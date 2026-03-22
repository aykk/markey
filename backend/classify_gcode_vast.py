import argparse
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import uuid4


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOCAL_MODEL_DIR = PROJECT_ROOT / "customModel" / "finishedModel"
LOCAL_SAVED_MODEL_DIR = LOCAL_MODEL_DIR / "saved_model"
LOCAL_MODEL_REQUIREMENTS = LOCAL_MODEL_DIR / "requirements.txt"
DEFAULT_REMOTE_DIR = "/workspace/3fil-gcode-classifier"
ENV_FILE = BACKEND_DIR / ".env"
REMOTE_REQUIRED_FILES = {
    "predict_gcode.py": "predict_gcode.py",
    "config.json": "saved_model/config.json",
    "feature_scaler.pkl": "saved_model/feature_scaler.pkl",
    "hybrid_classifier.pt": "saved_model/hybrid_classifier.pt",
    "requirements.txt": "requirements.txt",
}

DEBUG_ENABLED = os.getenv("VAST_DEBUG", "").strip().lower() in {"1", "true", "yes", "on"}
DEFAULT_REMOTE_API_PORT = "6006"
DEFAULT_PUBLIC_API_BASE_URL = "https://vern-unrusticated-delila.ngrok-free.dev"
MAX_DEBUG_LINES = int(os.getenv("VAST_DEBUG_MAX_LINES", "120") or "120")
_debug_lines_emitted = 0


def strip_vast_ssh_banner(text: str) -> str:
    lines = (text or "").splitlines()
    filtered: list[str] = []
    skip_next_have_fun = False
    for line in lines:
        lowered = line.strip().lower()
        if lowered.startswith("welcome to vast.ai"):
            skip_next_have_fun = True
            continue
        if skip_next_have_fun and lowered == "have fun!":
            skip_next_have_fun = False
            continue
        if lowered == "have fun!":
            continue
        filtered.append(line)
    return "\n".join(filtered).strip()


def env_value(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip()


def load_env_file(env_path: Path, override: bool = False):
    if not env_path.is_file():
        return

    raw_bytes = env_path.read_bytes()
    text = None
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "gbk", "latin-1"):
        try:
            text = raw_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if text is None:
        text = raw_bytes.decode("utf-8", errors="replace")

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        if line.startswith("export "):
            line = line[len("export ") :].strip()

        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if not key:
            continue

        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]

        if override or key not in os.environ:
            os.environ[key] = value


load_env_file(ENV_FILE)


@dataclass
class SshConnection:
    host: str
    port: int
    user: str
    key_path: str | None = None


def require_env(name: str) -> str:
    value = env_value(name, "") or ""
    if not value:
        raise RuntimeError(f"{name} is not configured.")
    return value


def debug_log(message: str):
    global _debug_lines_emitted
    if not DEBUG_ENABLED:
        return
    if _debug_lines_emitted >= MAX_DEBUG_LINES:
        return
    _debug_lines_emitted += 1
    if _debug_lines_emitted == MAX_DEBUG_LINES:
        print(
            "[vast-debug] Further debug logs suppressed (VAST_DEBUG_MAX_LINES reached)",
            file=sys.stderr,
            flush=True,
        )
        return
    print(f"[vast-debug] {message}", file=sys.stderr, flush=True)


def trim_output(text: str, limit: int = 1200) -> str:
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[:limit] + "...<truncated>"


def build_vast_args(api_key: str):
    return argparse.Namespace(
        api_key=api_key,
        url=env_value("VAST_URL", "https://console.vast.ai"),
        retry=3,
        explain=False,
        raw=True,
        quiet=False,
        curl=False,
        debugging=False,
    )


def load_vast_sdk():
    try:
        import vast
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "Vast.ai SDK is not installed for this Python interpreter. "
            "Install `vastai` or point VAST_PYTHON_BIN at a Python that has it."
        ) from exc

    return vast


def get_instance(instance_id: int, api_key: str) -> dict:
    vast = load_vast_sdk()
    args = build_vast_args(api_key)
    vast.ARGS = args
    if args.api_key:
        vast.headers["Authorization"] = "Bearer " + args.api_key
    args.id = instance_id
    debug_log(f"Fetching Vast instance metadata for instance_id={instance_id}")
    instance = vast.show__instance(args)
    if not isinstance(instance, dict):
        raise RuntimeError(f"Could not load Vast.ai instance {instance_id}.")
    return instance


