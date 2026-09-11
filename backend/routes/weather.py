from fastapi import APIRouter, HTTPException, Query
import requests
from services.weather_service import (
    get_current_weather,
    get_weather_forecast,
    search_locations
)

router = APIRouter()


@router.get("/current")
def current_weather(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate")
):
    """
    Get real-time biometeorological weather data from Open-Meteo API.
    """
    try:
        return get_current_weather(latitude, longitude)
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to fetch weather data from Open-Meteo"
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Internal weather processing error: {str(exc)}"
        ) from exc


@router.get("/forecast")
def weather_forecast(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate")
):
    """
    Get 3-day weather forecast from Open-Meteo API.
    """
    try:
        return get_weather_forecast(latitude, longitude)
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to fetch weather forecast from Open-Meteo"
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Internal forecast processing error: {str(exc)}"
        ) from exc


@router.get("/search")
def search_location(
    query: str = Query(..., min_length=2, description="Location search query")
):
    """
    Search geocoded coordinates by place name.
    """
    try:
        results = search_locations(query)
        return {"locations": results}
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to geocode location: {str(exc)}"
        ) from exc