from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

import os
from datetime import datetime, timezone
from services.weather_service import get_weather
from services.thermal_service import calculate_thermal_metrics
from services.vulnerability_service import get_vulnerability_data
from services.risk_service import calculate_final_risk, get_risk_category
from services.ml_service import predict_future_risk
from services.explanation_service import compute_shap_explanation
from services.alert_service import generate_heat_alert, get_alert_level
from services.action_service import get_recommended_actions
from services.alert_state_service import (
    map_level_to_alert_state,
    get_alert_history,
    add_alert_to_history,
    mark_alert_as_read,
    mark_all_alerts_as_read,
    create_notification_object,
    evaluate_alert_transition,
)
from routes.auth import get_current_user, UserProfile
from services.email_service import (
    send_heat_alert_email,
    send_demo_email,
    get_email_status,
    send_email,
)
from services.auth_service import (
    log_email_attempt,
    get_last_emailed_level,
    update_last_emailed_level,
    get_email_logs_for_user,
    set_user_monitored_location,
    get_user_monitored_location,
)
from services.monitoring_service import (
    get_monitoring_status,
    execute_transition_pipeline,
)

router = APIRouter()

# Default coordinates for West Godavari mandals
WEST_GODAVARI_COORDINATES: Dict[str, tuple] = {
    "tadepalligudem": (16.8152, 81.5267),
    "tanuku": (16.7570, 81.6820),
    "bhimavaram": (16.5449, 81.5212),
    "narsapur": (16.4344, 81.6917),
    "palakollu": (16.5173, 81.7342),
    "kovvur": (17.0142, 81.7289),
    "nidadavole": (16.9075, 81.6705),
    "jangareddygudem": (17.1264, 81.2942),
    "achanta": (16.5980, 81.7960),
    "attili": (16.6970, 81.5970),
    "penugonda": (16.6620, 81.7450),
    "penumantra": (16.6340, 81.6210),
    "iragavaram": (16.7240, 81.6530),
    "undi": (16.5820, 81.4720),
    "akividu": (16.5920, 81.3820),
    "mogalthur": (16.4020, 81.6020),
    "poduru": (16.5620, 81.7120),
    "veeravasaram": (16.5220, 81.6120),
    "kalla": (16.5420, 81.4520),
}


class ExplanationRequest(BaseModel):
    area_name: str = Field(..., description="Name of the area/mandal")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


# ============================================================
# EMAIL ALERT NOTIFICATION ENDPOINTS
# ============================================================

class EmailNotifyRequest(BaseModel):
    alert_id: Optional[str] = None
    alert_level: str = Field(..., description="Alert level: LOW, MODERATE, HIGH, EXTREME")
    location: str = Field(..., description="Active monitored location/area name")
    temperature: float
    risk_score: float
    risk_category: Optional[str] = None
    humidity: Optional[float] = None
    heat_index: Optional[float] = None
    wbgt: Optional[float] = None
    utci: Optional[float] = None
    thermal_stress_score: Optional[float] = None
    timestamp: Optional[str] = None
    force: Optional[bool] = False


