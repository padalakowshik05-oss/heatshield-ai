"""
HeatShield AI — Thermal Stress Calculation & API Tests (Step 3)
==============================================================
Comprehensive pytest suite covering:
1. Normal hot/humid conditions
2. Moderate conditions
3. Low-risk conditions
4. Heat Index calculation (Rothfusz + low temperature fallback)
5. Thermal Stress Score normalization and bounds (0–100)
6. Thermal Stress Category mapping
7. UTCI calculation for valid inputs
8. UTCI handling for invalid/out-of-range inputs without crashing
9. FastAPI route response schema and HTTP status codes
"""

from fastapi.testclient import TestClient
from main import app

from services.thermal_service import (
    calculate_heat_index,
    calculate_wet_bulb,
    estimate_globe_temperature,
    calculate_estimated_wbgt,
    calculate_estimated_utci,
    normalize,
    normalize_heat_index,
    normalize_wbgt,
    normalize_utci,
    calculate_thermal_stress_score,
    get_thermal_stress_category,
    get_risk_category,
    calculate_thermal_metrics
)

client = TestClient(app)


# ==========================================
# 1. HEAT INDEX TESTS
# ==========================================

def test_heat_index_structure():
    result = calculate_heat_index(40.0, 70.0)
    assert isinstance(result, dict)
    assert "value" in result
    assert "unit" in result
    assert "status" in result
    assert result["unit"] == "°C"
    assert isinstance(result["value"], (int, float))


def test_heat_index_increases_with_humidity():
    low = calculate_heat_index(40.0, 30.0)["value"]
    high = calculate_heat_index(40.0, 70.0)["value"]
    assert high > low


def test_heat_index_increases_with_temperature():
    low = calculate_heat_index(35.0, 70.0)["value"]
    high = calculate_heat_index(40.0, 70.0)["value"]
    assert high > low


def test_heat_index_rothfusz_applicability():
    # Hot condition (40°C = 104°F, RH = 65%) should use full Rothfusz regression
    result = calculate_heat_index(40.0, 65.0)
    assert result["status"] == "calculated"
    assert result["value"] > 45.0


def test_heat_index_low_temperature_fallback():
    # Cool condition (18°C = 64.4°F < 68°F)
    result = calculate_heat_index(18.0, 50.0)
    assert result["status"] == "estimated"
    assert result["value"] == 18.0


def test_heat_index_moderate_temperature_steadman():
    # Moderate condition (24°C = 75.2°F, 68°F <= T < 80°F)
    result = calculate_heat_index(24.0, 50.0)
    assert result["status"] == "estimated"
    assert 22.0 <= result["value"] <= 26.0


# ==========================================
# 2. WET BULB & GLOBE TEMPERATURE TESTS
# ==========================================

def test_wet_bulb_is_numeric():
    result = calculate_wet_bulb(40.0, 70.0)
    assert isinstance(result, float)


def test_wet_bulb_is_below_temperature():
    temp = 40.0
    wet_bulb = calculate_wet_bulb(temp, 70.0)
    assert wet_bulb < temp


def test_globe_temperature_is_numeric():
    result = estimate_globe_temperature(40.0, 800.0, 10.0)
    assert isinstance(result, float)


def test_globe_temperature_increases_with_solar_radiation():
    low_solar = estimate_globe_temperature(40.0, 200.0, 10.0)
    high_solar = estimate_globe_temperature(40.0, 800.0, 10.0)
    assert high_solar > low_solar


def test_globe_temperature_decreases_with_wind():
    low_wind = estimate_globe_temperature(40.0, 800.0, 5.0)
    high_wind = estimate_globe_temperature(40.0, 800.0, 15.0)
    assert low_wind > high_wind


# ==========================================
# 3. ESTIMATED WBGT TESTS
# ==========================================

def test_wbgt_structure():
    result = calculate_estimated_wbgt(40.0, 70.0, 10.0, 800.0)
    assert isinstance(result, dict)
    assert "value" in result
    assert result["type"] == "estimated"
    assert result["method"] == "prototype outdoor estimation"
    assert result["unit"] == "°C"


def test_wbgt_is_reasonable():
    result = calculate_estimated_wbgt(40.0, 70.0, 10.0, 800.0)
    wbgt = result["value"]
    assert 20.0 < wbgt < 60.0


# ==========================================
# 4. ESTIMATED UTCI TESTS (PYTHERMALCOMFORT)
# ==========================================

def test_utci_valid_input():
    # Normal warm outdoor condition
    result = calculate_estimated_utci(
        temp_c=32.0,
        humidity=60.0,
        wind_speed_kmh=10.0,
        solar_radiation=600.0
    )
    assert isinstance(result, dict)
    assert result["type"] == "estimated"
    assert result["status"] == "valid"
    assert result["value"] is not None
    assert 25.0 < result["value"] < 60.0


def test_utci_extreme_inputs_do_not_crash():
    # Extreme temperature outside polynomial bounds (tdb > 50°C)
    result = calculate_estimated_utci(
        temp_c=58.0,
        humidity=30.0,
        wind_speed_kmh=10.0,
        solar_radiation=800.0
    )
    assert isinstance(result, dict)
    assert result["type"] == "estimated"
    # Should safely return null without throwing exception
    assert result["value"] is None
    assert result["status"] == "outside_validity_range"


