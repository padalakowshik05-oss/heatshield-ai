import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, status

from services.weather_service import get_current_weather, get_weather_forecast
from services.thermal_service import calculate_thermal_metrics
from services.vulnerability_service import get_vulnerability_data
from services.risk_service import calculate_final_risk, get_risk_category, get_risk_explanation
from services.ml_service import predict_future_risk
from services.explanation_service import compute_shap_explanation
from services.alert_service import generate_heat_alert
from services.action_service import get_recommended_actions
from services.ai_service import get_nearby_summary, WEST_GODAVARI_COORDINATES

router = APIRouter()


@router.get("/summary", tags=["Dashboard"])
def get_dashboard_summary(
    area_name: str = Query(..., description="Name of the area/mandal in West Godavari"),
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude coordinate"),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude coordinate"),
):
    """
    Consolidated single-roundtrip dashboard summary endpoint.
    Gathers real-time weather, biometeorological thermal indicators, demographic vulnerability,
    composite heat-health risk, 6-hour ML prediction, SHAP attribution, intelligent alerts,
    operational action recommendations, 5-day synoptic forecast, and nearby area benchmarks.
    """
    area_clean = area_name.strip()
    if not area_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Area name cannot be empty."
        )

    norm_area = area_clean.lower()
    vuln_data = get_vulnerability_data(norm_area)
    if not vuln_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Area '{area_name}' not found in West Godavari dataset."
        )

    # Coordinate fallback from West Godavari mandal dictionary
    if latitude is None or longitude is None:
        if norm_area in WEST_GODAVARI_COORDINATES:
            lat, lon = WEST_GODAVARI_COORDINATES[norm_area]
        else:
            lat, lon = (16.8152, 81.5267)
    else:
        lat, lon = latitude, longitude

    now_utc = datetime.now(timezone.utc)
    timestamp_iso = now_utc.isoformat()
    last_updated_hhmm = now_utc.strftime("%H:%M UTC")

    # 1. Real Weather
    weather_err = None
    try:
        weather = get_current_weather(lat, lon)
    except Exception as exc:
        weather_err = str(exc)
        weather = {
            "temperature": 34.0,
            "humidity": 65.0,
            "wind_speed": 10.0,
            "solar_radiation": 500.0,
            "timestamp": timestamp_iso
        }

    temp = float(weather.get("temperature", 34.0))
    humidity = float(weather.get("humidity", 65.0))
    wind = float(weather.get("wind_speed", 10.0))
    solar = float(weather.get("solar_radiation", 500.0))

    # 2. Thermal Stress
    thermal_err = None
    try:
        thermal = calculate_thermal_metrics(
            temperature=temp,
            humidity=humidity,
            wind_speed=wind,
            solar_radiation=solar,
            latitude=lat,
            longitude=lon
        )
    except Exception as exc:
        thermal_err = str(exc)
        thermal = {
            "heat_index": {"value": temp + 4.0},
            "wbgt": {"value": 30.0},
            "utci": {"value": 38.0},
            "thermal_stress_score": 60.0,
            "thermal_stress_category": "HIGH"
        }

    thermal_score = float(thermal.get("thermal_stress_score", 60.0))
    vuln_score = float(vuln_data.get("vulnerability_score", 50.0))

    # 3. Final Risk Assessment
    risk_score = calculate_final_risk(thermal_score, vuln_score)
    risk_category = get_risk_category(risk_score)
    risk_explanation = get_risk_explanation(thermal_score, vuln_score)

    # 4. ML Future-Risk Prediction (6h)
    pred_data = None
    pred_err = None
    try:
        pred_data = predict_future_risk(
            current_weather=weather,
            current_thermal=thermal,
            vulnerability_data=vuln_data,
            current_risk_score=risk_score
        )
    except Exception as exc:
        pred_err = f"Prediction unavailable: {str(exc)}"

    pred_score = pred_data.get("predicted_risk_score", risk_score) if pred_data else risk_score

    # 5. SHAP Feature Attribution
    explanation = None
    try:
        explanation = compute_shap_explanation(
            current_weather=weather,
            current_thermal=thermal,
            vulnerability_data=vuln_data,
            current_risk_score=risk_score,
            area_name=vuln_data["area"],
            top_k=5
        )
    except Exception:
        explanation = {
            "top_factors": [],
            "summary": "Thermal stress combined with demographic factors drives current risk."
        }

    # 6. Intelligent Heat Alert
    alert = generate_heat_alert(
        current_risk_score=risk_score,
        predicted_risk_score=pred_score,
        area_name=vuln_data["area"],
        weather=weather,
        thermal=thermal
    )

    # 7. Recommended Public Health Actions
    actions = get_recommended_actions(
        alert_level=alert.get("level", "LOW"),
        top_factors=explanation.get("top_factors", []),
        max_actions=5
    )

    # 8. Real 5-Day Open-Meteo Synoptic Forecast
    forecast_data = None
    forecast_err = None
    try:
        forecast_res = get_weather_forecast(lat, lon)
        forecast_data = forecast_res.get("forecast", [])
    except Exception as exc:
        forecast_err = f"Forecast unavailable: {str(exc)}"

    # 9. Nearby Mandals Summary
    nearby_summary = get_nearby_summary()

    return {
        "area": vuln_data["area"],
        "district": "West Godavari",
        "coordinates": {
            "latitude": lat,
            "longitude": lon
        },
        "last_updated": last_updated_hhmm,
        "timestamp": timestamp_iso,
        "weather": {
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1),
            "wind_speed": round(wind, 1),
            "solar_radiation": round(solar, 1),
            "timestamp": weather.get("timestamp", timestamp_iso),
            "error": weather_err
        },
        "thermal": {
            "heat_index": thermal.get("heat_index", {}).get("value"),
            "estimated_wbgt": thermal.get("wbgt", {}).get("value"),
            "estimated_utci": thermal.get("utci", {}).get("value"),
            "thermal_stress_score": round(thermal_score, 1),
            "thermal_stress_category": thermal.get("thermal_stress_category", "MODERATE"),
            "error": thermal_err
        },
        "vulnerability": vuln_data,
        "risk": {
            "score": round(risk_score, 1),
            "category": risk_category,
            "explanation": risk_explanation
        },
        "prediction": pred_data,
        "prediction_error": pred_err,
        "explanation": explanation,
        "alert": alert,
        "recommended_actions": actions,
        "forecast": forecast_data,
        "forecast_error": forecast_err,
        "nearby_summary": nearby_summary,
        "disclaimer": "HeatShield AI biometeorological decision support. Estimated WBGT/UTCI values and 5-day synoptic forecast indicators are model approximations for screening."
    }
