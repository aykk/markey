import json
import os
import pickle
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from sentence_transformers import SentenceTransformer

os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "saved_model"


def is_xpu_available() -> bool:
    return bool(
        hasattr(torch, "xpu")
        and hasattr(torch.xpu, "is_available")
        and torch.xpu.is_available()
    )


def resolve_device() -> torch.device:
    requested = os.getenv("GCODE_MODEL_DEVICE", "").strip().lower()

    if requested:
        if requested == "xpu":
            if is_xpu_available():
                return torch.device("xpu")
            raise RuntimeError(
                "GCODE_MODEL_DEVICE=xpu was requested, but torch.xpu.is_available() is false."
            )
        if requested == "cuda":
            if torch.cuda.is_available():
                return torch.device("cuda")
            raise RuntimeError(
                "GCODE_MODEL_DEVICE=cuda was requested, but torch.cuda.is_available() is false."
            )
        if requested == "cpu":
            return torch.device("cpu")
        raise RuntimeError(
            "Unsupported GCODE_MODEL_DEVICE. Use one of: cpu, xpu, cuda."
        )

    if is_xpu_available():
        return torch.device("xpu")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


DEVICE = resolve_device()


with open(MODEL_DIR / "config.json", "r", encoding="utf-8") as config_file:
    CONFIG = json.load(config_file)

FEATURE_COLUMNS = list(CONFIG["feature_columns"])
TEXT_SAMPLE_LINES = int(CONFIG["text_sample_lines"])
EMBEDDING_MODEL_NAME = str(CONFIG["embedding_model"])
N_FEATURES = int(CONFIG["n_features"])
EMBEDDING_DIM = int(CONFIG["embedding_dim"])


def extract_gcode_features(gcode_text: str) -> dict:
    lines = gcode_text.splitlines()
    total_lines = len(lines)

    g0_count = 0
    g1_count = 0
    x_vals, y_vals, z_vals = [], [], []
    e_vals = []
    f_vals = []
    layer_count = 0

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(";"):
            if ";LAYER:" in stripped.upper():
                layer_count += 1
            continue

        if stripped.startswith("G0 ") or stripped.startswith("G0\t"):
            g0_count += 1
        elif stripped.startswith("G1 ") or stripped.startswith("G1\t"):
            g1_count += 1

        parts = stripped.split(";")[0].split()
        for part in parts:
            try:
                if part.startswith("X"):
                    x_vals.append(float(part[1:]))
                elif part.startswith("Y"):
                    y_vals.append(float(part[1:]))
                elif part.startswith("Z"):
                    z_vals.append(float(part[1:]))
                elif part.startswith("E"):
                    e_vals.append(float(part[1:]))
                elif part.startswith("F"):
                    f_vals.append(float(part[1:]))
            except ValueError:
                continue

    def safe_stats(values):
        if not values:
            return 0.0, 0.0, 0.0, 0.0
        arr = np.asarray(values, dtype=np.float32)
        return (
            float(np.min(arr)),
            float(np.max(arr)),
            float(np.mean(arr)),
            float(np.std(arr)),
        )

    total_moves = g0_count + g1_count
    extrusion_ratio = float(g1_count / max(total_moves, 1))

    x_min, x_max, x_mean, x_std = safe_stats(x_vals)
    y_min, y_max, y_mean, y_std = safe_stats(y_vals)
    z_min, z_max, z_mean, z_std = safe_stats(z_vals)
    e_min, e_max, e_mean, e_std = safe_stats(e_vals)
    f_min, f_max, f_mean, f_std = safe_stats(f_vals)

    return {
        "total_lines": float(total_lines),
        "layer_count": float(layer_count),
        "g0_count": float(g0_count),
        "g1_count": float(g1_count),
        "total_moves": float(total_moves),
        "extrusion_ratio": extrusion_ratio,
        "x_min": x_min,
        "x_max": x_max,
        "x_mean": x_mean,
        "x_std": x_std,
        "x_range": x_max - x_min,
        "y_min": y_min,
        "y_max": y_max,
        "y_mean": y_mean,
        "y_std": y_std,
        "y_range": y_max - y_min,
        "z_min": z_min,
        "z_max": z_max,
        "z_mean": z_mean,
        "z_std": z_std,
        "z_range": z_max - z_min,
        "e_min": e_min,
        "e_max": e_max,
        "e_mean": e_mean,
        "e_std": e_std,
        "f_min": f_min,
        "f_max": f_max,
        "f_mean": f_mean,
        "f_std": f_std,
    }


def sample_gcode_text(gcode_text: str, n_lines: int = TEXT_SAMPLE_LINES) -> str:
    raw_lines = [line.strip() for line in gcode_text.splitlines() if line.strip()]
    lines = []

    for line in raw_lines:
        if line.startswith(";"):
            upper = line.upper()
            if any(marker in upper for marker in [";LAYER:", ";TYPE:", ";MESH:"]):
                lines.append(line)
            continue
        lines.append(line)

    if len(lines) <= n_lines:
        return "\n".join(lines)

    third = n_lines // 3
    remainder = n_lines - (2 * third)

    begin = lines[:third]
    mid_start = (len(lines) - third) // 2
    middle = lines[mid_start : mid_start + third]
    end = lines[-remainder:]

    sampled = begin + ["\n;--- MID SAMPLE ---"] + middle + ["\n;--- END SAMPLE ---"] + end
    return "\n".join(sampled)