def resolve_ssh_connection(instance: dict) -> SshConnection:
    ports = instance.get("ports") or {}
    mapped_ssh = ports.get("22/tcp")

    if mapped_ssh:
        host = str(instance.get("public_ipaddr") or "").strip()
        port = int(mapped_ssh[0]["HostPort"])
    else:
        host = str(instance.get("ssh_host") or instance.get("public_ipaddr") or "").strip()
        port = int(instance.get("ssh_port") or 0)
        image_runtype = str(instance.get("image_runtype") or "")
        if port and "jupyter" in image_runtype:
            port += 1

    if not host or port <= 0:
        raise RuntimeError("Could not resolve SSH host/port for the Vast.ai instance.")

    key_path = env_value("VAST_SSH_KEY_PATH") or None
    user = env_value("VAST_SSH_USER", "root") or "root"
    return SshConnection(host=host, port=port, user=user, key_path=key_path)


def ssh_base(connection: SshConnection) -> list[str]:
    if not shutil.which("ssh"):
        raise RuntimeError("ssh is not available on PATH.")

    command = [
        "ssh",
        "-p",
        str(connection.port),
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "BatchMode=yes",
        "-o",
        "ConnectTimeout=30",
    ]
    if connection.key_path:
        command.extend(["-i", connection.key_path])
    command.append(f"{connection.user}@{connection.host}")
    return command


def scp_base(connection: SshConnection) -> list[str]:
    if not shutil.which("scp"):
        raise RuntimeError("scp is not available on PATH.")

    command = [
        "scp",
        "-P",
        str(connection.port),
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "BatchMode=yes",
        "-o",
        "ConnectTimeout=30",
    ]
    if connection.key_path:
        command.extend(["-i", connection.key_path])
    return command


def run_process(
    command: list[str],
    timeout: int,
    check: bool = True,
    input_text: str | None = None,
) -> subprocess.CompletedProcess[str]:
    started = perf_counter()
    debug_log(
        "Executing command: "
        + " ".join(shlex.quote(part) for part in command)
        + f" (timeout={timeout}s)"
    )
    result = subprocess.run(
        command,
        capture_output=True,
        input=input_text,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=False,
    )
    result.stdout = strip_vast_ssh_banner(result.stdout)
    result.stderr = strip_vast_ssh_banner(result.stderr)
    elapsed = perf_counter() - started
    debug_log(
        f"Command exited rc={result.returncode} after {elapsed:.2f}s"
        + (f" stdout={trim_output(result.stdout)!r}" if result.stdout.strip() else "")
        + (f" stderr={trim_output(result.stderr)!r}" if result.stderr.strip() else "")
    )
    if check and result.returncode != 0:
        raise RuntimeError(
            (result.stderr or result.stdout or "Command failed").strip()
        )
    return result


def run_remote(connection: SshConnection, shell_command: str, timeout: int, check: bool = True):
    command = ssh_base(connection)
    command.append(f"bash -lc {shlex.quote(shell_command)}")
    return run_process(command, timeout=timeout, check=check)


def upload_path(connection: SshConnection, source: Path, destination: str, recursive: bool = False):
    command = scp_base(connection)
    if recursive:
        command.append("-r")
    command.extend([str(source), f"{connection.user}@{connection.host}:{destination}"])
    run_process(command, timeout=300, check=True)


def extract_json_object(text: str) -> dict:
    cleaned = text.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            raise RuntimeError(f"Could not parse remote classifier output: {cleaned or 'empty output'}")
        return json.loads(match.group(0))


def ensure_remote_model_staged(connection: SshConnection, remote_root: str):
    missing_files: list[str] = []

    for label, relative_path in REMOTE_REQUIRED_FILES.items():
        remote_path = f"{remote_root}/{relative_path}"
        result = run_remote(
            connection,
            f"test -f {shlex.quote(remote_path)}",
            timeout=60,
            check=False,
        )
        if result.returncode != 0:
            missing_files.append(label)

    if missing_files:
        missing = ", ".join(missing_files)
        raise RuntimeError(
            "Remote Vast.ai model is not staged. "
            f"Missing: {missing}. Run backend/stage_vast_model.py first."
        )
    debug_log(f"Verified staged remote model under {remote_root}")


