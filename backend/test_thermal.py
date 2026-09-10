from services.thermal_service import (
    calculate_thermal_metrics
)


# --------------------------------
# Test weather conditions
# --------------------------------

temperature = 40.2
humidity = 71
wind_speed = 7.5
solar_radiation = 812


# --------------------------------
# Calculate thermal metrics
# --------------------------------

metrics = calculate_thermal_metrics(
    temperature,
    humidity,
    wind_speed,
    solar_radiation
)


# --------------------------------
# Display results
# --------------------------------

print("================================")
print("       HEATSHIELD AI TEST")
print("================================")

print()

print("Weather Conditions")
print("------------------")

print(
    "Temperature:",
    temperature,
    "°C"
)

print(
    "Humidity:",
    humidity,
    "%"
)

print(
    "Wind Speed:",
    wind_speed,
    "km/h"
)

print(
    "Solar Radiation:",
    solar_radiation,
    "W/m²"
)

print()

print("Thermal Metrics")
print("----------------")

print(
    "Heat Index:",
    metrics["thermal_metrics"]["heat_index"],
    "°C"
)

print(
    "Estimated WBGT:",
    metrics["thermal_metrics"]["estimated_wbgt"],
    "°C"
)

print()

print("================================")