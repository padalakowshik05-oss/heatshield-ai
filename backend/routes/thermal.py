"""
HeatShield AI — Thermal Stress Routes
======================================
API endpoint for calculating biometeorological thermal stress indices.
Accepts latitude & longitude to automatically fetch current weather from
Open-Meteo, or accepts direct weather parameters for testing/overrides.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from services.weather_service import get_current_weather
from services.thermal_service import calculate_thermal_metrics

router = APIRouter()


@router.get("/calculate")
def calculate_thermal(
    latitude: Optional[float] = Query(None, description="Latitude coordinate"),
    longitude: Optional[float] = Query(None, description="Longitude coordinate"),
    temperature: Optional[float] = Query(None, description="Air temperature in Celsius"),
    humidity: Optional[float] = Query(None, description="Relative humidity in percent"),
    wind_speed: Optional[float] = Query(None, description="Wind speed in km/h"),
    solar_radiation: Optional[float] = Query(None, description="Shortwave solar radiation in W/m²")
):
    """
    Calculate thermal stress indicators (Heat Index, Estimated WBGT,
    Estimated UTCI, Thermal Stress Score, and Risk Category).

    Workflow:
    - If latitude and longitude are supplied, retrieves current weather from Open-Meteo.
    - If direct weather values are supplied, computes using the provided parameters.
    """
    # Case 1: Coordinates provided -> fetch real weather via weather_service
    if latitude is not None and longitude is not None:
        try:
            weather_data = get_current_weather(latitude, longitude)
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Unable to retrieve current weather data from Open-Meteo: {str(exc)}"
            )

        if not weather_data:
            raise HTTPException(
                status_code=502,
                detail="Empty weather response from Open-Meteo service"
            )

        temp = weather_data.get("temperature")
        hum = weather_data.get("humidity")
        wind = weather_data.get("wind_speed", 0.0) or 0.0
        solar = weather_data.get("solar_radiation", 0.0) or 0.0

        if temp is None or hum is None:
            raise HTTPException(
                status_code=502,
                detail="Weather service did not return valid temperature or humidity"
            )

        return calculate_thermal_metrics(
            temperature=float(temp),
            humidity=float(hum),
            wind_speed=float(wind),
            solar_radiation=float(solar),
            latitude=latitude,
            longitude=longitude
        )

    # Case 2: Direct weather values provided
    if temperature is not None and humidity is not None:
        wind = wind_speed if wind_speed is not None else 0.0
        solar = solar_radiation if solar_radiation is not None else 0.0

        return calculate_thermal_metrics(
            temperature=temperature,
            humidity=humidity,
            wind_speed=wind,
            solar_radiation=solar,
            latitude=latitude,
            longitude=longitude
        )

    # Neither coordinates nor full weather values provided
    raise HTTPException(
        status_code=400,
        detail="Please provide either 'latitude' & 'longitude' OR 'temperature' & 'humidity'."
    )
