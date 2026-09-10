from services.thermal_service import (
    calculate_thermal_stress_score,
    get_risk_category
)


# Example normalized thermal metrics
heat_index = 50
wbgt = 35
utci = 40


# Calculate Thermal Stress Score
thermal_score = calculate_thermal_stress_score(
    heat_index,
    wbgt,
    utci
)


# Calculate risk category
risk_category = get_risk_category(
    thermal_score
)


print("==============================")
print("    HEATSHIELD AI SCORE")
print("==============================")

print()

print("Heat Index:", heat_index, "°C")
print("WBGT:", wbgt, "°C")
print("UTCI:", utci, "°C")

print()

print(
    "Thermal Stress Score:",
    thermal_score,
    "/ 100"
)

print(
    "Risk Category:",
    risk_category
)

print()
print("==============================")