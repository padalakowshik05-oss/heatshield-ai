import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app
from services.alert_service import get_alert_level, generate_heat_alert
from services.action_service import get_recommended_actions
from services.explanation_service import (
    compute_shap_explanation,
    generate_human_readable_summary,
    get_tree_explainer,
)
from ml.feature_engineering import ALL_FEATURE_COLUMNS

client = TestClient(app)


# ----------------------------------------------------------------------
# 1. SHAP Feature Extraction & Column Integrity
# ----------------------------------------------------------------------
def test_shap_feature_extraction_uses_all_35_features():
    """Verify that SHAP explainer uses the identical 35 model features."""
    explainer, feature_cols = get_tree_explainer()
    assert explainer is not None, "SHAP TreeExplainer failed to load"
    assert feature_cols is not None, "Feature columns failed to load"
    assert len(feature_cols) == len(ALL_FEATURE_COLUMNS)
    assert set(feature_cols) == set(ALL_FEATURE_COLUMNS)


# ----------------------------------------------------------------------
# 2. SHAP Top-Factor Sorting by Absolute Impact
# ----------------------------------------------------------------------
def test_shap_top_factor_sorting():
    """Verify that SHAP factors are sorted by absolute impact descending."""
    weather = {"temperature": 43.5, "humidity": 72.0, "wind_speed": 6.0, "solar_radiation": 900.0}
    thermal = {"heat_index": 58.0, "wbgt": 37.0, "utci": 44.0, "thermal_stress_score": 90.0}
    vuln = {
        "vulnerability_score": 75.0,
        "elderly": 80.0, "children": 70.0, "outdoor_workers": 90.0,
        "population_density": 85.0, "housing_vulnerability": 75.0, "healthcare_vulnerability": 65.0
    }
    
    result = compute_shap_explanation(
        current_weather=weather,
        current_thermal=thermal,
        vulnerability_data=vuln,
        current_risk_score=85.5,
        area_name="Tadepalligudem",
        top_k=5,
    )
    
    assert result["explanation_available"] is True
    top_factors = result["top_factors"]
    assert len(top_factors) == 5
    
    # Verify strict descending order
    for i in range(len(top_factors) - 1):
        assert top_factors[i]["impact"] >= top_factors[i+1]["impact"]
        assert top_factors[i]["direction"] in ["increases_risk", "decreases_risk"]


# ----------------------------------------------------------------------
# 3. Alert Threshold Boundaries
# ----------------------------------------------------------------------
def test_alert_threshold_boundaries():
    """
    Verify exact prototype alert boundaries:
    24 -> no active alert (LOW)
    25 -> HEAT WATCH (MODERATE)
    49 -> HEAT WATCH (MODERATE)
    50 -> HEAT WARNING (HIGH)
    74 -> HEAT WARNING (HIGH)
    75 -> EXTREME HEAT EMERGENCY (EXTREME)
    100 -> EXTREME HEAT EMERGENCY (EXTREME)
    """
    assert get_alert_level(24.0)["level"] == "LOW"
    assert get_alert_level(24.0)["active"] is False
    
    assert get_alert_level(25.0)["level"] == "MODERATE"
    assert get_alert_level(25.0)["status"] == "HEAT WATCH"
    assert get_alert_level(25.0)["active"] is True
    
    assert get_alert_level(49.0)["level"] == "MODERATE"
    assert get_alert_level(49.0)["status"] == "HEAT WATCH"
    
    assert get_alert_level(50.0)["level"] == "HIGH"
    assert get_alert_level(50.0)["status"] == "HEAT WARNING"
    
    assert get_alert_level(74.0)["level"] == "HIGH"
    assert get_alert_level(74.0)["status"] == "HEAT WARNING"
    
    assert get_alert_level(75.0)["level"] == "EXTREME"
    assert get_alert_level(75.0)["status"] == "EXTREME HEAT EMERGENCY"
    
    assert get_alert_level(100.0)["level"] == "EXTREME"
    assert get_alert_level(100.0)["status"] == "EXTREME HEAT EMERGENCY"


# ----------------------------------------------------------------------
# 4. Alert Priority Mappings
# ----------------------------------------------------------------------
def test_alert_priority_mapping():
    """Verify priority matches LOW -> INFO, MODERATE -> WATCH, HIGH -> WARNING, EXTREME -> CRITICAL."""
    assert get_alert_level(15.0)["priority"] == "INFO"
    assert get_alert_level(35.0)["priority"] == "WATCH"
    assert get_alert_level(65.0)["priority"] == "WARNING"
    assert get_alert_level(85.0)["priority"] == "CRITICAL"


# ----------------------------------------------------------------------
# 5. Current-Risk Alert Generation
# ----------------------------------------------------------------------
def test_current_risk_alert_generation():
    """Verify active alert when current risk is high/extreme."""
    alert = generate_heat_alert(current_risk_score=82.0, predicted_risk_score=80.0, area_name="Tadepalligudem")
    assert alert["active"] is True
    assert alert["level"] == "EXTREME"
    assert alert["priority"] == "CRITICAL"
    assert "currently active" in alert["message"].lower()


