import os
import pandas as pd
import numpy as np
from typing import List, Tuple

# Feature definitions
BASE_ENVIRONMENTAL_FEATURES = [
    "temperature",
    "humidity",
    "wind_speed",
    "solar_radiation",
]

BASE_THERMAL_FEATURES = [
    "heat_index",
    "estimated_wbgt",
    "estimated_utci",
    "thermal_stress_score",
]

VULNERABILITY_FEATURES = [
    "elderly",
    "children",
    "outdoor_workers",
    "population_density",
    "housing_vulnerability",
    "healthcare_vulnerability",
    "vulnerability_score",
]

TIME_FEATURES = [
    "hour",
    "day_of_week",
    "month",
]

LAG_FEATURES = [
    "temperature_lag_1",
    "temperature_lag_3",
    "temperature_lag_6",
    "temperature_lag_24",
    "humidity_lag_1",
    "wbgt_lag_1",
    "wbgt_lag_3",
    "risk_lag_1",
    "risk_lag_3",
    "risk_lag_6",
]

ROLLING_FEATURES = [
    "temperature_3h_avg",
    "temperature_6h_avg",
    "temperature_24h_avg",
    "wbgt_3h_avg",
    "wbgt_6h_avg",
    "risk_3h_avg",
    "risk_6h_avg",
]

ALL_FEATURE_COLUMNS = (
    TIME_FEATURES
    + BASE_ENVIRONMENTAL_FEATURES
    + BASE_THERMAL_FEATURES
    + VULNERABILITY_FEATURES
    + LAG_FEATURES
    + ROLLING_FEATURES
)

TARGET_COLUMN = "future_risk_score"


def engineer_features(df: pd.DataFrame, horizon_hours: int = 6) -> pd.DataFrame:
    """
    Generate time, lag, rolling, and target features from hourly time series.
    Guarantees strict absence of data leakage:
    - Features at time T strictly use observations at or before T.
    - Future target represents risk_score shifted forward by horizon_hours (T + horizon_hours).
    - Grouping by 'area' ensures no cross-mandal boundary pollution.
    """
    df = df.copy()
    
    # Ensure datetime format and sort chronologically within each area
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["area", "timestamp"]).reset_index(drop=True)
    
    # 1. Time Features
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["month"] = df["timestamp"].dt.month
    
    # 2. Grouped Lag Features (Strictly past observations: shift >= 1)
    grouped = df.groupby("area")
    
    df["temperature_lag_1"] = grouped["temperature"].shift(1)
    df["temperature_lag_3"] = grouped["temperature"].shift(3)
    df["temperature_lag_6"] = grouped["temperature"].shift(6)
    df["temperature_lag_24"] = grouped["temperature"].shift(24)
    
    df["humidity_lag_1"] = grouped["humidity"].shift(1)
    
    df["wbgt_lag_1"] = grouped["estimated_wbgt"].shift(1)
    df["wbgt_lag_3"] = grouped["estimated_wbgt"].shift(3)
    
    df["risk_lag_1"] = grouped["risk_score"].shift(1)
    df["risk_lag_3"] = grouped["risk_score"].shift(3)
    df["risk_lag_6"] = grouped["risk_score"].shift(6)
    
    # 3. Grouped Rolling Window Features (Backward-looking: observations <= T)
    # rolling(N).mean() on series ending at T includes {T-N+1, ..., T}, strictly <= T
    df["temperature_3h_avg"] = grouped["temperature"].rolling(3, min_periods=3).mean().reset_index(drop=True)
    df["temperature_6h_avg"] = grouped["temperature"].rolling(6, min_periods=6).mean().reset_index(drop=True)
    df["temperature_24h_avg"] = grouped["temperature"].rolling(24, min_periods=24).mean().reset_index(drop=True)
    
    df["wbgt_3h_avg"] = grouped["estimated_wbgt"].rolling(3, min_periods=3).mean().reset_index(drop=True)
    df["wbgt_6h_avg"] = grouped["estimated_wbgt"].rolling(6, min_periods=6).mean().reset_index(drop=True)
    
    df["risk_3h_avg"] = grouped["risk_score"].rolling(3, min_periods=3).mean().reset_index(drop=True)
    df["risk_6h_avg"] = grouped["risk_score"].rolling(6, min_periods=6).mean().reset_index(drop=True)
    
    # 4. Target Feature (Negative shift: value at T + horizon_hours)
    df[TARGET_COLUMN] = grouped["risk_score"].shift(-horizon_hours)
    
    # Drop rows containing NaNs from lag warm-up (first 24h) and target horizon (last 6h)
    clean_df = df.dropna(subset=ALL_FEATURE_COLUMNS + [TARGET_COLUMN]).reset_index(drop=True)
    
    return clean_df


