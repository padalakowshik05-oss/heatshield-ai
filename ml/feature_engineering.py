import pandas as pd


# Load dataset
df = pd.read_csv(
    "data/heat_risk_dataset.csv"
)


# Convert timestamp to datetime
df["timestamp"] = pd.to_datetime(
    df["timestamp"]
)


# ------------------------------------------------
# TIME FEATURES
# ------------------------------------------------

df["hour"] = df["timestamp"].dt.hour

df["day"] = df["timestamp"].dt.day

df["month"] = df["timestamp"].dt.month

df["day_of_year"] = (
    df["timestamp"].dt.dayofyear
)


# ------------------------------------------------
# LAG FEATURES
# ------------------------------------------------

# Previous hour temperature
df["temperature_previous_hour"] = (
    df["temperature"].shift(1)
)


# Previous day temperature
df["temperature_previous_day"] = (
    df["temperature"].shift(24)
)


# Previous hour humidity
df["humidity_previous_hour"] = (
    df["humidity"].shift(1)
)


# Previous hour WBGT
df["wbgt_previous_hour"] = (
    df["estimated_wbgt"].shift(1)
)


# ------------------------------------------------
# DISPLAY
# ------------------------------------------------

print("\nDataset with time and lag features:\n")

print(
    df[
        [
            "timestamp",
            "temperature",
            "temperature_previous_hour",
            "temperature_previous_day",
            "humidity",
            "humidity_previous_hour",
            "estimated_wbgt",
            "wbgt_previous_hour"
        ]
    ]
)


# ------------------------------------------------
# SAVE
# ------------------------------------------------

df.to_csv(
    "data/heat_risk_dataset.csv",
    index=False
)

print(
    "\nTime and lag features added successfully."
)