@router.post("/notify-email", tags=["Email Alerts"])
def notify_email(
    req: EmailNotifyRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Evaluate and dispatch an email alert to the authenticated user's registered address.
    Strictly enforces:
    - Only sends for HIGH and EXTREME alert levels.
    - Suppresses duplicate emails on repeated polling cycles when staying in the same tier.
    - Sends on state transitions (e.g. MODERATE -> HIGH, or HIGH -> EXTREME).
    - Uses the authenticated user's email address from JWT context (never arbitrary input).
    """
    clean_level = req.alert_level.strip().upper()
    loc = req.location.strip()

    # 1. Check if alert level warrants an email
    if clean_level not in ("HIGH", "EXTREME"):
        # If risk dropped to LOW or MODERATE, reset the tracked level so future spikes alert again
        last_level = get_last_emailed_level(current_user.id, loc)
        if last_level in ("HIGH", "EXTREME"):
            update_last_emailed_level(current_user.id, loc, None)
        return {
            "sent": False,
            "suppressed": True,
            "reason": f"Alert level '{clean_level}' does not require email notification (HIGH or EXTREME only).",
            "recipient": current_user.email,
        }

    # 2. Strict Deduplication Check
    last_level = get_last_emailed_level(current_user.id, loc)
    if not req.force:
        if clean_level == "HIGH" and last_level in ("HIGH", "EXTREME"):
            return {
                "sent": False,
                "suppressed": True,
                "reason": f"Suppressed: User already notified for {last_level} in {loc}. Deduplication active.",
                "recipient": current_user.email,
            }
        if clean_level == "EXTREME" and last_level == "EXTREME":
            return {
                "sent": False,
                "suppressed": True,
                "reason": f"Suppressed: User already notified for EXTREME in {loc}. Deduplication active.",
                "recipient": current_user.email,
            }

    # 3. Dispatch Email
    weather_data = {"temperature": req.temperature, "humidity": req.humidity}
    risk_data = {"score": req.risk_score, "category": req.risk_category or clean_level}
    thermal_data = {
        "heat_index": req.heat_index,
        "wbgt": req.wbgt,
        "utci": req.utci,
        "thermal_stress_score": req.thermal_stress_score,
    }

    success, err_msg = send_heat_alert_email(
        recipient=current_user.email,
        alert_level=clean_level,
        location=loc,
        weather=weather_data,
        risk=risk_data,
        thermal=thermal_data,
        timestamp=req.timestamp,
    )

    status_str = "sent" if success else "failed"
    log_email_attempt(
        recipient=current_user.email,
        alert_level=clean_level,
        location=loc,
        status=status_str,
        alert_id=req.alert_id,
        user_id=current_user.id,
        error_message=err_msg if not success else None,
    )

    if success:
        update_last_emailed_level(current_user.id, loc, clean_level)

    return {
        "sent": success,
        "recipient": current_user.email,
        "alert_level": clean_level,
        "location": loc,
        "status": status_str,
        "error": err_msg if not success else None,
    }


class MonitorLocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_name: str = Field(..., description="Name of the location to monitor")
    monitoring_enabled: bool = Field(True, description="Whether automated email monitoring is enabled")


@router.get("/email-status", tags=["Email Alerts"])
@router.get("/notifications/email/status", tags=["Email Alerts"])
def get_email_alert_status(current_user: UserProfile = Depends(get_current_user)):
    """
    Return the live configuration and operational status of email alerts.
    """
    status_info = get_email_status()
    monitored = get_user_monitored_location(current_user.id)
    return {
        **status_info,
        "recipient": current_user.email,
        "monitoring_active": bool(monitored and monitored.get("monitoring_enabled")),
        "monitored_location": monitored,
    }


@router.post("/monitor-location", tags=["Email Alerts"])
def set_monitored_location_endpoint(
    req: MonitorLocationRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Save or update user explicit consent and coordinates for automated heat-health monitoring.
    Autonomous backend scheduler checks this location periodically without requiring an open browser.
    """
    record = set_user_monitored_location(
        user_id=current_user.id,
        latitude=req.latitude,
        longitude=req.longitude,
        location_name=req.location_name,
        monitoring_enabled=req.monitoring_enabled,
    )
    return {
        "success": True,
        "monitored_location": record,
        "message": f"Monitored location set to {req.location_name} (Active: {req.monitoring_enabled})",
    }


@router.get("/monitor-location", tags=["Email Alerts"])
def get_monitored_location_endpoint(
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Retrieve current actively monitored location and telemetry for authenticated user.
    """
    record = get_user_monitored_location(current_user.id)
    return {
        "monitored_location": record,
    }


@router.post("/demo-email", tags=["Email Alerts"])
def send_demo_email_endpoint(
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Send exactly one real demo alert email to the authenticated user's registered address
    for hackathon demonstration purposes.
    - Requires authenticated user session.
    - Recipient is extracted strictly from authenticated account (current_user.email).
    - Sends a single real demo email with realistic EXTREME heat telemetry.
    - Does NOT modify real alert states or monitoring deduplication records.
    - Does NOT trigger the automatic alert scheduler.
    """
    status_info = get_email_status()
    if not status_info.get("configured"):
        raise HTTPException(
            status_code=400,
            detail="Automatic email alerts are not configured. Add the Resend API key to the backend environment."
        )

    success, err_msg = send_demo_email(current_user.email)
    status_str = "sent" if success else "failed"

    log_email_attempt(
        recipient=current_user.email,
        alert_level="DEMO",
        location="Tadepalligudem",
        status=status_str,
        alert_id=f"demo-{int(datetime.now(timezone.utc).timestamp())}",
        user_id=current_user.id,
        error_message=err_msg if not success else None,
    )

    if not success:
        clean_err = err_msg or "Failed to deliver demo email."
        if not clean_err.startswith("Unable to send email:"):
            clean_err = f"Unable to send email: {clean_err}"
        raise HTTPException(
            status_code=400,
            detail=clean_err
        )

    return {
        "sent": True,
        "recipient": current_user.email,
        "status": "sent",
        "message": "Demo alert email sent successfully.",
        "error": None,
    }


# ============================================================
# REAL-TIME PIPELINE DEVELOPMENT TEST ENDPOINTS
# ============================================================

class DevTriggerTransitionRequest(BaseModel):
    previous_risk: Optional[float] = Field(49.0, description="Simulated previous risk score (e.g. 49 for MODERATE)")
    new_risk: Optional[float] = Field(52.0, description="Simulated new risk score (e.g. 52 for HIGH)")
    location: Optional[str] = Field("Tadepalligudem", description="Monitored location name")


@router.post("/dev/trigger-transition", tags=["Email Alerts"])
def dev_trigger_transition(
    req: Optional[DevTriggerTransitionRequest] = None,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Development-only endpoint to verify that the real-time heat alert email pipeline works.
    Only available when ENVIRONMENT=development or DEV_ALERT_MODE=true.
    Disabled in production.

    Flow:
    test transition (49 -> 52)
    -> real alert classification (MODERATE -> HIGH)
    -> real transition detection
    -> real alert service
    -> real email service
    -> Resend
    -> authenticated user's email
    """
    # 1. Environment mode check — Strictly disabled in production
    env = os.getenv("ENVIRONMENT", "development").strip().lower()
    dev_mode = os.getenv("DEV_ALERT_MODE", "").strip().lower() in ("true", "1", "yes") or env == "development"

    if not dev_mode or env == "production":
        raise HTTPException(
            status_code=403,
            detail="Development transition test endpoint is disabled in production. Set ENVIRONMENT=development or DEV_ALERT_MODE=true to enable."
        )

    # 2. Extract risk values (default: 49 -> 52, representing MODERATE -> HIGH)
    prev_risk = float(req.previous_risk) if req is not None and req.previous_risk is not None else 49.0
    new_risk = float(req.new_risk) if req is not None and req.new_risk is not None else 52.0
    loc = (req.location if req is not None and req.location else "Tadepalligudem").strip()

    # 3. Pass through the exact production alert transition logic
    result = execute_transition_pipeline(
        previous_score=prev_risk,
        new_score=new_risk,
        user_id=current_user.id,
        recipient_email=current_user.email,
        location_name=loc,
        is_test_mode=True,
    )

    # 4. If Resend rejected or email failed, return real safe error (never return fake success)
    if not result.get("success"):
        err = result.get("error") or "Failed to deliver email through Resend."
        raise HTTPException(
            status_code=502,
            detail=f"Resend rejected email: {err}"
        )

    # 5. Return exact schema required on successful delivery
    return {
        "success": True,
        "provider": "resend",
        "transition": result.get("transition", "MODERATE -> HIGH"),
        "email_sent": True,
        "recipient": current_user.email,
        "message_id": result.get("message_id"),
    }


@router.get("/monitoring-status", tags=["Email Alerts"])
def get_monitoring_status_endpoint():
    """
    Operational status endpoint showing autonomous scheduler state and real-time transition telemetry.
    Never exposes secrets or API keys.
    """
    return get_monitoring_status()



@router.get("/email-history", tags=["Email Alerts"])
def get_email_history(current_user: UserProfile = Depends(get_current_user)):
    """
    Retrieve email alert delivery history for the currently authenticated user.
    """
    logs = get_email_logs_for_user(current_user.id, limit=20)
    return {
        "recipient": current_user.email,
        "logs": logs,
        "count": len(logs),
    }


@router.get("/status/{area_name}", tags=["Alert Status"])
def get_area_alert_status(
    area_name: str,
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
):
    """
    Return the current deterministic alert state for the area.
    Provides lightweight periodic status polling for front-end change detection.
    """
    norm_area = area_name.strip().lower()
    vuln_data = get_vulnerability_data(norm_area)
    if not vuln_data:
        raise HTTPException(
            status_code=404,
            detail=f"Vulnerability data not available for area: {area_name}"
        )

    if latitude is None or longitude is None:
        if norm_area in WEST_GODAVARI_COORDINATES:
            lat, lon = WEST_GODAVARI_COORDINATES[norm_area]
        else:
            lat, lon = (16.8152, 81.5267)
    else:
        lat, lon = latitude, longitude

    try:
        weather = get_weather(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch weather: {str(e)}")

    temp = weather.get("temperature", 35.0)
    humidity = weather.get("humidity", 60.0)
    wind_speed = weather.get("wind_speed", 10.0)
    solar_radiation = weather.get("solar_radiation", 500.0)

    try:
        thermal_metrics = calculate_thermal_metrics(
            temperature=temp,
            humidity=humidity,
            wind_speed=wind_speed,
            solar_radiation=solar_radiation,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing thermal stress: {str(e)}")

    thermal_score = thermal_metrics["thermal_stress_score"]
    vuln_score = vuln_data["vulnerability_score"]
    current_risk_score = calculate_final_risk(thermal_score, vuln_score)

    try:
        pred_result = predict_future_risk(
            current_weather=weather,
            current_thermal=thermal_metrics,
            vulnerability_data=vuln_data,
            current_risk_score=current_risk_score,
        )
        pred_score = pred_result["predicted_risk_score"]
    except Exception:
        pred_score = current_risk_score

    alert = generate_heat_alert(
        current_risk_score=current_risk_score,
        predicted_risk_score=pred_score,
        area_name=vuln_data["area"],
        weather=weather,
        thermal=thermal_metrics,
    )

    alert_state = map_level_to_alert_state(alert["level"])
    now_iso = datetime.now(timezone.utc).isoformat()

    return {
        "area": vuln_data["area"],
        "alert_state": alert_state,
        "alert_level": alert["level"],
        "priority": alert["priority"],
        "risk_score": round(float(current_risk_score), 1),
        "predicted_risk_score": round(float(pred_score), 1),
        "active": alert.get("active", False),
        "title": alert.get("title", ""),
        "message": alert.get("message", ""),
        "timestamp": now_iso,
    }


@router.get("/history/{area_name}", tags=["Alert History"])
def get_area_history(area_name: str):
    """
    Return recent alert history for the given area from in-memory storage.
    Note: In-memory history resets on backend process restart.
    """
    norm_area = area_name.strip().lower()
    vuln_data = get_vulnerability_data(norm_area)
    if not vuln_data:
        raise HTTPException(
            status_code=404,
            detail=f"Area '{area_name}' not recognized in West Godavari district"
        )
    history = get_alert_history(norm_area)
    return {
        "area": vuln_data["area"],
        "alerts": history,
        "count": len(history),
    }


@router.post("/{alert_id}/read", tags=["Alert History"])
def acknowledge_alert(alert_id: str):
    """
    Mark an alert as read by its unique alert ID.
    Returns 404 if the alert_id is not found.
    """
    success = mark_alert_as_read(alert_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Alert with ID '{alert_id}' not found"
        )
    return {
        "success": True,
        "alert_id": alert_id,
        "read": True,
    }


@router.post("/history/{area_name}/read-all", tags=["Alert History"])
def acknowledge_all_alerts(area_name: str):
    """
    Mark all alerts for an area as read in in-memory storage.
    """
    norm_area = area_name.strip().lower()
    vuln_data = get_vulnerability_data(norm_area)
    if not vuln_data:
        raise HTTPException(
            status_code=404,
            detail=f"Area '{area_name}' not recognized in West Godavari district"
        )
    count = mark_all_alerts_as_read(norm_area)
    return {
        "success": True,
        "area": vuln_data["area"],
        "marked_count": count,
    }


@router.get("/{area_name}")
def get_area_alerts(
    area_name: str,
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
):
    """
    Generate comprehensive alert payload for the selected area.
    Integrates weather, thermal stress, vulnerability, current composite risk,
    XGBoost 6-hour prediction, SHAP attribution explanation, and tailored actions.
    """
    norm_area = area_name.strip().lower()
    vuln_data = get_vulnerability_data(norm_area)
    if not vuln_data:
        raise HTTPException(
            status_code=404,
            detail=f"Vulnerability data not available for area: {area_name}"
        )

    # Resolve coordinates if not explicitly provided
    if latitude is None or longitude is None:
        if norm_area in WEST_GODAVARI_COORDINATES:
            lat, lon = WEST_GODAVARI_COORDINATES[norm_area]
        else:
            lat, lon = (16.8152, 81.5267)
    else:
        lat, lon = latitude, longitude

    # 1. Fetch current weather
    try:
        weather = get_weather(lat, lon)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch weather data: {str(e)}"
        )

    temp = weather.get("temperature", 35.0)
    humidity = weather.get("humidity", 60.0)
    wind_speed = weather.get("wind_speed", 10.0)
    solar_radiation = weather.get("solar_radiation", 500.0)

    # 2. Thermal Stress
    try:
        thermal_metrics = calculate_thermal_metrics(
            temperature=temp,
            humidity=humidity,
            wind_speed=wind_speed,
            solar_radiation=solar_radiation,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error computing thermal stress indicators: {str(e)}"
        )

    thermal_score = thermal_metrics["thermal_stress_score"]
    vuln_score = vuln_data["vulnerability_score"]

    # 3. Current Composite Risk
    current_risk_score = calculate_final_risk(thermal_score, vuln_score)
    current_risk_cat = get_risk_category(current_risk_score)

    # 4. ML Future Risk Prediction
    try:
        pred_result = predict_future_risk(
            current_weather=weather,
            current_thermal=thermal_metrics,
            vulnerability_data=vuln_data,
            current_risk_score=current_risk_score,
        )
        pred_score = pred_result["predicted_risk_score"]
        pred_cat = pred_result["predicted_risk_category"]
        pred_trend = pred_result["trend"]
        pred_diff = pred_result["trend_diff"]
    except Exception as p_err:
        pred_result = None
        pred_score = current_risk_score
        pred_cat = current_risk_cat
        pred_trend = "Stable"
        pred_diff = 0.0

    # 5. SHAP Feature Attribution
    explanation = compute_shap_explanation(
        current_weather=weather,
        current_thermal=thermal_metrics,
        vulnerability_data=vuln_data,
        current_risk_score=current_risk_score,
        area_name=vuln_data["area"],
        top_k=5,
    )

    # 6. Intelligent Alert Engine
    alert = generate_heat_alert(
        current_risk_score=current_risk_score,
        predicted_risk_score=pred_score,
        area_name=vuln_data["area"],
        weather=weather,
        thermal=thermal_metrics,
    )

    # 7. Recommended Actions
    recommended_actions = get_recommended_actions(
        alert_level=alert["level"],
        top_factors=explanation.get("top_factors", []),
        max_actions=4,
    )

    return {
        "area": vuln_data["area"],
        "current_risk": {
            "score": current_risk_score,
            "category": current_risk_cat,
            "thermal_stress_score": thermal_score,
            "vulnerability_score": vuln_score,
        },
        "prediction": {
            "horizon_hours": 6,
            "predicted_risk_score": pred_score,
            "predicted_risk_category": pred_cat,
            "trend": pred_trend,
            "trend_diff": pred_diff,
        },
        "alert": alert,
        "explanation": explanation,
        "recommended_actions": recommended_actions,
    }


@router.post("/explanation", tags=["Explanation"])
def get_explanation(request: ExplanationRequest):
    """
    Dedicated endpoint for SHAP explainability.
    Evaluates top environmental and vulnerability contributors for the area.
    """
    area_name = request.area_name.strip()
    vuln_data = get_vulnerability_data(area_name)
    if not vuln_data:
        raise HTTPException(
            status_code=404,
            detail=f"Vulnerability data not available for area: {area_name}"
        )

    try:
        weather = get_weather(request.latitude, request.longitude)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch weather data: {str(e)}"
        )

    temp = weather.get("temperature", 35.0)
    humidity = weather.get("humidity", 60.0)
    wind_speed = weather.get("wind_speed", 10.0)
    solar_radiation = weather.get("solar_radiation", 500.0)

    try:
        thermal_metrics = calculate_thermal_metrics(
            temperature=temp,
            humidity=humidity,
            wind_speed=wind_speed,
            solar_radiation=solar_radiation,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error computing thermal stress indicators: {str(e)}"
        )

    thermal_score = thermal_metrics["thermal_stress_score"]
    vuln_score = vuln_data["vulnerability_score"]
    current_risk_score = calculate_final_risk(thermal_score, vuln_score)

    explanation = compute_shap_explanation(
        current_weather=weather,
        current_thermal=thermal_metrics,
        vulnerability_data=vuln_data,
        current_risk_score=current_risk_score,
        area_name=vuln_data["area"],
        top_k=5,
    )

    return explanation
