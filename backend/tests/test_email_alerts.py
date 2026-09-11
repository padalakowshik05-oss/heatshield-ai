"""
Unit and integration tests for HeatShield AI email alert notifications (Resend API).
Covers template generation, alert filtering, deduplication state, status endpoint, and API endpoints.
All Resend API calls are mocked; no real external emails are sent during automated testing.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import resend.exceptions

from main import app
from services.email_service import (
    build_alert_email_content,
    build_demo_email_content,
    build_test_transition_email_content,
    send_heat_alert_email,
    send_demo_email,
    send_email,
    send_email_direct,
    get_email_status,
    get_resend_config,
    is_placeholder,
)
from services.auth_service import (
    create_access_token,
    create_user,
    get_user_by_email,
    log_email_attempt,
    get_last_emailed_level,
    update_last_emailed_level,
    get_email_logs_for_user,
    set_user_monitored_location,
    get_user_monitored_location,
)
from services.monitoring_service import (
    evaluate_location_risk_and_notify,
    run_monitoring_cycle,
)

client = TestClient(app)


# ============================================================
# FIXTURES
# ============================================================

@pytest.fixture
def auth_user():
    """Ensure a test user exists and return user dict and bearer token."""
    test_email = "test_officer@heatshield.ai"
    user = get_user_by_email(test_email)
    if not user:
        user = create_user(
            email=test_email,
            username="test_officer",
            full_name="Test Officer",
            password="SecurePassword123!",
            role="Disaster Management Officer",
        )
    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


# ============================================================
# 1. TEMPLATE UNIT TESTS
# ============================================================

def test_build_alert_email_content_high():
    """Verify HIGH heat alert email templates contain required subject, plain text, and actions."""
    subject, plain_text, html_text = build_alert_email_content(
        alert_level="HIGH",
        location="Tadepalligudem",
        temperature=39.5,
        risk_score=68.0,
        humidity=65.0,
        heat_index=46.2,
        wbgt=31.5,
        utci=38.0,
        thermal_stress_score=70.0,
    )

    assert subject == "[HeatShield AI] HIGH Heat Alert - Tadepalligudem"
    assert "⚠️🟠 HIGH TEMPERATURE ALERT" in plain_text
    assert "Area: Tadepalligudem" in plain_text
    assert "39.5°C" in plain_text
    assert "Heat Health Risk Score: 68" in plain_text
    assert "Drink water regularly" in plain_text
    assert "Avoid prolonged exposure to direct sunlight" in plain_text
    assert "STAY HYDRATED • STAY COOL • STAY SAFE" in plain_text
    assert "<html>" in html_text
    assert "Tadepalligudem" in html_text


def test_build_alert_email_content_extreme():
    """Verify EXTREME heat alert email templates contain danger warnings and actions without unverified heatwave claim."""
    subject, plain_text, html_text = build_alert_email_content(
        alert_level="EXTREME",
        location="Tanuku",
        temperature=43.2,
        risk_score=85.0,
        humidity=72.0,
        heat_index=54.0,
        wbgt=34.2,
        utci=44.1,
        thermal_stress_score=88.0,
    )

    assert subject == "[HeatShield AI] EXTREME Heat Alert - Tanuku"
    assert "🚨🔴 EXTREME HEAT ALERT" in plain_text
    assert "DANGER: EXTREME HEAT CONDITIONS" in plain_text
    assert "Area: Tanuku" in plain_text
    assert "43.2°C" in plain_text
    assert "Heat Health Risk Score: 85" in plain_text
    assert "Stay in a cool/shaded place" in plain_text
    assert "Avoid unnecessary outdoor activities" in plain_text
    assert "PLEASE TAKE PRECAUTIONS NOW." in plain_text
    assert "<html>" in html_text
    assert "#ef4444" in html_text


def test_build_demo_email_content():
    """Verify hackathon DEMO email template explicitly discloses it is not an emergency."""
    subject, plain_text, html_text = build_demo_email_content(
        recipient="test@example.com",
        location="Tadepalligudem",
        temperature=44.0,
        risk_score=88.0,
    )

    assert subject == "[HeatShield AI DEMO] Extreme Heat Alert"
    assert "⚠️ DEMO ALERT — NOT A REAL EMERGENCY" in plain_text
    assert "Area: Tadepalligudem" in plain_text
    assert "44°C" in plain_text
    assert "EXTREME" in plain_text
    assert "DEMO ALERT — NOT A REAL EMERGENCY" in html_text


# ============================================================
# 2. RESEND CONFIGURATION & SAFE DIAGNOSTICS TESTS
# ============================================================

def test_is_placeholder():
    """Verify placeholder detection identifies template tokens and empty strings."""
    assert is_placeholder("") is True
    assert is_placeholder(None) is True
    assert is_placeholder("re_xxxxxxxxxxxxxxxxx") is True
    assert is_placeholder("your-resend-api-key") is True
    assert is_placeholder("test@example.com") is True
    assert is_placeholder("re_123456789abcdef012345678") is True
    assert is_placeholder("re_validapikey999988887777") is False


def test_resend_not_configured():
    """Verify status reports 'Not configured' when RESEND_API_KEY is missing or placeholder."""
    with patch.dict("os.environ", {"RESEND_API_KEY": "", "EMAIL_FROM": ""}):
        status = get_email_status()
        assert status["status"] == "Not configured"
        assert status["configured"] is False
        assert status["enabled"] is False
        assert "not configured" in status["message"].lower()


def test_resend_configured():
    """Verify status reports 'Configured' when genuine RESEND_API_KEY and EMAIL_FROM exist."""
    with patch.dict("os.environ", {
        "RESEND_API_KEY": "re_live_secret_key_abcdef123456",
        "EMAIL_FROM": "onboarding@resend.dev",
    }):
        status = get_email_status()
        assert status["status"] == "Configured"
        assert status["configured"] is True
        assert status["enabled"] is True
        assert status["provider"] == "resend"
        assert status["email_from"] == "onboarding@resend.dev"
        assert "Automatic email alerts are enabled" in status["message"]


def test_api_key_never_exposed_in_status():
    """Verify secret RESEND_API_KEY is never leaked through get_email_status or API status response."""
    secret_key = "re_supersecretkeythatmustneverleak"
    with patch.dict("os.environ", {
        "RESEND_API_KEY": secret_key,
        "EMAIL_FROM": "alerts@heatshield.ai",
    }):
        status = get_email_status()
        status_str = str(status)
        assert secret_key not in status_str
        assert "api_key" not in status or status.get("api_key") is None


# ============================================================
# 3. DIRECT RESEND DISPATCH & ERROR HANDLING TESTS
# ============================================================

def test_send_email_missing_api_key():
    """Verify send_email fails gracefully when API key is missing or placeholder."""
    with patch.dict("os.environ", {"RESEND_API_KEY": ""}):
        ok, err = send_email("test@domain.com", "Subject", "<p>Body</p>", "Body")
        assert ok is False
        assert "not configured" in err.lower()


@patch("resend.Emails.send")
def test_send_email_success(mock_send):
    """Verify send_email passes correct parameters to Resend SDK and reports success."""
    mock_send.return_value = {"id": "resend_email_id_12345"}
    with patch.dict("os.environ", {
        "RESEND_API_KEY": "re_valid_key_12345",
        "EMAIL_FROM": "alerts@heatshield.ai",
    }):
        ok, err = send_email(
            recipient="officer@heatshield.ai",
            subject="Test Heat Alert",
            html_body="<p>Alert text</p>",
            text_body="Alert text",
        )
        assert ok is True
        assert err is None
        assert mock_send.call_count == 1
        args, kwargs = mock_send.call_args
        params = args[0] if args else kwargs.get("params")
        assert params["from"] == "alerts@heatshield.ai"
        assert params["to"] == ["officer@heatshield.ai"]
        assert params["subject"] == "Test Heat Alert"


@patch("resend.Emails.send", side_effect=resend.exceptions.InvalidApiKeyError(code="invalid_api_key", message="API key is invalid", error_type="validation_error"))
def test_send_email_invalid_api_key_error(mock_send):
    """Verify InvalidApiKeyError produces a safe, user-friendly message without crashing."""
    with patch.dict("os.environ", {
        "RESEND_API_KEY": "re_invalid_test_key",
        "EMAIL_FROM": "onboarding@resend.dev",
    }):
        ok, err = send_email("user@example.com", "Subject", "<p>Hi</p>", "Hi")
        assert ok is False
        assert "Unable to send email: Invalid Resend API key" in err


@patch("resend.Emails.send", side_effect=resend.exceptions.RateLimitError(code="rate_limit_exceeded", message="Too many requests", error_type="rate_limit"))
def test_send_email_rate_limit_error(mock_send):
    """Verify RateLimitError produces a safe retry error message."""
    with patch.dict("os.environ", {
        "RESEND_API_KEY": "re_valid_key_12345",
        "EMAIL_FROM": "onboarding@resend.dev",
    }):
        ok, err = send_email("user@example.com", "Subject", "<p>Hi</p>", "Hi")
        assert ok is False
        assert "rate limit exceeded" in err.lower()


# ============================================================
# 4. HACKATHON DEMO EMAIL ENDPOINT TESTS
# ============================================================

def test_demo_email_requires_authentication():
    """Verify /alerts/demo-email rejects unauthenticated requests with 401."""
    res = client.post("/alerts/demo-email")
    assert res.status_code == 401


def test_demo_email_unconfigured_returns_400(auth_user):
    """Verify demo email returns 400 when Resend is not configured."""
    with patch.dict("os.environ", {"RESEND_API_KEY": ""}):
        res = client.post("/alerts/demo-email", headers=auth_user["headers"])
        assert res.status_code == 400
        assert "not configured" in res.json()["detail"].lower()


def test_demo_email_sends_exactly_once(auth_user):
    """Verify demo email endpoint dispatches exactly one real email via Resend to authenticated user."""
    with patch.dict("os.environ", {
        "RESEND_API_KEY": "re_mock_test_key_12345",
        "EMAIL_FROM": "onboarding@resend.dev",
    }):
        with patch("services.email_service.send_email", return_value=(True, None)) as mock_send:
            res = client.post("/alerts/demo-email", headers=auth_user["headers"])
            assert res.status_code == 200
            data = res.json()
            assert data["sent"] is True
            assert data["recipient"] == auth_user["user"]["email"]
            assert data["message"] == "Demo alert email sent successfully."
            assert mock_send.call_count == 1
            args, kwargs = mock_send.call_args
            recipient = kwargs.get("recipient") or args[0]
            subject = kwargs.get("subject") or args[1]
            assert recipient == auth_user["user"]["email"]
            assert "[HeatShield AI DEMO] Extreme Heat Alert" in subject


# ============================================================
# 5. REAL ALERT PIPELINE & DEDUPLICATION TESTS
# ============================================================

def test_notify_email_unauthorized():
    """Verify /alerts/notify-email rejects requests without valid JWT bearer token."""
    res = client.post(
        "/alerts/notify-email",
        json={
            "alert_level": "HIGH",
            "location": "Tadepalligudem",
            "temperature": 40.0,
            "risk_score": 70.0,
        },
    )
    assert res.status_code == 401


def test_low_and_moderate_do_not_send(auth_user):
    """Verify LOW and MODERATE alert levels never dispatch emails."""
    with patch("services.email_service.send_email", return_value=(True, None)) as mock_send:
        for lvl, score in [("LOW", 15.0), ("MODERATE", 38.0)]:
            res = client.post(
                "/alerts/notify-email",
                json={
                    "alert_level": lvl,
                    "location": "Tadepalligudem",
                    "temperature": 32.0,
                    "risk_score": score,
                },
                headers=auth_user["headers"],
            )
            assert res.status_code == 200
            data = res.json()
            assert data["sent"] is False
            assert data["suppressed"] is True
            assert mock_send.call_count == 0


def test_high_transition_and_deduplication(auth_user):
    """
    Verify full state transition rules:
    - 49 -> 52 (transition to HIGH) -> SENDS email
    - 52 -> 60 (stay in HIGH) -> SENDS NOTHING (deduplicated)
    - 60 -> 70 (stay in HIGH) -> SENDS NOTHING
    - 74 -> 76 (transition to EXTREME) -> SENDS EXTREME email
    - 76 -> 80 (stay in EXTREME) -> SENDS NOTHING
    - 80 -> 70 (drop to HIGH) -> SENDS NOTHING
    - Drop to MODERATE -> resets state
    - 70 -> 76 (enter EXTREME again) -> SENDS EXTREME email
    """
    uid = auth_user["user"]["id"]
    loc = "Nidadavole"

    # Reset initial state
    update_last_emailed_level(uid, loc, None)

    with patch("services.email_service.send_email", return_value=(True, None)) as mock_send:
        # 1. 49 -> 52: Enter HIGH -> SEND HIGH
        res1 = client.post(
            "/alerts/notify-email",
            json={"alert_level": "HIGH", "location": loc, "temperature": 39.0, "risk_score": 52.0},
            headers=auth_user["headers"],
        )
        assert res1.status_code == 200
        assert res1.json()["sent"] is True
        assert mock_send.call_count == 1

        # 2. 52 -> 60: Stay in HIGH -> DO NOT SEND
        res2 = client.post(
            "/alerts/notify-email",
            json={"alert_level": "HIGH", "location": loc, "temperature": 39.5, "risk_score": 60.0},
            headers=auth_user["headers"],
        )
        assert res2.status_code == 200
        assert res2.json()["sent"] is False
        assert res2.json()["suppressed"] is True
        assert mock_send.call_count == 1  # Not called again

        # 3. 60 -> 70: Stay in HIGH -> DO NOT SEND
        res3 = client.post(
            "/alerts/notify-email",
            json={"alert_level": "HIGH", "location": loc, "temperature": 40.0, "risk_score": 70.0},
            headers=auth_user["headers"],
        )
        assert res3.status_code == 200
        assert res3.json()["sent"] is False
        assert mock_send.call_count == 1

        # 4. 74 -> 76: Transition to EXTREME -> SEND EXTREME
        res4 = client.post(
            "/alerts/notify-email",
            json={"alert_level": "EXTREME", "location": loc, "temperature": 43.5, "risk_score": 76.0},
            headers=auth_user["headers"],
        )
        assert res4.status_code == 200
        assert res4.json()["sent"] is True
        assert mock_send.call_count == 2
        args, kwargs = mock_send.call_args
        subject = kwargs.get("subject") or args[1]
        assert "EXTREME Heat Alert" in subject

        # 5. 76 -> 80: Stay in EXTREME -> DO NOT SEND
        res5 = client.post(
            "/alerts/notify-email",
            json={"alert_level": "EXTREME", "location": loc, "temperature": 44.0, "risk_score": 80.0},
            headers=auth_user["headers"],
        )
        assert res5.status_code == 200
        assert res5.json()["sent"] is False
        assert mock_send.call_count == 2

        # 6. 80 -> 70: Drop to HIGH -> DO NOT SEND
        res6 = client.post(
            "/alerts/notify-email",
            json={"alert_level": "HIGH", "location": loc, "temperature": 40.0, "risk_score": 70.0},
            headers=auth_user["headers"],
        )
        assert res6.status_code == 200
        assert res6.json()["sent"] is False
        assert mock_send.call_count == 2

        # 7. Drop to MODERATE (clears alert state)
        res7 = client.post(
            "/alerts/notify-email",
            json={"alert_level": "MODERATE", "location": loc, "temperature": 32.0, "risk_score": 40.0},
            headers=auth_user["headers"],
        )
        assert res7.status_code == 200
        assert res7.json()["sent"] is False

        # 8. 70 -> 76: Enter EXTREME again -> SENDS EXTREME again
        res8 = client.post(
            "/alerts/notify-email",
            json={"alert_level": "EXTREME", "location": loc, "temperature": 44.2, "risk_score": 76.0},
            headers=auth_user["headers"],
        )
        assert res8.status_code == 200
        assert res8.json()["sent"] is True
        assert mock_send.call_count == 3


# ============================================================
# 6. RECIPIENT SECURITY (NO HARDCODING, NO SPOOFING)
# ============================================================

def test_recipient_always_comes_from_authenticated_user(auth_user):
    """Verify endpoint strictly rejects client-supplied spoofed recipients."""
    user = auth_user["user"]
    update_last_emailed_level(user["id"], "Tadepalligudem", None)
    with patch("services.email_service.send_email", return_value=(True, None)) as mock_send:
        res = client.post(
            "/alerts/notify-email",
            json={
                "alert_level": "HIGH",
                "location": "Tadepalligudem",
                "temperature": 39.5,
                "risk_score": 62.0,
                "recipient": "attacker_spoofed@evil.com",
            },
            headers=auth_user["headers"],
        )
        assert res.status_code == 200
        assert res.json()["recipient"] == user["email"]
        assert res.json()["recipient"] != "attacker_spoofed@evil.com"
        args, kwargs = mock_send.call_args
        recipient = kwargs.get("recipient") or args[0]
        assert recipient == user["email"]


def test_no_hardcoded_recipient():
    """Verify arbitrary authenticated users receive alerts at their own unique account email."""
    unique_email = "climate_action_officer_99@andhra.gov.in"
    user = get_user_by_email(unique_email)
    if not user:
        user = create_user(
            email=unique_email,
            username="climate_officer_99",
            full_name="Climate Officer",
            password="SecurePassword999!",
            role="Disaster Management Officer",
        )
    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})
    headers = {"Authorization": f"Bearer {token}"}

    with patch.dict("os.environ", {
        "RESEND_API_KEY": "re_live_key_9999",
        "EMAIL_FROM": "onboarding@resend.dev",
    }):
        with patch("services.email_service.send_email", return_value=(True, None)) as mock_send:
            res = client.post("/alerts/demo-email", headers=headers)
            assert res.status_code == 200
            assert res.json()["recipient"] == unique_email
            args, kwargs = mock_send.call_args
            recipient = kwargs.get("recipient") or args[0]
            assert recipient == unique_email


# ============================================================
# 7. AUTONOMOUS BACKGROUND SCHEDULER TESTS
# ============================================================

def test_autonomous_monitoring_service_runs_independently(auth_user):
    """Verify the 5-minute background monitoring cycle operates with Open-Meteo & Resend without browser."""
    user = auth_user["user"]
    set_user_monitored_location(
        user_id=user["id"],
        latitude=16.8152,
        longitude=81.5267,
        location_name="Tadepalligudem",
        monitoring_enabled=True,
    )

    mock_weather = {
        "temperature": 43.5,
        "humidity": 65.0,
        "wind_speed": 12.0,
        "solar_radiation": 650.0,
    }

    with patch("services.monitoring_service.get_weather", return_value=mock_weather):
        with patch("services.monitoring_service.send_heat_alert_email", return_value=(True, None)) as mock_send:
            # First cycle: None -> EXTREME -> Send email
            res1 = evaluate_location_risk_and_notify(
                user_id=user["id"],
                recipient_email=user["email"],
                full_name=user["full_name"],
                latitude=16.8152,
                longitude=81.5267,
                location_name="Tadepalligudem",
                last_alert_level=None,
            )
            assert res1["email_sent"] is True
            assert mock_send.call_count == 1
            rec_lvl = res1["alert_level"]

            # Second cycle: EXTREME -> EXTREME -> Deduplicated
            res2 = evaluate_location_risk_and_notify(
                user_id=user["id"],
                recipient_email=user["email"],
                full_name=user["full_name"],
                latitude=16.8152,
                longitude=81.5267,
                location_name="Tadepalligudem",
                last_alert_level=rec_lvl,
            )
            assert res2["email_sent"] is False
            assert "Suppressed" in res2["reason"]
            assert mock_send.call_count == 1  # Not called again


def test_automatic_scheduler_never_sends_demo_emails(auth_user):
    """Verify background scheduler never dispatches demo alerts."""
    user = auth_user["user"]
    mock_weather = {
        "temperature": 44.5,
        "humidity": 68.0,
        "wind_speed": 10.0,
        "solar_radiation": 700.0,
    }
    with patch("services.monitoring_service.get_weather", return_value=mock_weather):
        with patch("services.monitoring_service.send_heat_alert_email", return_value=(True, None)) as mock_auto:
            with patch("services.email_service.send_demo_email") as mock_demo:
                res = evaluate_location_risk_and_notify(
                    user_id=user["id"],
                    recipient_email=user["email"],
                    full_name=user["full_name"],
                    latitude=16.8152,
                    longitude=81.5267,
                    location_name="Tadepalligudem",
                    last_alert_level=None,
                )
                assert res["email_sent"] is True
                assert mock_auto.call_count == 1
                assert mock_demo.call_count == 0


# ============================================================
# 8. SETTINGS STATUS AND HISTORY ENDPOINT TESTS
# ============================================================

def test_email_status_endpoint(auth_user):
    """Verify /alerts/email-status returns Resend provider status, monitoring state, and recipient."""
    res = client.get(
        "/alerts/email-status",
        headers=auth_user["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert data["status"] in ("Configured", "Not configured")
    assert data["provider"] == "resend"
    assert data["recipient"] == auth_user["user"]["email"]
    assert "monitoring_active" in data
    assert "monitored_location" in data


def test_email_history_endpoint(auth_user):
    """Verify /alerts/email-history returns delivery history for authenticated user."""
    res = client.get(
        "/alerts/email-history",
        headers=auth_user["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert data["recipient"] == auth_user["user"]["email"]
    assert "logs" in data
    assert isinstance(data["logs"], list)


def test_build_test_transition_email_content():
    """Verify test transition email subject and content requirements."""
    subject, plain, html = build_test_transition_email_content(
        recipient="operator@heatshield.ai",
        location="Tadepalligudem",
        previous_level="MODERATE",
        current_level="HIGH",
        previous_score=49.0,
        new_score=52.0,
    )
    assert "[HeatShield AI TEST] HIGH Heat Alert" in subject
    assert "DEVELOPMENT TEST — NOT A REAL HEAT EMERGENCY" in plain
    assert "MODERATE" in plain and "HIGH" in plain
    assert "49" in plain and "52" in plain
    assert "DEVELOPMENT TEST — NOT A REAL HEAT EMERGENCY" in html
    assert "Stay in cool or shaded places" in plain


def test_dev_trigger_transition_endpoint_success(auth_user):
    """Verify POST /alerts/dev/trigger-transition simulates 49->52 (MODERATE->HIGH) and dispatches via Resend."""
    with patch("services.email_service.resend.Emails.send") as mock_send, \
         patch.dict("os.environ", {"RESEND_API_KEY": "re_validkey12345678", "ENVIRONMENT": "development"}):
        mock_send.return_value = {"id": "resend_msg_test_id_9999"}
        res = client.post(
            "/alerts/dev/trigger-transition",
            json={"previous_risk": 49.0, "new_risk": 52.0},
            headers=auth_user["headers"],
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["provider"] == "resend"
        assert data["transition"] == "MODERATE -> HIGH"
        assert data["email_sent"] is True
        assert data["recipient"] == auth_user["user"]["email"]
        assert data["message_id"] == "resend_msg_test_id_9999"


def test_dev_trigger_transition_disabled_in_production(auth_user):
    """Verify POST /alerts/dev/trigger-transition is disabled in production."""
    with patch.dict("os.environ", {"ENVIRONMENT": "production", "DEV_ALERT_MODE": "false"}):
        res = client.post(
            "/alerts/dev/trigger-transition",
            json={"previous_risk": 49.0, "new_risk": 52.0},
            headers=auth_user["headers"],
        )
        assert res.status_code == 403
        assert "disabled in production" in res.json()["detail"].lower()


def test_dev_trigger_transition_resend_error_returns_502(auth_user):
    """Verify Resend failure returns 502 with safe error and never fakes success."""
    import resend
    with patch("services.email_service.resend.Emails.send") as mock_send, \
         patch.dict("os.environ", {"RESEND_API_KEY": "re_validkey12345678", "ENVIRONMENT": "development"}):
        mock_send.side_effect = resend.exceptions.InvalidApiKeyError(
            code="invalid_api_key",
            message="Invalid Resend API key",
            error_type="validation_error",
        )
        res = client.post(
            "/alerts/dev/trigger-transition",
            json={"previous_risk": 49.0, "new_risk": 52.0},
            headers=auth_user["headers"],
        )
        assert res.status_code == 502
        assert "Invalid Resend API key" in res.json()["detail"]


def test_monitoring_status_endpoint():
    """Verify GET /alerts/monitoring-status returns all required scheduler and telemetry fields."""
    res = client.get("/alerts/monitoring-status")
    assert res.status_code == 200
    data = res.json()
    expected_fields = [
        "monitoring_enabled",
        "scheduler_running",
        "scheduler_interval_seconds",
        "last_check_time",
        "last_weather_fetch_time",
        "last_risk_score",
        "last_alert_level",
        "last_transition",
        "last_email_attempt_time",
        "last_email_status",
        "last_email_message_id",
    ]
    for field in expected_fields:
        assert field in data, f"Missing field {field} in /alerts/monitoring-status"
    assert data["scheduler_interval_seconds"] == 300
