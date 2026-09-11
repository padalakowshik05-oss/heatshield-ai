import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_weather_forecast_5day():
    """Verify GET /weather/forecast returns 5 daily points with heat risk indicators."""
    response = client.get("/weather/forecast?latitude=16.8152&longitude=81.5267")
    assert response.status_code == 200
    data = response.json()
    assert "forecast" in data
    forecast = data["forecast"]
    assert len(forecast) == 5
    for day_item in forecast:
        assert "date" in day_item
        assert "day" in day_item
        assert "temperature" in day_item
        assert "heat_risk_indicator" in day_item
        assert "category" in day_item
        assert "indicator_type" in day_item
        assert day_item["indicator_type"] == "synoptic_weather_indicator"
        assert "note" in day_item


def test_dashboard_summary_success():
    """Verify GET /dashboard/summary returns consolidated telemetry for valid area."""
    response = client.get("/dashboard/summary?area_name=Tadepalligudem")
    assert response.status_code == 200
    data = response.json()
    assert data["area"] == "Tadepalligudem"
    assert data["district"] == "West Godavari"
    assert "coordinates" in data
    assert "last_updated" in data
    assert "timestamp" in data
    assert "weather" in data
    assert "temperature" in data["weather"]
    assert "humidity" in data["weather"]
    assert "thermal" in data
    assert "thermal_stress_score" in data["thermal"]
    assert "vulnerability" in data
    assert "vulnerability_score" in data["vulnerability"]
    assert "risk" in data
    assert "score" in data["risk"]
    assert "category" in data["risk"]
    assert "alert" in data
    assert "recommended_actions" in data
    assert len(data["recommended_actions"]) > 0
    assert "forecast" in data
    assert len(data["forecast"]) == 5
    assert "nearby_summary" in data
    assert len(data["nearby_summary"]) > 0


def test_dashboard_summary_area_switching():
    """Verify switching from Tadepalligudem to Bhimavaram updates telemetry cleanly."""
    res_tade = client.get("/dashboard/summary?area_name=Tadepalligudem")
    res_bhima = client.get("/dashboard/summary?area_name=Bhimavaram")
    assert res_tade.status_code == 200
    assert res_bhima.status_code == 200
    d_tade = res_tade.json()
    d_bhima = res_bhima.json()
    assert d_tade["area"] == "Tadepalligudem"
    assert d_bhima["area"] == "Bhimavaram"
    assert d_tade["coordinates"]["latitude"] != d_bhima["coordinates"]["latitude"]
    assert d_tade["vulnerability"]["vulnerability_score"] != d_bhima["vulnerability"]["vulnerability_score"]


def test_dashboard_summary_invalid_area_404():
    """Verify unknown area returns 404."""
    response = client.get("/dashboard/summary?area_name=UnknownNonExistentCity")
    assert response.status_code == 404


def test_dashboard_summary_empty_area_400():
    """Verify empty area returns 400."""
    response = client.get("/dashboard/summary?area_name=%20%20")
    assert response.status_code == 400


def test_health_check_returns_ok():
    """Verify GET /health returns 200 and operational diagnostic status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") in ("ok", "healthy")
    assert "database" in data
    assert "environment" in data



def test_root_endpoint_returns_message():
    """Verify GET / returns 200 and running message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data

