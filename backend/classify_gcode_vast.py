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
from uuid import uuid4


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOCAL_MODEL_DIR = PROJECT_ROOT / "customModel" / "finishedModel"
LOCAL_SAVED_MODEL_DIR = LOCAL_MODEL_DIR / "saved_model"
DEFAULT_REMOTE_DIR = "/workspace/3fil-gcode-classifier"
ENV_FILE = BACKEND_DIR / ".env"
REMOTE_REQUIRED_FILES = {
    "predict_gcode.py": "predict_gcode.py",
    "config.json": "saved_model/config.json",
    "feature_scaler.pkl": "saved_model/feature_scaler.pkl",
    "hybrid_classifier.pt": "saved_model/hybrid_classifier.pt",
}


def load_env_file(env_path: Path, override: bool = False):
    if not env_path.is_file():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
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
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is not configured.")
    return value


def build_vast_args(api_key: str):
    return argparse.Namespace(
        api_key=api_key,
        url=os.getenv("VAST_URL", "https://console.vast.ai"),
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

    key_path = os.getenv("VAST_SSH_KEY_PATH", "").strip() or None
    user = os.getenv("VAST_SSH_USER", "root").strip() or "root"
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


def run_process(command: list[str], timeout: int, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
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


def classify_on_vast(gcode_path: str) -> dict:
    api_key = require_env("VAST_API_KEY")
    instance_id = int(require_env("VAST_INSTANCE_ID"))
    remote_root = os.getenv("VAST_REMOTE_DIR", DEFAULT_REMOTE_DIR).strip() or DEFAULT_REMOTE_DIR
    remote_python = os.getenv("VAST_REMOTE_PYTHON", "python3").strip() or "python3"

    instance = get_instance(instance_id, api_key)
    connection = resolve_ssh_connection(instance)
    ensure_remote_model_staged(connection, remote_root)

    job_id = uuid4().hex
    remote_job_dir = f"{remote_root}/jobs/{job_id}"
    remote_input_path = f"{remote_job_dir}/input.gcode"

    run_remote(
        connection,
        "mkdir -p "
        f"{shlex.quote(f'{remote_root}/saved_model')} "
        f"{shlex.quote(remote_job_dir)}",
        timeout=120,
    )
    upload_path(connection, Path(gcode_path), remote_input_path)

    try:
        result = run_remote(
            connection,
            " && ".join(
                [
                    f"cd {shlex.quote(remote_root)}",
                    f"{shlex.quote(remote_python)} predict_gcode.py {shlex.quote(remote_input_path)}",
                ]
            ),
            timeout=1800,
        )
        return extract_json_object(result.stdout)
    finally:
        run_remote(
            connection,
            f"rm -rf {shlex.quote(remote_job_dir)}",
            timeout=120,
            check=False,
        )


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python classify_gcode_vast.py <file.gcode>"}))
        sys.exit(1)

    gcode_path = os.path.abspath(os.path.expanduser(sys.argv[1]))
    if not os.path.isfile(gcode_path):
        print(json.dumps({"error": f"G-code file not found: {gcode_path}"}))
        sys.exit(1)

    try:
        result = classify_on_vast(gcode_path)
        print(json.dumps(result))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
