function ThermalRiskCard({
  riskCategory,
  thermalScore
}) {

  // --------------------------------
  // Risk configuration
  // --------------------------------

  const riskConfig = {

    LOW: {
      emoji: "🟢",
      label: "LOW RISK",
      textColor: "text-green-400",
      borderColor: "border-green-500/30",
      backgroundColor: "bg-green-500/10"
    },

    MODERATE: {
      emoji: "🟡",
      label: "MODERATE RISK",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/30",
      backgroundColor: "bg-yellow-500/10"
    },

    HIGH: {
      emoji: "🟠",
      label: "HIGH RISK",
      textColor: "text-orange-400",
      borderColor: "border-orange-500/30",
      backgroundColor: "bg-orange-500/10"
    },

    EXTREME: {
      emoji: "🔴",
      label: "EXTREME RISK",
      textColor: "text-red-500",
      borderColor: "border-red-500/30",
      backgroundColor: "bg-red-500/10"
    }

  };


  // --------------------------------
  // Select risk configuration
  // --------------------------------

  const risk =
    riskConfig[riskCategory] || {

      emoji: "⚠️",

      label: "RISK UNAVAILABLE",

      textColor: "text-slate-400",

      borderColor: "border-slate-700",

      backgroundColor: "bg-slate-800/50"

    };


  // --------------------------------
  // UI
  // --------------------------------

  return (

    <div
      className={`
        ${risk.backgroundColor}
        ${risk.borderColor}
        border
        rounded-2xl
        p-6
      `}
    >

      {/* Heading */}

      <p className="text-slate-400 text-sm uppercase tracking-wide">
        Thermal Risk
      </p>


      {/* Risk Indicator */}

      <div className="flex items-center gap-4 mt-5">

        <div className="text-5xl">
          {risk.emoji}
        </div>


        <div>

          <p
            className={`
              ${risk.textColor}
              text-3xl
              font-bold
            `}
          >
            {risk.label}
          </p>

          <p className="text-slate-400 mt-1">
            Current heat-health risk level
          </p>

        </div>

      </div>


      {/* Divider */}

      <div className="border-t border-slate-700/50 mt-6 pt-5">

        <p className="text-slate-400 text-sm">
          Thermal Stress Score
        </p>


        <p className="text-4xl font-bold mt-1">

          {thermalScore !== undefined &&
          thermalScore !== null
            ? `${thermalScore} / 100`
            : "--"}

        </p>

      </div>

    </div>

  );
}


export default ThermalRiskCard;