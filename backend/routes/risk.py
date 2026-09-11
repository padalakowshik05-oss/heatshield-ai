from fastapi import APIRouter

from services.risk_service import (
    calculate_heat_health_risk,
    get_risk_category
)


# ============================================================
# RISK ROUTER
# ============================================================

router = APIRouter()


# ============================================================
# CALCULATE HEAT-HEALTH RISK
# ============================================================

@router.get("/calculate")
def calculate_risk(
    thermal_stress: float,
    vulnerability: float
):
    """
    Calculate combined heat-health risk.

    Parameters:
        thermal_stress : Environmental thermal stress score
                         from 0 to 100.

        vulnerability  : Population vulnerability score
                         from 0 to 100.

    Returns:
        Combined risk score and risk category.
    """

    # Calculate combined risk score
    score = calculate_heat_health_risk(
        thermal_stress,
        vulnerability
    )

    # Convert score to category
    category = get_risk_category(
        score
    )

    return {
        "risk_score": score,
        "risk_category": category
    }