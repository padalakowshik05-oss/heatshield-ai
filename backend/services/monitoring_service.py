"""
HeatShield AI — Autonomous Real-Time Heat Monitoring Service
============================================================
Independently monitors subscribed user locations in the background.
Operates on a 5-minute schedule without requiring an open browser session.

PIPELINE:
---------
1. Load subscribed locations from persistent SQLite database.
2. Fetch live Open-Meteo weather for exact monitored coordinates.
3. Calculate Heat Index, estimated WBGT, estimated UTCI, and Thermal Stress.
4. Integrate localized vulnerability indicators.
5. Calculate composite HeatShield Risk Score.
6. Determine alert level (LOW, MODERATE, HIGH, EXTREME).
7. Perform strict deduplication against recorded state in SQLite.
8. Dispatch real email on qualifying transitions (e.g. -> HIGH or -> EXTREME).
9. Persist updated telemetry, alert levels, and timestamps.
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from services.weather_service import get_weather, get_current_weather
from services.thermal_service import calculate_thermal_metrics
from services.vulnerability_service import get_vulnerability_data
from services.risk_service import calculate_final_risk, get_risk_category
from services.email_service import (
    send_heat_alert_email,
    send_heat_alert_email_with_id,
    get_last_email_details,
)
from services.auth_service import (
    get_all_active_monitored_locations,
    update_monitored_location_state,
    log_email_attempt,
)

logger = logging.getLogger("heatshield.monitoring")

# Singleton reference for background asyncio task
_background_task: Optional[asyncio.Task] = None

# Telemetry and state tracking for operational monitoring status
_MONITORING_STATUS: Dict[str, Any] = {
    "monitoring_enabled": True,
    "scheduler_running": False,
    "scheduler_interval_seconds": 300,
    "last_check_time": None,
    "last_weather_fetch_time": None,
    "last_risk_score": None,
    "last_alert_level": None,
    "last_transition": None,
    "last_email_attempt_time": None,
    "last_email_status": None,
    "last_email_message_id": None,
}


def _update_monitoring_telemetry(
    risk_score: Optional[float] = None,
    alert_level: Optional[str] = None,
    transition: Optional[str] = None,
    email_sent: Optional[bool] = None,
    message_id: Optional[str] = None,
    error: Optional[str] = None,
    weather_fetched: bool = False,
):
    """Internal helper to record runtime telemetry without exposing secrets."""
    global _MONITORING_STATUS
    now_iso = datetime.now(timezone.utc).isoformat()
    _MONITORING_STATUS["last_check_time"] = now_iso
    if weather_fetched:
        _MONITORING_STATUS["last_weather_fetch_time"] = now_iso
    if risk_score is not None:
        _MONITORING_STATUS["last_risk_score"] = round(float(risk_score), 1)
    if alert_level is not None:
        _MONITORING_STATUS["last_alert_level"] = alert_level.strip().upper()
    if transition is not None:
        _MONITORING_STATUS["last_transition"] = transition
    if email_sent is not None:
        _MONITORING_STATUS["last_email_attempt_time"] = now_iso
        _MONITORING_STATUS["last_email_status"] = "sent" if email_sent else "failed"
        if message_id:
            _MONITORING_STATUS["last_email_message_id"] = message_id
        elif error:
            _MONITORING_STATUS["last_email_message_id"] = None


def get_monitoring_status() -> Dict[str, Any]:
    """Return live scheduler operational status and telemetry. Never exposes secrets."""
    global _background_task, _MONITORING_STATUS
    is_running = bool(_background_task is not None and not _background_task.done())
    status = dict(_MONITORING_STATUS)
    status["scheduler_running"] = is_running
    return status


def evaluate_location_risk_and_notify(
    user_id: int,
    recipient_email: str,
    full_name: str,
    latitude: float,
    longitude: float,
    location_name: str,
    last_alert_level: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute full deterministic risk pipeline for a monitored location.
    If Open-Meteo is unavailable, safely aborts without generating alerts from stale mock data.
    """
    clean_area = location_name.strip()
    norm_area = clean_area.lower()

    logger.info(f"[HeatShield Scheduler] Checking monitored location: {clean_area}...")

    # 1. Fetch live Open-Meteo weather
    try:
        raw_weather = get_weather(latitude, longitude)
        if isinstance(raw_weather, dict) and "temperature" in raw_weather:
            weather = raw_weather
        elif isinstance(raw_weather, dict) and "current" in raw_weather:
            current = raw_weather.get("current", {})
            weather = {
                "latitude": latitude,
                "longitude": longitude,
                "temperature": current.get("temperature_2m"),
                "humidity": current.get("relative_humidity_2m"),
                "wind_speed": current.get("wind_speed_10m", 10.0),
                "solar_radiation": current.get("shortwave_radiation", 500.0),
            }
        else:
            weather = raw_weather or {}
    except Exception as exc:
        logger.warning(
            f"[MONITORING] Open-Meteo unavailable for {clean_area} ({latitude}, {longitude}): {exc}. "
            "Aborting cycle to prevent alerts from stale/mock data."
        )
        return {"status": "weather_unavailable", "error": str(exc)}

    temp = weather.get("temperature")
    humidity = weather.get("humidity")
    wind_speed = weather.get("wind_speed", 10.0)
    solar_rad = weather.get("solar_radiation", 500.0)

    if temp is None or humidity is None:
        logger.warning(f"[MONITORING] Incomplete weather data for {clean_area}. Skipping cycle.")
        return {"status": "incomplete_weather"}

    logger.info(f"[Weather] Fetched current weather for {clean_area}: Temp={temp}°C, Humidity={humidity}%")
    _update_monitoring_telemetry(weather_fetched=True)

    # 2. Thermal Stress Engine
    try:
        thermal_metrics = calculate_thermal_metrics(
            temperature=float(temp),
            humidity=float(humidity),
            wind_speed=float(wind_speed),
            solar_radiation=float(solar_rad),
        )
    except Exception as exc:
        logger.error(f"[MONITORING] Error calculating thermal metrics for {clean_area}: {exc}")
        return {"status": "thermal_error", "error": str(exc)}

    thermal_score = thermal_metrics["thermal_stress_score"]

    # 3. Localized Vulnerability
    vuln_data = get_vulnerability_data(norm_area)
    if vuln_data:
        vuln_score = vuln_data["vulnerability_score"]
    else:
        # Default baseline vulnerability for West Godavari region if area not directly matched
        vuln_score = 50.0

    # 4. Final Composite Risk Score & Category
    current_risk_score = calculate_final_risk(thermal_score, vuln_score)
    current_alert_level = get_risk_category(current_risk_score)

    prev_lvl = (last_alert_level or "").strip().upper()
    curr_lvl = current_alert_level.strip().upper()

    logger.info(f"[Risk] Current score: {current_risk_score:.1f}")
    logger.info(f"[Risk] Current level: {curr_lvl}")

    email_sent = False
    send_reason = None
    transition_detected = False
    resend_msg_id = None
    err_msg = None

    # 5. Strict Transition Evaluation
    # 75–100: EXTREME
    if curr_lvl == "EXTREME":
        if prev_lvl == "EXTREME":
            send_reason = f"Suppressed: Area already in EXTREME state ({clean_area})"
            transition_detected = False
        else:
            transition_detected = True
            send_reason = "Dispatched EXTREME alert transition"
            success, err_msg = send_heat_alert_email(
                recipient=recipient_email,
                alert_level="EXTREME",
                location=clean_area,
                weather=weather,
                risk={"score": current_risk_score, "category": "EXTREME"},
                thermal=thermal_metrics,
            )
            email_sent = success
            resend_msg_id = get_last_email_details().get("message_id")
            log_email_attempt(
                recipient=recipient_email,
                alert_level="EXTREME",
                location=clean_area,
                status="sent" if success else "failed",
                alert_id=f"auto-ext-{user_id}-{int(datetime.now(timezone.utc).timestamp())}",
                user_id=user_id,
                error_message=err_msg if not success else None,
            )

    # 50–74.99: HIGH
    elif curr_lvl == "HIGH":
        if prev_lvl in ("HIGH", "EXTREME"):
            send_reason = f"Suppressed: Area already in {prev_lvl} state ({clean_area})"
            transition_detected = False
        else:
            transition_detected = True
            send_reason = "Dispatched HIGH alert transition"
            success, err_msg = send_heat_alert_email(
                recipient=recipient_email,
                alert_level="HIGH",
                location=clean_area,
                weather=weather,
                risk={"score": current_risk_score, "category": "HIGH"},
                thermal=thermal_metrics,
            )
            email_sent = success
            resend_msg_id = get_last_email_details().get("message_id")
            log_email_attempt(
                recipient=recipient_email,
                alert_level="HIGH",
                location=clean_area,
                status="sent" if success else "failed",
                alert_id=f"auto-high-{user_id}-{int(datetime.now(timezone.utc).timestamp())}",
                user_id=user_id,
                error_message=err_msg if not success else None,
            )

    else:
        # LOW or MODERATE -> No email sent, state recorded for clean reset
        send_reason = f"Sub-threshold condition ({curr_lvl}); no email needed"
        transition_detected = False

    logger.info(f"[Alert] Previous level: {prev_lvl or 'NONE'}")
    logger.info(f"[Alert] Current level: {curr_lvl}")
    logger.info(f"[Alert] Transition detected: {str(transition_detected).lower()}")

    # Update operational telemetry state
    transition_str = f"{prev_lvl or 'NONE'} -> {curr_lvl}"
    _update_monitoring_telemetry(
        risk_score=current_risk_score,
        alert_level=curr_lvl,
        transition=transition_str,
        email_sent=email_sent if transition_detected else None,
        message_id=resend_msg_id,
        error=err_msg,
    )

    # 6. Persist Updated Telemetry and Transition State
    update_monitored_location_state(
        user_id=user_id,
        risk_score=current_risk_score,
        alert_level=curr_lvl,
        email_sent=email_sent,
    )

    logger.info(
        f"[MONITORING] Evaluated {clean_area} for {recipient_email}: "
        f"Temp={temp}°C, Risk={current_risk_score:.1f}, Alert={curr_lvl}, "
        f"EmailSent={email_sent} ({send_reason})"
    )

    return {
        "user_id": user_id,
        "location": clean_area,
        "temperature": temp,
        "humidity": humidity,
        "risk_score": current_risk_score,
        "alert_level": curr_lvl,
        "email_sent": email_sent,
        "reason": send_reason,
    }


