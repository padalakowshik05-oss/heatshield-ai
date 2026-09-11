import pytest
from fastapi.testclient import TestClient
from main import app
from services.alert_state_service import (
    map_level_to_alert_state,
    evaluate_alert_transition,
    create_notification_object,
    add_alert_to_history,
    get_alert_history,
    mark_alert_as_read,
    mark_all_alerts_as_read,
    RISK_SCORE_CHANGE_THRESHOLD,
)

client = TestClient(app)


# 1. Alert state detection
def test_alert_state_canonical_mapping():
    assert map_level_to_alert_state("LOW") == "NO_ALERT"
    assert map_level_to_alert_state("MODERATE") == "HEAT_WATCH"
    assert map_level_to_alert_state("HIGH") == "HEAT_WARNING"
    assert map_level_to_alert_state("EXTREME") == "EXTREME_HEAT_EMERGENCY"
    assert map_level_to_alert_state("UNKNOWN") == "NO_ALERT"
    assert map_level_to_alert_state("") == "NO_ALERT"


# 2. Alert transitions (NO_ALERT -> WATCH -> WARNING -> EXTREME)
def test_alert_transitions_emission():
    area = "TransitionTestArea"
    
    # State 1: NO_ALERT
    s1 = {"alert_state": "NO_ALERT", "alert_level": "LOW", "risk_score": 18.0, "predicted_risk_score": 20.0, "priority": "INFO"}
    n1 = evaluate_alert_transition(area, None, s1)
    assert n1 is None  # Initial NO_ALERT does not emit notification

    # State 2: NO_ALERT -> HEAT_WATCH
    s2 = {"alert_state": "HEAT_WATCH", "alert_level": "MODERATE", "risk_score": 38.0, "predicted_risk_score": 40.0, "priority": "WATCH"}
    n2 = evaluate_alert_transition(area, s1, s2)
    assert n2 is not None
    assert n2["level"] == "MODERATE"
    assert n2["priority"] == "WATCH"
    assert "Heat Watch issued" in n2["message"]

    # State 3: HEAT_WATCH -> HEAT_WARNING
    s3 = {"alert_state": "HEAT_WARNING", "alert_level": "HIGH", "risk_score": 62.0, "predicted_risk_score": 65.0, "priority": "WARNING"}
    n3 = evaluate_alert_transition(area, s2, s3)
    assert n3 is not None
    assert n3["level"] == "HIGH"
    assert n3["priority"] == "WARNING"
    assert "Heat Warning issued" in n3["message"]

    # State 4: HEAT_WARNING -> EXTREME_HEAT_EMERGENCY
    s4 = {"alert_state": "EXTREME_HEAT_EMERGENCY", "alert_level": "EXTREME", "risk_score": 82.0, "predicted_risk_score": 84.0, "priority": "CRITICAL"}
    n4 = evaluate_alert_transition(area, s3, s4)
    assert n4 is not None
    assert n4["level"] == "EXTREME"
    assert n4["priority"] == "CRITICAL"
    assert "Extreme heat alert issued" in n4["message"]


# 3. Risk-change threshold (64 -> 65: no notify; 64 -> 71: notify)
def test_risk_score_change_threshold():
    area = "ThresholdTestArea"
    
    # Base state: High risk at 64.0
    prev_state = {
        "alert_state": "HEAT_WARNING",
        "alert_level": "HIGH",
        "risk_score": 64.0,
        "predicted_risk_score": 65.0,
        "priority": "WARNING",
    }
    
    # Sub-threshold shift: 64.0 -> 65.0 (+1.0 point, < 5.0 threshold)
    minor_state = {
        "alert_state": "HEAT_WARNING",
        "alert_level": "HIGH",
        "risk_score": 65.0,
        "predicted_risk_score": 65.0,
        "priority": "WARNING",
    }
    minor_notif = evaluate_alert_transition(area, prev_state, minor_state, threshold=5.0)
    assert minor_notif is None  # Suppressed because < 5.0

    # Meaningful shift: 64.0 -> 71.0 (+7.0 points, >= 5.0 threshold)
    major_state = {
        "alert_state": "HEAT_WARNING",
        "alert_level": "HIGH",
        "risk_score": 71.0,
        "predicted_risk_score": 71.0,
        "priority": "WARNING",
    }
    major_notif = evaluate_alert_transition(area, prev_state, major_state, threshold=5.0)
    assert major_notif is not None
    assert major_notif["type"] == "RISK_CHANGE"
    assert "Heat risk increased in ThresholdTestArea from 64 to 71" in major_notif["message"]


# 4. Duplicate prevention (86 -> 86 -> 86 -> 86 produces 1 notification, not 4)
def test_duplicate_prevention_identical_states():
    area = "DedupTestArea"
    
    s1 = {
        "alert_state": "EXTREME_HEAT_EMERGENCY",
        "alert_level": "EXTREME",
        "risk_score": 86.0,
        "predicted_risk_score": 86.0,
        "priority": "CRITICAL",
    }
    
    # First check generates initial notification
    n1 = evaluate_alert_transition(area, None, s1)
    assert n1 is not None
    
    # 2nd check identical -> None
    n2 = evaluate_alert_transition(area, s1, s1)
    assert n2 is None
    
    # 3rd check identical -> None
    n3 = evaluate_alert_transition(area, s1, s1)
    assert n3 is None
    
    # 4th check identical -> None
    n4 = evaluate_alert_transition(area, s1, s1)
    assert n4 is None


