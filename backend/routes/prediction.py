import os
import sys
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional

from services.weather_service import get_weather
from services.thermal_service import calculate_thermal_metrics
from services.vulnerability_service import get_vulnerability_data
from services.risk_service import calculate_final_risk, get_risk_category
from services.ml_service import (
    predict_future_risk,
    is_model_available,
    load_prediction_model,
)

router = APIRouter()


class PredictionRequest(BaseModel):
    area_name: str = Field(..., description="Name of the area/mandal in West Godavari")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude of the location")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude of the location")


@router.get("/status")
def get_prediction_status():
    """Check if the ML model artifact is loaded and ready for inference."""
    available = is_model_available()
    return {
        "model_available": available,
        "status": "ready" if available else "not_trained",
        "message": "Model is loaded and active." if available else "Prediction model is not trained yet."
    }


@router.post("/predict")
def predict_area_risk(request: PredictionRequest):
    """
    Predict 6-hour future HeatShield heat-health risk for the selected area.
    
    Coordinates:
    1. Real weather data retrieval via Open-Meteo
    2. Real-time thermal stress index computation (Heat Index, WBGT, UTCI)
    3. Demographic vulnerability lookup
    4. Current composite risk assessment
    5. XGBoost future-risk inference (clamped to [0, 100])
    6. Directional trend and transparent explanation
    """
    area_name = request.area_name.strip()
    
    # 1. Retrieve vulnerability profile first (validates area before network calls)
    vuln_data = get_vulnerability_data(area_name)
    if not vuln_data:
        raise HTTPException(
            status_code=404,
            detail=f"Vulnerability data not available for area: {area_name}"
        )
        
    # 2. Fetch current weather
    try:
        weather = get_weather(request.latitude, request.longitude)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch weather data for ({request.latitude}, {request.longitude}): {str(e)}"
        )
        
    temp = weather.get("temperature", 35.0)
    humidity = weather.get("humidity", 60.0)
    wind_speed = weather.get("wind_speed", 10.0)
    solar_radiation = weather.get("solar_radiation", 500.0)
    
    # 3. Calculate thermal stress metrics
    try:
        thermal_metrics = calculate_thermal_metrics(
            temperature=temp,
            humidity=humidity,
            wind_speed=wind_speed,
            solar_radiation=solar_radiation,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error computing thermal stress indicators: {str(e)}"
        )
        
    thermal_score = thermal_metrics["thermal_stress_score"]
    vuln_score = vuln_data["vulnerability_score"]
    
    # 4. Calculate current composite risk
    current_risk_score = calculate_final_risk(thermal_score, vuln_score)
    current_risk_cat = get_risk_category(current_risk_score)
    
    # 5. Run ML future-risk inference
    try:
        pred_result = predict_future_risk(
            current_weather=weather,
            current_thermal=thermal_metrics,
            vulnerability_data=vuln_data,
            current_risk_score=current_risk_score,
        )
    except RuntimeError as r_err:
        raise HTTPException(
            status_code=503,
            detail=str(r_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference error during future risk prediction: {str(e)}"
        )
        
    # 6. Assemble standardized response
    return {
        "area": vuln_data["area"],
        "prediction": {
            "horizon_hours": pred_result["horizon_hours"],
            "predicted_risk_score": pred_result["predicted_risk_score"],
            "predicted_risk_category": pred_result["predicted_risk_category"],
            "trend": pred_result["trend"],
            "trend_diff": pred_result["trend_diff"],
            "trend_formatted": pred_result["trend_formatted"],
            "explanation": pred_result["explanation"],
        },
        "current": {
            "risk_score": current_risk_score,
            "risk_category": current_risk_cat,
            "thermal_stress_score": thermal_score,
            "vulnerability_score": vuln_score,
        },
        "model": {
            "name": pred_result["model_metadata"]["name"],
            "version": pred_result["model_metadata"]["version"],
            "prediction_type": pred_result["model_metadata"]["prediction_type"],
            "training_type": pred_result["model_metadata"]["training_type"],
            "scientific_scope": pred_result["model_metadata"]["scientific_scope"],
        },
    }