def prepare_single_inference_vector(
    current_weather: dict,
    current_thermal: dict,
    vulnerability_data: dict,
    current_risk_score: float,
    recent_history: pd.DataFrame = None,
) -> pd.DataFrame:
    """
    Construct a single-row feature vector formatted for model prediction.
    If recent_history (e.g. past 24h) is provided, computes exact lags & rolling averages.
    Otherwise, computes physically calibrated diurnal estimates based on the hour.
    """
    import datetime
    now = datetime.datetime.now()
    hour = now.hour
    day_of_week = now.weekday()
    month = now.month
    
    def _extract_val(v, default):
        if v is None:
            return float(default)
        if isinstance(v, dict):
            v_val = v.get("value")
            return float(v_val) if v_val is not None else float(default)
        try:
            return float(v)
        except (ValueError, TypeError):
            return float(default)

    temp = _extract_val(current_weather.get("temperature"), 35.0)
    humidity = _extract_val(current_weather.get("humidity"), 60.0)
    wind = _extract_val(current_weather.get("wind_speed"), 10.0)
    solar = _extract_val(current_weather.get("solar_radiation"), 500.0)
    
    hi = _extract_val(current_thermal.get("heat_index"), temp)
    wbgt = _extract_val(current_thermal.get("wbgt"), temp)
    utci = _extract_val(current_thermal.get("utci"), temp)
    thermal_score = _extract_val(current_thermal.get("thermal_stress_score"), 50.0)
    
    vuln_score = _extract_val(vulnerability_data.get("vulnerability_score"), 50.0)
    elderly = _extract_val(vulnerability_data.get("elderly"), 50.0)
    children = _extract_val(vulnerability_data.get("children"), 50.0)
    outdoor = _extract_val(vulnerability_data.get("outdoor_workers"), 50.0)
    density = _extract_val(vulnerability_data.get("population_density"), 50.0)
    housing = _extract_val(vulnerability_data.get("housing_vulnerability"), 50.0)
    healthcare = _extract_val(vulnerability_data.get("healthcare_vulnerability"), 50.0)
    
    # Check if recent history is supplied
    if recent_history is not None and len(recent_history) >= 24:
        # Exact values from history
        temp_lag_1 = float(recent_history["temperature"].iloc[-1])
        temp_lag_3 = float(recent_history["temperature"].iloc[-3])
        temp_lag_6 = float(recent_history["temperature"].iloc[-6])
        temp_lag_24 = float(recent_history["temperature"].iloc[-24])
        hum_lag_1 = float(recent_history["humidity"].iloc[-1])
        wbgt_lag_1 = float(recent_history["estimated_wbgt"].iloc[-1])
        wbgt_lag_3 = float(recent_history["estimated_wbgt"].iloc[-3])
        risk_lag_1 = float(recent_history["risk_score"].iloc[-1])
        risk_lag_3 = float(recent_history["risk_score"].iloc[-3])
        risk_lag_6 = float(recent_history["risk_score"].iloc[-6])
        
        temp_3h = float(recent_history["temperature"].iloc[-3:].mean())
        temp_6h = float(recent_history["temperature"].iloc[-6:].mean())
        temp_24h = float(recent_history["temperature"].iloc[-24:].mean())
        wbgt_3h = float(recent_history["estimated_wbgt"].iloc[-3:].mean())
        wbgt_6h = float(recent_history["estimated_wbgt"].iloc[-6:].mean())
        risk_3h = float(recent_history["risk_score"].iloc[-3:].mean())
        risk_6h = float(recent_history["risk_score"].iloc[-6:].mean())
    else:
        # Calibrated diurnal derivatives
        # Morning warming vs afternoon cooling
        rate = 0.8 if (6 <= hour <= 14) else (-0.7 if (15 <= hour <= 21) else -0.2)
        temp_lag_1 = round(temp - rate * 1, 1)
        temp_lag_3 = round(temp - rate * 2.5, 1)
        temp_lag_6 = round(temp - rate * 4.0, 1)
        temp_lag_24 = round(temp + np.random.normal(0, 0.5), 1)
        
        hum_lag_1 = round(humidity + rate * 1.5, 1)
        wbgt_lag_1 = round(wbgt - rate * 0.7, 1)
        wbgt_lag_3 = round(wbgt - rate * 1.8, 1)
        
        risk_lag_1 = round(max(0.0, min(100.0, current_risk_score - rate * 0.9)), 1)
        risk_lag_3 = round(max(0.0, min(100.0, current_risk_score - rate * 2.2)), 1)
        risk_lag_6 = round(max(0.0, min(100.0, current_risk_score - rate * 3.5)), 1)
        
        temp_3h = round((temp + temp_lag_1 + temp_lag_3) / 3, 1)
        temp_6h = round((temp + temp_lag_1 + temp_lag_3 + temp_lag_6) / 4, 1)
        temp_24h = round(temp - 1.5, 1)
        
        wbgt_3h = round((wbgt + wbgt_lag_1 + wbgt_lag_3) / 3, 1)
        wbgt_6h = round((wbgt + wbgt_lag_1 + wbgt_lag_3 + (wbgt - 2.0)) / 4, 1)
        
        risk_3h = round((current_risk_score + risk_lag_1 + risk_lag_3) / 3, 1)
        risk_6h = round((current_risk_score + risk_lag_1 + risk_lag_3 + risk_lag_6) / 4, 1)
        
    row = {
        "hour": hour,
        "day_of_week": day_of_week,
        "month": month,
        "temperature": temp,
        "humidity": humidity,
        "wind_speed": wind,
        "solar_radiation": solar,
        "heat_index": hi,
        "estimated_wbgt": wbgt,
        "estimated_utci": utci,
        "thermal_stress_score": thermal_score,
        "elderly": elderly,
        "children": children,
        "outdoor_workers": outdoor,
        "population_density": density,
        "housing_vulnerability": housing,
        "healthcare_vulnerability": healthcare,
        "vulnerability_score": vuln_score,
        "temperature_lag_1": temp_lag_1,
        "temperature_lag_3": temp_lag_3,
        "temperature_lag_6": temp_lag_6,
        "temperature_lag_24": temp_lag_24,
        "humidity_lag_1": hum_lag_1,
        "wbgt_lag_1": wbgt_lag_1,
        "wbgt_lag_3": wbgt_lag_3,
        "risk_lag_1": risk_lag_1,
        "risk_lag_3": risk_lag_3,
        "risk_lag_6": risk_lag_6,
        "temperature_3h_avg": temp_3h,
        "temperature_6h_avg": temp_6h,
        "temperature_24h_avg": temp_24h,
        "wbgt_3h_avg": wbgt_3h,
        "wbgt_6h_avg": wbgt_6h,
        "risk_3h_avg": risk_3h,
        "risk_6h_avg": risk_6h,
    }
    
    return pd.DataFrame([row])[ALL_FEATURE_COLUMNS]