def ensure_remote_runtime_ready(connection: SshConnection, remote_root: str, remote_python: str):
    runtime_check = run_remote(
        connection,
        " && ".join(
            [
                f"cd {shlex.quote(remote_root)}",
                f"{shlex.quote(remote_python)} -c {shlex.quote('import torch, numpy, sklearn, sentence_transformers; print(\'runtime-ok\')')}",
            ]
        ),
        timeout=120,
        check=False,
    )

    if runtime_check.returncode == 0:
        debug_log(f"Verified remote runtime dependencies under {remote_root}")
        return

    install_cmd = env_value("VAST_REMOTE_SETUP_CMD", "") or ""
    if install_cmd:
        debug_log("Remote runtime missing; attempting install via VAST_REMOTE_SETUP_CMD")
        run_remote(
            connection,
            f"cd {shlex.quote(remote_root)} && {install_cmd}",
            timeout=1800,
        )
    else:
        raise RuntimeError(
            "Remote Vast.ai runtime is missing required Python packages (torch/numpy/scikit-learn/sentence-transformers). "
            "Set VAST_REMOTE_SETUP_CMD in backend/.env to install dependencies, for example: "
            "python3 -m pip install -r /workspace/3fil-gcode-classifier/requirements.txt"
        )

    verify_after_install = run_remote(
        connection,
        " && ".join(
            [
                f"cd {shlex.quote(remote_root)}",
                f"{shlex.quote(remote_python)} -c {shlex.quote('import torch, numpy, sklearn, sentence_transformers; print(\'runtime-ok\')')}",
            ]
        ),
        timeout=120,
        check=False,
    )

    if verify_after_install.returncode != 0:
        raise RuntimeError(
            "Remote dependency installation did not complete successfully. "
            + trim_output(verify_after_install.stderr or verify_after_install.stdout)
        )

    debug_log(f"Remote runtime dependencies installed successfully under {remote_root}")


def remote_api_base_url(connection: SshConnection) -> str:
    port = env_value("VAST_REMOTE_API_PORT", DEFAULT_REMOTE_API_PORT) or DEFAULT_REMOTE_API_PORT
    host = connection.host
    return f"http://{host}:{port}"


def normalize_api_base_url(base_url: str) -> str:
    return (base_url or "").strip().rstrip("/")


def direct_api_request(
    base_url: str,
    method: str,
    path: str,
    payload: dict | None = None,
    timeout: int = 120,
) -> dict:
    normalized = normalize_api_base_url(base_url)
    if not normalized:
        raise RuntimeError("Public API base URL is empty.")

    url = f"{normalized}{path}"
    data = None
    headers = {"Content-Type": "application/json"}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = Request(url, data=data, headers=headers, method=method)
    debug_log(f"HTTP {method} {url}")
    try:
        with urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            debug_log(f"HTTP {method} {url} -> {response.status} body={trim_output(body)}")
            return json.loads(body)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Public API error {exc.code}: {trim_output(body)}") from exc
    except URLError as exc:
        raise RuntimeError(f"Public API request failed: {exc}") from exc


def remote_api_request(
    connection: SshConnection,
    method: str,
    path: str,
    payload: dict | None = None,
    timeout: int = 120,
    remote_python: str = "python3",
) -> dict:
    url = f"{remote_api_base_url(connection)}{path}"
    data = None
    headers = {"Content-Type": "application/json"}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = Request(url, data=data, headers=headers, method=method)
    debug_log(f"HTTP {method} {url}")
    try:
        with urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            debug_log(f"HTTP {method} {url} -> {response.status} body={trim_output(body)}")
            return json.loads(body)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Remote API error {exc.code}: {trim_output(body)}") from exc
    except URLError as exc:
        debug_log(f"Direct HTTP failed for {url}; retrying through SSH localhost tunnel: {exc}")

        localhost_url = f"http://127.0.0.1:{env_value('VAST_REMOTE_API_PORT', DEFAULT_REMOTE_API_PORT) or DEFAULT_REMOTE_API_PORT}{path}"
        payload_json = json.dumps(payload) if payload is not None else ""
        remote_script = (
            "import sys, urllib.request, urllib.error; "
            "method=sys.argv[1]; url=sys.argv[2]; body=sys.stdin.read(); "
            "data=body.encode('utf-8') if body else None; "
            "req=urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'}, method=method); "
            "try:\n"
            " resp=urllib.request.urlopen(req, timeout=120); "
            " sys.stdout.write(resp.read().decode('utf-8')); "
            " resp.close()\n"
            "except urllib.error.HTTPError as e:\n"
            " sys.stderr.write(e.read().decode('utf-8', 'replace')); "
            " raise"
        )
        fallback_command = ssh_base(connection)
        fallback_command.append(
            f"{shlex.quote(remote_python)} -c {shlex.quote(remote_script)} "
            f"{shlex.quote(method)} {shlex.quote(localhost_url)}"
        )
        fallback = run_process(
            fallback_command,
            timeout=timeout,
            check=False,
            input_text=payload_json,
        )
        if fallback.returncode != 0:
            raise RuntimeError(
                "Remote API request failed over both public HTTP and SSH localhost fallback: "
                f"{trim_output(fallback.stderr or fallback.stdout)}"
            ) from exc

        body = (fallback.stdout or "").strip()
        if not body:
            raise RuntimeError("Remote API request via SSH returned empty response body") from exc
        debug_log(f"SSH localhost HTTP {method} {localhost_url} body={trim_output(body)}")
        return json.loads(body)


