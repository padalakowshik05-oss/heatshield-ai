from typing import Dict, Any, Optional


def get_alert_level(risk_score: float) -> Dict[str, Any]:
    """
    Standardized mapping of HeatShield risk score to prototype alert tier.
    Thresholds:
      0 - 24: LOW (INFO)
      25 - 49: MODERATE (WATCH)
      50 - 74: HIGH (WARNING)
      75 - 100: EXTREME (CRITICAL)
    """
    score = round(float(risk_score), 1)
    
    if score >= 75.0:
        return {
            "level": "EXTREME",
            "label": "EMERGENCY",
            "status": "EXTREME HEAT EMERGENCY",
            "priority": "CRITICAL",
            "active": True,
            "color": "#ef4444",
            "dot": "🔴",
            "textColor": "text-red-400",
            "badgeBg": "bg-red-500/20 text-red-300 border-red-500/40",
            "threshold_rule": "Score ≥ 75",
        }
    elif score >= 50.0:
        return {
            "level": "HIGH",
            "label": "WARNING",
            "status": "HEAT WARNING",
            "priority": "WARNING",
            "active": True,
            "color": "#f97316",
            "dot": "🟠",
            "textColor": "text-orange-400",
            "badgeBg": "bg-orange-500/20 text-orange-300 border-orange-500/40",
            "threshold_rule": "50 ≤ Score < 75",
        }
    elif score >= 25.0:
        return {
            "level": "MODERATE",
            "label": "WATCH",
            "status": "HEAT WATCH",
            "priority": "WATCH",
            "active": True,
            "color": "#f59e0b",
            "dot": "🟡",
            "textColor": "text-amber-400",
            "badgeBg": "bg-amber-500/20 text-amber-300 border-amber-500/40",
            "threshold_rule": "25 ≤ Score < 50",
        }
    else:
        return {
            "level": "LOW",
            "label": "NORMAL",
            "status": "No active heat alert",
            "priority": "INFO",
            "active": False,
            "color": "#10b981",
            "dot": "🟢",
            "textColor": "text-emerald-400",
            "badgeBg": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            "threshold_rule": "Score < 25",
        }


def generate_heat_alert(
    current_risk_score: float,
    predicted_risk_score: float,
    area_name: str = "Tadepalligudem",
    weather: Optional[Dict[str, Any]] = None,
    thermal: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Intelligent alert generation combining current risk score (trigger >= 25)
    and 6-hour advance predicted risk score (trigger >= 50).
    Distinguishes active ongoing emergencies from advance warnings.
    """
    c_score = round(float(current_risk_score), 1)
    p_score = round(float(predicted_risk_score), 1)
    
    current_tier = get_alert_level(c_score)
    predicted_tier = get_alert_level(p_score)
    
    # 1. Current Extreme
    if c_score >= 75.0:
        return {
            "active": True,
            "level": "EXTREME",
            "priority": "CRITICAL",
            "title": "Extreme Heat Alert",
            "risk_score": c_score,
            "predicted_risk_score": p_score,
            "status_headline": "EXTREME HEAT EMERGENCY",
            "message": "Extreme heat-health risk is currently active. High thermal stress combined with population vulnerability requires immediate attention.",
            "trigger": "Current risk above extreme emergency threshold (≥ 75)",
            "timing": "Currently Active",
            "tier_info": current_tier,
        }
        
    # 2. Current High
    if c_score >= 50.0:
        if p_score >= 75.0:
            return {
                "active": True,
                "level": "HIGH",
                "priority": "CRITICAL",
                "title": "Heat Warning — Extreme Risk Expected",
                "risk_score": c_score,
                "predicted_risk_score": p_score,
                "status_headline": "EXTREME HEAT RISK EXPECTED",
                "message": "High heat-health risk detected currently, with extreme heat risk expected within 6 hours. Preemptive protection required.",
                "trigger": "Current risk High (≥ 50) and 6-hour forecast Extreme (≥ 75)",
                "timing": "Active Warning • Escalating within 6 Hours",
                "tier_info": current_tier,
            }
        return {
            "active": True,
            "level": "HIGH",
            "priority": "WARNING",
            "title": "Heat Warning",
            "risk_score": c_score,
            "predicted_risk_score": p_score,
            "status_headline": "HEAT WARNING IN EFFECT",
            "message": "High heat-health risk detected. Reduce prolonged outdoor exposure and increase hydration and cooling measures.",
            "trigger": "Current risk above high threshold (≥ 50)",
            "timing": "Currently Active",
            "tier_info": current_tier,
        }
        
    # 3. Current Moderate
    if c_score >= 25.0:
        if p_score >= 75.0:
            return {
                "active": True,
                "level": "MODERATE",
                "priority": "CRITICAL",
                "title": "Heat Watch — Extreme Risk Expected",
                "risk_score": c_score,
                "predicted_risk_score": p_score,
                "status_headline": "EXTREME HEAT EXPECTED (6H)",
                "message": "Moderate heat conditions currently, but extreme heat risk is expected within 6 hours as solar exposure and thermal stress surge.",
                "trigger": "Predicted 6-hour risk above extreme threshold (≥ 75)",
                "timing": "Expected within 6 Hours",
                "tier_info": current_tier,
            }
        elif p_score >= 50.0:
            return {
                "active": True,
                "level": "MODERATE",
                "priority": "WARNING",
                "title": "Heat Watch — Warning Expected",
                "risk_score": c_score,
                "predicted_risk_score": p_score,
                "status_headline": "HEAT WARNING EXPECTED (6H)",
                "message": "Moderate heat conditions currently, but a heat warning is expected within 6 hours as thermal stress increases.",
                "trigger": "Predicted 6-hour risk above high warning threshold (≥ 50)",
                "timing": "Expected within 6 Hours",
                "tier_info": current_tier,
            }
        return {
            "active": True,
            "level": "MODERATE",
            "priority": "WATCH",
            "title": "Heat Watch",
            "risk_score": c_score,
            "predicted_risk_score": p_score,
            "status_headline": "HEAT WATCH ACTIVE",
            "message": "Moderate heat-health risk detected. Monitor conditions and take basic heat-protection measures.",
            "trigger": "Current risk in moderate watch band (25–49)",
            "timing": "Currently Active",
            "tier_info": current_tier,
        }
        
    # 4. Current Low (< 25)
    if p_score >= 50.0:
        level = "HIGH" if p_score < 75.0 else "EXTREME"
        priority = "WARNING" if p_score < 75.0 else "CRITICAL"
        return {
            "active": True,
            "level": level,
            "priority": priority,
            "title": "Advance Heat Warning",
            "risk_score": c_score,
            "predicted_risk_score": p_score,
            "status_headline": "ADVANCE WARNING (6H SURGE)",
            "message": f"Conditions are currently mild ({c_score}/100), but significant heat risk ({p_score}/100) is expected within 6 hours.",
            "trigger": "Advance 6-hour prediction indicates daytime surge (≥ 50)",
            "timing": "Expected within 6 Hours",
            "tier_info": predicted_tier,
        }
        
    # 5. Routine / Low
    return {
        "active": False,
        "level": "LOW",
        "priority": "INFO",
        "title": "No Active Heat Alert",
        "risk_score": c_score,
        "predicted_risk_score": p_score,
        "status_headline": "ROUTINE CONDITIONS",
        "message": "Normal biometeorological conditions. Continue monitoring local weather bulletins.",
        "trigger": "Current and predicted risk below alert thresholds (< 25)",
        "timing": "Normal Baseline",
        "tier_info": current_tier,
    }
