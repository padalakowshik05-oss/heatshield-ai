import math


def calculate_heat_index(temp_c, humidity):
    """
    Calculate Heat Index using the Rothfusz regression.

    temp_c: temperature in Celsius
    humidity: relative humidity in %
    """

    temp_f = (temp_c * 9 / 5) + 32

    # For lower temperatures, heat index is approximately
    # the ambient temperature.
    if temp_f < 80:
        return temp_c

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

    # Convert Fahrenheit back to Celsius
    heat_index_c = (HI - 32) * 5 / 9

    return round(heat_index_c, 2)


def calculate_wet_bulb(temp_c, humidity):
    """
    Approximate wet-bulb temperature.

    This is a prototype approximation, not an
    instrument-grade measurement.
    """

    tw = (
        temp_c * math.atan(
            0.151977 * math.sqrt(humidity + 8.313659)
        )
        + math.atan(temp_c + humidity)
        - math.atan(humidity - 1.676331)
        + 0.00391838 * humidity ** 1.5
        * math.atan(0.023101 * humidity)
        - 4.686035
    )

    return round(tw, 2)


def estimate_globe_temperature(
    temp_c,
    solar_radiation,
    wind_speed
):
    """
    Estimate globe temperature using a simplified
    prototype approximation.

    This is NOT a physical globe-temperature model.
    """

    solar_effect = 0.02 * solar_radiation

    # Prevent division by zero
    wind_effect = max(wind_speed, 1)

    globe_temp = (
        temp_c
        + solar_effect / (wind_effect ** 0.5)
    )

    return round(globe_temp, 2)


def calculate_estimated_wbgt(
    temp_c,
    humidity,
    wind_speed,
    solar_radiation
):
    """
    Calculate estimated WBGT.

    The wet-bulb and globe temperatures are estimated,
    so this is a prototype WBGT estimate.
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


def normalize(value, minimum, maximum):
    """
    Normalize a value to the range 0-1.
    """

    score = (
        (value - minimum)
        / (maximum - minimum)
    )

    return max(0, min(score, 1))


def calculate_thermal_stress_score(
    heat_index,
    wbgt,
    utci
):
    """
    Calculate the HeatShield Thermal Stress Score.

    Weighting:
        Heat Index = 30%
        WBGT       = 40%
        UTCI       = 30%

    Final score is between 0 and 100.
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

    return round(thermal_score, 2)


def get_risk_category(score):
    """
    Convert Thermal Stress Score into a risk category.

    These are prototype scoring thresholds.
    """

    if score < 25:
        return "LOW"

    elif score < 50:
        return "MODERATE"

    elif score < 75:
        return "HIGH"

    else:
        return "EXTREME"


def calculate_thermal_metrics(
    temperature,
    humidity,
    wind_speed,
    solar_radiation
):
    """
    Calculate thermal metrics.

    UTCI and final thermal stress score are not included
    yet because UTCI still needs to be properly integrated
    and validated.
    """

    # Calculate Heat Index
    heat_index = calculate_heat_index(
        temperature,
        humidity
    )

    # Calculate Estimated WBGT
    wbgt = calculate_estimated_wbgt(
        temperature,
        humidity,
        wind_speed,
        solar_radiation
    )

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