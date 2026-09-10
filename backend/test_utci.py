from pythermalcomfort.models import utci


# Test weather conditions
temperature = 40.0       # °C
mean_radiant_temp = 45.0 # °C
wind_speed = 10.0        # km/h
humidity = 70.0          # %


# Convert wind speed from km/h to m/s
wind_speed_ms = wind_speed / 3.6


# Calculate UTCI
result = utci(
    tdb=temperature,
    tr=mean_radiant_temp,
    v=wind_speed_ms,
    rh=humidity
)


# Display results
print("Temperature:", temperature, "°C")
print("Mean Radiant Temperature:", mean_radiant_temp, "°C")
print("Wind Speed:", wind_speed, "km/h")
print("Wind Speed:", round(wind_speed_ms, 2), "m/s")
print("Humidity:", humidity, "%")

print("UTCI:", result.utci, "°C")
print("Stress Category:", result.stress_category)