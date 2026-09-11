import pytest
from fastapi.testclient import TestClient
from main import app
from services.ai_service import (
    build_heatshield_context,
    synthesize_grounded_response,
    generate_ai_response,
    get_nearby_summary,
)

client = TestClient(app)


def test_build_heatshield_context_valid():
    """Context builder should include all required HeatShield telemetry."""
    context = build_heatshield_context("Tadepalligudem")
    assert context["area"] == "Tadepalligudem"
    assert "weather" in context
    assert "temperature" in context["weather"]
    assert "humidity" in context["weather"]
    assert "thermal" in context
    assert "thermal_stress_score" in context["thermal"]
    assert "vulnerability" in context
    assert "vulnerability_score" in context["vulnerability"]
    assert "risk" in context
    assert "score" in context["risk"]
    assert "category" in context["risk"]
    assert "prediction" in context
    assert "explanation" in context
    assert "top_factors" in context["explanation"]
    assert "alert" in context
    assert "recommended_actions" in context
    assert len(context["recommended_actions"]) > 0
    assert "nearby_summary" in context
    assert len(context["nearby_summary"]) > 0


def test_build_heatshield_context_invalid_area():
    """Unknown area should raise ValueError."""
    with pytest.raises(ValueError):
        build_heatshield_context("UnknownCityXYZ")


def test_grounded_response_high_risk_reason():
    """Synthesizer should explain risk cause clearly referencing thermal and vulnerability."""
    context = build_heatshield_context("Tadepalligudem")
    resp = synthesize_grounded_response("Tadepalligudem", "Why is Tadepalligudem at high risk?", context)
    assert "Tadepalligudem" in resp
    assert "risk" in resp.lower()
    assert "thermal stress" in resp.lower()


def test_grounded_response_action_recommendations():
    """Action questions should return bulleted actionable advice."""
    context = build_heatshield_context("Tadepalligudem")
    resp = synthesize_grounded_response("Tadepalligudem", "What should outdoor workers do now?", context)
    assert "•" in resp or "-" in resp
    assert "Recommended heat-health actions" in resp


def test_grounded_response_6_hour_forecast():
    """Forecast query should return 6h prediction trend and category."""
    context = build_heatshield_context("Tadepalligudem")
    resp = synthesize_grounded_response("Tadepalligudem", "What will happen in the next 6 hours?", context)
    assert "6 hours" in resp
    assert "forecast" in resp.lower() or "predict" in resp.lower()


def test_grounded_response_dominant_factor():
    """Dominant factor query should cite SHAP feature attribution."""
    context = build_heatshield_context("Tadepalligudem")
    resp = synthesize_grounded_response("Tadepalligudem", "Which factor contributes most to the risk?", context)
    assert "contributor" in resp.lower() or "thermal stress" in resp.lower()


def test_grounded_response_alert_trigger():
    """Alert trigger query should explain why the alert was fired."""
    context = build_heatshield_context("Tadepalligudem")
    resp = synthesize_grounded_response("Tadepalligudem", "Why did the alert trigger?", context)
    assert "alert" in resp.lower()
    assert "triggered" in resp.lower() or "risk" in resp.lower()


def test_grounded_response_wbgt_definition():
    """Technical definitions should include biometeorological disclaimer."""
    context = build_heatshield_context("Tadepalligudem")
    resp = synthesize_grounded_response("Tadepalligudem", "What does WBGT mean?", context)
    assert "WBGT" in resp
    assert "Wet Bulb Globe Temperature" in resp
    assert "estimate" in resp.lower()


def test_grounded_response_nearby_comparison():
    """Nearby comparison should cite highest risk nearby area."""
    context = build_heatshield_context("Tadepalligudem")
    resp = synthesize_grounded_response("Tadepalligudem", "Which nearby area has the highest risk?", context)
    assert "Jangareddygudem" in resp


import asyncio

def test_generate_ai_response_fallback_safe():
    """Even without Gemini API key, generate_ai_response returns valid non-empty string."""
    context = build_heatshield_context("Tadepalligudem")
    resp = asyncio.run(generate_ai_response("Tadepalligudem", "Why is the heat risk high?", context))
    assert isinstance(resp, str)
    assert len(resp) > 20
    assert "Tadepalligudem" in resp


def test_api_assistant_chat_success():
    """POST /assistant/chat returns 200 with grounded response."""
    payload = {
        "area_name": "Tadepalligudem",
        "message": "Why is the risk level high and what precautions should be taken?"
    }
    response = client.post("/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["area"] == "Tadepalligudem"
    assert data["message"] == payload["message"]
    assert len(data["response"]) > 0
    assert data["provider"] in ["gemini", "grounded_deterministic"]
    assert "context_summary" in data
    assert "risk_score" in data["context_summary"]
    assert "disclaimer" in data


def test_api_assistant_chat_invalid_area():
    """POST /assistant/chat with unknown area returns 404."""
    payload = {
        "area_name": "NonExistentArea123",
        "message": "Is it hot?"
    }
    response = client.post("/assistant/chat", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_api_assistant_chat_empty_area():
    """POST /assistant/chat with blank area returns 400."""
    payload = {
        "area_name": "   ",
        "message": "Is it hot?"
    }
    response = client.post("/assistant/chat", json=payload)
    assert response.status_code == 400


def test_api_assistant_status():
    """GET /assistant/status returns operational status."""
    response = client.get("/assistant/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "provider" in data
    assert "supported_features" in data