class HybridGCodeClassifier(nn.Module):
    def __init__(self, n_features: int, embedding_dim: int, hidden_dim: int = 128):
        super().__init__()
        self.feature_branch = nn.Sequential(
            nn.Linear(n_features, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
        )
        self.embedding_branch = nn.Sequential(
            nn.Linear(embedding_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
        )
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim // 2, 1),
        )

    def forward(self, features, embeddings):
        feat_out = self.feature_branch(features)
        emb_out = self.embedding_branch(embeddings)
        combined = torch.cat([feat_out, emb_out], dim=1)
        return self.classifier(combined).squeeze(-1)


def load_classifier_state(model_path: Path):
    try:
        return torch.load(model_path, map_location="cpu", weights_only=True)
    except TypeError:
        return torch.load(model_path, map_location="cpu")


def load_classifier_model(device: torch.device):
    model = HybridGCodeClassifier(N_FEATURES, EMBEDDING_DIM)
    model.load_state_dict(load_classifier_state(MODEL_DIR / "hybrid_classifier.pt"))

    try:
        model = model.to(device)
        model.eval()
        return model, device
    except Exception:
        cpu_device = torch.device("cpu")
        model = model.to(cpu_device)
        model.eval()
        return model, cpu_device


def load_embedding_model(device: torch.device):
    target_device = device.type
    try:
        return SentenceTransformer(
            EMBEDDING_MODEL_NAME,
            device=target_device,
            trust_remote_code=True,
        )
    except Exception:
        if target_device == "cpu":
            raise
        return SentenceTransformer(
            EMBEDDING_MODEL_NAME,
            device="cpu",
            trust_remote_code=True,
        )


def load_artifacts():
    with open(MODEL_DIR / "feature_scaler.pkl", "rb") as scaler_file:
        scaler = pickle.load(scaler_file)

    model, model_device = load_classifier_model(DEVICE)
    embed_model = load_embedding_model(DEVICE)

    return model, scaler, embed_model, model_device


ARTIFACTS = None


def get_artifacts():
    global ARTIFACTS
    if ARTIFACTS is None:
        ARTIFACTS = load_artifacts()
    return ARTIFACTS


def classify_gcode_text(gcode_text: str, threshold: float = 0.5) -> dict:
    model, scaler, embed_model, model_device = get_artifacts()

    if not isinstance(gcode_text, str) or not gcode_text.strip():
        raise RuntimeError("G-code text is empty.")

    gcode_text = gcode_text.strip()

    features = extract_gcode_features(gcode_text)
    ordered_features = np.array(
        [[float(features.get(column, 0.0)) for column in FEATURE_COLUMNS]],
        dtype=np.float32,
    )
    feature_vector = scaler.transform(ordered_features)
    feature_vector = np.nan_to_num(feature_vector, nan=0.0, posinf=0.0, neginf=0.0)

    sampled_text = sample_gcode_text(gcode_text)
    text_embedding = embed_model.encode(
        [sampled_text],
        convert_to_numpy=True,
        show_progress_bar=False,
    )

    with torch.no_grad():
        feature_tensor = torch.tensor(feature_vector, dtype=torch.float32).to(model_device)
        embedding_tensor = torch.tensor(text_embedding, dtype=torch.float32).to(model_device)
        logit = model(feature_tensor, embedding_tensor)
        probability = float(torch.sigmoid(logit).item())

    is_gun = probability >= threshold
    verdict = "yes it's a gun" if is_gun else "no it's not a gun"

    return {
        "verdict": verdict,
        "label": "restricted_mechanical_part" if is_gun else "allowed",
        "confidence": probability,
        "summary": (
            f"Model verdict: {verdict}. Confidence {probability * 100:.1f}% "
            "from Cura-generated G-code."
        ),
        "reasons": [
            f"Cura converted the uploaded mesh into G-code before classification.",
            f"Neural verdict: {verdict}.",
            f"Confidence: {probability * 100:.1f}%.",
        ],
    }


def classify_gcode(gcode_input: str, threshold: float = 0.5) -> dict:
    if os.path.isfile(gcode_input):
        with open(gcode_input, "r", encoding="utf-8", errors="ignore") as gcode_file:
            gcode_text = gcode_file.read()
        return classify_gcode_text(gcode_text, threshold=threshold)

    return classify_gcode_text(gcode_input, threshold=threshold)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python predict_gcode.py <file.gcode>"}))
        sys.exit(1)

    gcode_path = os.path.abspath(os.path.expanduser(sys.argv[1]))
    if not os.path.isfile(gcode_path):
        print(json.dumps({"error": f"G-code file not found: {gcode_path}"}))
        sys.exit(1)

    try:
        result = classify_gcode(gcode_path)
        print(json.dumps(result))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
