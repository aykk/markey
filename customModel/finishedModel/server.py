import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from predict_gcode import classify_gcode, resolve_device


MODEL_READY = False
MODEL_ERROR = None


class PredictRequest(BaseModel):
    gcode_text: str
    threshold: float = 0.5


def preload_model():
    global MODEL_READY, MODEL_ERROR
    try:
        import predict_gcode

        predict_gcode.load_artifacts()
        MODEL_READY = True
        MODEL_ERROR = None
    except Exception as exc:
        MODEL_READY = False
        MODEL_ERROR = str(exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    preload_model()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "ok": MODEL_READY,
        "device": str(resolve_device()),
        "error": MODEL_ERROR,
    }


@app.post("/predict")
def predict(request: PredictRequest):
    if not MODEL_READY:
        raise HTTPException(status_code=503, detail=MODEL_ERROR or "Model is not ready")

    try:
        return classify_gcode(request.gcode_text, threshold=request.threshold)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
