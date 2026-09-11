import os
import sys
import pytest
import numpy as np
import pandas as pd
import joblib
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app
from ml.feature_engineering import (
    ALL_FEATURE_COLUMNS,
    TARGET_COLUMN,
    engineer_features,
    prepare_single_inference_vector,
)
from services.ml_service import (
    score_to_category,
    calculate_trend,
    get_prediction_explanation,
    predict_future_risk,
    load_prediction_model,
    is_model_available,
)

client = TestClient(app)


# ----------------------------------------------------------------------
# 1. Feature Engineering & Column Verification
# ----------------------------------------------------------------------
def test_feature_engineering_columns():
    """Verify that feature engineering produces all required columns."""
    sample_df = pd.DataFrame({
        "timestamp": pd.date_range("2025-05-01 00:00:00", periods=48, freq="h"),
        "area": ["Tadepalligudem"] * 48,
        "temperature": [30.0 + i * 0.2 for i in range(48)],
        "humidity": [60.0] * 48,
        "wind_speed": [10.0] * 48,
        "solar_radiation": [300.0] * 48,
        "heat_index": [35.0] * 48,
        "estimated_wbgt": [28.0] * 48,
        "estimated_utci": [32.0] * 48,
        "thermal_stress_score": [50.0] * 48,
        "elderly": [45.0] * 48,
        "children": [40.0] * 48,
        "outdoor_workers": [55.0] * 48,
        "population_density": [50.0] * 48,
        "housing_vulnerability": [45.0] * 48,
        "healthcare_vulnerability": [40.0] * 48,
        "vulnerability_score": [46.0] * 48,
        "risk_score": [48.0] * 48,
    })
    
    engineered = engineer_features(sample_df, horizon_hours=6)
    
    for col in ALL_FEATURE_COLUMNS:
        assert col in engineered.columns, f"Missing feature column: {col}"
    assert TARGET_COLUMN in engineered.columns
    assert len(engineered) > 0
    assert not engineered[ALL_FEATURE_COLUMNS].isnull().any().any()


# ----------------------------------------------------------------------
# 2. Lag Features Accuracy
# ----------------------------------------------------------------------
def test_lag_features_accuracy():
    """Verify lag 1, 3, 6, 24 correctly match past values."""
    temps = [20.0 + i for i in range(40)]
    sample_df = pd.DataFrame({
        "timestamp": pd.date_range("2025-05-01 00:00:00", periods=40, freq="h"),
        "area": ["TestArea"] * 40,
        "temperature": temps,
        "humidity": [50.0] * 40,
        "wind_speed": [10.0] * 40,
        "solar_radiation": [200.0] * 40,
        "heat_index": temps,
        "estimated_wbgt": temps,
        "estimated_utci": temps,
        "thermal_stress_score": temps,
        "elderly": [50.0] * 40,
        "children": [50.0] * 40,
        "outdoor_workers": [50.0] * 40,
        "population_density": [50.0] * 40,
        "housing_vulnerability": [50.0] * 40,
        "healthcare_vulnerability": [50.0] * 40,
        "vulnerability_score": [50.0] * 40,
        "risk_score": temps,
    })
    
    engineered = engineer_features(sample_df, horizon_hours=6)
    row = engineered.iloc[0]
    orig_idx = sample_df[sample_df["timestamp"] == row["timestamp"]].index[0]
    
    assert row["temperature_lag_1"] == sample_df["temperature"].iloc[orig_idx - 1]
    assert row["temperature_lag_3"] == sample_df["temperature"].iloc[orig_idx - 3]
    assert row["temperature_lag_6"] == sample_df["temperature"].iloc[orig_idx - 6]
    assert row["temperature_lag_24"] == sample_df["temperature"].iloc[orig_idx - 24]


# ----------------------------------------------------------------------
# 3. Rolling Features Accuracy
# ----------------------------------------------------------------------
def test_rolling_features_accuracy():
    """Verify rolling 3h, 6h, 24h backward-looking averages."""
    temps = [float(i) for i in range(40)]
    sample_df = pd.DataFrame({
        "timestamp": pd.date_range("2025-05-01 00:00:00", periods=40, freq="h"),
        "area": ["TestArea"] * 40,
        "temperature": temps,
        "humidity": [50.0] * 40,
        "wind_speed": [10.0] * 40,
        "solar_radiation": [200.0] * 40,
        "heat_index": temps,
        "estimated_wbgt": temps,
        "estimated_utci": temps,
        "thermal_stress_score": temps,
        "elderly": [50.0] * 40,
        "children": [50.0] * 40,
        "outdoor_workers": [50.0] * 40,
        "population_density": [50.0] * 40,
        "housing_vulnerability": [50.0] * 40,
        "healthcare_vulnerability": [50.0] * 40,
        "vulnerability_score": [50.0] * 40,
        "risk_score": temps,
    })
    
    engineered = engineer_features(sample_df, horizon_hours=6)
    row = engineered.iloc[0]
    orig_idx = sample_df[sample_df["timestamp"] == row["timestamp"]].index[0]
    
    expected_3h = np.mean(sample_df["temperature"].iloc[orig_idx-2 : orig_idx+1])
    assert abs(row["temperature_3h_avg"] - expected_3h) < 1e-4


