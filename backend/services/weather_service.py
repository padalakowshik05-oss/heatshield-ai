import requests


def get_weather(latitude: float, longitude: float):

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

        "forecast_days": 3,

        "timezone": "auto"
    }

    response = requests.get(
        url,
        params=params
    )

    response.raise_for_status()

    return response.json()


def search_locations(query: str):

    url = "https://geocoding-api.open-meteo.com/v1/search"

    params = {
        "name": query,
        "count": 5,
        "language": "en",
        "format": "json"
    }

    response = requests.get(
        url,
        params=params
    )

    response.raise_for_status()

    data = response.json()

    return data.get(
        "results",
        []
    )