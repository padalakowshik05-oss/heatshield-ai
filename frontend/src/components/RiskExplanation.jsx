function RiskExplanation({
  temperature,
  humidity,
  solarRadiation,
  windSpeed
}) {

  // --------------------------------
  // Calculate factor strengths
  // --------------------------------

  // Temperature
  const temperatureStrength = Math.min(
    Math.max(
      ((temperature - 30) / 15) * 100,
      0
    ),
    100
  );


  // Humidity
  const humidityStrength = Math.min(
    Math.max(
      ((humidity - 40) / 60) * 100,
      0
    ),
    100
  );


  // Solar Radiation
  const solarStrength = Math.min(
    Math.max(
      (solarRadiation / 1000) * 100,
      0
    ),
    100
  );


  // Wind
  // Lower wind = greater heat stress
  const windStrength = Math.min(
    Math.max(
      ((15 - windSpeed) / 15) * 100,
      0
    ),
    100
  );


  // --------------------------------
  // Determine explanation
  // --------------------------------

  let reason = "WHY IS THE RISK HIGH?";


  if (
    temperature >= 38 ||
    humidity >= 70 ||
    solarRadiation >= 700 ||
    windSpeed <= 8
  ) {

    reason = "WHY IS THE RISK HIGH?";

  }
  else {

    reason = "WHAT IS AFFECTING THERMAL STRESS?";

  }


  // --------------------------------
  // Factor component
  // --------------------------------

  function Factor({
    icon,
    name,
    value,
    unit,
    strength
  }) {

    return (

      <div className="mb-6">

        {/* Label */}

        <div className="flex justify-between items-center mb-2">

          <div className="flex items-center gap-2">

            <span className="text-xl">
              {icon}
            </span>

            <span className="text-slate-300">
              {name}
            </span>

          </div>


          <span className="text-slate-400 text-sm">

            {value}
            {unit}

          </span>

        </div>


        {/* Bar */}

        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">

          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{
              width: `${strength}%`
            }}
          />

        </div>


        {/* Strength */}

        <div className="text-right mt-1">

          <span className="text-xs text-slate-500">

            {Math.round(strength)}% contribution strength

          </span>

        </div>

      </div>

    );

  }


  // --------------------------------
  // UI
  // --------------------------------

  return (

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">


      {/* Header */}

      <div className="mb-7">

        <h2 className="text-xl font-semibold">

          {reason}

        </h2>


        <p className="text-slate-500 text-sm mt-2">

          Rule-based explanation from current weather conditions

        </p>

      </div>


      {/* Temperature */}

      <Factor
        icon="🌡️"
        name="High temperature"
        value={temperature}
        unit="°C"
        strength={temperatureStrength}
      />


      {/* Humidity */}

      <Factor
        icon="💧"
        name="High humidity"
        value={humidity}
        unit="%"
        strength={humidityStrength}
      />


      {/* Solar */}

      <Factor
        icon="☀️"
        name="Strong solar radiation"
        value={solarRadiation}
        unit=" W/m²"
        strength={solarStrength}
      />


      {/* Wind */}

      <Factor
        icon="💨"
        name="Low wind"
        value={windSpeed}
        unit=" km/h"
        strength={windStrength}
      />


      {/* Explanation note */}

      <div className="border-t border-slate-800 pt-4 mt-2">

        <p className="text-xs text-slate-500">

          These explanations are rule-based.
          Future ML predictions can use SHAP for
          model-specific explanations.

        </p>

      </div>


    </div>

  );

}


export default RiskExplanation;