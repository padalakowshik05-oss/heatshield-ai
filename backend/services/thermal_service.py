"""
HeatShield AI — Thermal Stress Calculation Service (Step 3)
===========================================================

Biometeorological modeling and human heat-stress assessment layer.
Transforms real-time meteorological observations into physiologically
meaningful thermal indicators:

1. Heat Index (NOAA Rothfusz regression with boundary adjustments)
2. Estimated WBGT (Outdoor prototype approximation using Stull wet-bulb
   and empirical solar/wind globe temperature)
3. Estimated UTCI (Universal Thermal Climate Index via pythermalcomfort
   with prototype mean radiant temperature estimation)
4. Normalized Thermal Stress Score (0–100 scale, weighted multi-metric)
5. Thermal Stress Category (Prototype risk bands: LOW, MODERATE, HIGH, EXTREME)

SCIENTIFIC CREDIBILITY DISCLAIMER:
----------------------------------
Direct measurements of natural wet-bulb temperature, black globe temperature,
and mean radiant temperature are not provided by Open-Meteo or standard synoptic
stations. Therefore, WBGT and UTCI are strictly labeled and treated as
"Estimated WBGT" and "Estimated UTCI" derived from available environmental proxies.
"""

import math
from typing import Dict, Any, Optional
import numpy as np

try:
    from pythermalcomfort.models import utci as pythermal_utci
    from pythermalcomfort.utilities import mean_radiant_tmp
    PYTHERMALCOMFORT_AVAILABLE = True
except ImportError:
    PYTHERMALCOMFORT_AVAILABLE = False


# ============================================================
# 1. HEAT INDEX (NOAA ROTHFUSZ REGRESSION)
# ============================================================

def calculate_heat_index(temp_c: float, humidity: float) -> Dict[str, Any]:
    """
    Calculate Heat Index using the standard NOAA / Rothfusz regression.
    
    Applicability:
    - Standard Rothfusz regression applies when T >= 80°F (26.7°C) and RH >= 40%.
    - If T >= 68°F (20°C) but outside standard Rothfusz bounds, Steadman's simple
      formula is applied (status: "estimated").
    - If T < 68°F (20°C), heat stress is negligible; Heat Index defaults to
      ambient temperature (status: "estimated").
    
    Parameters:
        temp_c: Dry-bulb air temperature in Celsius (°C)
        humidity: Relative humidity in percentage (%)
        
    Returns:
        dict: {"value": float, "unit": "°C", "status": "calculated" | "estimated"}
    """
    # Convert Celsius to Fahrenheit for NOAA formula
    temp_f = (temp_c * 9.0 / 5.0) + 32.0

    # Low-temperature fallback (below 68°F / 20°C: heat index = air temp)
    if temp_f < 68.0:
        return {
            "value": round(temp_c, 1),
            "unit": "°C",
            "status": "estimated"
        }

    # Moderate temperature range (68°F <= T < 80°F): Steadman's simple equation
    if temp_f < 80.0:
        hi_f = 0.5 * (temp_f + 61.0 + ((temp_f - 68.0) * 1.2) + (humidity * 0.094))
        hi_c = (hi_f - 32.0) * 5.0 / 9.0
        return {
            "value": round(hi_c, 1),
            "unit": "°C",
            "status": "estimated"
        }

    # Full 9-parameter Rothfusz Regression (T >= 80°F)
    T = temp_f
    R = humidity

    hi_f = (
        -42.379
        + 2.04901523 * T
        + 10.14333127 * R
        - 0.22475541 * T * R
        - 0.00683783 * T * T
        - 0.05481717 * R * R
        + 0.00122874 * T * T * R
        + 0.00085282 * T * R * R
        - 0.00000199 * T * T * R * R
    )

    # NOAA Low-humidity adjustment: RH < 13% and 80 <= T <= 112
    if R < 13.0 and 80.0 <= T <= 112.0:
        adjustment = -((13.0 - R) / 4.0) * math.sqrt((17.0 - abs(T - 95.0)) / 17.0)
        hi_f += adjustment

    # NOAA High-humidity adjustment: RH > 85% and 80 <= T <= 87
    elif R > 85.0 and 80.0 <= T <= 87.0:
        adjustment = ((R - 85.0) / 10.0) * ((87.0 - T) / 5.0)
        hi_f += adjustment

    hi_c = (hi_f - 32.0) * 5.0 / 9.0

    return {
        "value": round(hi_c, 1),
        "unit": "°C",
        "status": "calculated"
    }


