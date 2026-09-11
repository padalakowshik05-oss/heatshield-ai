import os
import sys
import shap
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from services.ml_service import load_prediction_model
from ml.feature_engineering import prepare_single_inference_vector

# Cached explainer
_cached_explainer = None
_cached_model_ref = None

FEATURE_LABEL_MAP = {
    "temperature": "Ambient Temperature",
    "humidity": "Relative Humidity",
    "wind_speed": "Surface Wind Speed",
    "solar_radiation": "Solar Radiation Intensity",
    "heat_index": "NOAA Heat Index",
    "estimated_wbgt": "Estimated Wet Bulb Globe Temperature (WBGT)",
    "estimated_utci": "Estimated Universal Thermal Climate Index (UTCI)",
    "thermal_stress_score": "Composite Thermal Stress Score",
    "outdoor_workers": "Outdoor Worker Labor Exposure",
    "elderly": "Elderly Demographic Sensitivity",
    "children": "Pediatric Age Vulnerability",
    "population_density": "Urban Population Density",
    "housing_vulnerability": "Housing Heat Retention",
    "healthcare_vulnerability": "Healthcare Access Vulnerability",
    "vulnerability_score": "Overall Baseline Vulnerability",
    "temperature_lag_1": "Recent Hourly Temperature Trend",
    "temperature_lag_3": "3-Hour Temperature Shift",
    "temperature_lag_6": "6-Hour Temperature Shift",
    "temperature_lag_24": "24-Hour Diurnal Baseline",
    "humidity_lag_1": "Recent Humidity Trend",
    "wbgt_lag_1": "Recent WBGT Level",
    "wbgt_lag_3": "3-Hour WBGT Persistence",
    "risk_lag_1": "Preceding Hour Risk Baseline",
    "risk_lag_3": "3-Hour Risk Trajectory",
    "risk_lag_6": "6-Hour Risk Trajectory",
    "temperature_3h_avg": "Sustained 3-Hour Temperature",
    "temperature_6h_avg": "Sustained 6-Hour Heat",
    "temperature_24h_avg": "24-Hour Cumulative Heat Load",
    "wbgt_3h_avg": "Sustained 3-Hour WBGT",
    "wbgt_6h_avg": "Sustained 6-Hour WBGT",
    "risk_3h_avg": "Sustained 3-Hour Risk Baseline",
    "risk_6h_avg": "Sustained 6-Hour Risk Baseline",
    "hour": "Time of Day (Diurnal Cycle)",
    "day_of_week": "Weekly Cycle",
    "month": "Seasonal Cycle",
}


def get_tree_explainer(force_reload: bool = False):
    """
    Retrieve or initialize the cached SHAP TreeExplainer for the XGBoost model.
    """
    global _cached_explainer, _cached_model_ref
    
    model, features = load_prediction_model(force_reload=force_reload)
    if model is None or features is None:
        return None, None
        
    if _cached_explainer is not None and _cached_model_ref is model and not force_reload:
        return _cached_explainer, features
        
    try:
        _cached_explainer = shap.TreeExplainer(model)
        _cached_model_ref = model
        return _cached_explainer, features
    except Exception as e:
        print(f"Warning: Failed to initialize SHAP TreeExplainer: {e}")
        _cached_explainer = None
        _cached_model_ref = None
        return None, None


def get_impact_level(impact: float) -> str:
    """Format impact into an operational category."""
    if impact >= 5.0:
        return "High impact"
    elif impact >= 2.0:
        return "Moderate impact"
    else:
        return "Low impact"


