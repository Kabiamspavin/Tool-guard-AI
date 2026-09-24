import pandas as pd
import numpy as np
from typing import Dict, Any

def calculate_sensor_features(df: pd.DataFrame, sensor_cols: Dict[str, str], window_size: int = 5) -> pd.DataFrame:
    """
    Calculates time-domain and rolling statistics for CNC sensor telemetry.
    Strictly avoids data leakage by using only preceding samples in rolling windows.
    """
    df = df.copy()
    
    # 1. Force features
    force_col = sensor_cols.get("force")
    if force_col and force_col in df.columns:
        df["force_rms"] = np.sqrt(df[force_col] ** 2)
        df["force_rolling_mean"] = df[force_col].rolling(window=window_size, min_periods=1).mean()
        df["force_rolling_std"] = df[force_col].rolling(window=window_size, min_periods=1).std().fillna(0)
    
    # 2. Vibration features
    vib_col = sensor_cols.get("vibration")
    if vib_col and vib_col in df.columns:
        df["vibration_rms"] = np.sqrt(df[vib_col] ** 2)
        df["vibration_rolling_mean"] = df[vib_col].rolling(window=window_size, min_periods=1).mean()
        df["vibration_rolling_std"] = df[vib_col].rolling(window=window_size, min_periods=1).std().fillna(0)

    # 3. Acoustic emission features
    ae_col = sensor_cols.get("acoustic")
    if ae_col and ae_col in df.columns:
        df["acoustic_rolling_mean"] = df[ae_col].rolling(window=window_size, min_periods=1).mean()
        df["acoustic_rolling_std"] = df[ae_col].rolling(window=window_size, min_periods=1).std().fillna(0)

    # 4. Machining Power / Energy Proxy
    speed_col = sensor_cols.get("speed")
    feed_col = sensor_cols.get("feed")
    if force_col in df.columns and feed_col in df.columns:
        sp = df[speed_col] if speed_col in df.columns else 10000
        df["machining_energy_index"] = (df[force_col] * df[feed_col]) / np.maximum(sp, 1)

    return df
