"""
HeatShield AI — Hyperlocal Ward Data Service
=============================================
Centralized ward-level prototype dataset for urban pilot centers.

DATA HONESTY & ETHICAL NOTICE:
------------------------------
Ward boundaries and risk values in this service are prototype estimates
compiled for demonstration of hyperlocal heat-health early warning capabilities.
They are NOT official government administrative boundary measurements.
"""

from typing import Dict, List, Optional, Any


def calculate_risk_category(score: float) -> str:
    """Classify 0–100 risk score into HeatShield risk category."""
    if score >= 75:
        return "EXTREME"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MODERATE"
    return "LOW"


# ============================================================
# PROTOTYPE WARD DATASET FOR PILOT LOCALITIES
# ============================================================

TADEPALLIGUDEM_WARDS: List[Dict[str, Any]] = [
    {
        "id": "tpg-ward-01",
        "ward_number": "Ward 01",
        "name": "Ward 01 - Railway Colony & Siding",
        "latitude": 16.8205,
        "longitude": 81.5220,
        "risk_score": 82.0,
        "risk_category": "EXTREME",
        "temperature": 41.5,
        "humidity": 65.0,
        "vulnerable_population": 1450,
        "alert_level": "EXTREME",
        "risk_drivers": [
            "Extreme thermal stress from asphalt & rail ballast",
            "High concentration of informal transit laborers",
            "Elevated night-time heat retention"
        ]
    },
    {
        "id": "tpg-ward-02",
        "ward_number": "Ward 02",
        "name": "Ward 02 - Market Yard & Old Bus Stand",
        "latitude": 16.8160,
        "longitude": 81.5275,
        "risk_score": 86.0,
        "risk_category": "EXTREME",
        "temperature": 41.8,
        "humidity": 68.0,
        "vulnerable_population": 2100,
        "alert_level": "EXTREME",
        "risk_drivers": [
            "Dense wholesale vegetable & grain market activity",
            "Direct afternoon sun exposure for street vendors",
            "Asbestos and tin-sheet roofing concentration"
        ]
    },
    {
        "id": "tpg-ward-03",
        "ward_number": "Ward 03",
        "name": "Ward 03 - K.N. Road Commercial Strip",
        "latitude": 16.8140,
        "longitude": 81.5290,
        "risk_score": 78.0,
        "risk_category": "EXTREME",
        "temperature": 41.0,
        "humidity": 66.0,
        "vulnerable_population": 1320,
        "alert_level": "EXTREME",
        "risk_drivers": [
            "High pedestrian footfall and motorized traffic heat",
            "Urban heat canyon effect between commercial blocks",
            "Limited public shade infrastructure"
        ]
    },
    {
        "id": "tpg-ward-04",
        "ward_number": "Ward 04",
        "name": "Ward 04 - Housing Board Colony",
        "latitude": 16.8115,
        "longitude": 81.5330,
        "risk_score": 62.0,
        "risk_category": "HIGH",
        "temperature": 39.8,
        "humidity": 63.0,
        "vulnerable_population": 980,
        "alert_level": "HIGH",
        "risk_drivers": [
            "Elevated residential temperature accumulation",
            "High proportion of elderly home occupants",
            "Moderate building density"
        ]
    },
    {
        "id": "tpg-ward-05",
        "ward_number": "Ward 05",
        "name": "Ward 05 - Subba Rao Peta Residential",
        "latitude": 16.8185,
        "longitude": 81.5310,
        "risk_score": 69.0,
        "risk_category": "HIGH",
        "temperature": 40.2,
        "humidity": 65.0,
        "vulnerable_population": 1150,
        "alert_level": "HIGH",
        "risk_drivers": [
            "High thermal stress during peak afternoon hours",
            "Narrow residential streets trapping ambient warmth",
            "Outdoor municipal sanitation staff exposure"
        ]
    },
    {
        "id": "tpg-ward-06",
        "ward_number": "Ward 06",
        "name": "Ward 06 - Sasibhushan Rao Peta",
        "latitude": 16.8230,
        "longitude": 81.5280,
        "risk_score": 58.0,
        "risk_category": "HIGH",
        "temperature": 39.4,
        "humidity": 64.0,
        "vulnerable_population": 850,
        "alert_level": "HIGH",
        "risk_drivers": [
            "Moderate domestic thermal buildup",
            "Partial shade from residential tree canopy",
            "Elderly population vulnerability"
        ]
    },
    {
        "id": "tpg-ward-07",
        "ward_number": "Ward 07",
        "name": "Ward 07 - Pentapadu Bypass Junction",
        "latitude": 16.8070,
        "longitude": 81.5210,
        "risk_score": 68.0,
        "risk_category": "HIGH",
        "temperature": 40.1,
        "humidity": 64.0,
        "vulnerable_population": 1180,
        "alert_level": "HIGH",
        "risk_drivers": [
            "High thermal stress",
            "Outdoor-worker exposure",
            "Elevated population vulnerability"
        ]
    },
    {
        "id": "tpg-ward-08",
        "ward_number": "Ward 08",
        "name": "Ward 08 - Weavers Colony & Agro-Textile",
        "latitude": 16.8220,
        "longitude": 81.5360,
        "risk_score": 74.0,
        "risk_category": "HIGH",
        "temperature": 40.8,
        "humidity": 67.0,
        "vulnerable_population": 1650,
        "alert_level": "HIGH",
        "risk_drivers": [
            "Indoor heat trapping in tin-roof handloom sheds",
            "High physical exertion under elevated indoor humidity",
            "Informal home-based worker vulnerability"
        ]
    },
    {
        "id": "tpg-ward-09",
        "ward_number": "Ward 09",
        "name": "Ward 09 - Municipal Office & Clock Tower",
        "latitude": 16.8130,
        "longitude": 81.5250,
        "risk_score": 64.0,
        "risk_category": "HIGH",
        "temperature": 39.9,
        "humidity": 62.0,
        "vulnerable_population": 820,
        "alert_level": "HIGH",
        "risk_drivers": [
            "High impervious pavement fraction",
            "Civic center congregation exposure",
            "Transit corridor thermal loading"
        ]
    },
    {
        "id": "tpg-ward-10",
        "ward_number": "Ward 10",
        "name": "Ward 10 - Madhavaram Agricultural Fringe",
        "latitude": 16.8310,
        "longitude": 81.5180,
        "risk_score": 72.0,
        "risk_category": "HIGH",
        "temperature": 41.2,
        "humidity": 61.0,
        "vulnerable_population": 1280,
        "alert_level": "HIGH",
        "risk_drivers": [
            "Intense direct solar radiation over open fields",
            "High agricultural laborer density without cooling shelters",
            "Limited rapid rehydration access"
        ]
    },
    {
        "id": "tpg-ward-11",
        "ward_number": "Ward 11",
        "name": "Ward 11 - DRG Govt Degree College Zone",
        "latitude": 16.8175,
        "longitude": 81.5390,
        "risk_score": 48.0,
        "risk_category": "MODERATE",
        "temperature": 38.6,
        "humidity": 60.0,
        "vulnerable_population": 650,
        "alert_level": "MODERATE",
        "risk_drivers": [
            "Lower density institutional green cover",
            "Moderate daytime heat exposure during class transit",
            "Adequate access to potable water points"
        ]
    },
    {
        "id": "tpg-ward-12",
        "ward_number": "Ward 12",
        "name": "Ward 12 - Gollagudem Canal Green Belt",
        "latitude": 16.8030,
        "longitude": 81.5350,
        "risk_score": 42.0,
        "risk_category": "MODERATE",
        "temperature": 37.9,
        "humidity": 69.0,
        "vulnerable_population": 520,
        "alert_level": "MODERATE",
        "risk_drivers": [
            "Microclimate evaporative cooling along irrigation canal",
            "Riparian vegetation buffer moderating peak daytime heat",
            "Moderate humidity offset by open airflow"
        ]
    }
]

