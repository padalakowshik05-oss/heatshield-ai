"""
HeatShield AI — Heat Health Risk Routes (Step 4)
================================================
Coordinates end-to-end risk evaluation:
Weather Telemetry -> Thermal Stress -> Vulnerability Profile -> Final Risk Score
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from services.weather_service import get_current_weather
from services.thermal_service import calculate_thermal_metrics
from services.vulnerability_service import get_vulnerability_data
from services.risk_service import (
    calculate_final_risk,
    get_risk_category,
    get_risk_explanation
)
from services.alert_service import generate_heat_alert
from services.action_service import get_recommended_actions
from services.ward_service import get_wards_for_locality

router = APIRouter()


@router.get("/calculate")
def calculate_risk(
    area_name: Optional[str] = Query(None, description="Mandal or city name"),
    latitude: Optional[float] = Query(None, description="Latitude coordinate"),
    longitude: Optional[float] = Query(None, description="Longitude coordinate"),
    thermal_stress: Optional[float] = Query(None, description="Direct thermal stress score (0–100)"),
    vulnerability: Optional[float] = Query(None, description="Direct vulnerability score (0–100)")
):
    """
    Calculate combined Heat-Health Risk.

    Modes:
    1. Full End-to-End: Provide `area_name`, `latitude`, and `longitude`.
       Fetches live Open-Meteo weather, computes thermal indicators, retrieves
       centralized vulnerability factors, and generates the final risk score.
    2. Direct Score Combination: Provide `thermal_stress` and `vulnerability`.
    """
    # Mode 1: Full pipeline with area and coordinates
    if area_name and latitude is not None and longitude is not None:
        # 1. Fetch real weather
        try:
            weather_data = get_current_weather(latitude, longitude)
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Unable to retrieve current weather from Open-Meteo: {str(exc)}"
            )

        if not weather_data:
            raise HTTPException(
                status_code=502,
                detail="Empty weather response from Open-Meteo"
            )

        temp = weather_data.get("temperature", 0.0)
        humidity = weather_data.get("humidity", 0.0)
        wind = weather_data.get("wind_speed", 0.0) or 0.0
        solar = weather_data.get("solar_radiation", 0.0) or 0.0

        # 2. Calculate thermal stress metrics
        thermal_res = calculate_thermal_metrics(
            temperature=float(temp),
            humidity=float(humidity),
            wind_speed=float(wind),
            solar_radiation=float(solar),
            latitude=latitude,
            longitude=longitude
        )
        thermal_score = thermal_res["thermal_stress_score"]

        # 3. Retrieve vulnerability for the area
        vuln_res = get_vulnerability_data(area_name)
        if not vuln_res:
            raise HTTPException(
                status_code=404,
                detail=f"Vulnerability data not available for this area"
            )
        vuln_score = vuln_res["vulnerability_score"]

        # 4. Final Risk Calculation (70% Thermal, 30% Vulnerability)
        final_score = calculate_final_risk(thermal_score, vuln_score)
        category = get_risk_category(final_score)
        explanation = get_risk_explanation(thermal_score, vuln_score)

        return {
            "area": vuln_res["area"],
            "weather": {
                "temperature": temp,
                "humidity": humidity,
                "wind_speed": wind,
                "solar_radiation": solar
            },
            "thermal": {
                "heat_index": thermal_res["heat_index"]["value"],
                "wbgt": thermal_res["wbgt"]["value"],
                "utci": thermal_res["utci"].get("value"),
                "thermal_stress_score": thermal_score,
                "thermal_stress_category": thermal_res["thermal_stress_category"]
            },
            "vulnerability": {
                "elderly": vuln_res["factors"]["elderly"],
                "children": vuln_res["factors"]["children"],
                "outdoor_workers": vuln_res["factors"]["outdoor_workers"],
                "population_density": vuln_res["factors"]["population_density"],
                "housing_vulnerability": vuln_res["factors"]["housing_vulnerability"],
                "healthcare_vulnerability": vuln_res["factors"]["healthcare_vulnerability"],
                "vulnerability_score": vuln_score,
                "data_type": "prototype"
            },
            "risk": {
                "score": final_score,
                "category": category,
                "explanation": explanation
            },
            # Backwards compatibility top-level aliases
            "risk_score": final_score,
            "risk_category": category,
            "alert": generate_heat_alert(final_score, final_score, vuln_res["area"], weather_data, thermal_res),
            "recommended_actions": get_recommended_actions(category)
        }

    # Mode 2: Direct inputs
    if thermal_stress is not None and vulnerability is not None:
        score = calculate_final_risk(thermal_stress, vulnerability)
        category = get_risk_category(score)
        explanation = get_risk_explanation(thermal_stress, vulnerability)

        return {
            "risk_score": score,
            "risk_category": category,
            "risk": {
                "score": score,
                "category": category,
                "explanation": explanation
            }
        }

    raise HTTPException(
        status_code=400,
        detail="Must provide either ('area_name', 'latitude', 'longitude') OR ('thermal_stress', 'vulnerability')."
    )


@router.get("/wards/{area_name}")
def get_wards(area_name: str):
    """
    Retrieve hyperlocal ward-level prototype dataset for an urban locality.
    If locality is outside supported ward dataset, returns 404 with honest explanation.
    """
    data = get_wards_for_locality(area_name)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Ward-level data is not available for '{area_name}' yet."
        )
    return data

