function RiskExplanation({
  temperature,
  humidity,
  solarRadiation,
  windSpeed,
  heatIndex,
  wbgt,
  utci,
  thermalScore,
  vulnerabilityScore,
  vulnerabilityCategory,
  riskScore,
  riskCategory
}) {


  // ============================================================
  // FACTOR STRENGTHS
  // ============================================================

  const temperatureStrength = Math.min(
    Math.max(
      ((temperature - 30) / 15) * 100,
      0
    ),
    100
  );


  const humidityStrength = Math.min(
    Math.max(
      ((humidity - 40) / 60) * 100,
      0
    ),
    100
  );


  const solarStrength = Math.min(
    Math.max(
      (solarRadiation / 1000) * 100,
      0
    ),
    100
  );


  const windStrength = Math.min(
    Math.max(
      ((15 - windSpeed) / 15) * 100,
      0
    ),
    100
  );


  // ============================================================
  // HELPERS
  // ============================================================

  function getLevel(value) {

    if (value === undefined || value === null) {
      return "--";
    }

    if (value >= 75) {
      return "VERY HIGH";
    }

    if (value >= 50) {
      return "HIGH";
    }

    if (value >= 25) {
      return "MODERATE";
    }

    return "LOW";
  }


  function Factor({
    icon,
    name,
    value,
    unit,
    strength
  }) {

    return (

      <div className="mb-6">

        <div className="
          flex
          justify-between
          items-center
          mb-2
        ">

          <div className="
            flex
            items-center
            gap-2
          ">

            <span className="text-xl">
              {icon}
            </span>

            <span className="text-slate-300">
              {name}
            </span>

          </div>

          <span className="
            text-slate-400
            text-sm
          ">

            {value !== undefined &&
            value !== null
              ? `${value}${unit}`
              : "--"}

          </span>

        </div>


        <div className="
          w-full
          h-3
          bg-slate-800
          rounded-full
          overflow-hidden
        ">

          <div
            className="
              h-full
              rounded-full
              bg-orange-500
              transition-all
              duration-500
            "
            style={{
              width: `${strength}%`
            }}
          />

        </div>


        <div className="
          text-right
          mt-1
        ">

          <span className="
            text-xs
            text-slate-500
          ">
            {Math.round(strength)}% contribution strength
          </span>

        </div>

      </div>

    );

  }


  // ============================================================
  // MAIN
  // ============================================================

  return (

    <div className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      p-6
    ">


      {/* ======================================================
          TITLE
      ====================================================== */}

      <div className="mb-8">

        <h2 className="
          text-xl
          font-semibold
        ">
          WHY IS THIS AREA AT {riskCategory || "CURRENT"} RISK?
        </h2>

        <p className="
          text-slate-500
          text-sm
          mt-2
        ">
          Explanation based on current environmental
          conditions and population vulnerability.
        </p>

      </div>


      {/* ======================================================
          ENVIRONMENTAL FACTORS
      ====================================================== */}

      <div>

        <h3 className="
          text-lg
          font-semibold
          mb-5
        ">
          Environmental Factors
        </h3>


        <Factor
          icon="🌡️"
          name="Temperature"
          value={temperature}
          unit="°C"
          strength={temperatureStrength}
        />


        <Factor
          icon="💧"
          name="Humidity"
          value={humidity}
          unit="%"
          strength={humidityStrength}
        />


        <Factor
          icon="☀️"
          name="Solar Radiation"
          value={solarRadiation}
          unit=" W/m²"
          strength={solarStrength}
        />


        <Factor
          icon="💨"
          name="Low Wind"
          value={windSpeed}
          unit=" km/h"
          strength={windStrength}
        />

      </div>


      {/* ======================================================
          THERMAL METRICS
      ====================================================== */}

      <div className="
        border-t
        border-slate-800
        mt-8
        pt-6
      ">

        <h3 className="
          text-lg
          font-semibold
          mb-5
        ">
          Thermal Stress
        </h3>


        <div className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-4
        ">


          <div className="
            bg-slate-800/50
            rounded-xl
            p-4
          ">

            <p className="text-slate-500 text-sm">
              Heat Index
            </p>

            <p className="
              text-xl
              font-bold
              mt-1
            ">
              {heatIndex !== undefined
                ? `${heatIndex}°C`
                : "--"}
            </p>

          </div>


          <div className="
            bg-slate-800/50
            rounded-xl
            p-4
          ">

            <p className="text-slate-500 text-sm">
              WBGT
            </p>

            <p className="
              text-xl
              font-bold
              mt-1
            ">
              {wbgt !== undefined
                ? `${wbgt}°C`
                : "--"}
            </p>

          </div>


          <div className="
            bg-slate-800/50
            rounded-xl
            p-4
          ">

            <p className="text-slate-500 text-sm">
              UTCI
            </p>

            <p className="
              text-xl
              font-bold
              mt-1
            ">
              {utci !== undefined &&
              utci !== null
                ? `${utci}°C`
                : "--"}
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          POPULATION FACTORS
      ====================================================== */}

      <div className="
        border-t
        border-slate-800
        mt-8
        pt-6
      ">

        <h3 className="
          text-lg
          font-semibold
          mb-5
        ">
          Population Factors
        </h3>


        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
        ">


          {/* Outdoor Workers */}

          <div className="
            bg-slate-800/50
            rounded-xl
            p-4
          ">

            <p className="text-slate-500 text-sm">
              Outdoor Workers
            </p>

            <p className="
              text-xl
              font-bold
              mt-1
            ">
              {vulnerabilityCategory || "--"}
            </p>

          </div>


          {/* Elderly */}

          <div className="
            bg-slate-800/50
            rounded-xl
            p-4
          ">

            <p className="text-slate-500 text-sm">
              Elderly Population
            </p>

            <p className="
              text-xl
              font-bold
              mt-1
            ">
              {getLevel(
                vulnerabilityScore
              )}
            </p>

          </div>


          {/* Population Density */}

          <div className="
            bg-slate-800/50
            rounded-xl
            p-4
          ">

            <p className="text-slate-500 text-sm">
              Population Density
            </p>

            <p className="
              text-xl
              font-bold
              mt-1
            ">
              {getLevel(
                vulnerabilityScore
              )}
            </p>

          </div>


          {/* Healthcare */}

          <div className="
            bg-slate-800/50
            rounded-xl
            p-4
          ">

            <p className="text-slate-500 text-sm">
              Healthcare Access
            </p>

            <p className="
              text-xl
              font-bold
              mt-1
            ">
              {vulnerabilityScore !== undefined
                ? "Needs Assessment"
                : "--"}
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          OVERALL
      ====================================================== */}

      <div className="
        border-t
        border-slate-800
        mt-8
        pt-6
      ">

        <h3 className="
          text-lg
          font-semibold
          mb-5
        ">
          Overall
        </h3>


        <div className="
          space-y-4
        ">


          {/* Thermal */}

          <div className="
            flex
            justify-between
            items-center
          ">

            <span className="text-slate-400">
              Thermal Stress
            </span>

            <span className="
              font-bold
            ">

              {thermalScore !== undefined &&
              thermalScore !== null
                ? `${thermalScore}/100`
                : "--"}

            </span>

          </div>


          {/* Vulnerability */}

          <div className="
            flex
            justify-between
            items-center
          ">

            <span className="text-slate-400">
              Vulnerability
            </span>

            <span className="
              font-bold
            ">

              {vulnerabilityScore !== undefined
                ? `${vulnerabilityScore}/100`
                : "--"}

            </span>

          </div>


          {/* Risk */}

          <div className="
            border-t
            border-slate-800
            pt-4
            flex
            justify-between
            items-center
          ">

            <span className="
              text-slate-300
              font-semibold
            ">
              Heat Health Risk
            </span>

            <div className="text-right">

              <p className="
                text-2xl
                font-bold
              ">

                {riskScore !== undefined &&
                riskScore !== null
                  ? `${riskScore}/100`
                  : "--"}

              </p>

              <p className="
                text-orange-400
                font-semibold
              ">

                {riskCategory || "--"}

              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          DISCLAIMER
      ====================================================== */}

      <div className="
        border-t
        border-slate-800
        pt-5
        mt-6
      ">

        <p className="
          text-xs
          text-slate-500
        ">
          Risk explanations are based on prototype
          rule-based indicators. The 70:30 thermal-to-
          vulnerability weighting is a prototype design
          choice and should be validated using historical
          health outcome data.
        </p>

      </div>

    </div>

  );

}


export default RiskExplanation;