BHIMAVARAM_WARDS: List[Dict[str, Any]] = [
    {
        "id": "bvrm-ward-01",
        "ward_number": "Ward 01",
        "name": "Ward 01 - Town Railway Station & Market",
        "latitude": 16.5455,
        "longitude": 81.5225,
        "risk_score": 83.0,
        "risk_category": "EXTREME",
        "temperature": 40.8,
        "humidity": 67.0,
        "vulnerable_population": 1780,
        "alert_level": "EXTREME",
        "risk_drivers": [
            "Extreme thermal loading in rail and transit zone",
            "High concentration of unorganized transport workers",
            "Dense commercial shop fronts"
        ]
    },
    {
        "id": "bvrm-ward-02",
        "ward_number": "Ward 02",
        "name": "Ward 02 - Someswara Swamy Temple Street",
        "latitude": 16.5410,
        "longitude": 81.5240,
        "risk_score": 67.0,
        "risk_category": "HIGH",
        "temperature": 39.7,
        "humidity": 66.0,
        "vulnerable_population": 1240,
        "alert_level": "HIGH",
        "risk_drivers": [
            "High foot-traffic over stone pavements",
            "Elderly pilgrimage and resident demographics",
            "Limited canopy shade"
        ]
    },
    {
        "id": "bvrm-ward-03",
        "ward_number": "Ward 03",
        "name": "Ward 03 - Aqua Processing & Cold Hub",
        "latitude": 16.5350,
        "longitude": 81.5160,
        "risk_score": 76.0,
        "risk_category": "EXTREME",
        "temperature": 40.5,
        "humidity": 70.0,
        "vulnerable_population": 1920,
        "alert_level": "EXTREME",
        "risk_drivers": [
            "High thermal shock between refrigerated and outdoor environments",
            "Heavy manual cargo handling in direct sun",
            "Elevated coastal plain relative humidity"
        ]
    },
    {
        "id": "bvrm-ward-04",
        "ward_number": "Ward 04",
        "name": "Ward 04 - DNR College Campus & Residential",
        "latitude": 16.5490,
        "longitude": 81.5310,
        "risk_score": 46.0,
        "risk_category": "MODERATE",
        "temperature": 38.2,
        "humidity": 62.0,
        "vulnerable_population": 710,
        "alert_level": "MODERATE",
        "risk_drivers": [
            "Campus green spaces buffering ground heat",
            "Low built density with good airflow",
            "Adequate access to indoor shaded corridors"
        ]
    }
]

