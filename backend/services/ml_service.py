import os
import sys
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
ARTIFACTS_DIR = os.path.join(BACKEND_DIR, "ml", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "heat_risk_model.joblib")
FEATURES_PATH = os.path.join(ARTIFACTS_DIR, "feature_columns.joblib")

# Internal cache
_cached_model = None
_cached_feature_columns = None


def load_prediction_model(force_reload: bool = False):
    """
    Load trained model artifact and feature columns from disk.
    Caches model in memory for fast low-latency inference.
    """
    global _cached_model, _cached_feature_columns
    
    if _cached_model is not None and _cached_feature_columns is not None and not force_reload:
        return _cached_model, _cached_feature_columns
        
    if not os.path.exists(MODEL_PATH) or not os.path.exists(FEATURES_PATH):
        _cached_model = None
        _cached_feature_columns = None
        return None, None
        
    try:
        _cached_model = joblib.load(MODEL_PATH)
        _cached_feature_columns = joblib.load(FEATURES_PATH)
        return _cached_model, _cached_feature_columns
    except Exception as e:
        print(f"Warning: Failed to load model artifact: {e}")
        _cached_model = None
        _cached_feature_columns = None
        return None, None


def is_model_available() -> bool:
    """Check if the model artifact is present and loadable."""
    model, features = load_prediction_model()
    return model is not None and features is not None


def score_to_category(score: float) -> str:
    """Standard HeatShield risk category classification."""
    if score < 25.0:
        return "LOW"
    elif score < 50.0:
        return "MODERATE"
    elif score < 75.0:
        return "HIGH"
    else:
        return "EXTREME"


def calculate_trend(predicted_score: float, current_score: float, threshold: float = 3.0) -> Dict[str, Any]:
    """
    Compute directional trend between current risk score and 6-hour predicted risk score.
    Returns trend status, numerical delta, and formatted label.
    """
    diff = round(predicted_score - current_score, 1)
    
    if diff > threshold:
        direction = "Increasing"
        icon = "↑"
    elif diff < -threshold:
        direction = "Decreasing"
        icon = "↓"
    else:
        direction = "Stable"
        icon = "→"
        
    sign = "+" if diff > 0 else ""
    return {
        "trend": direction,
        "diff": diff,
        "icon": icon,
        "formatted": f"{icon} {direction} ({sign}{diff})",
    }


def get_prediction_explanation(
    predicted_score: float,
    current_score: float,
    thermal_stress_score: float,
    vulnerability_score: float,
    trend: str,
) -> str:
    """
    Generate deterministic, transparent explanation of the 6-hour prediction
    grounded in thermal dynamics and demographic vulnerability.
    """
    if trend == "Increasing":
        if thermal_stress_score >= 65.0:
            return "Predicted risk is increasing over the next 6 hours as elevated ambient temperatures and solar exposure drive up thermal stress."
        else:
            return "Predicted risk is trending upward as daytime thermal conditions intensify."
    elif trend == "Decreasing":
        return "Predicted risk is decreasing as diurnal cooling and moderating solar exposure lower environmental stress."
    else:
        if thermal_stress_score >= 75.0:
            return "Predicted risk remains critical and steady due to sustained high thermal stress across the warning window."
        elif vulnerability_score >= 60.0:
            return "Predicted risk remains stable with population vulnerability maintaining an elevated baseline."
        else:
            return "Predicted risk is expected to remain stable with moderate environmental thermal conditions."


def predict_future_risk(
    current_weather: Dict[str, Any],
    current_thermal: Dict[str, Any],
    vulnerability_data: Dict[str, Any],
    current_risk_score: float,
    recent_history: Optional[pd.DataFrame] = None,
) -> Dict[str, Any]:
    """
    Perform 6-hour future HeatShield risk inference using the trained XGBoost model.
    Accepts current environmental, thermal, and vulnerability parameters.
    """
    from ml.feature_engineering import prepare_single_inference_vector
    
    model, feature_cols = load_prediction_model()
    if model is None or feature_cols is None:
        raise RuntimeError("Prediction model is not trained yet.")
        
    # Construct feature dataframe matching exact training columns
    X = prepare_single_inference_vector(
        current_weather=current_weather,
        current_thermal=current_thermal,
        vulnerability_data=vulnerability_data,
        current_risk_score=current_risk_score,
        recent_history=recent_history,
    )
    
    # Run model prediction
    raw_prediction = float(model.predict(X[feature_cols])[0])
    
    # Clamp score to [0.0, 100.0]
    predicted_score = round(max(0.0, min(100.0, raw_prediction)), 1)
    predicted_category = score_to_category(predicted_score)
    
    # Calculate directional trend
    trend_info = calculate_trend(predicted_score, current_risk_score)
    
    # Thermal score
    thermal_score = float(current_thermal.get("thermal_stress_score", current_risk_score))
    vuln_score = float(vulnerability_data.get("vulnerability_score", 50.0))
    
    explanation = get_prediction_explanation(
        predicted_score=predicted_score,
        current_score=current_risk_score,
        thermal_stress_score=thermal_score,
        vulnerability_score=vuln_score,
        trend=trend_info["trend"],
    )
    
    return {
        "horizon_hours": 6,
        "predicted_risk_score": predicted_score,
        "predicted_risk_category": predicted_category,
        "trend": trend_info["trend"],
        "trend_diff": trend_info["diff"],
        "trend_formatted": trend_info["formatted"],
        "explanation": explanation,
        "model_metadata": {
            "name": "XGBoost Regressor",
            "version": "prototype-v1",
            "prediction_type": "future HeatShield risk",
            "training_type": "prototype derived-risk",
            "scientific_scope": "Predicts future HeatShield-derived heat-health risk (~6 hours). Not a clinical diagnosis model.",
            "status": "active",
        },
    }