def ensure_remote_server_running(connection: SshConnection, remote_root: str, remote_python: str):
    api_port = env_value("VAST_REMOTE_API_PORT", DEFAULT_REMOTE_API_PORT) or DEFAULT_REMOTE_API_PORT
    health = None
    try:
        health = remote_api_request(connection, "GET", "/health", timeout=15, remote_python=remote_python)
    except Exception as exc:
        debug_log(f"Remote API health check failed before start attempt: {exc}")

    if isinstance(health, dict) and health.get("ok"):
        debug_log("Remote FastAPI inference server is already healthy")
        return

    cleanup_cmd = (
        f"pkill -f {shlex.quote(f'uvicorn server:app.*--port {api_port}')} "
        "|| true"
    )
    run_remote(connection, cleanup_cmd, timeout=30, check=False)
    debug_log(f"Cleared stale uvicorn processes for port {api_port} before restart")

    server_cmd = (
        f"cd {shlex.quote(remote_root)} && "
        f"nohup {shlex.quote(remote_python)} -m uvicorn server:app --host 0.0.0.0 --port {shlex.quote(api_port)} "
        "</dev/null > server.log 2>&1 & "
        "echo server-started"
    )
    try:
        run_remote(connection, server_cmd, timeout=120)
        debug_log(f"Started remote FastAPI server on port {api_port}")
    except subprocess.TimeoutExpired:
        debug_log(
            "SSH command timed out while launching uvicorn; continuing with health checks in case server started successfully"
        )

    last_error = None
    for _ in range(20):
        try:
            health = remote_api_request(connection, "GET", "/health", timeout=15, remote_python=remote_python)
            if isinstance(health, dict) and health.get("ok"):
                debug_log(f"Remote FastAPI server healthy: {trim_output(json.dumps(health))}")
                return
            last_error = RuntimeError(f"Health check returned non-ready payload: {health}")
        except Exception as exc:
            last_error = exc
        subprocess.run(["cmd", "/c", "timeout", "/t", "2", "/nobreak"], capture_output=True)

    log_tail = run_remote(
        connection,
        f"cd {shlex.quote(remote_root)} && (tail -n 120 server.log 2>/dev/null || true)",
        timeout=30,
        check=False,
    )
    log_excerpt = trim_output(log_tail.stdout or log_tail.stderr, limit=4000)
    raise RuntimeError(
        "Remote FastAPI server did not become healthy: "
        f"{last_error}. Remote server.log tail:\n{log_excerpt}"
    )


def classify_on_vast(gcode_path: str) -> dict:
    total_started = perf_counter()

    public_api_base_url = env_value("VAST_PUBLIC_API_BASE_URL", DEFAULT_PUBLIC_API_BASE_URL) or ""
    normalized_base_url = normalize_api_base_url(public_api_base_url)
    if not normalized_base_url:
        raise RuntimeError(
            "VAST_PUBLIC_API_BASE_URL is required. SSH fallback is disabled."
        )

    with open(gcode_path, "r", encoding="utf-8", errors="ignore") as gcode_file:
        gcode_text = gcode_file.read()

    debug_log(f"Using public API endpoint for inference: {normalized_base_url}")
    health = direct_api_request(normalized_base_url, "GET", "/health", timeout=30)
    if isinstance(health, dict) and health.get("ok") is False:
        raise RuntimeError(f"Public API is not ready: {health}")

    parsed = direct_api_request(
        normalized_base_url,
        "POST",
        "/predict",
        payload={"gcode_text": gcode_text, "threshold": 0.5},
        timeout=1800,
    )

    if isinstance(parsed, dict):
        parsed.setdefault("job_id", str(uuid4()))
    debug_log(
        f"Public endpoint classification completed in {perf_counter() - total_started:.2f}s with payload={trim_output(json.dumps(parsed))}"
    )
    return parsed


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python classify_gcode_vast.py <file.gcode>"}))
        sys.exit(1)

    gcode_path = os.path.abspath(os.path.expanduser(sys.argv[1]))
    if not os.path.isfile(gcode_path):
        print(json.dumps({"error": f"G-code file not found: {gcode_path}"}))
        sys.exit(1)

    try:
        debug_log(f"CLI entrypoint received gcode_path={gcode_path}")
        result = classify_on_vast(gcode_path)
        print(json.dumps(result))
    except Exception as exc:
        debug_log(f"Classification failed: {exc}")
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
