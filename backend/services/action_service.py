from typing import List, Dict, Any, Optional


def get_recommended_actions(
    alert_level: str,
    top_factors: Optional[List[Dict[str, Any]]] = None,
    max_actions: int = 4,
) -> List[Dict[str, Any]]:
    """
    Synthesize 3 to 5 targeted public-health action directives combining
    risk tier baselines with factor-specific interventions derived from SHAP drivers.
    """
    level = alert_level.upper() if alert_level else "LOW"
    top_factors = top_factors or []
    
    actions = []
    seen_categories = set()
    
    # 1. Factor-specific targeted additions based on dominant SHAP contributors
    top_feature_names = [f.get("feature", "") for f in top_factors[:3]]
    
    for f in top_factors[:3]:
        fname = f.get("feature", "")
        
        # Outdoor Workers
        if "outdoor_workers" in fname and "workers" not in seen_categories:
            actions.append({
                "icon": "👷",
                "action": "Reduce outdoor work during peak heat",
                "detail": "Suspend heavy manual labor between 12:00 PM and 4:00 PM and mandate shaded rest breaks.",
                "category": "workers",
                "driver": "Outdoor Worker Exposure",
            })
            seen_categories.add("workers")
            
        # Elderly citizens
        elif "elderly" in fname and "elderly" not in seen_categories:
            actions.append({
                "icon": "👴",
                "action": "Check on elderly residents and ensure cooling access",
                "detail": "Conduct welfare checks on senior citizens living alone and verify active ventilation.",
                "category": "elderly",
                "driver": "Elderly Demographic Sensitivity",
            })
            seen_categories.add("elderly")
            
        # Humidity
        elif "humidity" in fname and "hydration" not in seen_categories:
            actions.append({
                "icon": "💧",
                "action": "Increase hydration and electrolyte intake",
                "detail": "High atmospheric humidity impairs sweat evaporation; consume water with oral rehydration salts.",
                "category": "hydration",
                "driver": "High Relative Humidity",
            })
            seen_categories.add("hydration")
            
        # Solar radiation
        elif "solar_radiation" in fname and "shade" not in seen_categories:
            actions.append({
                "icon": "☀️",
                "action": "Provide shade and reduce direct solar exposure",
                "detail": "Deploy temporary canopies at transit stops and open shaded community relief points.",
                "category": "shade",
                "driver": "Intense Solar Radiation",
            })
            seen_categories.add("shade")
            
        # Ambient temperature
        elif "temperature" in fname and "exposure" not in seen_categories and level in ["HIGH", "EXTREME"]:
            actions.append({
                "icon": "🌡️",
                "action": "Limit prolonged exposure during peak temperatures",
                "detail": "Stay indoors in well-ventilated spaces during peak afternoon thermal maximums.",
                "category": "exposure",
                "driver": "Extreme Ambient Heat",
            })
            seen_categories.add("exposure")
            
    # 2. Tier-specific baseline additions to ensure comprehensive coverage (up to max_actions)
    tier_baselines = {
        "EXTREME": [
            {
                "icon": "🚰",
                "action": "Increase water availability",
                "detail": "Mobilize emergency drinking water tankers and public hydration kiosks.",
                "category": "hydration",
            },
            {
                "icon": "🧊",
                "action": "Activate cooling centers",
                "detail": "Open air-conditioned municipal halls and shaded community cooling shelters.",
                "category": "cooling",
            },
            {
                "icon": "🏥",
                "action": "Prepare healthcare facilities",
                "detail": "Equip Primary Health Centers (PHCs) with IV fluids, ice packs, and dedicated heatstroke beds.",
                "category": "healthcare",
            },
            {
                "icon": "👷",
                "action": "Reduce outdoor exposure",
                "detail": "Issue mandatory work-hour restrictions for agricultural and construction labor.",
                "category": "workers",
            },
        ],
        "HIGH": [
            {
                "icon": "🚰",
                "action": "Increase hydration frequency",
                "detail": "Drink water every 15–20 minutes even before feeling thirsty.",
                "category": "hydration",
            },
            {
                "icon": "🧊",
                "action": "Open shaded transit zones",
                "detail": "Provide shaded rest stops and cold water booths along high-density transit corridors.",
                "category": "cooling",
            },
            {
                "icon": "🏥",
                "action": "Prepare healthcare resources",
                "detail": "Alert local clinics and pharmacies for heat-exhaustion presentations.",
                "category": "healthcare",
            },
            {
                "icon": "👷",
                "action": "Provide worker heat-safety guidance",
                "detail": "Enforce shaded breaks and buddy monitoring for outdoor laborers.",
                "category": "workers",
            },
        ],
        "MODERATE": [
            {
                "icon": "🚰",
                "action": "Maintain routine hydration",
                "detail": "Carry drinking water when traveling and avoid caffeinated or sugary beverages.",
                "category": "hydration",
            },
            {
                "icon": "🧊",
                "action": "Avoid unnecessary midday exposure",
                "detail": "Schedule outdoor errands during early morning or evening hours.",
                "category": "exposure",
            },
            {
                "icon": "👥",
                "action": "Monitor vulnerable individuals",
                "detail": "Keep children and seniors hydrated and away from unventilated rooms.",
                "category": "vulnerable",
            },
            {
                "icon": "📱",
                "action": "Follow local weather bulletins",
                "detail": "Stay informed on afternoon temperature updates and district advisories.",
                "category": "monitoring",
            },
        ],
        "LOW": [
            {
                "icon": "🚰",
                "action": "Standard daily precautions",
                "detail": "Maintain normal fluid intake and wear light, loose-fitting cotton clothing.",
                "category": "hydration",
            },
            {
                "icon": "📱",
                "action": "Continue monitoring weather",
                "detail": "Check daily forecasts for upcoming weather changes.",
                "category": "monitoring",
            },
        ],
    }
    
    # Fill remaining slots from tier baseline without category duplication
    baselines = tier_baselines.get(level, tier_baselines["LOW"])
    for item in baselines:
        if len(actions) >= max_actions:
            break
        if item["category"] not in seen_categories:
            actions.append(item)
            seen_categories.add(item["category"])
            
    # Guarantee at least 3 actions if possible
    if len(actions) < 3 and len(baselines) >= 3:
        for item in baselines:
            if item not in actions and len(actions) < 3:
                actions.append(item)
                
    return actions[:max_actions]
