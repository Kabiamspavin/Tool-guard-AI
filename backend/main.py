import os
import io
import json
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, Any

from .config import settings
from .database import get_db, init_db, Prediction, ModelRun, Dataset as DBMDataset
from .schemas import (
    PredictionInput, PredictionResponse, TrainRequest,
    ModelMetricsResponse, ShapResponse, ChatRequest, MaintenanceReportRequest
)
from .preprocessing import preprocess_sensor_data
from .feature_engineering import calculate_sensor_features
from .train import train_xgboost_pipeline
from .predict import predict_wear
from .explainability import explain_prediction
from .gemini_service import ask_copilot, generate_maintenance_report
from .utils import detect_column_mapping, sanitize_filename

app = FastAPI(
    title="ToolGuard AI API",
    description="Intelligent Tool Wear Prediction & Predictive Maintenance System for CNC Manufacturing",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    os.makedirs("./data", exist_ok=True)
    os.makedirs("./models", exist_ok=True)
    init_db()

@app.get("/api/health")
def health_check():
    has_model = os.path.exists(settings.MODEL_PATH)
    return {
        "status": "healthy",
        "system": "ToolGuard AI",
        "model_trained": has_model,
        "machine_status": "ONLINE"
    }

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV datasets are accepted.")
        
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
        
    mapping = detect_column_mapping(df.columns.tolist())
    
    # Save preview record to DB
    clean_name = sanitize_filename(file.filename)
    df_db = DBMDataset(
        filename=clean_name,
        row_count=len(df),
        column_count=len(df.columns),
        columns_json=json.dumps(df.columns.tolist())
    )
    db.add(df_db)
    db.commit()
    
    # Save temp active dataset
    df.to_csv("./data/active_dataset.csv", index=False)
    
    return {
        "success": True,
        "filename": clean_name,
        "row_count": len(df),
        "columns": df.columns.tolist(),
        "detected_mapping": mapping,
        "preview": df.head(10).to_dict(orient="records")
    }

@app.post("/api/train")
def train_model(req: TrainRequest, db: Session = Depends(get_db)):
    active_path = "./data/active_dataset.csv"
    if not os.path.exists(active_path):
        raise HTTPException(status_code=400, detail="No active dataset uploaded. Please upload a dataset first.")
        
    df = pd.read_csv(active_path)
    
    # Feature engineering
    sensor_map = {"force": "cutting_force", "vibration": "vibration", "acoustic": "acoustic_emission"}
    df_feat = calculate_sensor_features(df, sensor_map)
    
    # Preprocessing
    X_train, X_test, y_train, y_test, feat_cols, stats = preprocess_sensor_data(
        df_feat,
        target_col=req.targetColumn,
        ignore_cols=[req.toolIdColumn, req.cycleColumn]
    )
    
    # Model training
    res = train_xgboost_pipeline(
        X_train, y_train, X_test, y_test, feat_cols,
        params={
            "n_estimators": req.nEstimators,
            "max_depth": req.maxDepth,
            "learning_rate": req.learningRate,
            "subsample": req.subsample,
            "colsample_bytree": req.colsampleBytree,
            "random_state": 42
        }
    )
    
    # Persist run to DB
    run = ModelRun(
        mae=res["metrics"]["mae"],
        rmse=res["metrics"]["rmse"],
        r2=res["metrics"]["r2"],
        feature_count=len(feat_cols),
        train_samples=res["train_samples"],
        test_samples=res["test_samples"],
        model_path=settings.MODEL_PATH
    )
    db.add(run)
    db.commit()
    
    return res

@app.get("/api/model-metrics")
def get_model_metrics():
    if not os.path.exists(settings.FEATURE_CONFIG_PATH):
        return {"trained": False, "message": "Model not trained"}
        
    with open(settings.FEATURE_CONFIG_PATH, "r") as f:
        config = json.load(f)
        
    return {
        "trained": True,
        "metrics": config["metrics"],
        "params": config["params"],
        "feature_count": len(config["feature_names"])
    }

@app.post("/api/predict")
def predict_endpoint(req: PredictionInput, db: Session = Depends(get_db)):
    data_dict = req.dict()
    try:
        result = predict_wear(data_dict)
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Store to history table
    pred_row = Prediction(
        tool_id=req.toolId,
        cycle=req.cycle,
        cutting_force=req.cuttingForce,
        vibration=req.vibration,
        acoustic_emission=req.acousticEmission,
        spindle_speed=req.spindleSpeed,
        feed_rate=req.feedRate,
        depth_of_cut=req.depthOfCut,
        predicted_wear=result["predicted_wear"],
        risk_level=result["risk_level"],
        tool_health=result["tool_health"]
    )
    db.add(pred_row)
    db.commit()
    
    return result

@app.post("/api/explain")
def explain_endpoint(req: PredictionInput):
    data_dict = req.dict()
    if not os.path.exists(settings.FEATURE_CONFIG_PATH):
        raise HTTPException(status_code=400, detail="Model not trained. Train model first.")
        
    with open(settings.FEATURE_CONFIG_PATH, "r") as f:
        config = json.load(f)
        
    feat_names = config["feature_names"]
    vec = [float(data_dict.get(k, 0.0)) for k in feat_names]
    import numpy as np
    return explain_prediction(np.array(vec))

@app.get("/api/history")
def get_prediction_history(db: Session = Depends(get_db)):
    rows = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(100).all()
    return {"count": len(rows), "predictions": rows}

@app.post("/api/chat")
def copilot_chat(req: ChatRequest):
    reply = ask_copilot(req.message, req.context or {}, req.history or [])
    return {"reply": reply}

@app.post("/api/maintenance-report")
def maintenance_report(req: MaintenanceReportRequest):
    report = generate_maintenance_report(req.context)
    return {"report": report}
