from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.weather_service import (
    get_weather,
    search_locations
)

from routes.thermal import router as thermal_router


app = FastAPI(
    title="HeatShield AI",
    description="Heat-Health Early Warning System",
    version="1.0.0"
)


# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Thermal Router
# -----------------------------

app.include_router(
    thermal_router,
    prefix="/thermal",
    tags=["Thermal Stress"]
)


# -----------------------------
# Root
# -----------------------------

@app.get("/")
def root():

    return {
        "message": "HeatShield AI API is running"
    }


# -----------------------------
# Current Weather
# -----------------------------

@app.get("/weather/current")
def current_weather(
    latitude: float,
    longitude: float
):

    weather = get_weather(
        latitude,
        longitude
    )

    current = weather["current"]

    return {
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },

        "current": {
            "temperature": current["temperature_2m"],
            "humidity": current["relative_humidity_2m"],
            "wind_speed": current["wind_speed_10m"],
            "solar_radiation": current["shortwave_radiation"]
        }
    }


# -----------------------------
# 3-Day Forecast
# -----------------------------

@app.get("/weather/forecast")
def weather_forecast(
    latitude: float,
    longitude: float
):

    weather = get_weather(
        latitude,
        longitude
    )

    daily = weather["daily"]

    forecast = []

    for i in range(3):

        forecast.append({

            "date": daily["time"][i],

            "temperature": daily[
                "temperature_2m_max"
            ][i],

            "humidity": daily[
                "relative_humidity_2m_mean"
            ][i],

            "wind_speed": daily[
                "wind_speed_10m_max"
            ][i],

            "solar_radiation": daily[
                "shortwave_radiation_sum"
            ][i]
        })

    return {
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },

        "forecast": forecast
    }


# -----------------------------
# Location Search
# -----------------------------

@app.get("/locations/search")
def location_search(query: str):

    results = search_locations(query)

    locations = []

    for result in results:

        locations.append({

            "name": result.get("name"),

            "latitude": result.get(
                "latitude"
            ),

            "longitude": result.get(
                "longitude"
            ),

            "country": result.get(
                "country"
            ),

            "admin1": result.get(
                "admin1"
            )
        })

    return {
        "locations": locations
    }