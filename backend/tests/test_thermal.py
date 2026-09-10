from services.thermal_service import (
    calculate_heat_index,
    calculate_wet_bulb,
    estimate_globe_temperature,
    calculate_estimated_wbgt,
    normalize,
    calculate_thermal_stress_score,
    get_risk_category,
    calculate_thermal_metrics
)


# ==========================================
# HEAT INDEX TESTS
# ==========================================

def test_heat_index_is_numeric():

    result = calculate_heat_index(
        40,
        70
    )

    assert isinstance(result, float)


def test_heat_index_increases_with_humidity():

    low = calculate_heat_index(
        40,
        30
    )

    high = calculate_heat_index(
        40,
        70
    )

    assert high > low


def test_heat_index_increases_with_temperature():

    low = calculate_heat_index(
        35,
        70
    )

    high = calculate_heat_index(
        40,
        70
    )

    assert high > low


# ==========================================
# WET BULB TESTS
# ==========================================

def test_wet_bulb_is_numeric():

    result = calculate_wet_bulb(
        40,
        70
    )

    assert isinstance(result, float)


def test_wet_bulb_is_below_temperature():

    temperature = 40

    wet_bulb = calculate_wet_bulb(
        temperature,
        70
    )

    assert wet_bulb < temperature


# ==========================================
# GLOBE TEMPERATURE TESTS
# ==========================================

def test_globe_temperature_is_numeric():

    result = estimate_globe_temperature(
        40,
        800,
        10
    )

    assert isinstance(result, float)


def test_globe_temperature_increases_with_solar_radiation():

    low_solar = estimate_globe_temperature(
        40,
        200,
        10
    )

    high_solar = estimate_globe_temperature(
        40,
        800,
        10
    )

    assert high_solar > low_solar


def test_globe_temperature_decreases_with_wind():

    low_wind = estimate_globe_temperature(
        40,
        800,
        5
    )

    high_wind = estimate_globe_temperature(
        40,
        800,
        15
    )

    assert low_wind > high_wind


# ==========================================
# WBGT TESTS
# ==========================================

def test_wbgt_is_numeric():

    result = calculate_estimated_wbgt(
        40,
        70,
        10,
        800
    )

    assert isinstance(result, float)


def test_wbgt_is_reasonable():

    wbgt = calculate_estimated_wbgt(
        40,
        70,
        10,
        800
    )

    assert wbgt > 20
    assert wbgt < 60


# ==========================================
# NORMALIZATION TESTS
# ==========================================

def test_normalize_middle_value():

    result = normalize(
        50,
        0,
        100
    )

    assert result == 0.5


def test_normalize_lower_bound():

    result = normalize(
        0,
        0,
        100
    )

    assert result == 0


def test_normalize_upper_bound():

    result = normalize(
        100,
        0,
        100
    )

    assert result == 1


def test_normalize_does_not_exceed_one():

    result = normalize(
        150,
        0,
        100
    )

    assert result == 1


def test_normalize_does_not_go_below_zero():

    result = normalize(
        -50,
        0,
        100
    )

    assert result == 0


# ==========================================
# THERMAL STRESS SCORE TESTS
# ==========================================

def test_thermal_stress_score_is_numeric():

    score = calculate_thermal_stress_score(
        40,
        30,
        35
    )

    assert isinstance(score, float)


def test_thermal_stress_score_is_between_zero_and_hundred():

    score = calculate_thermal_stress_score(
        40,
        30,
        35
    )

    assert 0 <= score <= 100


def test_higher_thermal_values_increase_score():

    low = calculate_thermal_stress_score(
        30,
        20,
        25
    )

    high = calculate_thermal_stress_score(
        50,
        35,
        45
    )

    assert high > low


# ==========================================
# RISK CATEGORY TESTS
# ==========================================

def test_low_risk():

    assert get_risk_category(10) == "LOW"


def test_moderate_risk():

    assert get_risk_category(30) == "MODERATE"


def test_high_risk():

    assert get_risk_category(60) == "HIGH"


def test_extreme_risk():

    assert get_risk_category(90) == "EXTREME"


def test_risk_boundaries():

    assert get_risk_category(24.99) == "LOW"

    assert get_risk_category(25) == "MODERATE"

    assert get_risk_category(49.99) == "MODERATE"

    assert get_risk_category(50) == "HIGH"

    assert get_risk_category(74.99) == "HIGH"

    assert get_risk_category(75) == "EXTREME"


# ==========================================
# COMPLETE THERMAL PIPELINE TEST
# ==========================================

def test_thermal_metrics_structure():

    result = calculate_thermal_metrics(
        40,
        70,
        10,
        800
    )

    assert "temperature" in result

    assert "humidity" in result

    assert "wind_speed" in result

    assert "solar_radiation" in result

    assert "thermal_metrics" in result


def test_thermal_metrics_contains_heat_index():

    result = calculate_thermal_metrics(
        40,
        70,
        10,
        800
    )

    assert "heat_index" in result[
        "thermal_metrics"
    ]


def test_thermal_metrics_contains_wbgt():

    result = calculate_thermal_metrics(
        40,
        70,
        10,
        800
    )

    assert "estimated_wbgt" in result[
        "thermal_metrics"
    ]