import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from services.thermal_service import (
    calculate_heat_index,
    calculate_estimated_wbgt,
    calculate_estimated_utci,
    calculate_thermal_stress_score,
)
from services.vulnerability_service import (
    WEST_GODAVARI_VULNERABILITY,
    get_vulnerability_data,
)
from services.risk_service import (
    calculate_final_risk,
    get_risk_category,
)


def generate_prototype_dataset(
    start_date: str = "2025-03-01",
    days: int = 180,
    output_path: str = None,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate a reproducible, scientifically grounded prototype dataset
    of hourly meteorological observations and derived HeatShield risk scores
    for all 19 West Godavari mandals.
    
    Covers the hot pre-monsoon, peak summer, and monsoon seasons
    with realistic diurnal curves, inland vs coastal microclimates,
    and heatwave episodes.
    """
    np.random.seed(seed)
    
    if output_path is None:
        output_path = os.path.join(BACKEND_DIR, "data", "heat_risk_dataset.csv")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    total_hours = days * 24
    timestamps = [start_dt + timedelta(hours=h) for h in range(total_hours)]
    
    records = []
    
    # Coordinates and microclimate profiles for the 19 mandals
    # Coastal locations (e.g. Narsapur, Mogalthur) have higher humidity and sea breeze dampening
    # Inland locations (e.g. Jangareddygudem, Kovvur) experience higher extreme temperatures
    coastal_areas = {"narsapur", "mogalthur", "palakollu", "achanta"}
    inland_hotspots = {"jangareddygudem", "kovvur", "tadepalligudem", "tanuku"}
    
    locations = list(WEST_GODAVARI_VULNERABILITY.keys())
    print(f"Generating synthetic meteorological dataset across {len(locations)} locations for {days} days ({total_hours} hours each)...")
    
    for area_key in locations:
        vuln_data = get_vulnerability_data(area_key)
        area_name = vuln_data["area"]
        is_coastal = area_key in coastal_areas
        is_inland_hot = area_key in inland_hotspots
        
        # Base microclimate offsets
        temp_bias = 1.8 if is_inland_hot else (-1.2 if is_coastal else 0.0)
        humidity_bias = 8.0 if is_coastal else (-4.0 if is_inland_hot else 0.0)
        
        for t_idx, ts in enumerate(timestamps):
            hour = ts.hour
            month = ts.month
            day_of_year = ts.timetuple().tm_yday
            day_of_week = ts.weekday()
            
            # 1. Seasonal baseline temperature (peaks in May, day of year ~140)
            # March (DOY 60-90): ~32°C, May (DOY 120-150): ~39°C, July/August (DOY 180-240): ~33°C
            seasonal_temp = 32.0 + 7.5 * np.sin(np.pi * (day_of_year - 60) / 100)
            
            # Heatwave episodes (random but smoothed multi-day heat surges in May/June)
            heatwave_surge = 0.0
            if 125 <= day_of_year <= 155:
                # May heatwave cluster
                heatwave_surge = 3.5 * np.sin(day_of_year * 0.4) + 2.0
            
            # 2. Diurnal temperature curve (minimum at 05:00, maximum at 14:00)
            diurnal_cycle = -np.cos(2 * np.pi * (hour - 5) / 24)
            diurnal_amplitude = 5.5 if not is_coastal else 3.8
            temp_noise = np.random.normal(0, 0.6)
            
            temperature = round(float(seasonal_temp + heatwave_surge + (diurnal_amplitude * diurnal_cycle) + temp_bias + temp_noise), 1)
            temperature = max(18.0, min(temperature, 48.5))
            
            # 3. Relative humidity (inversely related to diurnal temperature)
            seasonal_rh = 60.0 + 15.0 * np.sin(np.pi * (day_of_year - 90) / 120)  # Monsoons are humid
            diurnal_rh = -0.7 * (temperature - seasonal_temp) * 3.5
            rh_noise = np.random.normal(0, 2.0)
            humidity = round(float(seasonal_rh + diurnal_rh + humidity_bias + rh_noise), 1)
            humidity = max(20.0, min(humidity, 96.0))
            
            # 4. Solar radiation (0 at night, sinusoidal bell curve 06:00 - 18:00)
            if 6 <= hour <= 18:
                solar_peak = 920.0 if month in [4, 5] else 750.0  # Clouds in July/August
                solar_val = solar_peak * np.sin(np.pi * (hour - 6) / 12) + np.random.normal(0, 25.0)
                solar_radiation = round(float(max(0.0, min(solar_val, 1050.0))), 1)
            else:
                solar_radiation = 0.0
                
            # 5. Wind speed (typically 6 - 22 km/h, pick up in afternoon)
            wind_base = 12.0 + (5.0 if is_coastal else 0.0)
            wind_noise = np.random.normal(0, 2.5)
            wind_speed = round(float(max(2.0, wind_base + 3.0 * np.sin(np.pi * (hour - 8) / 12) + wind_noise)), 1)
            
            # Step 3 Thermal Metrics (extract numeric values from dict responses)
            hi_res = calculate_heat_index(temperature, humidity)
            wbgt_res = calculate_estimated_wbgt(temperature, humidity, wind_speed, solar_radiation)
            utci_res = calculate_estimated_utci(temperature, humidity, wind_speed, solar_radiation)
            
            hi_val = hi_res.get("value")
            wbgt_val = wbgt_res.get("value")
            utci_val = utci_res.get("value")
            
            thermal_score = calculate_thermal_stress_score(hi_val, wbgt_val, utci_val)
            
            # Step 4 Vulnerability & Composite Risk
            vuln_score = vuln_data["vulnerability_score"]
            risk_score = calculate_final_risk(thermal_score, vuln_score)
            
            records.append({
                "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "area": area_name,
                "hour": hour,
                "day_of_week": day_of_week,
                "month": month,
                "temperature": temperature,
                "humidity": humidity,
                "wind_speed": wind_speed,
                "solar_radiation": solar_radiation,
                "heat_index": hi_val,
                "estimated_wbgt": wbgt_val,
                "estimated_utci": utci_val,
                "thermal_stress_score": thermal_score,
                "elderly": vuln_data["elderly"],
                "children": vuln_data["children"],
                "outdoor_workers": vuln_data["outdoor_workers"],
                "population_density": vuln_data["population_density"],
                "housing_vulnerability": vuln_data["housing_vulnerability"],
                "healthcare_vulnerability": vuln_data["healthcare_vulnerability"],
                "vulnerability_score": vuln_score,
                "risk_score": risk_score,
            })
            
    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Prototype dataset successfully generated: {len(df)} records saved to {output_path}")
    return df


if __name__ == "__main__":
    generate_prototype_dataset()