TANUKU_WARDS: List[Dict[str, Any]] = [
    {
        "id": "tnk-ward-01",
        "ward_number": "Ward 01",
        "name": "Ward 01 - Industrial Estate & Machinery Belt",
        "latitude": 16.7590,
        "longitude": 81.6840,
        "risk_score": 87.0,
        "risk_category": "EXTREME",
        "temperature": 42.4,
        "humidity": 64.0,
        "vulnerable_population": 1850,
        "alert_level": "EXTREME",
        "risk_drivers": [
            "Waste heat from agro-industrial processing mills",
            "Metal roof workshops with intense radiative heat",
            "Heavy manual labor during afternoon peak"
        ]
    },
    {
        "id": "tnk-ward-02",
        "ward_number": "Ward 02",
        "name": "Ward 02 - Town Center & Clock Tower",
        "latitude": 16.7550,
        "longitude": 81.6800,
        "risk_score": 75.0,
        "risk_category": "EXTREME",
        "temperature": 41.2,
        "humidity": 65.0,
        "vulnerable_population": 1340,
        "alert_level": "EXTREME",
        "risk_drivers": [
            "Dense urban fabric and motorized traffic heat",
            "High proportion of street hawkers and transit users",
            "Asphalt heat retention past sunset"
        ]
    },
    {
        "id": "tnk-ward-03",
        "ward_number": "Ward 03",
        "name": "Ward 03 - Gosthani Riverbank Colony",
        "latitude": 16.7620,
        "longitude": 81.6740,
        "risk_score": 45.0,
        "risk_category": "MODERATE",
        "temperature": 38.4,
        "humidity": 68.0,
        "vulnerable_population": 690,
        "alert_level": "MODERATE",
        "risk_drivers": [
            "Riverine evaporative cooling",
            "Moderate daytime heat with active natural breezes",
            "Buffer of coconut groves and foliage"
        ]
    }
]

WARDS_BY_LOCALITY: Dict[str, List[Dict[str, Any]]] = {
    "tadepalligudem": TADEPALLIGUDEM_WARDS,
    "bhimavaram": BHIMAVARAM_WARDS,
    "tanuku": TANUKU_WARDS,
}


def normalize_area_key(name: str) -> str:
    """Normalize user input area or locality name to lookup key."""
    if not name:
        return ""
    clean = name.strip().lower()
    for sep in [" ", "-", "_", ","]:
        clean = clean.replace(sep, "")
    for key in WARDS_BY_LOCALITY.keys():
        if key in clean or clean in key:
            return key
    return clean


