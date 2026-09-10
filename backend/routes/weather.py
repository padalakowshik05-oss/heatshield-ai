from fastapi import APIRouter
from services.weather_service import get_weather

router = APIRouter()


@router.get("/current")
def current_weather(
    latitude: float,
    longitude: float
):

    weather = get_weather(latitude, longitude)

    return weather