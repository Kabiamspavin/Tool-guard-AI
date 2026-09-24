import shap
import joblib
import json
import os
import numpy as np
from typing import Dict, Any
from .config import settings

def explain_prediction(feature_vector: np.ndarray) -> Dict[str, Any]:
    """
    Computes exact TreeSHAP values for a single tool wear prediction instance.
    """
    if not os.path.exists(settings.MODEL_PATH) or not os.path.exists(settings.FEATURE_CONFIG_PATH):
        raise FileNotFoundError("Trained XGBoost model not found. Please train model first.")
        
    model = joblib.load(settings.MODEL_PATH)
    with open(settings.FEATURE_CONFIG_PATH, "r") as f:
        config = json.load(f)
        
    feature_names = config["feature_names"]
    
    explainer = shap.TreeExplainer(model)
    shap_vals = explainer.shap_values(feature_vector.reshape(1, -1))[0]
    base_val = float(explainer.expected_value)
    pred_val = float(model.predict(feature_vector.reshape(1, -1))[0])
    
    contributions = []
    for feat, val, s in zip(feature_names, feature_vector, shap_vals):
        contributions.append({
            "feature": feat,
            "value": float(val),
            "contribution": float(round(s, 4))
        })
        
    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    
    top_drivers = [
        {
            "feature": c["feature"],
            "impact": "increases_wear" if c["contribution"] >= 0 else "decreases_wear",
            "magnitude": abs(c["contribution"])
        }
        for c in contributions[:5]
    ]
    
    return {
        "base_value": round(base_val, 4),
        "predicted_value": round(pred_val, 4),
        "shap_values": contributions,
        "top_drivers": top_drivers
    }