# ============================================================
# 2. WET-BULB & ESTIMATED GLOBE TEMPERATURE
# ============================================================

def calculate_wet_bulb(temp_c: float, humidity: float) -> float:
    """
    Estimate natural wet-bulb temperature using the empirical Stull (2011) formula.
    Valid for sea-level pressure, temperature -20°C to 50°C, humidity 5% to 99%.
    """
    tw = (
        temp_c * math.atan(0.151977 * math.sqrt(humidity + 8.313659))
        + math.atan(temp_c + humidity)
        - math.atan(humidity - 1.676331)
        + 0.00391838 * (humidity ** 1.5) * math.atan(0.023101 * humidity)
        - 4.686035
    )
    return round(tw, 2)


def estimate_globe_temperature(
    temp_c: float,
    solar_radiation: float,
    wind_speed: float
) -> float:
    """
    Estimate black globe temperature using an empirical solar irradiance and
    convective wind cooling balance.

    NOTE:
    This is a prototype approximation and NOT a physical black globe sensor
    measurement (ISO 7243).
    """
    solar_effect = 0.02 * max(solar_radiation, 0.0)
    wind_effect = max(wind_speed, 1.0)

    globe_temp = temp_c + (solar_effect / (wind_effect ** 0.5))
    return round(globe_temp, 2)


# ============================================================
# 3. ESTIMATED WBGT (OUTDOOR PROTOTYPE APPROXIMATION)
# ============================================================

def calculate_estimated_wbgt(
    temp_c: float,
    humidity: float,
    wind_speed: float,
    solar_radiation: float
) -> Dict[str, Any]:
    """
    Calculate Estimated Wet-Bulb Globe Temperature (WBGT) for outdoor environments.

    Formula structure:
        0.7 * Tw (wet-bulb) + 0.2 * Tg (globe temp) + 0.1 * Tdb (dry-bulb)

    CREDIBILITY NOTICE:
    Labeled explicitly as "estimated" with method "prototype outdoor estimation"
    because wet-bulb and globe temperatures are modeled from synoptic proxies.
    """
    wet_bulb = calculate_wet_bulb(temp_c, humidity)
    globe_temp = estimate_globe_temperature(temp_c, solar_radiation, wind_speed)

    wbgt = 0.7 * wet_bulb + 0.2 * globe_temp + 0.1 * temp_c

    return {
        "value": round(wbgt, 1),
        "unit": "°C",
        "type": "estimated",
        "method": "prototype outdoor estimation"
    }


# ============================================================
# 4. ESTIMATED UTCI (PYTHERMALCOMFORT INTEGRATION)
# ============================================================

def estimate_mean_radiant_temperature(
    temp_c: float,
    solar_radiation: float,
    wind_speed_ms: float
) -> float:
    """
    Estimate Mean Radiant Temperature (Tr) for UTCI input.
    If solar radiation is negligible (<= 5 W/m² e.g. at night), Tr ≈ Tdb.
    In sunlight, Tr is estimated using ISO Mixed Convection from estimated globe temp.
    """
    if solar_radiation <= 5.0:
        return temp_c

    globe_temp = estimate_globe_temperature(
        temp_c=temp_c,
        solar_radiation=solar_radiation,
        wind_speed=wind_speed_ms * 3.6  # convert m/s to km/h for globe_temp formula
    )

    if PYTHERMALCOMFORT_AVAILABLE:
        try:
            tr = mean_radiant_tmp(
                tg=globe_temp,
                tdb=temp_c,
                v=max(wind_speed_ms, 0.1),
                standard="ISO"
            )
            if isinstance(tr, (np.ndarray, list)):
                tr = float(tr[0])
            if not math.isnan(tr) and not math.isinf(tr):
                return round(float(tr), 2)
        except Exception:
            pass

    # Fallback solar-convection approximation if ISO formula is unavailable
    tr_fallback = temp_c + (0.03 * solar_radiation / math.sqrt(max(wind_speed_ms, 0.5)))
    return round(tr_fallback, 2)