# ----------------------------------------------------------------------
# 4. Target Shift Verification
# ----------------------------------------------------------------------
def test_target_shift_accuracy():
    """Verify future_risk_score aligns with T+6."""
    risks = [float(i * 2) for i in range(40)]
    sample_df = pd.DataFrame({
        "timestamp": pd.date_range("2025-05-01 00:00:00", periods=40, freq="h"),
        "area": ["TestArea"] * 40,
        "temperature": [30.0] * 40,
        "humidity": [50.0] * 40,
        "wind_speed": [10.0] * 40,
        "solar_radiation": [200.0] * 40,
        "heat_index": [30.0] * 40,
        "estimated_wbgt": [25.0] * 40,
        "estimated_utci": [28.0] * 40,
        "thermal_stress_score": [50.0] * 40,
        "elderly": [50.0] * 40,
        "children": [50.0] * 40,
        "outdoor_workers": [50.0] * 40,
        "population_density": [50.0] * 40,
        "housing_vulnerability": [50.0] * 40,
        "healthcare_vulnerability": [50.0] * 40,
        "vulnerability_score": [50.0] * 40,
        "risk_score": risks,
    })
    
    engineered = engineer_features(sample_df, horizon_hours=6)
    row = engineered.iloc[0]
    orig_idx = sample_df[sample_df["timestamp"] == row["timestamp"]].index[0]
    
    assert row[TARGET_COLUMN] == sample_df["risk_score"].iloc[orig_idx + 6]


# ----------------------------------------------------------------------
# 5. Data Leakage Prevention
# ----------------------------------------------------------------------
def test_data_leakage_prevention():
    """Verify that feature columns do NOT contain future target or lookahead values."""
    assert TARGET_COLUMN not in ALL_FEATURE_COLUMNS
    for col in ALL_FEATURE_COLUMNS:
        assert not col.startswith("target"), f"Feature column {col} appears to be a target!"
        assert not "future" in col, f"Feature column {col} contains lookahead 'future' indicator!"


# ----------------------------------------------------------------------
# 6. Chronological Split Guarantee
# ----------------------------------------------------------------------
def test_chronological_split_logic():
    """Verify train timestamps are strictly earlier than test timestamps."""
    times = pd.date_range("2025-01-01", periods=100, freq="D")
    split_idx = int(len(times) * 0.8)
    train_times = times[:split_idx]
    test_times = times[split_idx:]
    
    assert train_times.max() < test_times.min()


# ----------------------------------------------------------------------
# 7. Model Artifact Exists and Loads
# ----------------------------------------------------------------------
def test_model_artifact_exists_and_loads():
    """Verify model and feature columns exist in artifacts and are loadable."""
    model, features = load_prediction_model(force_reload=True)
    assert model is not None, "heat_risk_model.joblib failed to load"
    assert features is not None, "feature_columns.joblib failed to load"
    assert len(features) == len(ALL_FEATURE_COLUMNS)


# ----------------------------------------------------------------------
# 8. Score Bounds & Range
# ----------------------------------------------------------------------
def test_prediction_score_bounds():
    """Verify predicted risk score is strictly bounded [0, 100]."""
    current_weather = {"temperature": 45.0, "humidity": 75.0, "wind_speed": 5.0, "solar_radiation": 950.0}
    current_thermal = {"heat_index": 52.0, "wbgt": 38.0, "utci": 44.0, "thermal_stress_score": 92.0}
    vulnerability_data = {
        "vulnerability_score": 80.0,
        "elderly": 85.0, "children": 75.0, "outdoor_workers": 90.0,
        "population_density": 80.0, "housing_vulnerability": 75.0, "healthcare_vulnerability": 70.0
    }
    
    result = predict_future_risk(
        current_weather=current_weather,
        current_thermal=current_thermal,
        vulnerability_data=vulnerability_data,
        current_risk_score=88.4,
    )
    
    assert 0.0 <= result["predicted_risk_score"] <= 100.0
    assert result["predicted_risk_category"] in ["LOW", "MODERATE", "HIGH", "EXTREME"]
    assert result["trend"] in ["Increasing", "Decreasing", "Stable"]