def test_utci_zero_solar_nighttime():
    # Nighttime conditions (solar = 0)
    result = calculate_estimated_utci(
        temp_c=28.0,
        humidity=80.0,
        wind_speed_kmh=8.0,
        solar_radiation=0.0
    )
    assert result["status"] == "valid"
    assert result["value"] is not None


# ==========================================
# 5. NORMALIZATION TESTS
# ==========================================

def test_normalize_scale():
    assert normalize(50, 0, 100) == 0.5
    assert normalize(0, 0, 100) == 0.0
    assert normalize(100, 0, 100) == 1.0
    assert normalize(150, 0, 100) == 1.0
    assert normalize(-50, 0, 100) == 0.0


def test_normalize_heat_index():
    assert normalize_heat_index(27.0) == 0.0
    assert normalize_heat_index(55.0) == 100.0
    assert 0.0 <= normalize_heat_index(40.0) <= 100.0


def test_normalize_wbgt():
    assert normalize_wbgt(18.0) == 0.0
    assert normalize_wbgt(40.0) == 100.0
    assert 0.0 <= normalize_wbgt(30.0) <= 100.0


def test_normalize_utci():
    assert normalize_utci(20.0) == 0.0
    assert normalize_utci(50.0) == 100.0
    assert 0.0 <= normalize_utci(35.0) <= 100.0


# ==========================================
# 6. THERMAL STRESS SCORE TESTS
# ==========================================

def test_thermal_stress_score_bounds():
    score = calculate_thermal_stress_score(
        heat_index=45.0,
        wbgt=32.0,
        utci=40.0
    )
    assert isinstance(score, (int, float))
    assert 0.0 <= score <= 100.0


def test_higher_thermal_values_increase_score():
    low = calculate_thermal_stress_score(heat_index=30.0, wbgt=20.0, utci=25.0)
    high = calculate_thermal_stress_score(heat_index=50.0, wbgt=35.0, utci=45.0)
    assert high > low


def test_thermal_stress_score_handles_none_utci():
    # If UTCI is None (e.g., out of polynomial bounds), calculation must still succeed
    score = calculate_thermal_stress_score(
        heat_index=45.0,
        wbgt=32.0,
        utci=None
    )
    assert isinstance(score, (int, float))
    assert 0.0 <= score <= 100.0


# ==========================================
# 7. RISK CATEGORY TESTS
# ==========================================

def test_category_low():
    assert get_thermal_stress_category(10.0) == "LOW"
    assert get_thermal_stress_category(24.9) == "LOW"


def test_category_moderate():
    assert get_thermal_stress_category(25.0) == "MODERATE"
    assert get_thermal_stress_category(49.9) == "MODERATE"


def test_category_high():
    assert get_thermal_stress_category(50.0) == "HIGH"
    assert get_thermal_stress_category(74.9) == "HIGH"


def test_category_extreme():
    assert get_thermal_stress_category(75.0) == "EXTREME"
    assert get_thermal_stress_category(95.0) == "EXTREME"


# ==========================================
# 8. SCENARIO CONDITIONS
# ==========================================

def test_hot_humid_conditions():
    # Extreme Andhra summer conditions
    metrics = calculate_thermal_metrics(
        temperature=41.2,
        humidity=68.0,
        wind_speed=8.0,
        solar_radiation=812.0
    )
    assert metrics["thermal_stress_category"] == "EXTREME"
    assert metrics["thermal_stress_score"] >= 75.0


def test_moderate_conditions():
    metrics = calculate_thermal_metrics(
        temperature=29.0,
        humidity=50.0,
        wind_speed=12.0,
        solar_radiation=350.0
    )
    assert metrics["thermal_stress_category"] in ["LOW", "MODERATE"]
    assert metrics["thermal_stress_score"] < 50.0


def test_low_risk_conditions():
    metrics = calculate_thermal_metrics(
        temperature=22.0,
        humidity=40.0,
        wind_speed=10.0,
        solar_radiation=100.0
    )
    assert metrics["thermal_stress_category"] == "LOW"
    assert metrics["thermal_stress_score"] < 25.0


# ==========================================
# 9. FASTAPI API ROUTE TESTS
# ==========================================

def test_api_thermal_calculate_with_parameters():
    response = client.get(
        "/thermal/calculate",
        params={
            "temperature": 40.0,
            "humidity": 65.0,
            "wind_speed": 8.0,
            "solar_radiation": 750.0
        }
    )
    assert response.status_code == 200
    data = response.json()

    # Schema verification
    assert "weather" in data
    assert "heat_index" in data
    assert "wbgt" in data
    assert "utci" in data
    assert "thermal_stress_score" in data
    assert "thermal_stress_category" in data

    # Scientific labels and types
    assert data["wbgt"]["type"] == "estimated"
    assert data["utci"]["type"] == "estimated"
    assert data["heat_index"]["unit"] == "°C"
    assert data["wbgt"]["unit"] == "°C"
    assert data["utci"]["unit"] == "°C"
    assert 0 <= data["thermal_stress_score"] <= 100


def test_api_thermal_calculate_missing_params_returns_400():
    response = client.get("/thermal/calculate")
    assert response.status_code == 400