# ----------------------------------------------------------------------
# 6. Future-Risk Predictive Alert Generation
# ----------------------------------------------------------------------
def test_future_risk_predictive_alert_generation():
    """
    Verify early warning trigger when current risk is moderate (e.g. 40),
    but 6-hour prediction escalates to high/extreme (e.g. 78).
    """
    alert = generate_heat_alert(current_risk_score=40.0, predicted_risk_score=78.0, area_name="Bhimavaram")
    assert alert["active"] is True
    assert alert["priority"] == "CRITICAL"
    assert "within 6 hours" in alert["message"].lower() or "expected" in alert["message"].lower()
    assert "Predicted 6-hour risk" in alert["trigger"]


# ----------------------------------------------------------------------
# 7. Low / Sub-Threshold Alert Logic
# ----------------------------------------------------------------------
def test_low_risk_no_active_alert():
    """Verify inactive alert status when both current and predicted risk are below 25."""
    alert = generate_heat_alert(current_risk_score=18.0, predicted_risk_score=20.0, area_name="Narsapur")
    assert alert["active"] is False
    assert alert["level"] == "LOW"
    assert alert["priority"] == "INFO"
    assert "Normal biometeorological conditions" in alert["message"]


# ----------------------------------------------------------------------
# 8. Recommended Actions by Risk Tier
# ----------------------------------------------------------------------
def test_recommended_actions_by_tier():
    """Verify recommended actions are returned for each tier (3-4 actions)."""
    actions_extreme = get_recommended_actions("EXTREME")
    assert 3 <= len(actions_extreme) <= 4
    texts_extreme = [a["action"].lower() for a in actions_extreme]
    assert any("water" in t for t in texts_extreme)
    assert any("cooling" in t for t in texts_extreme)

    actions_low = get_recommended_actions("LOW")
    assert 2 <= len(actions_low) <= 4
    texts_low = [a["action"].lower() for a in actions_low]
    assert any("monitoring" in t or "precautions" in t for t in texts_low)


# ----------------------------------------------------------------------
# 9. Factor-Specific Action Enrichment
# ----------------------------------------------------------------------
def test_factor_specific_actions():
    """Verify SHAP top factors inject targeted public health actions."""
    # Worker vulnerability dominant
    top_factors = [
        {"feature": "outdoor_workers", "impact": 8.5, "direction": "increases_risk"},
        {"feature": "humidity", "impact": 6.2, "direction": "increases_risk"},
    ]
    actions = get_recommended_actions("HIGH", top_factors=top_factors)
    actions_text = " ".join([a["action"].lower() + " " + a["detail"].lower() for a in actions])
    
    assert "outdoor work" in actions_text or "labor" in actions_text
    assert "hydration" in actions_text or "electrolyte" in actions_text


# ----------------------------------------------------------------------
# 10. Missing Model / SHAP Failure Handling
# ----------------------------------------------------------------------
def test_missing_model_shap_graceful_handling(monkeypatch):
    """Verify compute_shap_explanation returns explanation_available: false without crashing."""
    import services.explanation_service as exp_svc
    monkeypatch.setattr(exp_svc, "get_tree_explainer", lambda **kwargs: (None, None))
    
    result = exp_svc.compute_shap_explanation(
        current_weather={"temperature": 35.0, "humidity": 60.0},
        current_thermal={"heat_index": 38.0},
        vulnerability_data={"vulnerability_score": 50.0},
        current_risk_score=55.0,
    )
    assert result["explanation_available"] is False
    assert "unavailable" in result["summary"].lower()


# ----------------------------------------------------------------------
# 11. Full End-to-End Alert & Explanation API Endpoints
# ----------------------------------------------------------------------
def test_api_alerts_get_endpoint():
    """GET /alerts/{area_name} returns complete coordinated payload."""
    response = client.get("/alerts/Tadepalligudem")
    assert response.status_code == 200
    data = response.json()
    
    assert data["area"] == "Tadepalligudem"
    assert "current_risk" in data
    assert "prediction" in data
    assert "alert" in data
    assert "explanation" in data
    assert "recommended_actions" in data
    assert data["alert"]["level"] in ["LOW", "MODERATE", "HIGH", "EXTREME"]
    assert 3 <= len(data["recommended_actions"]) <= 4


def test_api_alerts_unknown_area_returns_404():
    """GET /alerts/{area_name} with unknown area returns 404."""
    response = client.get("/alerts/UnknownAreaXYZ")
    assert response.status_code == 404
    assert "Vulnerability data not available" in response.json()["detail"]


def test_api_explanation_post_endpoint():
    """POST /explanation returns SHAP top factors and summary."""
    payload = {
        "area_name": "Tadepalligudem",
        "latitude": 16.8152,
        "longitude": 81.5267,
    }
    response = client.post("/explanation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["explanation_available"] is True
    assert "top_factors" in data
    assert len(data["top_factors"]) == 5
    assert "summary" in data
