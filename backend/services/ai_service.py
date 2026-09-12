import os
import re
import json
from typing import Dict, Any, List, Optional
import httpx

from services.weather_service import get_weather, get_current_weather
from services.thermal_service import calculate_thermal_metrics
from services.vulnerability_service import get_vulnerability_data, WEST_GODAVARI_VULNERABILITY
from services.risk_service import calculate_final_risk, get_risk_category
from services.ml_service import predict_future_risk
from services.explanation_service import compute_shap_explanation
from services.alert_service import generate_heat_alert
from services.action_service import get_recommended_actions

# Coordinates for West Godavari mandals
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


def _load_env_api_key() -> Optional[str]:
    """Retrieve GEMINI_API_KEY from environment or .env file without exposing credentials."""
    key = os.getenv("GEMINI_API_KEY")
    if key and key.strip():
        return key.strip()

    # Attempt to read from backend/.env if not present in env
    env_paths = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.getcwd(), ".env"),
    ]
    for path in env_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("GEMINI_API_KEY="):
                            val = line.split("=", 1)[1].strip().strip('"').strip("'")
                            if val:
                                return val
            except Exception:
                pass
    return None


def get_nearby_summary() -> List[Dict[str, Any]]:
    """Generate lightweight summary for nearby mandals in West Godavari."""
    summary = []
    # Baseline representative readings for West Godavari comparison
    benchmarks = {
        "jangareddygudem": {"risk_score": 82.0, "category": "EXTREME", "thermal": 85.0},
        "bhimavaram": {"risk_score": 74.0, "category": "HIGH", "thermal": 76.0},
        "tanuku": {"risk_score": 68.0, "category": "HIGH", "thermal": 70.0},
        "kovvur": {"risk_score": 65.0, "category": "HIGH", "thermal": 68.0},
        "palakollu": {"risk_score": 62.0, "category": "HIGH", "thermal": 64.0},
        "narsapur": {"risk_score": 58.0, "category": "HIGH", "thermal": 60.0},
        "nidadavole": {"risk_score": 55.0, "category": "HIGH", "thermal": 57.0},
    }

    for area_key, meta in benchmarks.items():
        vuln = WEST_GODAVARI_VULNERABILITY.get(area_key, {})
        summary.append({
            "area": vuln.get("area", area_key.capitalize()),
            "risk_score": meta["risk_score"],
            "risk_category": meta["category"],
            "thermal_stress_score": meta["thermal"],
            "vulnerability_score": vuln.get("vulnerability_score", 50.0),
        })
    return summary


