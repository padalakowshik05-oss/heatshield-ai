import os
import sys

import requests
import pandas as pd


# ============================================================
# MAKE BACKEND AVAILABLE
# ============================================================

# This allows the script to import services/
# when executed from backend/scripts/
BACKEND_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


# ============================================================
# IMPORT EXISTING THERMAL FUNCTIONS
# ============================================================

from services.thermal_service import (
    calculate_heat_index,
    calculate_estimated_wbgt
)


# ============================================================
# FETCH HISTORICAL WEATHER DATA
# ============================================================

def fetch_historical_weather(
    latitude,
    longitude,
    start_date,
    end_date
):
    """
    Fetch historical hourly weather data
    from Open-Meteo Archive API.
    """

    url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
        "latitude": latitude,
        "longitude": longitude,

        "start_date": start_date,
        "end_date": end_date,

        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "shortwave_radiation"
        ],

        "timezone": "auto"
    }

    response = requests.get(
        url,
        params=params,
        timeout=30
    )

    response.raise_for_status()

    data = response.json()

    hourly = data["hourly"]

    df = pd.DataFrame({

        "timestamp":
            hourly["time"],

        "temperature":
            hourly["temperature_2m"],

        "humidity":
            hourly["relative_humidity_2m"],

        "wind_speed":
            hourly["wind_speed_10m"],

        "solar_radiation":
            hourly["shortwave_radiation"]

    })

    df["timestamp"] = pd.to_datetime(
        df["timestamp"]
    )

    return df


# ============================================================
# ADD THERMAL METRICS
# ============================================================

def add_thermal_metrics(df):
    """
    Calculate thermal metrics for every row
    in the historical weather dataset.

    Existing thermal service functions are reused.
    """

    # --------------------------------------------------------
    # Heat Index
    # --------------------------------------------------------

    df["heat_index"] = df.apply(
        lambda row: calculate_heat_index(
            row["temperature"],
            row["humidity"]
        ),
        axis=1
    )

    # --------------------------------------------------------
    # Estimated WBGT
    # --------------------------------------------------------

    df["estimated_wbgt"] = df.apply(
        lambda row: calculate_estimated_wbgt(
            row["temperature"],
            row["humidity"],
            row["wind_speed"],
            row["solar_radiation"]
        ),
        axis=1
    )

    # --------------------------------------------------------
    # UTCI
    #
    # UTCI will be added after pythermalcomfort
    # integration.
    # --------------------------------------------------------

    df["utci"] = None

    return df


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print(
        "Fetching historical weather data..."
    )

    # --------------------------------------------------------
    # Location
    # --------------------------------------------------------

    latitude = 16.3067
    longitude = 80.4365

    # --------------------------------------------------------
    # Historical period
    # --------------------------------------------------------

    start_date = "2026-08-01"
    end_date = "2026-08-07"

    # --------------------------------------------------------
    # Fetch weather data
    # --------------------------------------------------------

    df = fetch_historical_weather(
        latitude,
        longitude,
        start_date,
        end_date
    )

    print()
    print(
        "Historical weather data fetched successfully."
    )

    print()

    print("Original data:")
    print(df.head())

    print()

    # --------------------------------------------------------
    # STEP 23
    # Calculate thermal metrics
    # --------------------------------------------------------

    print(
        "Calculating thermal metrics..."
    )

    df = add_thermal_metrics(df)

    print()
    print(
        "Thermal metrics calculated successfully."
    )

    print()

    # --------------------------------------------------------
    # Display result
    # --------------------------------------------------------

    print("Historical data with thermal metrics:")

    print(
        df.head()
    )

    print()

    # --------------------------------------------------------
    # Display columns
    # --------------------------------------------------------

    print("Columns:")

    print(
        df.columns.tolist()
    )

    print()

    # --------------------------------------------------------
    # Data shape
    # --------------------------------------------------------

    print("Data shape:")

    print(
        df.shape
    )

    # --------------------------------------------------------
    # STEP 22
    # Save updated dataset
    # --------------------------------------------------------

    data_directory = os.path.join(
        BACKEND_DIR,
        "data"
    )

    os.makedirs(
        data_directory,
        exist_ok=True
    )

    output_file = os.path.join(
        data_directory,
        "historical_weather.csv"
    )

    df.to_csv(
        output_file,
        index=False
    )

    print()

    print(
        "Historical data saved successfully."
    )

    print()

    print(
        "File:"
    )

    print(
        output_file
    )