def get_wards_for_locality(area_name: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve ward-level real-time biometeorological dataset for an urban locality.
    Obtains live Open-Meteo observations for each ward coordinate in a batch request,
    calculates real-time thermal metrics, vulnerability score, and composite heat-health risk.
    """
    import requests
    from services.thermal_service import calculate_thermal_metrics
    from services.risk_service import calculate_final_risk

    key = normalize_area_key(area_name)
    base_wards = WARDS_BY_LOCALITY.get(key)
    if not base_wards:
        return None

    # Capitalized display name
    if "tpg" in base_wards[0]["id"]:
        display_name = "Tadepalligudem"
    elif "bvrm" in base_wards[0]["id"]:
        display_name = "Bhimavaram"
    elif "tnk" in base_wards[0]["id"]:
        display_name = "Tanuku"
    else:
        display_name = area_name

    lats = ",".join([str(w["latitude"]) for w in base_wards])
    lons = ",".join([str(w["longitude"]) for w in base_wards])
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lats,
        "longitude": lons,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "shortwave_radiation"
        ]
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        raw_list = response.json()
        if not isinstance(raw_list, list):
            raw_list = [raw_list]
    except Exception as exc:
        # If Open-Meteo is unavailable, clearly report it
        live_wards = []
        for w in base_wards:
            w_copy = dict(w)
            w_copy["is_live"] = False
            w_copy["data_source"] = "Prototype baseline (Open-Meteo offline)"
            w_copy["error"] = f"Unable to fetch real-time weather: {str(exc)}"
            live_wards.append(w_copy)

        return {
            "area": display_name,
            "data_type": "prototype",
            "live_data_available": False,
            "error": str(exc),
            "disclaimer": "Ward risk values are prototype estimates because Open-Meteo is temporarily unreachable.",
            "count": len(live_wards),
            "wards": live_wards
        }

    live_wards = []
    for i, w in enumerate(base_wards):
        w_copy = dict(w)
        res = raw_list[i] if i < len(raw_list) else {}
        curr = res.get("current", {})

        temp = curr.get("temperature_2m")
        humidity = curr.get("relative_humidity_2m")
        wind = curr.get("wind_speed_10m", 10.0)
        solar = curr.get("shortwave_radiation", 500.0)

        if temp is not None and humidity is not None:
            try:
                thermal = calculate_thermal_metrics(
                    temperature=float(temp),
                    humidity=float(humidity),
                    wind_speed=float(wind),
                    solar_radiation=float(solar),
                    latitude=float(w["latitude"]),
                    longitude=float(w["longitude"])
                )
                thermal_score = float(thermal.get("thermal_stress_score", 50.0))
            except Exception:
                thermal_score = 50.0

            # Normalized demographic vulnerability factor based on vulnerable_population (range 35 to 75)
            vuln_pop = float(w.get("vulnerable_population", 1200))
            vuln_score = round(min(75.0, max(35.0, 35.0 + (vuln_pop / 50.0))), 1)

            # Combined risk score = 0.70 * thermal + 0.30 * vulnerability
            final_risk = round(calculate_final_risk(thermal_score, vuln_score), 1)
            cat = calculate_risk_category(final_risk)

            w_copy["temperature"] = round(temp, 1)
            w_copy["humidity"] = round(humidity, 1)
            w_copy["wind_speed"] = round(wind, 1)
            w_copy["solar_radiation"] = round(solar, 1)
            w_copy["thermal_stress_score"] = round(thermal_score, 1)
            w_copy["vulnerability_score"] = vuln_score
            w_copy["risk_score"] = final_risk
            w_copy["risk_category"] = cat
            w_copy["alert_level"] = cat
            w_copy["is_live"] = True
            w_copy["data_source"] = "Live weather-model data"
        else:
            w_copy["is_live"] = False
            w_copy["data_source"] = "Prototype baseline"

        live_wards.append(w_copy)

    return {
        "area": display_name,
        "data_type": "live_model",
        "live_data_available": True,
        "disclaimer": "Live weather-model data derived from Open-Meteo biometeorological observations and demographic vulnerability modeling. Not physical sensor measurements.",
        "count": len(live_wards),
        "wards": live_wards
    }
