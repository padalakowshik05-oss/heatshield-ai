# ============================================================
# RISK SERVICE
# ============================================================


# ============================================================
# HEAT-HEALTH RISK SCORE
# ============================================================

def calculate_heat_health_risk(
    thermal_stress_score,
    vulnerability_score
):
    """
    Calculate the combined heat-health risk score.

    Parameters:
        thermal_stress_score : Thermal stress score (0–100)
        vulnerability_score  : Population vulnerability score (0–100)

    Returns:
        Heat-health risk score (0–100)

    Prototype weighting:
        70% = environmental thermal stress
        30% = population vulnerability
    """

    risk_score = (
        0.70 * thermal_stress_score
        + 0.30 * vulnerability_score
    )

    return round(
        risk_score,
        2
    )


# ============================================================
# RISK CATEGORY
# STEP 26
# ============================================================

def get_risk_category(score):
    """
    Convert heat-health risk score into a category.

    Score:
        0–24.99   = LOW
        25–49.99  = MODERATE
        50–74.99  = HIGH
        75–100    = EXTREME
    """

    if score < 25:
        return "LOW"

    elif score < 50:
        return "MODERATE"

    elif score < 75:
        return "HIGH"

    else:
        return "EXTREME"