def execute_transition_pipeline(
    previous_score: float,
    new_score: float,
    user_id: int,
    recipient_email: str,
    location_name: str = "Tadepalligudem",
    is_test_mode: bool = True,
) -> Dict[str, Any]:
    """
    Executes the exact production alert transition logic:
    test transition -> real alert classification -> real transition detection -> real alert service -> Resend.
    Does NOT mock Resend. Never exposes API keys.
    """
    clean_area = location_name.strip()

    # 1. Real alert classification
    prev_lvl = get_risk_category(previous_score).strip().upper()
    curr_lvl = get_risk_category(new_score).strip().upper()
    transition_str = f"{prev_lvl} -> {curr_lvl}"

    logger.info(f"[HeatShield Scheduler] Checking monitored location: {clean_area} (test transition)...")
    logger.info(f"[Risk] Current score: {new_score:.1f}")
    logger.info(f"[Risk] Current level: {curr_lvl}")

    # 2. Real transition detection (Identical rules to scheduler)
    should_send = False
    send_reason = None
    if curr_lvl == "EXTREME":
        if prev_lvl == "EXTREME":
            send_reason = f"Suppressed: Area already in EXTREME state ({clean_area})"
        else:
            should_send = True
            send_reason = "Dispatched EXTREME alert transition"
    elif curr_lvl == "HIGH":
        if prev_lvl in ("HIGH", "EXTREME"):
            send_reason = f"Suppressed: Area already in {prev_lvl} state ({clean_area})"
        else:
            should_send = True
            send_reason = "Dispatched HIGH alert transition"
    else:
        send_reason = f"Sub-threshold condition ({curr_lvl}); no email needed"

    logger.info(f"[Alert] Previous level: {prev_lvl}")
    logger.info(f"[Alert] Current level: {curr_lvl}")
    logger.info(f"[Alert] Transition detected: {str(should_send).lower()}")

    email_sent = False
    resend_msg_id = None
    error_msg = None

    if should_send:
        # 3. Real email service -> Resend dispatch
        weather_mock = {"temperature": 38.0, "humidity": 65.0}
        risk_data = {"score": new_score, "category": curr_lvl}
        thermal_mock = {"thermal_stress_score": 68.0, "heat_index": 45.0, "wbgt": 31.0, "utci": 39.0}

        success, err_msg = send_heat_alert_email(
            recipient=recipient_email,
            alert_level=curr_lvl,
            location=clean_area,
            weather=weather_mock,
            risk=risk_data,
            thermal=thermal_mock,
            is_test=is_test_mode,
            test_previous_level=prev_lvl,
            test_previous_score=previous_score,
            test_new_score=new_score,
        )
        email_sent = success
        resend_msg_id = get_last_email_details().get("message_id")
        error_msg = err_msg

        # Update telemetry state
        _update_monitoring_telemetry(
            risk_score=new_score,
            alert_level=curr_lvl,
            transition=transition_str,
            email_sent=email_sent,
            message_id=resend_msg_id,
            error=error_msg,
        )

        log_email_attempt(
            recipient=recipient_email,
            alert_level=curr_lvl,
            location=clean_area,
            status="sent" if success else "failed",
            alert_id=f"dev-trans-{user_id}-{int(datetime.now(timezone.utc).timestamp())}",
            user_id=user_id,
            error_message=error_msg,
        )
    else:
        _update_monitoring_telemetry(
            risk_score=new_score,
            alert_level=curr_lvl,
            transition=transition_str,
        )

    return {
        "success": email_sent,
        "provider": "resend",
        "transition": transition_str,
        "email_sent": email_sent,
        "recipient": recipient_email,
        "message_id": resend_msg_id,
        "error": error_msg,
        "reason": send_reason,
    }