def calculate_estimated_utci(
    temp_c: float,
    humidity: float,
    wind_speed_kmh: float,
    solar_radiation: float
) -> Dict[str, Any]:
    """
    Calculate Universal Thermal Climate Index (UTCI) using the official pythermalcomfort model.

    Requirements & Assumptions:
    - Wind speed at 10m is converted from km/h to m/s (v_ms = wind_speed_kmh / 3.6).
    - Mean radiant temperature (Tr) is estimated from solar radiation and air speed.
    - Uses UTCI polynomial applicability limits (-50 < tdb < 50, 0.5 < v < 17.0 m/s).
    - If environmental conditions exceed valid polynomial bounds, returns value: null
      with status: "outside_validity_range" without crashing.

    Returns:
        dict: {"value": float | None, "unit": "°C", "type": "estimated", "status": "valid" | "outside_validity_range"}
    """
    v_ms = wind_speed_kmh / 3.6
    tr = estimate_mean_radiant_temperature(temp_c, solar_radiation, v_ms)

    if not PYTHERMALCOMFORT_AVAILABLE:
        return {
            "value": None,
            "unit": "°C",
            "type": "estimated",
            "status": "pythermalcomfort_unavailable",
            "message": "pythermalcomfort package is not installed."
        }

    try:
        result = pythermal_utci(
            tdb=temp_c,
            tr=tr,
            v=v_ms,
            rh=humidity,
            units="SI",
            limit_inputs=True
        )

        utci_val = getattr(result, "utci", None)

        if utci_val is not None and not math.isnan(utci_val):
            return {
                "value": round(float(utci_val), 1),
                "unit": "°C",
                "type": "estimated",
                "status": "valid",
                "stress_category": getattr(result, "stress_category", None)
            }
        else:
            return {
                "value": None,
                "unit": "°C",
                "type": "estimated",
                "status": "outside_validity_range",
                "message": "Inputs fall outside UTCI standard bounds (-50<tdb<50°C, 0.5<v<17m/s)."
            }
    except Exception as e:
        return {
            "value": None,
            "unit": "°C",
            "type": "estimated",
            "status": "calculation_error",
            "message": str(e)
        }


# ============================================================
# 5. NORMALIZATION (0–100 HEAT STRESS SCALE)
# ============================================================

def normalize(value: float, minimum: float, maximum: float) -> float:
    """
    Normalize a scalar value to a unit scale [0, 1], clamped.
    """
    if maximum <= minimum:
        return 0.0
    score = (value - minimum) / (maximum - minimum)
    return max(0.0, min(score, 1.0))


def normalize_heat_index(heat_index: float) -> float:
    """
    Normalize Heat Index (°C) to a 0–100 heat stress scale.
    - 27°C (~80°F): Baseline caution threshold -> 0
    - 55°C (~131°F): Extreme danger / imminent heat stroke -> 100
    """
    return round(normalize(heat_index, 27.0, 55.0) * 100.0, 2)


def normalize_wbgt(wbgt: float) -> float:
    """
    Normalize Estimated WBGT (°C) to a 0–100 heat stress scale.
    - 18°C: Safe/normal work ceiling -> 0
    - 40°C: Extreme heat hazard / catastrophic labor risk -> 100
    """
    return round(normalize(wbgt, 18.0, 40.0) * 100.0, 2)


def normalize_utci(utci: float) -> float:
    """
    Normalize Estimated UTCI (°C) to a 0–100 heat stress scale.
    - 20°C: Thermal neutrality / comfort baseline -> 0
    - 50°C: Extreme physiological heat stress -> 100
    """
    return round(normalize(utci, 20.0, 50.0) * 100.0, 2)


