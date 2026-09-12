import React from "react";

export function Forecast({ location }) {
  const loc = location || {
    name: "Tadepalligudem",
    forecast: [],
  };

  const forecastData = loc.forecast || [];

  if (!forecastData || forecastData.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs text-center text-xs text-slate-400 font-mono">
        Forecast data unavailable for {loc.name}.
      </div>
    );
  }

  const getBadgeStyle = (category) => {
    switch (category) {
      case "EXTREME":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "MODERATE":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
          <span>📅</span>
          <span>5-Day Heat Risk Forecast — {loc.name}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Only for {loc.name}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {forecastData.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-center flex flex-col justify-between"
          >
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              {item.day}
            </span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white my-1">
              {item.temp}°C
            </span>
            <span
              className={`mt-1 text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border inline-block ${getBadgeStyle(
                item.category
              )}`}
            >
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Forecast;
