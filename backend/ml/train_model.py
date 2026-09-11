import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
)
import xgboost as xgb

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from ml.feature_engineering import (
    ALL_FEATURE_COLUMNS,
    TARGET_COLUMN,
    engineer_features,
)
from ml.generate_dataset import generate_prototype_dataset


def score_to_category(score: float) -> str:
    """Map continuous score [0-100] to HeatShield category."""
    if score < 25.0:
        return "LOW"
    elif score < 50.0:
        return "MODERATE"
    elif score < 75.0:
        return "HIGH"
    else:
        return "EXTREME"


def train_and_evaluate(
    data_path: str = None,
    artifacts_dir: str = None,
    horizon_hours: int = 6,
):
    """
    Execute end-to-end model training, chronological evaluation,
    and artifact serialization.
    """
    if data_path is None:
        data_path = os.path.join(BACKEND_DIR, "data", "heat_risk_dataset.csv")
        
    if artifacts_dir is None:
        artifacts_dir = os.path.join(CURRENT_DIR, "artifacts")
        
    os.makedirs(artifacts_dir, exist_ok=True)
    
    # 1. Load or generate dataset
    if not os.path.exists(data_path) or os.path.getsize(data_path) == 0:
        print(f"Dataset not found at {data_path}. Generating prototype dataset...")
        raw_df = generate_prototype_dataset(output_path=data_path)
    else:
        print(f"Loading existing dataset from {data_path}...")
        raw_df = pd.read_csv(data_path)
        
    print(f"Raw data shape: {raw_df.shape}")
    
    # 2. Feature Engineering
    print("Engineering features (lags, rolling averages, target shift)...")
    featured_df = engineer_features(raw_df, horizon_hours=horizon_hours)
    print(f"Engineered dataset shape (clean): {featured_df.shape}")
    
    # 3. Chronological Train / Test Split (80% Train, 20% Test)
    # Strictly chronological split based on timestamp to avoid any lookahead leakage
    featured_df["timestamp"] = pd.to_datetime(featured_df["timestamp"])
    unique_times = sorted(featured_df["timestamp"].unique())
    split_idx = int(len(unique_times) * 0.80)
    split_timestamp = unique_times[split_idx]
    
    train_mask = featured_df["timestamp"] < split_timestamp
    test_mask = featured_df["timestamp"] >= split_timestamp
    
    train_df = featured_df[train_mask]
    test_df = featured_df[test_mask]
    
    print(f"Train period: {train_df['timestamp'].min()} to {train_df['timestamp'].max()} ({len(train_df)} samples)")
    print(f"Test period:  {test_df['timestamp'].min()} to {test_df['timestamp'].max()} ({len(test_df)} samples)")
    assert train_df["timestamp"].max() < test_df["timestamp"].min(), "Error: Chronological split violation!"
    
    X_train = train_df[ALL_FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN]
    
    X_test = test_df[ALL_FEATURE_COLUMNS]
    y_test = test_df[TARGET_COLUMN]
    
    # True categorical test labels
    y_test_cats = [score_to_category(s) for s in y_test]
    categories = ["LOW", "MODERATE", "HIGH", "EXTREME"]
    
    # 4. Train Baseline Model (DummyRegressor - Mean)
    print("\nTraining baseline model (DummyRegressor - Mean)...")
    baseline = DummyRegressor(strategy="mean")
    baseline.fit(X_train, y_train)
    y_pred_baseline = baseline.predict(X_test)
    
    base_mae = float(mean_absolute_error(y_test, y_pred_baseline))
    base_rmse = float(root_mean_squared_error(y_test, y_pred_baseline))
    base_r2 = float(r2_score(y_test, y_pred_baseline))
    base_pred_cats = [score_to_category(s) for s in y_pred_baseline]
    base_acc = float(accuracy_score(y_test_cats, base_pred_cats))
    
    print(f"Baseline -> MAE: {base_mae:.3f}, RMSE: {base_rmse:.3f}, R2: {base_r2:.3f}, Cat Acc: {base_acc:.3f}")
    
    # 5. Train Main Model (XGBoost Regressor)
    print("\nTraining main model (XGBoost Regressor)...")
    main_model = xgb.XGBRegressor(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        tree_method="hist",
    )
    main_model.fit(X_train, y_train)
    
    # 6. Evaluate Main Model
    y_pred_raw = main_model.predict(X_test)
    y_pred = np.clip(y_pred_raw, 0.0, 100.0)
    
    main_mae = float(mean_absolute_error(y_test, y_pred))
    main_rmse = float(root_mean_squared_error(y_test, y_pred))
    main_r2 = float(r2_score(y_test, y_pred))
    
    y_pred_cats = [score_to_category(s) for s in y_pred]
    main_acc = float(accuracy_score(y_test_cats, y_pred_cats))
    
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test_cats, y_pred_cats, labels=categories, average="macro", zero_division=0
    )
    cm = confusion_matrix(y_test_cats, y_pred_cats, labels=categories).tolist()
    
    print(f"Main Model -> MAE: {main_mae:.3f}, RMSE: {main_rmse:.3f}, R2: {main_r2:.3f}")
    print(f"Classification -> Acc: {main_acc:.3f}, Precision: {float(precision):.3f}, Recall: {float(recall):.3f}, F1: {float(f1):.3f}")
    print(f"Confusion Matrix (labels={categories}):\n{cm}")
    
    # 7. Save Model Artifacts
    model_artifact_path = os.path.join(artifacts_dir, "heat_risk_model.joblib")
    features_artifact_path = os.path.join(artifacts_dir, "feature_columns.joblib")
    metrics_path = os.path.join(artifacts_dir, "metrics.json")
    
    joblib.dump(main_model, model_artifact_path)
    joblib.dump(ALL_FEATURE_COLUMNS, features_artifact_path)
    
    metrics_data = {
        "scientific_disclaimer": "The prototype ML model predicts future HeatShield-derived heat-health risk from environmental and vulnerability features. It is not a clinical prediction model and does not directly predict individual medical outcomes.",
        "training_data_source": "Prototype meteorological time-series for 19 West Godavari mandals with HeatShield risk formulas",
        "horizon_hours": horizon_hours,
        "total_samples": len(featured_df),
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "feature_count": len(ALL_FEATURE_COLUMNS),
        "feature_columns": ALL_FEATURE_COLUMNS,
        "baseline_model": {
            "name": "DummyRegressor(strategy='mean')",
            "mae": round(base_mae, 4),
            "rmse": round(base_rmse, 4),
            "r2": round(base_r2, 4),
            "category_accuracy": round(base_acc, 4),
        },
        "main_model": {
            "name": "XGBoost Regressor",
            "version": "prototype-v1",
            "hyperparameters": {
                "n_estimators": 120,
                "max_depth": 5,
                "learning_rate": 0.08,
            },
            "mae": round(main_mae, 4),
            "rmse": round(main_rmse, 4),
            "r2": round(main_r2, 4),
            "category_accuracy": round(main_acc, 4),
            "category_precision_macro": round(float(precision), 4),
            "category_recall_macro": round(float(recall), 4),
            "category_f1_macro": round(float(f1), 4),
            "confusion_matrix": cm,
            "category_labels": categories,
        },
    }
    
    with open(metrics_path, "w") as f:
        json.dump(metrics_data, f, indent=2)
        
    print(f"\nArtifacts successfully saved:")
    print(f"  - Model: {model_artifact_path}")
    print(f"  - Features: {features_artifact_path}")
    print(f"  - Metrics: {metrics_path}")
    
    return metrics_data


if __name__ == "__main__":
    train_and_evaluate()