# ============================================================
# 6. THERMAL STRESS SCORE (0–100 COMPOSITE)
# ============================================================

def calculate_thermal_stress_score(
    heat_index: float,
    wbgt: float,
    utci: Optional[float] = None
) -> float:
    """
    Calculate normalized composite Thermal Stress Score (0–100).

    Prototype Weights:
    - Heat Index: 30% (0.30)
    - Estimated WBGT: 40% (0.40)
    - Estimated UTCI: 30% (0.30)

    If UTCI is outside valid bounds (None), the available HI and WBGT
    indicators are proportionately re-weighted (30/70 and 40/70).
    """
    norm_hi = normalize_heat_index(heat_index)
    norm_wbgt = normalize_wbgt(wbgt)

    if utci is not None:
        norm_utci = normalize_utci(utci)
        score = (0.30 * norm_hi) + (0.40 * norm_wbgt) + (0.30 * norm_utci)
    else:
        score = (0.30 * norm_hi + 0.40 * norm_wbgt) / 0.70

    clamped_score = max(0.0, min(score, 100.0))
    return round(clamped_score, 1)


# ============================================================
# 7. THERMAL STRESS CATEGORY
# ============================================================

def get_thermal_stress_category(score: float) -> str:
    """
    Convert Thermal Stress Score into prototype public safety category.
    
    Prototype Thresholds:
    - 0–24:   LOW
    - 25–49:  MODERATE
    - 50–74:  HIGH
    - 75–100: EXTREME

    NOTE:
    These are HeatShield AI prototype operational categories, NOT official
    statutory or medical definitions.
    """
    if score < 25.0:
        return "LOW"
    elif score < 50.0:
        return "MODERATE"
    elif score < 75.0:
        return "HIGH"
    else:
        return "EXTREME"


# Backwards compatibility alias
def get_risk_category(score: float) -> str:
    return get_thermal_stress_category(score)


# ============================================================
# 8. MASTER THERMAL METRICS PIPELINE
# ============================================================

def calculate_thermal_metrics(
    temperature: float,
    humidity: float,
    wind_speed: float = 0.0,
    solar_radiation: float = 0.0,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> Dict[str, Any]:
    """
    Full thermal stress calculation pipeline.
    Transforms environmental weather parameters into standardized
    biometeorological indices and composite risk score.
    """
    # 1. Heat Index
    hi_result = calculate_heat_index(temperature, humidity)
    hi_value = hi_result["value"]

    # 2. Estimated WBGT
    wbgt_result = calculate_estimated_wbgt(
        temperature,
        humidity,
        wind_speed,
        solar_radiation
    )
    wbgt_value = wbgt_result["value"]

    # 3. Estimated UTCI
    utci_result = calculate_estimated_utci(
        temperature,
        humidity,
        wind_speed,
        solar_radiation
    )
    utci_value = utci_result.get("value")

    # 4. Composite Thermal Stress Score (0–100)
    thermal_score = calculate_thermal_stress_score(
        heat_index=hi_value,
        wbgt=wbgt_value,
        utci=utci_value
    )

    # 5. Operational Category
    category = get_thermal_stress_category(thermal_score)

    return {
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "weather": {
            "temperature": temperature,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "solar_radiation": solar_radiation
        },
        "heat_index": hi_result,
        "wbgt": wbgt_result,
        "utci": utci_result,
        "thermal_stress_score": thermal_score,
        "thermal_stress_category": category,
        # Backwards compatibility fields
        "temperature": temperature,
        "humidity": humidity,
        "wind_speed": wind_speed,
        "solar_radiation": solar_radiation,
        "thermal_metrics": {
            "heat_index": hi_value,
            "estimated_wbgt": wbgt_value,
            "estimated_utci": utci_value,
            "thermal_stress_score": thermal_score,
            "thermal_stress_category": category
        }
    }
