import math


# ============================================================
# HEAT INDEX
# ============================================================

def calculate_heat_index(temp_c, humidity):
    """
    Calculate Heat Index using the Rothfusz regression.

    Parameters:
        temp_c   : Temperature in Celsius
        humidity : Relative humidity in %

    Returns:
        Heat Index in Celsius
    """

    temp_f = (temp_c * 9 / 5) + 32

    # Below 80°F, use actual temperature
    if temp_f < 80:
        return round(temp_c, 2)

    T = temp_f
    R = humidity

    HI = (
        -42.379
        + 2.04901523 * T
        + 10.14333127 * R
        - 0.22475541 * T * R
        - 0.00683783 * T * T
        - 0.05481717 * R * R
        + 0.00122874 * T * T * R
        + 0.00085282 * T * R * R
        - 0.00000199 * T * T * R * R
    )

    heat_index_c = (HI - 32) * 5 / 9

    return round(heat_index_c, 2)


# ============================================================
# WET BULB TEMPERATURE
# ============================================================

def calculate_wet_bulb(temp_c, humidity):
    """
    Estimate wet-bulb temperature.
    """

    tw = (
        temp_c
        * math.atan(
            0.151977 * math.sqrt(humidity + 8.313659)
        )
        + math.atan(temp_c + humidity)
        - math.atan(humidity - 1.676331)
        + 0.00391838
        * humidity ** 1.5
        * math.atan(0.023101 * humidity)
        - 4.686035
    )

    return round(tw, 2)


# ============================================================
# ESTIMATED GLOBE TEMPERATURE
# ============================================================

def estimate_globe_temperature(
    temp_c,
    solar_radiation,
    wind_speed
):
    """
    Estimate globe temperature using a simplified
    solar-radiation and wind-speed relationship.

    NOTE:
    This is a prototype approximation and not a
    physical globe thermometer measurement.
    """

    solar_effect = 0.02 * solar_radiation

    wind_effect = max(wind_speed, 1)

    globe_temp = (
        temp_c
        + solar_effect / (wind_effect ** 0.5)
    )

    return round(globe_temp, 2)


# ============================================================
# ESTIMATED WBGT
# ============================================================

def calculate_estimated_wbgt(
    temp_c,
    humidity,
    wind_speed,
    solar_radiation
):
    """
    Estimate outdoor WBGT.

    WBGT structure:

        0.7 * wet-bulb
        + 0.2 * globe temperature
        + 0.1 * dry-bulb temperature

    NOTE:
    This is an estimated WBGT because the wet-bulb and
    globe temperatures are themselves estimated.
    """

    wet_bulb = calculate_wet_bulb(
        temp_c,
        humidity
    )

    globe_temp = estimate_globe_temperature(
        temp_c,
        solar_radiation,
        wind_speed
    )

    wbgt = (
        0.7 * wet_bulb
        + 0.2 * globe_temp
        + 0.1 * temp_c
    )

    return round(wbgt, 2)


# ============================================================
# NORMALIZATION
# STEP 11
# ============================================================

def normalize(value, minimum, maximum):
    """
    Normalize a value to the range 0–1.

    0 = least vulnerable
    1 = most vulnerable
    """

    # Prevent division by zero
    if maximum == minimum:
        return 0

    score = (
        (value - minimum)
        / (maximum - minimum)
    )

    # Keep score between 0 and 1
    return max(
        0,
        min(score, 1)
    )


# ============================================================
# VULNERABILITY SCORE
# STEP 12
# ============================================================

