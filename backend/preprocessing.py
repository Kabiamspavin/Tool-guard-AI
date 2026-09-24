import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List
from sklearn.model_selection import train_test_split

def preprocess_sensor_data(
    df: pd.DataFrame,
    target_col: str,
    ignore_cols: List[str] = None,
    test_size: float = 0.2,
    remove_outliers: bool = True
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, List[str], Dict[str, Any]]:
    """
    Cleans raw CNC telemetry, removes duplicates, handles missing values,
    filters extreme outliers using IQR, and splits into train/test sets.
    """
    if ignore_cols is None:
        ignore_cols = []
        
    initial_rows = len(df)
    
    # 1. Deduplicate
    df = df.drop_duplicates().copy()
    duplicates_removed = initial_rows - len(df)
    
    # 2. Impute missing values with column medians
    missing_count = df.isnull().sum().sum()
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        df[col] = df[col].fillna(df[col].median())
        
    # 3. Outlier handling via IQR on target
    outliers_detected = 0
    if remove_outliers and target_col in df.columns:
        q1 = df[target_col].quantile(0.25)
        q3 = df[target_col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.75 * iqr
        upper = q3 + 1.75 * iqr
        outlier_mask = (df[target_col] < lower) | (df[target_col] > upper)
        outliers_detected = int(outlier_mask.sum())
        df = df[~outlier_mask].copy()

    # 4. Feature Selection
    feature_cols = [c for c in numeric_cols if c != target_col and c not in ignore_cols]
    
    X = df[feature_cols].values
    y = df[target_col].values
    
    # 5. Train/Test split preserving temporal integrity if chronological
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42, shuffle=False)
    
    stats = {
        "total_rows": initial_rows,
        "valid_rows": len(df),
        "missing_values_handled": int(missing_count),
        "duplicates_removed": int(duplicates_removed),
        "outliers_detected": outliers_detected,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_count": len(feature_cols)
    }
    
    return X_train, X_test, y_train, y_test, feature_cols, stats
