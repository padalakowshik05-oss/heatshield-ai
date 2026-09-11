import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from services.alert_service import get_alert_level


# 1. Deterministic Alert State Mapping
ALERT_STATE_MAPPING: Dict[str, str] = {
    "LOW": "NO_ALERT",
    "MODERATE": "HEAT_WATCH",
    "HIGH": "HEAT_WARNING",
    "EXTREME": "EXTREME_HEAT_EMERGENCY",
}

ALERT_STATE_DISPLAY: Dict[str, Dict[str, Any]] = {
    "NO_ALERT": {
        "title": "No Active Heat Alert",
        "icon": "🟢",
        "priority": "INFO",
        "badgeBg": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    },
    "HEAT_WATCH": {
        "title": "Heat Watch",
        "icon": "🟡",
        "priority": "WATCH",
        "badgeBg": "bg-amber-500/20 text-amber-300 border-amber-500/40",
    },
    "HEAT_WARNING": {
        "title": "Heat Warning",
        "icon": "🟠",
        "priority": "WARNING",
        "badgeBg": "bg-orange-500/20 text-orange-300 border-orange-500/40",
    },
    "EXTREME_HEAT_EMERGENCY": {
        "title": "Extreme Heat Alert",
        "icon": "🔴",
        "priority": "CRITICAL",
        "badgeBg": "bg-red-500/20 text-red-300 border-red-500/40",
    },
}

# Configurable prototype setting for risk score change notification
RISK_SCORE_CHANGE_THRESHOLD = 5.0


def map_level_to_alert_state(alert_level: str) -> str:
    """Map alert level string (LOW, MODERATE, HIGH, EXTREME) to canonical alert state."""
    level = alert_level.strip().upper() if alert_level else "LOW"
    return ALERT_STATE_MAPPING.get(level, "NO_ALERT")


# 2. In-Memory Alert History Store
# Structure: { normalized_area_name: [ alert_object, ... ] }
_ALERT_HISTORY: Dict[str, List[Dict[str, Any]]] = {}
# Flat lookup index: { alert_id: alert_object }
_ALERT_LOOKUP: Dict[str, Dict[str, Any]] = {}


def _format_timestamp(dt: Optional[datetime] = None) -> str:
    """Format UTC datetime into standardized ISO-8601 string."""
    if dt is None:
        dt = datetime.now(timezone.utc)
    return dt.isoformat()