def calculate_vulnerability_score(
    elderly,
    children,
    outdoor_workers,
    population_density,
    housing_vulnerability,
    healthcare_access
):
    """
    Calculate overall vulnerability score.

    Returns:
        Score from 0 to 100.

        0   = least vulnerable
        100 = most vulnerable
    """

    # --------------------------------------------------------
    # Elderly population
    # --------------------------------------------------------

    elderly_score = normalize(
        elderly,
        0,
        30
    )

    # --------------------------------------------------------
    # Children population
    # --------------------------------------------------------

    children_score = normalize(
        children,
        0,
        30
    )

    # --------------------------------------------------------
    # Outdoor workers
    # --------------------------------------------------------

    outdoor_worker_score = normalize(
        outdoor_workers,
        0,
        60
    )

    # --------------------------------------------------------
    # Population density
    # --------------------------------------------------------

    density_score = normalize(
        population_density,
        0,
        30000
    )

    # --------------------------------------------------------
    # Housing vulnerability
    # --------------------------------------------------------

    housing_score = normalize(
        housing_vulnerability,
        0,
        1
    )

    # --------------------------------------------------------
    # Healthcare access
    #
    # Higher healthcare access means lower vulnerability.
    # Therefore, we invert the normalized value.
    # --------------------------------------------------------

    healthcare_vulnerability = 1 - normalize(
        healthcare_access,
        0,
        1
    )

    # --------------------------------------------------------
    # Weighted vulnerability score
    # --------------------------------------------------------

    score = (
        0.20 * elderly_score
        + 0.15 * children_score
        + 0.25 * outdoor_worker_score
        + 0.15 * density_score
        + 0.15 * housing_score
        + 0.10 * healthcare_vulnerability
    )

    # Convert 0–1 to 0–100
    return round(
        score * 100,
        2
    )


# ============================================================
# VULNERABILITY CATEGORY
# STEP 13
# ============================================================

def get_vulnerability_category(score):
    """
    Convert vulnerability score into a category.

    0–24.99   = LOW
    25–49.99  = MODERATE
    50–74.99  = HIGH
    75–100     = EXTREME
    """

    if score < 25:
        return "LOW"

    elif score < 50:
        return "MODERATE"

    elif score < 75:
        return "HIGH"

    else:
        return "EXTREME"


# ============================================================
# THERMAL STRESS SCORE
# ============================================================

def calculate_thermal_stress_score(
    heat_index,
    wbgt,
    utci
):
    """
    Calculate overall thermal stress score.

    Returns:
        Score from 0 to 100.
    """

    hi_score = normalize(
        heat_index,
        27,
        55
    )

    wbgt_score = normalize(
        wbgt,
        18,
        40
    )

    utci_score = normalize(
        utci,
        20,
        50
    )

    thermal_score = (
        0.30 * hi_score
        + 0.40 * wbgt_score
        + 0.30 * utci_score
    )

    thermal_score *= 100

    return round(
        thermal_score,
        2
    )


# ============================================================
# THERMAL RISK CATEGORY
# ============================================================

def get_risk_category(score):
    """
    Convert thermal stress score into a risk category.
    """

    if score < 25:
        return "LOW"

    elif score < 50:
        return "MODERATE"

    elif score < 75:
        return "HIGH"

    else:
        return "EXTREME"


# ============================================================
# THERMAL METRICS
# ============================================================

def calculate_thermal_metrics(
    temperature,
    humidity,
    wind_speed,
    solar_radiation
):
    """
    Calculate thermal metrics from weather conditions.

    Currently calculates:
        - Heat Index
        - Estimated WBGT

    UTCI will be integrated in the next step.
    """

    # --------------------------------------------------------
    # Heat Index
    # --------------------------------------------------------

    heat_index = calculate_heat_index(
        temperature,
        humidity
    )

    # --------------------------------------------------------
    # Estimated WBGT
    # --------------------------------------------------------

    wbgt = calculate_estimated_wbgt(
        temperature,
        humidity,
        wind_speed,
        solar_radiation
    )

    # --------------------------------------------------------
    # Return results
    # --------------------------------------------------------

    return {
        "temperature": temperature,

        "humidity": humidity,

        "wind_speed": wind_speed,

        "solar_radiation": solar_radiation,

        "thermal_metrics": {
            "heat_index": heat_index,
            "estimated_wbgt": wbgt
        }
    }