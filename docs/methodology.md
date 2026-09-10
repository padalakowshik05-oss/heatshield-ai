# HeatShield AI - Scientific Methodology

## 1. Purpose

HeatShield AI is a prototype heat-health early warning system.

The system combines meteorological variables such as:

- Air temperature
- Relative humidity
- Wind speed
- Solar radiation

to estimate human heat stress.

The project uses a combination of established scientific formulas and
prototype approximations.

Scientific formulas should not be replaced by arbitrary AI-generated
equations without checking their source and validity.

---

# 2. Scientific Methodology Principle

For every scientific calculation, we follow:

Source
  ↓
Formula / Published Method
  ↓
Implementation
  ↓
Test
  ↓
Validation

AI-generated code is treated as implementation assistance only.

AI-generated formulas are NOT automatically considered scientifically valid.

---

# 3. Heat Index

## Purpose

Heat Index estimates how hot conditions feel to the human body by
combining air temperature and relative humidity.

## Method

HeatShield AI uses the Rothfusz regression approach for the Heat Index.

The Rothfusz regression was published by the U.S. National Weather Service
and uses temperature in degrees Fahrenheit and relative humidity in percent.

The equation is:

HI = -42.379
     + 2.04901523*T
     + 10.14333127*RH
     - 0.22475541*T*RH
     - 0.00683783*T²
     - 0.05481717*RH²
     + 0.00122874*T²*RH
     + 0.00085282*T*RH²
     - 0.00000199*T²*RH²

where:

T  = temperature in °F
RH = relative humidity in %

The resulting Heat Index is converted back to °C.

## Important limitation

The Rothfusz regression is not intended for all combinations of
temperature and humidity. The National Weather Service documents
additional adjustments and applicability considerations.

Therefore, HeatShield AI treats this calculation as one component
of the overall heat-risk assessment rather than as a complete
human heat-stress model.

## Source

U.S. National Weather Service:

https://www.weather.gov/tbw/heatindex

Rothfusz, L. P. (1990), National Weather Service Technical Attachment
SR 90-23.

---

# 4. Wet-Bulb Temperature

## Purpose

Wet-bulb temperature provides an indication of the atmosphere's
evaporative cooling conditions.

High humidity reduces the effectiveness of sweat evaporation,
which can increase heat stress.

## Method

HeatShield AI currently uses an approximate wet-bulb temperature
calculation for prototype heat-stress estimation.

The implementation is based on the commonly used approximate
wet-bulb equation implemented in the project.

## Important limitation

This is an approximation.

It should NOT be described as an instrument-grade wet-bulb
measurement.

The value is used as an input to the prototype heat-stress model.

---

# 5. Globe Temperature

## Purpose

Globe temperature represents the combined influence of air
temperature and radiant heat.

Solar radiation can substantially increase heat load on a person
outdoors.

## Method

HeatShield AI currently estimates globe temperature using:

solar_effect = 0.02 * solar_radiation

wind_effect = max(wind_speed, 1)

globe_temperature =
    air_temperature
    + solar_effect / sqrt(wind_effect)

## Important limitation

This is a simplified prototype approximation.

It is NOT a physical black-globe thermometer model and should not
be presented as a directly measured globe temperature.

The purpose is to estimate additional radiative heat load from
available solar-radiation and wind data.

---

# 6. Estimated WBGT

## Purpose

Wet Bulb Globe Temperature (WBGT) is a widely used environmental
heat-stress index.

For outdoor conditions with solar radiation, the standard weighting
is:

WBGT_out =
    0.7 * natural wet-bulb temperature
    + 0.2 * globe temperature
    + 0.1 * dry-bulb temperature

HeatShield AI uses this weighting structure for its prototype
estimated WBGT.

## Important limitation

The project does not directly measure natural wet-bulb temperature
or globe temperature with physical instruments.

Therefore, the system currently produces:

"Estimated WBGT"

rather than claiming to produce instrument-measured WBGT.

The wet-bulb and globe temperatures used by the prototype are
estimated from meteorological inputs.

## Sources

U.S. OSHA Technical Manual:
https://www.osha.gov/otm/section-3-health-hazards/chapter-4

NIOSH / CDC documentation on WBGT:
https://www.cdc.gov/niosh/

---

# 7. UTCI

## Purpose

The Universal Thermal Climate Index (UTCI) is a more comprehensive
outdoor thermal-stress index.

It considers:

- Air temperature
- Mean radiant temperature
- Wind speed
- Relative humidity / water vapour

## Implementation

