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
    Retrieve ward-level prototype dataset for an urban locality.
    Returns None if locality is outside the prototype coverage dataset.
    """
    key = normalize_area_key(area_name)
    wards = WARDS_BY_LOCALITY.get(key)
    if not wards:
        return None

    # Capitalized display name
    if "tpg" in wards[0]["id"]:
        display_name = "Tadepalligudem"
    elif "bvrm" in wards[0]["id"]:
        display_name = "Bhimavaram"
    elif "tnk" in wards[0]["id"]:
        display_name = "Tanuku"
    else:
        display_name = area_name

    return {
        "area": display_name,
        "data_type": "prototype",
        "disclaimer": "Ward-level risk values are prototype estimates for demonstration.",
        "count": len(wards),
        "wards": wards
    }
