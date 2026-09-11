"""
HeatShield AI — Heat-Health Risk Scoring Service (Step 4)
=========================================================

Combines environmental thermal stress with demographic/socioeconomic
vulnerability to produce the composite Heat-Health Risk Score.

WEIGHTING:
- 70% Environmental Thermal Stress (Meteorological heat hazard)
- 30% Population Vulnerability (Demographic sensitivity & adaptive capacity)

FORMULA:
final_risk_score = 0.70 * thermal_stress_score + 0.30 * vulnerability_score
Clamped to [0, 100].

OPERATIONAL THRESHOLDS:
- 0–24.99:   LOW
- 25–49.99:  MODERATE
- 50–74.99:  HIGH
- 75–100:    EXTREME

NOTE:
These are HeatShield AI prototype operational risk categories,
not official statutory or clinical thresholds.
"""


def calculate_final_risk(
    thermal_stress_score: float,
    vulnerability_score: float
) -> float:
    """
    Calculate the combined heat-health risk score.
    Formula: 0.70 * thermal_stress_score + 0.30 * vulnerability_score
    Clamped to [0, 100].
    """
    raw_score = (0.70 * float(thermal_stress_score)) + (0.30 * float(vulnerability_score))
    clamped = max(0.0, min(raw_score, 100.0))
    return round(clamped, 1)


# Backwards compatibility alias
def calculate_heat_health_risk(
    thermal_stress_score: float,
    vulnerability_score: float
) -> float:
    return calculate_final_risk(thermal_stress_score, vulnerability_score)


def get_risk_category(score: float) -> str:
    """
    Convert composite risk score into public health warning category.
    
    Category Thresholds:
    - 0 to <25:   LOW
    - 25 to <50:  MODERATE
    - 50 to <75:  HIGH
    - 75 to 100:  EXTREME
    """
    val = float(score)
    if val < 25.0:
        return "LOW"
    elif val < 50.0:
        return "MODERATE"
    elif val < 75.0:
        return "HIGH"
    else:
        return "EXTREME"


def get_risk_explanation(
    thermal_stress_score: float,
    vulnerability_score: float
) -> str:
    """
    Generate deterministic, evidence-based attribution explanation
    comparing thermal hazard against demographic vulnerability.
    """
    ts = float(thermal_stress_score)
    vs = float(vulnerability_score)

    if ts >= 50.0 and vs >= 50.0:
        return "High thermal stress combined with elevated population vulnerability is driving the current risk."
    elif (ts - vs) >= 15.0:
        return "Environmental heat stress is the primary contributor to the current risk."
    elif (vs - ts) >= 15.0:
        return "Population vulnerability is significantly increasing the overall heat-health risk."
    elif ts >= 75.0 or vs >= 75.0:
        return "Extreme hazard conditions require active public health interventions."
    else:
        return "Moderate environmental heat stress and localized demographic vulnerability establish current risk levels."