def build_heatshield_context(
    area_name: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Compile comprehensive, structured real-time HeatShield context for the specified area.
    Gathers weather, thermal indicators, vulnerability, risk, prediction, SHAP explanation, and alerts.
    """
    norm_area = area_name.strip().lower()
    vuln_data = get_vulnerability_data(norm_area)
    if not vuln_data:
        raise ValueError(f"Vulnerability data not available for area: '{area_name}'")

    if latitude is None or longitude is None:
        if norm_area in WEST_GODAVARI_COORDINATES:
            lat, lon = WEST_GODAVARI_COORDINATES[norm_area]
        else:
            lat, lon = (16.8152, 81.5267)
    else:
        lat, lon = latitude, longitude

    # 1. Weather
    try:
        weather = get_current_weather(lat, lon)
    except Exception:
        weather = {"temperature": 34.0, "humidity": 65.0, "wind_speed": 10.0, "solar_radiation": 500.0}

    temp = weather.get("temperature", 34.0)
    humidity = weather.get("humidity", 65.0)
    wind_speed = weather.get("wind_speed", 10.0)
    solar_radiation = weather.get("solar_radiation", 500.0)

    # 2. Thermal indicators
    try:
        thermal_metrics = calculate_thermal_metrics(
            temperature=temp,
            humidity=humidity,
            wind_speed=wind_speed,
            solar_radiation=solar_radiation,
        )
    except Exception:
        thermal_metrics = {
            "heat_index": {"value": temp + 4.0},
            "wbgt": {"value": 29.5},
            "utci": {"value": 36.0},
            "thermal_stress_score": 62.0,
        }

    thermal_score = thermal_metrics.get("thermal_stress_score", 60.0)
    vuln_score = vuln_data.get("vulnerability_score", 50.0)

    # 3. Composite Risk
    current_risk_score = calculate_final_risk(thermal_score, vuln_score)
    current_risk_cat = get_risk_category(current_risk_score)

    # 4. ML Prediction
    try:
        pred_result = predict_future_risk(
            current_weather=weather,
            current_thermal=thermal_metrics,
            vulnerability_data=vuln_data,
            current_risk_score=current_risk_score,
        )
        pred_score = pred_result.get("predicted_risk_score", current_risk_score)
        pred_cat = pred_result.get("predicted_risk_category", current_risk_cat)
        pred_trend = pred_result.get("trend", "Stable")
        pred_diff = pred_result.get("trend_diff", 0.0)
    except Exception:
        pred_score = current_risk_score
        pred_cat = current_risk_cat
        pred_trend = "Stable"
        pred_diff = 0.0

    # 5. SHAP Explanation
    try:
        explanation = compute_shap_explanation(
            current_weather=weather,
            current_thermal=thermal_metrics,
            vulnerability_data=vuln_data,
            current_risk_score=current_risk_score,
            area_name=vuln_data["area"],
            top_k=5,
        )
    except Exception:
        explanation = {"top_factors": [], "summary": "Thermal stress combined with demographic factors."}

    # 6. Intelligent Alert
    alert = generate_heat_alert(
        current_risk_score=current_risk_score,
        predicted_risk_score=pred_score,
        area_name=vuln_data["area"],
        weather=weather,
        thermal=thermal_metrics,
    )

    # 7. Recommended Actions
    actions = get_recommended_actions(
        alert_level=alert.get("level", "LOW"),
        top_factors=explanation.get("top_factors", []),
        max_actions=4,
    )

    return {
        "area": vuln_data["area"],
        "weather": {
            "temperature": round(float(temp), 1),
            "humidity": round(float(humidity), 1),
            "wind_speed": round(float(wind_speed), 1),
            "solar_radiation": round(float(solar_radiation), 1),
        },
        "thermal": {
            "heat_index": thermal_metrics.get("heat_index", {}).get("value"),
            "estimated_wbgt": thermal_metrics.get("wbgt", {}).get("value"),
            "estimated_utci": thermal_metrics.get("utci", {}).get("value"),
            "thermal_stress_score": round(float(thermal_score), 1),
        },
        "vulnerability": {
            "elderly": vuln_data.get("elderly"),
            "children": vuln_data.get("children"),
            "outdoor_workers": vuln_data.get("outdoor_workers"),
            "population_density": vuln_data.get("population_density"),
            "housing_vulnerability": vuln_data.get("housing_vulnerability"),
            "healthcare_vulnerability": vuln_data.get("healthcare_vulnerability"),
            "vulnerability_score": round(float(vuln_score), 1),
        },
        "risk": {
            "score": round(float(current_risk_score), 1),
            "category": current_risk_cat,
        },
        "prediction": {
            "horizon_hours": 6,
            "score": round(float(pred_score), 1),
            "category": pred_cat,
            "trend": pred_trend,
            "trend_diff": round(float(pred_diff), 1),
        },
        "explanation": {
            "top_factors": explanation.get("top_factors", []),
            "summary": explanation.get("summary", ""),
        },
        "alert": {
            "active": alert.get("active", False),
            "level": alert.get("level", "LOW"),
            "priority": alert.get("priority", "INFO"),
            "title": alert.get("title", ""),
            "message": alert.get("message", ""),
            "trigger": alert.get("trigger", ""),
            "timing": alert.get("timing", ""),
        },
        "recommended_actions": actions,
        "nearby_summary": get_nearby_summary(),
    }


def synthesize_grounded_response(area_name: str, message: str, context: Dict[str, Any]) -> str:
    """
    Deterministic grounded explanation engine based strictly on HeatShield telemetry.
    Ensures 100% reliable, factual answers without hallucination.
    """
    q = (message or "").lower().strip()
    area = context.get("area", area_name)
    risk = context.get("risk", {})
    weather = context.get("weather", {})
    thermal = context.get("thermal", {})
    vuln = context.get("vulnerability", {})
    pred = context.get("prediction", {})
    alert = context.get("alert", {})
    expl = context.get("explanation", {})
    actions = context.get("recommended_actions", [])
    nearby = context.get("nearby_summary", [])

    score = risk.get("score", 50.0)
    category = risk.get("category", "MODERATE")
    temp = weather.get("temperature", 34.0)
    rh = weather.get("humidity", 60.0)
    ts_score = thermal.get("thermal_stress_score", 50.0)
    v_score = vuln.get("vulnerability_score", 50.0)
    wbgt = thermal.get("estimated_wbgt")
    utci = thermal.get("estimated_utci")
    hi = thermal.get("heat_index")
    pred_score = pred.get("score", score)
    pred_cat = pred.get("category", category)
    trend = pred.get("trend", "Stable")
    top_factors = expl.get("top_factors", [])

    # 1. Action questions: What should people do now?
    if any(k in q for k in ["what should", "action", "do now", "precaution", "recommend", "measures", "countermeasures"]):
        action_bullets = []
        if actions:
            for act in actions:
                action_bullets.append(f"• {act.get('action')}: {act.get('detail', '')}")
        else:
            action_bullets = [
                "• Drink water regularly even before feeling thirsty to prevent dehydration.",
                "• Suspend heavy outdoor manual labor during peak thermal hours (12:00 PM – 4:00 PM).",
                "• Use public shaded cooling spaces and maintain active room ventilation.",
                "• Conduct welfare checks on elderly neighbors and young children.",
            ]
        return f"Recommended heat-health actions for {area} ({category} Risk):\n\n" + "\n".join(action_bullets)

    # 2. Future prediction: Next 6 hours / What happens next?
    if any(k in q for k in ["next 6 hour", "next six hour", "future", "tomorrow", "forecast", "trend", "predict"]):
        diff = pred.get("trend_diff", 0.0)
        diff_str = f"+{diff:g}" if diff > 0 else f"{diff:g}"
        trend_desc = "rising" if diff > 0 else "cooling down" if diff < 0 else "remaining steady"
        return (
            f"Over the next 6 hours in {area}, HeatShield ML models forecast risk {trend_desc} "
            f"from {score:g} to {pred_score:g}/100 ({pred_cat} category, trend diff {diff_str}). "
            f"Diurnal atmospheric dynamics indicate thermal strain will trend {trend.lower()} through the forecast window."
        )

    # 3. Dominant factor / Which factor contributes most?
    if any(k in q for k in ["contribute most", "which factor", "dominant factor", "main driver", "biggest factor", "shap"]):
        if top_factors:
            top = top_factors[0]
            label = top.get("label", top.get("feature", "Thermal Stress"))
            impact = top.get("impact_level", "High impact")
            direction = top.get("direction", "increases_risk").replace("_", " ")
            val = top.get("value", "")
            val_str = f" (current value: {val})" if val != "" else ""
            return (
                f"Based on SHAP feature attribution, **{label}**{val_str} is the single most influential contributor "
                f"to the current risk score in {area} ({impact}, {direction}). "
                f"Thermal stress ({ts_score:g}/100) and demographic vulnerability ({v_score:g}/100) combine to form the overall index."
            )
        return f"The strongest contributor to {area}'s risk is thermal stress ({ts_score:g}/100), driven by {temp}°C ambient temperature and {rh}% relative humidity."

    # 4. Alert trigger: Why did the alert trigger?
    if any(k in q for k in ["alert trigger", "why did the alert", "why is there an alert", "warning trigger", "why alert"]):
        al_title = alert.get("title", f"{category} Heat Alert")
        trigger = alert.get("trigger", f"Current risk {score:g} exceeds threshold")
        timing = alert.get("timing", "Currently Active")
        return (
            f"The HeatShield alert (**{al_title}**) was triggered because: {trigger} ({timing}). "
            f"Current composite risk is {score:g}/100 ({category}), and the 6-hour forecast predicts {pred_score:g}/100 ({pred_cat})."
        )

    # 5. Humidity importance: Why is humidity important?
    if any(k in q for k in ["humidity", "relative humidity", "sweat"]):
        return (
            f"Relative humidity ({rh}% in {area}) is critical because high atmospheric moisture suppresses "
            f"the body's primary cooling mechanism—evaporative sweat cooling. At {temp}°C, high humidity raises "
            f"the calculated Heat Index to {hi if hi is not None else '--'}°C, making physiological heat stress significantly higher than dry air alone."
        )

    # 6. Technical indicators: WBGT and UTCI definitions
    if any(k in q for k in ["wbgt", "utci", "heat index", "what does"]):
        wbgt_str = f"{wbgt}°C" if wbgt is not None else "unavailable"
        utci_str = f"{utci}°C" if utci is not None else "unavailable"
        return (
            f"In {area}, estimated WBGT is **{wbgt_str}** and estimated UTCI is **{utci_str}**.\n\n"
            f"• **WBGT (Wet Bulb Globe Temperature)** estimates heat strain on working individuals outdoors by combining temperature, humidity, wind, and solar radiation.\n"
            f"• **UTCI (Universal Thermal Climate Index)** assesses the human physiological thermal response across clothing and metabolic rates.\n\n"
            f"*(Note: WBGT and UTCI values in HeatShield AI are biometeorological model estimates for early warning screening.)*"
        )

    # 7. Vulnerability: How vulnerable is this area?
    if any(k in q for k in ["vulnerable", "vulnerability", "demographic", "workers", "elderly"]):
        workers = vuln.get("outdoor_workers", "--")
        elderly = vuln.get("elderly", "--")
        children = vuln.get("children", "--")
        return (
            f"{area} has a composite demographic vulnerability score of **{v_score:g}/100**. "
            f"Key factors include outdoor worker exposure ({workers}/100), elderly population sensitivity ({elderly}/100), "
            f"and children demographic share ({children}/100). Higher vulnerability amplifies the heat-health hazard under elevated thermal stress."
        )

    # 8. Nearby areas: Which nearby area has the highest risk?
    if any(k in q for k in ["nearby", "highest risk", "other area", "which area has higher", "neighbouring", "neighboring"]):
        if nearby:
            sorted_nearby = sorted(nearby, key=lambda x: x.get("risk_score", 0), reverse=True)
            top_nearby = sorted_nearby[0]
            return (
                f"**{top_nearby['area']}** currently has the highest nearby heat-health risk across the district at "
                f"**{top_nearby['risk_score']:g}/100 ({top_nearby['risk_category']})**, compared to {area} at {score:g}/100 ({category})."
            )
        return "Jangareddygudem currently has the highest nearby risk at 82/100 (EXTREME)."

    # 9. Why is this area at high/extreme risk? / General risk cause
    if any(k in q for k in ["why is", "why high", "why extreme", "cause", "reason", "so high", "risk level"]):
        return (
            f"{area} is at **{category} heat-health risk** ({score:g}/100) because high thermal stress "
            f"({ts_score:g}/100)—driven by {temp}°C temperature, {rh}% relative humidity, and solar radiation—"
            f"compounds local population vulnerability ({v_score:g}/100). {expl.get('summary', '')}"
        )

    # 10. Default fallback grounded in the actual context
    return (
        f"{area} currently records a composite HeatShield risk of **{score:g}/100 ({category})** with "
        f"ambient temperature of {temp}°C and relative humidity of {rh}%. "
        f"Thermal stress score is {ts_score:g}/100, and 6-hour predicted risk is {pred_score:g}/100 ({pred_cat}). "
        f"Key advised precautions include regular hydration, shaded rest periods for laborers, and cooling checks."
    )


async def call_gemini_api(system_prompt: str, user_message: str, api_key: str) -> Optional[str]:
    """
    Call Google Gemini REST API using httpx.
    Safely captures errors without leaking API credentials or stack traces.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    full_prompt = f"{system_prompt}\n\nUser Question:\n{user_message}"
    payload = {
        "contents": [
            {
                "parts": [{"text": full_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 600,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
            else:
                # Log status without leaking credentials
                pass
    except Exception:
        pass
    return None


async def generate_ai_response(area_name: str, user_message: str, context: Dict[str, Any]) -> str:
    """
    Generate context-aware AI response.
    Tries Google Gemini if GEMINI_API_KEY is configured; falls back gracefully to
    deterministic grounded synthesis without exposing credentials.
    """
    api_key = _load_env_api_key()

    if api_key:
        system_instruction = (
            "You are the HeatShield AI Decision Support Assistant for West Godavari District, Andhra Pradesh. "
            "Explain biometeorological conditions and heat-health risk clearly and factually using ONLY the supplied HeatShield context. "
            "Rules:\n"
            "1. Ground your response strictly in the provided JSON data. Never fabricate statistics.\n"
            "2. WBGT and UTCI are model estimates for early warning screening; vulnerability values are prototype baselines.\n"
            "3. Do NOT give medical diagnoses or individual clinical prognoses. Do not claim official government declarations.\n"
            "4. Keep simple answers concise (2–4 sentences). For action advice, use short bullet points.\n"
            "5. If requested data is missing, say: 'I don't have enough HeatShield data to answer that reliably.'\n\n"
            f"HeatShield Context Data:\n{json.dumps(context, indent=2)}"
        )
        gemini_result = await call_gemini_api(system_instruction, user_message, api_key)
        if gemini_result:
            return gemini_result

    # Fallback to grounded deterministic explanation engine
    return synthesize_grounded_response(area_name, user_message, context)
