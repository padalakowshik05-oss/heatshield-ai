"""
Unit tests for Hyperlocal Ward Data Endpoint (/risk/wards/{area_name})
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_get_wards_tadepalligudem():
    """Verify Tadepalligudem ward data returns expected prototype structure."""
    response = client.get("/risk/wards/tadepalligudem")
    assert response.status_code == 200
    data = response.json()
    assert data["area"] == "Tadepalligudem"
    assert data["data_type"] == "prototype"
    assert "Ward-level risk values are prototype estimates" in data["disclaimer"]
    assert data["count"] >= 10
    assert len(data["wards"]) == data["count"]

    first_ward = data["wards"][0]
    required_keys = [
        "id", "ward_number", "name", "latitude", "longitude",
        "risk_score", "risk_category", "temperature", "humidity",
        "vulnerable_population", "alert_level", "risk_drivers"
    ]
    for key in required_keys:
        assert key in first_ward, f"Missing key {key} in ward object"

    assert first_ward["risk_score"] >= 0 and first_ward["risk_score"] <= 100
    assert first_ward["risk_category"] in ["LOW", "MODERATE", "HIGH", "EXTREME"]
    assert isinstance(first_ward["risk_drivers"], list)
    assert len(first_ward["risk_drivers"]) > 0


def test_get_wards_bhimavaram():
    """Verify Bhimavaram ward data returns 200."""
    response = client.get("/risk/wards/bhimavaram")
    assert response.status_code == 200
    data = response.json()
    assert data["area"] == "Bhimavaram"
    assert len(data["wards"]) > 0


def test_get_wards_unsupported():
    """Verify unsupported locality returns 404 with honest explanation."""
    response = client.get("/risk/wards/unknown_place_12345")
    assert response.status_code == 404
    detail = response.json().get("detail", "")
    assert "Ward-level data is not available" in detail
