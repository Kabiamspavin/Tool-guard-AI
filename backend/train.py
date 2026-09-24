import os
import json
import joblib
import numpy as np
from typing import Dict, Any
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
from .config import settings

def train_xgboost_pipeline(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_names: list,
    params: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Trains an actual XGBRegressor on CNC sensor data, computes genuine test metrics,
    and serializes the trained model and feature configuration.
    """
    os.makedirs("./models", exist_ok=True)
    
    if params is None:
        params = {
            "n_estimators": 300,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42
        }
        
    model = xgb.XGBRegressor(**params)
    model.fit(X_train, y_train)
    
    # Evaluate on held-out test data
    y_pred = model.predict(X_test)
    
    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))
    
    # Feature Importances
    importances = model.feature_importances_
    feat_imp = {feat: float(imp * 100) for feat, imp in zip(feature_names, importances)}
    
    # Save model and feature config
    joblib.dump(model, settings.MODEL_PATH)
    
    config = {
        "feature_names": feature_names,
        "metrics": {
            "mae": round(mae, 4),
            "mse": round(mse, 6),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4)
        },
        "params": params
    }
    
    with open(settings.FEATURE_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)
        
    return {
        "success": True,
        "metrics": config["metrics"],
        "feature_importance": feat_imp,
        "train_samples": len(X_train),
        "test_samples": len(X_test)
    }