def generate_human_readable_summary(top_factors: List[Dict[str, Any]], area_name: str) -> str:
    """
    Synthesize plain-language summary of SHAP attribution factors.
    Avoids raw statistical formulas while clearly communicating dominant drivers.
    """
    if not top_factors:
        return f"Environmental conditions and baseline demographics define the current risk profile for {area_name}."
        
    # Categorize top drivers into environmental vs vulnerability
    env_keys = {"temperature", "humidity", "solar_radiation", "wind_speed", "heat_index", "estimated_wbgt", "estimated_utci", "thermal_stress_score"}
    vuln_keys = {"outdoor_workers", "elderly", "children", "population_density", "housing_vulnerability", "healthcare_vulnerability", "vulnerability_score"}
    
    env_drivers = [f["label"] for f in top_factors if any(k in f["feature"] for k in env_keys)]
    vuln_drivers = [f["label"] for f in top_factors if any(k in f["feature"] for k in vuln_keys)]
    
    parts = []
    if env_drivers:
        primary_env = env_drivers[:2]
        parts.append(f"{' and '.join(primary_env).lower()} are the strongest environmental contributors to elevated thermal stress")
    
    if vuln_drivers:
        primary_vuln = vuln_drivers[:2]
        if parts:
            parts.append(f"compounded by elevated {', '.join(primary_vuln).lower()} in this locality")
        else:
            parts.append(f"{' and '.join(primary_vuln).lower()} significantly increase the baseline heat-health vulnerability")
            
    if parts:
        joined = ", ".join(parts)
        return joined[0].upper() + joined[1:] + "."
    
    return f"{top_factors[0]['label']} is the primary driver influencing the predicted heat risk for {area_name}."


def compute_shap_explanation(
    current_weather: Dict[str, Any],
    current_thermal: Dict[str, Any],
    vulnerability_data: Dict[str, Any],
    current_risk_score: float,
    area_name: str = "Tadepalligudem",
    top_k: int = 5,
) -> Dict[str, Any]:
    """
    Compute actual SHAP feature attributions on the trained XGBoost model.
    Returns the top-k most influential factors, their direction of impact,
    and a synthesized plain-language explanation.
    """
    explainer, feature_cols = get_tree_explainer()
    if explainer is None or feature_cols is None:
        return {
            "explanation_available": False,
            "summary": "Explanation unavailable for this prediction.",
            "top_factors": [],
            "scientific_disclaimer": "SHAP feature attributions evaluate model input sensitivity, not clinical/medical causality.",
        }
        
    try:
        # Construct feature vector with exact training columns and order
        X = prepare_single_inference_vector(
            current_weather=current_weather,
            current_thermal=current_thermal,
            vulnerability_data=vulnerability_data,
            current_risk_score=current_risk_score,
        )
        
        X_ordered = X[feature_cols]
        shap_values = explainer.shap_values(X_ordered)
        
        # In tree-based regression, shap_values is a 2D array of shape (1, num_features)
        raw_shaps = np.array(shap_values).flatten()
        
        factor_list = []
        for idx, col in enumerate(feature_cols):
            shap_val = float(raw_shaps[idx])
            feature_val = float(X_ordered.iloc[0, idx])
            impact = round(abs(shap_val), 2)
            direction = "increases_risk" if shap_val > 0 else "decreases_risk"
            
            label = FEATURE_LABEL_MAP.get(col, col.replace("_", " ").title())
            
            factor_list.append({
                "feature": col,
                "label": label,
                "value": round(feature_val, 1),
                "shap_value": round(shap_val, 3),
                "impact": impact,
                "impact_level": get_impact_level(impact),
                "direction": direction,
            })
            
        # Sort by absolute impact descending
        factor_list.sort(key=lambda x: x["impact"], reverse=True)
        top_factors = factor_list[:top_k]
        
        summary = generate_human_readable_summary(top_factors, area_name)
        
        return {
            "explanation_available": True,
            "area": area_name,
            "summary": summary,
            "top_factors": top_factors,
            "all_features_count": len(feature_cols),
            "explainer_type": "TreeExplainer (XGBoost)",
            "scientific_disclaimer": "SHAP explanations describe how input features influence the prototype model's predicted HeatShield risk score. They should not be interpreted as medical causality.",
        }
    except Exception as e:
        print(f"Error computing SHAP values: {e}")
        return {
            "explanation_available": False,
            "summary": "Explanation unavailable for this prediction.",
            "top_factors": [],
            "error": str(e),
            "scientific_disclaimer": "SHAP feature attributions evaluate model input sensitivity, not clinical/medical causality.",
        }