HeatShield AI uses the pythermalcomfort Python package rather than
reimplementing the UTCI mathematical model manually.

Example:

from pythermalcomfort.models import utci

result = utci(
    tdb=temperature,
    tr=mean_radiant_temperature,
    v=wind_speed_ms,
    rh=humidity
)

The UTCI result is obtained using:

result.utci

The thermal stress classification is obtained using:

result.stress_category

## Units

The pythermalcomfort UTCI implementation expects SI units:

tdb = air temperature in °C

tr = mean radiant temperature in °C

v = wind speed at 10 m in m/s

rh = relative humidity in %

Therefore, weather API wind speed must be converted to m/s
when necessary.

For example:

wind_speed_ms = wind_speed_kmh / 3.6

## Important limitation

UTCI requires mean radiant temperature.

Solar radiation is not simply substituted for mean radiant
temperature.

HeatShield AI therefore treats the current radiant-temperature
estimate as a prototype input and clearly labels the resulting
UTCI calculation accordingly.

## Source

pythermalcomfort documentation:

https://pythermalcomfort.readthedocs.io/en/latest/documentation/models.html

The pythermalcomfort package implements UTCI based on published
thermal-stress research and provides the UTCI stress category.

---

# 8. Weather Data

HeatShield AI obtains meteorological information from the
Open-Meteo weather API.

The project currently uses:

- Temperature
- Relative humidity
- Wind speed
- Shortwave solar radiation

These variables are mapped into the thermal calculations.

---

# 9. Unit Conversion

All scientific calculations must use the units expected by the
corresponding model.

Examples:

Temperature:

Weather API → °C

Heat Index:

°C → °F for Rothfusz calculation → °C

Wind:

km/h → m/s for UTCI

Conversion:

m/s = km/h / 3.6

Solar radiation:

W/m²

Relative humidity:

%

---

# 10. Validation Strategy

Each calculation is tested independently before being connected
to the complete risk engine.

Example:

Temperature
+
Humidity
    ↓
Heat Index

Temperature
+
Humidity
    ↓
Wet-Bulb Temperature

Temperature
+
Solar Radiation
+
Wind
    ↓
Estimated Globe Temperature

Wet-Bulb
+
Globe Temperature
+
Temperature
    ↓
Estimated WBGT

Temperature
+
Mean Radiant Temperature
+
Wind
+
Humidity
    ↓
UTCI

---

# 11. Scientific Safety

HeatShield AI is a hackathon prototype.

It is not a medical diagnostic system.

It should not be used as a substitute for:

- Official weather warnings
- Medical advice
- Occupational safety procedures
- Professional heat-stress monitoring
- Physical WBGT instrumentation

The purpose of the system is to demonstrate how multiple
meteorological variables can be combined to provide more
human-centered heat-risk information than temperature alone.

---

# 12. AI Usage Policy

AI coding assistants such as Gemini or other coding tools may be
used to help implement the software.

However:

AI-generated scientific formulas must not be accepted without
verification.

For every scientific formula:

1. Identify the scientific source.
2. Check the formula.
3. Implement it.
4. Test it with known or expected values.
5. Document its limitations.

Example of an unacceptable approach:

utci = temperature + humidity * 0.5

This equation should NOT be used simply because an AI generated it.

---

# 13. Current Method Classification

| Component | Method | Status |
|---|---|---|
| Heat Index | Rothfusz regression | Established formula |
| Wet-Bulb | Approximate equation | Prototype approximation |
| Globe Temperature | Solar + wind approximation | Prototype approximation |
| WBGT | 0.7 / 0.2 / 0.1 outdoor weighting | Established WBGT structure |
| UTCI | pythermalcomfort implementation | Validated published model implementation |
| Overall Risk Score | HeatShield AI design | Prototype |

---

# 14. Presentation Statement

For the hackathon presentation:

"We combine established thermal-stress indices with transparent
prototype estimations. Established models such as Rothfusz Heat
Index and UTCI are sourced from published methodologies or
maintained scientific libraries, while our estimated globe
temperature and WBGT pipeline are clearly identified as prototype
approximations."

---

# 15. Future Improvements

Future versions can improve the system by:

- Using a physically based outdoor WBGT model
- Improving mean radiant temperature estimation
- Using solar position and cloud information
- Incorporating barometric pressure
- Using validated meteorological WBGT algorithms
- Adding location-specific heat-health thresholds
- Comparing predictions against weather-station observations
- Adding uncertainty estimates
- Validating results against official heat-health advisories