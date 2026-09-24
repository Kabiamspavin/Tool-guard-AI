import joblib
import json
import os
import numpy as np
from typing import Dict, Any
from .config import settings
from .maintenance import classify_tool_health

def predict_wear(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Loads serialized XGBoost model and produces actual tool wear prediction.
    """
    if not os.path.exists(settings.MODEL_PATH) or not os.path.exists(settings.FEATURE_CONFIG_PATH):
        raise FileNotFoundError("Model not trained. Upload a dataset and train the XGBoost model first.")
        
    model = joblib.load(settings.MODEL_PATH)
    with open(settings.FEATURE_CONFIG_PATH, "r") as f:
        config = json.load(f)
        
    feature_names = config["feature_names"]
    
    # Map input dictionary to ordered feature vector
    vector = []
    for feat in feature_names:
        val = input_data.get(feat, 0.0)
        vector.append(float(val))
        
    arr = np.array(vector).reshape(1, -1)
    pred = float(model.predict(arr)[0])
    pred = max(0.0, round(pred, 4))
    
    classification = classify_tool_health(
        pred,
        settings.DEFAULT_LOW_THRESHOLD,
        settings.DEFAULT_MEDIUM_THRESHOLD,
        settings.DEFAULT_HIGH_THRESHOLD
    )
    
    # RUL calculation: Remaining cycles before critical wear
    crit = settings.DEFAULT_HIGH_THRESHOLD
    rul = max(0, int(round((crit - pred) / 0.0024))) if pred < crit else 0
    
    return {
        "predicted_wear": pred,
        "rul_cycles": rul,
        **classification
    }