# ----------------------------------------------------------------------
# 9. Category Mapping Boundaries
# ----------------------------------------------------------------------
def test_score_to_category_thresholds():
    """Verify exact category thresholds: [0, 25, 50, 75, 100]."""
    assert score_to_category(0.0) == "LOW"
    assert score_to_category(24.9) == "LOW"
    assert score_to_category(25.0) == "MODERATE"
    assert score_to_category(49.9) == "MODERATE"
    assert score_to_category(50.0) == "HIGH"
    assert score_to_category(74.9) == "HIGH"
    assert score_to_category(75.0) == "EXTREME"
    assert score_to_category(100.0) == "EXTREME"


# ----------------------------------------------------------------------
# 10. Trend Helper Logic
# ----------------------------------------------------------------------
def test_calculate_trend_logic():
    """Verify directional trend detection with thresholding."""
    up = calculate_trend(predicted_score=85.0, current_score=80.0, threshold=3.0)
    assert up["trend"] == "Increasing"
    assert up["diff"] == 5.0
    assert "↑" in up["icon"]
    
    down = calculate_trend(predicted_score=70.0, current_score=75.0, threshold=3.0)
    assert down["trend"] == "Decreasing"
    assert down["diff"] == -5.0
    assert "↓" in down["icon"]
    
    stable = calculate_trend(predicted_score=75.5, current_score=75.0, threshold=3.0)
    assert stable["trend"] == "Stable"
    assert abs(stable["diff"]) <= 3.0


# ----------------------------------------------------------------------
# 11. Deterministic Explanation
# ----------------------------------------------------------------------
def test_prediction_explanation_content():
    """Verify explanation strings correspond to trend and thermal stress."""
    exp_inc = get_prediction_explanation(85.0, 78.0, 70.0, 50.0, "Increasing")
    assert "increasing" in exp_inc.lower()
    
    exp_dec = get_prediction_explanation(65.0, 75.0, 50.0, 50.0, "Decreasing")
    assert "decreasing" in exp_dec.lower()


# ----------------------------------------------------------------------
# 12. API Status & Prediction Endpoint Integration
# ----------------------------------------------------------------------
def test_api_prediction_status():
    """GET /prediction/status returns ready."""
    response = client.get("/prediction/status")
    assert response.status_code == 200
    data = response.json()
    assert data["model_available"] is True
    assert data["status"] == "ready"


def test_api_prediction_predict_success():
    """POST /prediction/predict with valid area returns complete prediction schema."""
    payload = {
        "area_name": "Tadepalligudem",
        "latitude": 16.8152,
        "longitude": 81.5267,
    }
    response = client.post("/prediction/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["area"] == "Tadepalligudem"
    assert "prediction" in data
    assert data["prediction"]["horizon_hours"] == 6
    assert 0.0 <= data["prediction"]["predicted_risk_score"] <= 100.0
    assert data["prediction"]["predicted_risk_category"] in ["LOW", "MODERATE", "HIGH", "EXTREME"]
    assert data["prediction"]["trend"] in ["Increasing", "Decreasing", "Stable"]
    assert "current" in data
    assert "model" in data
    assert data["model"]["name"] == "XGBoost Regressor"
    assert data["model"]["version"] == "prototype-v1"


def test_api_prediction_predict_unknown_area():
    """POST /prediction/predict with unknown area returns 404."""
    payload = {
        "area_name": "NonExistentPlaceXYZ",
        "latitude": 16.8152,
        "longitude": 81.5267,
    }
    response = client.post("/prediction/predict", json=payload)
    assert response.status_code == 404
    assert "Vulnerability data not available" in response.json()["detail"]


def test_api_prediction_predict_invalid_coordinates():
    """POST /prediction/predict with invalid latitude returns 422 validation error."""
    payload = {
        "area_name": "Tadepalligudem",
        "latitude": 999.0,  # Invalid latitude > 90
        "longitude": 81.5267,
    }
    response = client.post("/prediction/predict", json=payload)
    assert response.status_code == 422


def test_api_prediction_missing_model_returns_503(monkeypatch):
    """POST /prediction/predict when model artifact is missing returns 503."""
    import services.ml_service as ml_svc
    monkeypatch.setattr(ml_svc, "load_prediction_model", lambda **kwargs: (None, None))
    
    payload = {
        "area_name": "Tadepalligudem",
        "latitude": 16.8152,
        "longitude": 81.5267,
    }
    response = client.post("/prediction/predict", json=payload)
    assert response.status_code == 503
    assert "Prediction model is not trained yet." in response.json()["detail"]
