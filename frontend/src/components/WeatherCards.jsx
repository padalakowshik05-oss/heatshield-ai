import React from "react";

export function WeatherCards({
  location,
  isLoading = false,
  error = null,
  isLive = false,
  onRetry,
}) {
  const loc = location || {};

  const cards = [
    {
      title: "Temperature",
      icon: "🌡",
      value: loc.temperature != null ? loc.temperature : "--",
      unit: "°C",
      textColor: "text-red-400",
    },
    {
      title: "Humidity",
      icon: "💧",
      value: loc.humidity != null ? loc.humidity : "--",
      unit: "%",
      textColor: "text-blue-400",
    },
    {
      title: "Wind Speed",
      icon: "🌬",
      value: loc.windSpeed != null ? loc.windSpeed : "--",
      unit: "km/h",
      textColor: "text-teal-400",
    },
    {
      title: "Solar Radiation",
      icon: "☀",
      value: loc.solarRadiation != null ? loc.solarRadiation : "--",
      unit: "W/m²",
      textColor: "text-amber-400",
    },
  ];

  return (
    <div>
      {/* Live Status / Loading / Error Strip */}
      {isLoading && (
        <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 mb-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-amber-300 font-sans">Loading live weather from Open-Meteo...</span>
          </div>
          <span className="text-[10px] text-slate-500">Open-Meteo Synoptic API</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex items-center justify-between text-xs text-amber-200 bg-amber-950/40 border border-amber-800/60 rounded-lg px-3 py-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>Unable to load live weather data. {error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 cursor-pointer transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && isLive && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
              LIVE WEATHER • OPEN-METEO
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              ({loc.name || "Station"} • {loc.latitude?.toFixed?.(2) ?? loc.latitude}°N, {loc.longitude?.toFixed?.(2) ?? loc.longitude}°E)
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Synoptic Observations</span>
        </div>
      )}

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-between transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{card.title}</span>
            <span className="text-base leading-none">{card.icon}</span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-mono font-bold ${card.textColor} tabular-nums`}>
              {card.value}
            </span>
            <span className="text-xs font-mono text-slate-400 font-medium">
              {card.unit}
            </span>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

export default WeatherCards;