def create_notification_object(
    area: str,
    level: str,
    priority: str,
    title: str,
    message: str,
    risk_score: float,
    alert_type: str = "ALERT",
    read: bool = False,
    timestamp: Optional[str] = None,
    alert_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a standardized notification object conforming to Step 7 requirements."""
    uid = alert_id or f"alert-{uuid.uuid4().hex[:8]}"
    ts = timestamp or _format_timestamp()
    
    return {
        "id": uid,
        "area": area,
        "type": alert_type,
        "level": level.upper(),
        "priority": priority.upper(),
        "title": title,
        "message": message,
        "risk_score": round(float(risk_score), 1),
        "timestamp": ts,
        "read": bool(read),
    }


def seed_initial_history() -> None:
    """
    Seed realistic initial alert history for demonstration areas
    so the Alert History tab displays meaningful past records (e.g. today & yesterday).
    """
    now = datetime.now(timezone.utc)
    
    seeds = [
        {
            "area": "Tadepalligudem",
            "level": "EXTREME",
            "priority": "CRITICAL",
            "title": "Extreme Heat Alert",
            "message": "Extreme heat-health risk detected. High thermal stress combined with population vulnerability requires immediate attention.",
            "risk_score": 86.0,
            "read": False,
            "dt": now - timedelta(hours=2, minutes=15),
        },
        {
            "area": "Tadepalligudem",
            "level": "HIGH",
            "priority": "WARNING",
            "title": "Heat Warning",
            "message": "High heat-health risk detected. Reduce prolonged outdoor exposure and increase hydration and cooling measures.",
            "risk_score": 71.0,
            "read": True,
            "dt": now - timedelta(hours=4, minutes=45),
        },
        {
            "area": "Tadepalligudem",
            "level": "MODERATE",
            "priority": "WATCH",
            "title": "Heat Watch",
            "message": "Moderate heat-health risk detected. Monitor conditions and take basic heat-protection measures.",
            "risk_score": 48.0,
            "read": True,
            "dt": now - timedelta(days=1, hours=3),
        },
        {
            "area": "Bhimavaram",
            "level": "HIGH",
            "priority": "WARNING",
            "title": "Heat Warning",
            "message": "High heat-health risk detected in Bhimavaram.",
            "risk_score": 74.0,
            "read": False,
            "dt": now - timedelta(hours=1, minutes=30),
        },
        {
            "area": "Tanuku",
            "level": "HIGH",
            "priority": "WARNING",
            "title": "Heat Warning",
            "message": "High heat-health risk detected in Tanuku.",
            "risk_score": 68.0,
            "read": True,
            "dt": now - timedelta(hours=3, minutes=10),
        },
    ]

    for s in seeds:
        norm = s["area"].strip().lower()
        notif = create_notification_object(
            area=s["area"],
            level=s["level"],
            priority=s["priority"],
            title=s["title"],
            message=s["message"],
            risk_score=s["risk_score"],
            read=s["read"],
            timestamp=_format_timestamp(s["dt"]),
        )
        if norm not in _ALERT_HISTORY:
            _ALERT_HISTORY[norm] = []
        _ALERT_HISTORY[norm].append(notif)
        _ALERT_LOOKUP[notif["id"]] = notif


# Initialize seeds on module import
seed_initial_history()


def get_alert_history(area_name: str) -> List[Dict[str, Any]]:
    """Retrieve in-memory alert history for an area, sorted newest first."""
    norm = area_name.strip().lower()
    history = _ALERT_HISTORY.get(norm, [])
    return sorted(history, key=lambda x: x.get("timestamp", ""), reverse=True)


def add_alert_to_history(area_name: str, alert_obj: Dict[str, Any]) -> Dict[str, Any]:
    """Add a new alert notification to the in-memory history."""
    norm = area_name.strip().lower()
    if norm not in _ALERT_HISTORY:
        _ALERT_HISTORY[norm] = []
        
    _ALERT_HISTORY[norm].insert(0, alert_obj)
    _ALERT_LOOKUP[alert_obj["id"]] = alert_obj
    return alert_obj


def mark_alert_as_read(alert_id: str) -> bool:
    """
    Mark an alert as read by ID.
    Returns True if found and updated, False if unknown alert_id.
    """
    if alert_id in _ALERT_LOOKUP:
        _ALERT_LOOKUP[alert_id]["read"] = True
        return True
    return False


def mark_all_alerts_as_read(area_name: str) -> int:
    """Mark all alerts for a given area as read. Returns count of modified alerts."""
    norm = area_name.strip().lower()
    count = 0
    if norm in _ALERT_HISTORY:
        for a in _ALERT_HISTORY[norm]:
            if not a.get("read", False):
                a["read"] = True
                count += 1
    return count


# 3. State Transition & Change Detection Engine
def evaluate_alert_transition(
    area: str,
    prev_state: Optional[Dict[str, Any]],
    current_state: Dict[str, Any],
    threshold: float = RISK_SCORE_CHANGE_THRESHOLD,
) -> Optional[Dict[str, Any]]:
    """
    Deterministically evaluate if an alert or notification should be generated.
    Returns notification object if a meaningful change occurred, None otherwise.
    """
    c_alert_state = current_state.get("alert_state", "NO_ALERT")
    c_risk = round(float(current_state.get("risk_score", 0.0)), 1)
    c_pred = round(float(current_state.get("predicted_risk_score", c_risk)), 1)
    c_level = current_state.get("alert_level", "LOW")
    c_prio = current_state.get("priority", "INFO")
    
    # 1. First evaluation for this area
    if prev_state is None:
        if c_alert_state != "NO_ALERT":
            title = ALERT_STATE_DISPLAY.get(c_alert_state, {}).get("title", f"{c_level} Alert")
            msg = f"{c_level.capitalize()} heat alert is currently active for {area} (Risk: {c_risk}/100)."
            notif = create_notification_object(
                area=area,
                level=c_level,
                priority=c_prio,
                title=title,
                message=msg,
                risk_score=c_risk,
            )
            return add_alert_to_history(area, notif)
        return None

    p_alert_state = prev_state.get("alert_state", "NO_ALERT")
    p_risk = round(float(prev_state.get("risk_score", 0.0)), 1)
    p_pred = round(float(prev_state.get("predicted_risk_score", p_risk)), 1)

    # 2. Transition between alert states
    if c_alert_state != p_alert_state:
        if c_alert_state == "EXTREME_HEAT_EMERGENCY":
            title = "Extreme Heat Alert"
            msg = f"Extreme heat alert issued for {area} (Risk: {c_risk}/100)."
            prio = "CRITICAL"
        elif c_alert_state == "HEAT_WARNING":
            title = "Heat Warning"
            msg = f"Heat Warning issued for {area} (Risk: {c_risk}/100)."
            prio = "WARNING"
        elif c_alert_state == "HEAT_WATCH":
            title = "Heat Watch"
            msg = f"Heat Watch issued for {area} (Risk: {c_risk}/100)."
            prio = "WATCH"
        else:
            title = "Conditions Normalized"
            msg = f"Heat alert for {area} has subsided to normal baseline levels (Risk: {c_risk}/100)."
            prio = "INFO"

        notif = create_notification_object(
            area=area,
            level=c_level,
            priority=prio,
            title=title,
            message=msg,
            risk_score=c_risk,
        )
        return add_alert_to_history(area, notif)

    # 3. Check for Prediction-Based Early Warning Surge
    # Current MODERATE (25-49) and predicted HIGH (50-74)
    if 25.0 <= c_risk < 50.0 and 50.0 <= c_pred < 75.0:
        if not (50.0 <= p_pred < 75.0):
            notif = create_notification_object(
                area=area,
                level="HIGH",
                priority="WARNING",
                title="Heat Warning Expected (6H)",
                message=f"High heat risk is expected in {area} within 6 hours (Forecast: {c_pred}/100).",
                risk_score=c_risk,
            )
            return add_alert_to_history(area, notif)

    # Current HIGH (50-74) and predicted EXTREME (>= 75)
    if 50.0 <= c_risk < 75.0 and c_pred >= 75.0:
        if p_pred < 75.0:
            notif = create_notification_object(
                area=area,
                level="EXTREME",
                priority="CRITICAL",
                title="Extreme Heat Expected (6H)",
                message=f"Extreme heat risk is expected in {area} within 6 hours (Forecast: {c_pred}/100).",
                risk_score=c_risk,
            )
            return add_alert_to_history(area, notif)

    # 4. Same state: Check for meaningful risk score shift (>= threshold points)
    delta = c_risk - p_risk
    if abs(delta) >= threshold:
        direction = "increased" if delta > 0 else "decreased"
        title = f"Heat Risk {direction.capitalize()}"
        msg = f"Heat risk {direction} in {area} from {p_risk:g} to {c_risk:g}."
        prio = c_prio
        notif = create_notification_object(
            area=area,
            level=c_level,
            priority=prio,
            title=title,
            message=msg,
            risk_score=c_risk,
            alert_type="RISK_CHANGE",
        )
        return add_alert_to_history(area, notif)

    # 5. Duplicate state with insignificant change -> Suppress
    return None
