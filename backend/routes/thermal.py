from fastapi import APIRouter

from services.thermal_service import (
    calculate_thermal_metrics
)


router = APIRouter()


@router.get("/calculate")
def calculate_thermal(
    temperature: float,
    humidity: float,
    wind_speed: float,
    solar_radiation: float
):

    return calculate_thermal_metrics(
        temperature,
        humidity,
        wind_speed,
        solar_radiation
    )