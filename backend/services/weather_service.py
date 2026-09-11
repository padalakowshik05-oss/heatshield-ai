import requests
from typing import Dict, Any


def get_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetch full forecast payload from Open-Meteo API.
    """
    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "shortwave_radiation"
        ],
        "daily": [
            "temperature_2m_max",
            "relative_humidity_2m_mean",
            "wind_speed_10m_max",
            "shortwave_radiation_sum"
        ],
        "forecast_days": 5,
        "timezone": "auto"
    }

    response = requests.get(url, params=params, timeout=8)
    response.raise_for_status()
    return response.json()


def get_current_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Retrieve real-time weather observations from Open-Meteo for given coordinates.
    Returns clean, normalized biometeorological variables.
    """
    raw_data = get_weather(latitude, longitude)
    current = raw_data.get("current", {})

    temp = current.get("temperature_2m")
    humidity = current.get("relative_humidity_2m")
    wind_speed = current.get("wind_speed_10m")
    solar_rad = current.get("shortwave_radiation")
    timestamp = current.get("time")

    return {
        "latitude": latitude,
        "longitude": longitude,
        "temperature": temp,
        "humidity": humidity,
        "wind_speed": wind_speed,
        "solar_radiation": solar_rad,
        "timestamp": timestamp,
        # Backward-compatibility wrappers
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "current": {
            "temperature": temp,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "solar_radiation": solar_rad
        }
    }


def get_weather_forecast(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Retrieve 5-day synoptic forecast for given coordinates with daily
    temperature and synoptic heat-risk indicator.
    """
    from datetime import datetime
    from services.thermal_service import calculate_thermal_metrics

    raw_data = get_weather(latitude, longitude)
    daily = raw_data.get("daily", {})

    forecast = []
    times = daily.get("time", [])
    temp_max = daily.get("temperature_2m_max", [])
    humidity_mean = daily.get("relative_humidity_2m_mean", [])
    wind_max = daily.get("wind_speed_10m_max", [])
    solar_sum = daily.get("shortwave_radiation_sum", [])

    for i in range(min(len(times), 5)):
        t = float(temp_max[i]) if i < len(temp_max) and temp_max[i] is not None else 34.0
        rh = float(humidity_mean[i]) if i < len(humidity_mean) and humidity_mean[i] is not None else 65.0
        w = float(wind_max[i]) if i < len(wind_max) and wind_max[i] is not None else 10.0
        s = float(solar_sum[i]) if i < len(solar_sum) and solar_sum[i] is not None else 450.0
        date_str = times[i]

        # Format human-readable day label
        try:
            dt = datetime.fromisoformat(date_str)
            if i == 0:
                day_label = "Today"
            elif i == 1:
                day_label = "Tomorrow"
            else:
                day_label = dt.strftime("%a")
        except Exception:
            day_label = f"Day {i+1}"

        # Calculate daily synoptic thermal stress / heat risk indicator
        try:
            thermal_res = calculate_thermal_metrics(
                temperature=t,
                humidity=rh,
                wind_speed=w,
                solar_radiation=s,
                latitude=latitude,
                longitude=longitude,
            )
            thermal_score = thermal_res.get("thermal_stress_score", 50.0)
            category = thermal_res.get("thermal_stress_category", "MODERATE")
            hi = thermal_res.get("heat_index", {}).get("value", round(t, 1))
        except Exception:
            thermal_score = round(min(100.0, max(0.0, (t - 25.0) * 4.0 + (rh - 40.0) * 0.4)), 1)
            category = "EXTREME" if thermal_score >= 75 else "HIGH" if thermal_score >= 50 else "MODERATE" if thermal_score >= 25 else "LOW"
            hi = round(t, 1)

        forecast.append({
            "date": date_str,
            "day": day_label,
            "temperature": round(t, 1),
            "temp": round(t, 1), # alias for ForecastChart
            "humidity": round(rh, 1),
            "wind_speed": round(w, 1),
            "solar_radiation": round(s, 1),
            "heat_index": hi,
            "heat_risk_indicator": round(thermal_score, 1),
            "riskScore": round(thermal_score, 1), # alias for ForecastChart
            "category": category,
            "indicator_type": "synoptic_weather_indicator",
            "note": "Synoptic weather forecast indicator calculated from daily temperature & humidity (distinguish from 6-Hour ML Prediction).",
        })

    return {
        "latitude": latitude,
        "longitude": longitude,
        "forecast_days": len(forecast),
        "forecast": forecast
    }


def search_locations(query: str):
    url = "https://geocoding-api.open-meteo.com/v1/search"

    params = {
        "name": query,
        "count": 5,
        "language": "en",
        "format": "json"
    }

    response = requests.get(url, params=params, timeout=8)
    response.raise_for_status()
    data = response.json()

    return data.get("results", [])