def run_monitoring_cycle() -> List[Dict[str, Any]]:
    """Query all active subscriptions and evaluate risk."""
    subscriptions = get_all_active_monitored_locations()
    if not subscriptions:
        logger.debug("[MONITORING] No active monitored locations found.")
        return []

    logger.info(f"[MONITORING] Running cycle for {len(subscriptions)} active monitored locations.")
    results = []
    for sub in subscriptions:
        try:
            res = evaluate_location_risk_and_notify(
                user_id=sub["user_id"],
                recipient_email=sub["email"],
                full_name=sub["full_name"],
                latitude=sub["monitored_latitude"],
                longitude=sub["monitored_longitude"],
                location_name=sub["monitored_location_name"],
                last_alert_level=sub.get("last_alert_level"),
            )
            results.append(res)
        except Exception as exc:
            logger.error(f"[MONITORING ERROR] Error evaluating subscriber {sub.get('user_id')}: {exc}", exc_info=True)

    return results


async def monitoring_worker_loop(interval_seconds: int = 300):
    """Asynchronous background worker loop running every 5 minutes."""
    logger.info(f"[MONITORING WORKER] Started independent scheduler (cycle interval: {interval_seconds}s)")
    while True:
        try:
            # Run blocking evaluation cycle in threadpool to keep event loop unblocked
            await asyncio.to_thread(run_monitoring_cycle)
        except asyncio.CancelledError:
            logger.info("[MONITORING WORKER] Scheduler task cancelled.")
            break
        except Exception as exc:
            logger.error(f"[MONITORING WORKER ERROR] {exc}", exc_info=True)

        await asyncio.sleep(interval_seconds)


def start_monitoring_scheduler(interval_seconds: int = 300) -> Optional[asyncio.Task]:
    """Launch the background monitoring scheduler if not already running."""
    global _background_task
    if _background_task is not None and not _background_task.done():
        logger.info("[MONITORING] Scheduler is already active.")
        return _background_task

    try:
        loop = asyncio.get_event_loop()
        _background_task = loop.create_task(monitoring_worker_loop(interval_seconds))
        return _background_task
    except RuntimeError:
        logger.warning("[MONITORING] No running event loop found to attach scheduler.")
        return None
