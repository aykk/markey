import json
import shlex
import sys
from pathlib import Path

from classify_gcode_vast import (
    DEFAULT_REMOTE_DIR,
    LOCAL_MODEL_DIR,
    LOCAL_MODEL_REQUIREMENTS,
    LOCAL_SAVED_MODEL_DIR,
    env_value,
    ensure_remote_model_staged,
    ensure_remote_runtime_ready,
    ensure_remote_server_running,
    get_instance,
    require_env,
    resolve_ssh_connection,
    run_remote,
    upload_path,
)


def stage_model_on_vast() -> dict:
    api_key = require_env("VAST_API_KEY")
    instance_id = int(require_env("VAST_INSTANCE_ID"))
    remote_root = env_value("VAST_REMOTE_DIR", DEFAULT_REMOTE_DIR) or DEFAULT_REMOTE_DIR
    remote_setup_cmd = env_value("VAST_REMOTE_SETUP_CMD", "") or ""

    instance = get_instance(instance_id, api_key)
    connection = resolve_ssh_connection(instance)

    run_remote(
        connection,
        "mkdir -p "
        f"{shlex.quote(f'{remote_root}/saved_model')} "
        f"{shlex.quote(f'{remote_root}/jobs')}",
        timeout=120,
    )

    upload_path(connection, LOCAL_MODEL_DIR / "predict_gcode.py", f"{remote_root}/predict_gcode.py")
    upload_path(connection, LOCAL_MODEL_DIR / "server.py", f"{remote_root}/server.py")
    upload_path(connection, LOCAL_MODEL_REQUIREMENTS, f"{remote_root}/requirements.txt")
    upload_path(connection, LOCAL_SAVED_MODEL_DIR, remote_root, recursive=True)

    if remote_setup_cmd:
        run_remote(
            connection,
            f"cd {shlex.quote(remote_root)} && {remote_setup_cmd}",
            timeout=1800,
        )

    ensure_remote_model_staged(connection, remote_root)
    remote_python = env_value("VAST_REMOTE_PYTHON", "python3") or "python3"
    ensure_remote_runtime_ready(connection, remote_root, remote_python)
    ensure_remote_server_running(connection, remote_root, remote_python)

    return {
        "ok": True,
        "instance_id": instance_id,
        "remote_root": remote_root,
        "uploaded": [
            str(Path(remote_root) / "predict_gcode.py"),
            str(Path(remote_root) / "saved_model" / "config.json"),
            str(Path(remote_root) / "saved_model" / "feature_scaler.pkl"),
            str(Path(remote_root) / "saved_model" / "hybrid_classifier.pt"),
            str(Path(remote_root) / "server.py"),
            str(Path(remote_root) / "requirements.txt"),
        ],
    }


def main():
    try:
        print(json.dumps(stage_model_on_vast()))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