# 5. Prediction-based early warning alert
def test_prediction_based_early_warning_alert():
    area = "PredEarlyWarningArea"
    
    # Moderate current (38.0) but predicted High (62.0)
    prev = {
        "alert_state": "HEAT_WATCH",
        "alert_level": "MODERATE",
        "risk_score": 38.0,
        "predicted_risk_score": 42.0,  # was previously moderate
        "priority": "WATCH",
    }
    curr = {
        "alert_state": "HEAT_WATCH",
        "alert_level": "MODERATE",
        "risk_score": 39.0,            # still moderate (< 5 point change)
        "predicted_risk_score": 62.0,  # surged to HIGH (>= 50)
        "priority": "WATCH",
    }
    
    pred_notif = evaluate_alert_transition(area, prev, curr)
    assert pred_notif is not None
    assert "Heat Warning Expected" in pred_notif["title"]
    assert "High heat risk is expected" in pred_notif["message"]


# 6. Alert history retrieval and structure
def test_alert_history_retrieval():
    area = "HistoryTestArea"
    n1 = create_notification_object(area, "HIGH", "WARNING", "Warning 1", "Message 1", 65.0)
    add_alert_to_history(area, n1)
    
    history = get_alert_history(area)
    assert len(history) >= 1
    item = history[0]
    assert item["area"] == area
    assert "id" in item
    assert "title" in item
    assert "level" in item
    assert "risk_score" in item
    assert "timestamp" in item
    assert "read" in item
    assert item["read"] is False


# 7. Mark alert as read
def test_mark_alert_as_read():
    area = "ReadTestArea"
    notif = create_notification_object(area, "EXTREME", "CRITICAL", "Extreme Alert", "Danger", 88.0)
    add_alert_to_history(area, notif)
    alert_id = notif["id"]
    
    # Verify initial unread
    assert notif["read"] is False
    
    # Mark as read
    success = mark_alert_as_read(alert_id)
    assert success is True
    
    # Verify updated
    history = get_alert_history(area)
    found = next((x for x in history if x["id"] == alert_id), None)
    assert found is not None
    assert found["read"] is True


# 8. Unknown alert ID returns 404 in API
def test_api_mark_unknown_alert_returns_404():
    response = client.post("/alerts/non-existent-alert-id-99999/read")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


# 9. Multiple areas maintain isolated alert histories
def test_multiple_areas_isolation():
    area_a = "AreaAlpha"
    area_b = "AreaBeta"
    
    na = create_notification_object(area_a, "HIGH", "WARNING", "Alpha Alert", "Msg A", 60.0)
    nb = create_notification_object(area_b, "EXTREME", "CRITICAL", "Beta Alert", "Msg B", 90.0)
    
    add_alert_to_history(area_a, na)
    add_alert_to_history(area_b, nb)
    
    hist_a = get_alert_history(area_a)
    hist_b = get_alert_history(area_b)
    
    assert any(x["id"] == na["id"] for x in hist_a)
    assert not any(x["id"] == nb["id"] for x in hist_a)
    assert any(x["id"] == nb["id"] for x in hist_b)
    assert not any(x["id"] == na["id"] for x in hist_b)


# 10. API Endpoints testing: GET /alerts/status/{area_name} and GET /alerts/history/{area_name}
def test_api_status_and_history_endpoints():
    # 1. Test status endpoint for known area
    res_status = client.get("/alerts/status/Tadepalligudem")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["area"] == "Tadepalligudem"
    assert "alert_state" in status_data
    assert status_data["alert_state"] in ["NO_ALERT", "HEAT_WATCH", "HEAT_WARNING", "EXTREME_HEAT_EMERGENCY"]
    assert "risk_score" in status_data
    assert "predicted_risk_score" in status_data
    assert "timestamp" in status_data

    # 2. Test status endpoint for unknown area returns 404
    res_unknown = client.get("/alerts/status/NonExistentLocation")
    assert res_unknown.status_code == 404

    # 3. Test history endpoint for known area
    res_hist = client.get("/alerts/history/Tadepalligudem")
    assert res_hist.status_code == 200
    hist_data = res_hist.json()
    assert hist_data["area"] == "Tadepalligudem"
    assert "alerts" in hist_data
    assert isinstance(hist_data["alerts"], list)
    assert len(hist_data["alerts"]) > 0

    # 4. Test mark as read endpoint on real seeded alert
    alert_to_mark = hist_data["alerts"][0]
    alert_id = alert_to_mark["id"]
    res_read = client.post(f"/alerts/{alert_id}/read")
    assert res_read.status_code == 200
    assert res_read.json()["success"] is True
    assert res_read.json()["read"] is True

    # 5. Test mark all as read
    res_read_all = client.post("/alerts/history/Tadepalligudem/read-all")
    assert res_read_all.status_code == 200
    assert res_read_all.json()["success"] is True
