import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

/**
 * 5-Day Forecast Chart for the Dashboard
 */
export function ForecastChart({ forecast = [] }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-lg text-xs font-mono">
          <p className="font-bold text-slate-200 mb-1 font-sans">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-red-400">Max Temp:</span>
              <span className="font-bold text-white">{payload[0]?.value}°C</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-amber-400">Risk Score:</span>
              <span className="font-bold text-white">{payload[1]?.value} / 100</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Next 5 Days — Heat Risk Forecast
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Forward projection of ambient temperature and heat-health strain scores
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Temp (°C)
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Risk Score
          </span>
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={forecast}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
            <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} domain={[20, 100]} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="temp" name="Temperature" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Line
              type="monotone"
              dataKey="riskScore"
              name="Risk Score"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, fill: "#f59e0b", strokeWidth: 1, stroke: "#ffffff" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono">
        {forecast.map((d, i) => (
          <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800/80 text-xs">
            <span className="text-[11px] font-sans font-semibold text-slate-300 block">{d.day}</span>
            <span className="text-red-400 font-bold block mt-0.5">{d.temp}°C</span>
            <span className="text-[10px] text-amber-400 font-bold block">{d.riskScore}/100</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Clickable District Comparison Chart for District Analysis Section
 */
export function DistrictComparisonChart({
  locations = [],
  selectedLocation,
  onSelectLocation,
}) {
  // Sort locations by risk score descending for clear ranking
  const sortedLocations = [...locations].sort((a, b) => b.riskScore - a.riskScore);

  const getBarColor = (category) => {
    switch (category) {
      case "EXTREME":
        return "#ef4444";
      case "HIGH":
        return "#f97316";
      case "MODERATE":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs font-mono">
          <p className="font-bold text-white font-sans text-sm mb-1">{data.name}</p>
          <div className="space-y-1">
            <div>
              <span className="text-slate-400">Risk Category: </span>
              <strong style={{ color: getBarColor(data.riskCategory) }}>{data.riskCategory}</strong>
            </div>
            <div>
              <span className="text-slate-400">Risk Score: </span>
              <strong className="text-white">{data.riskScore} / 100</strong>
            </div>
            <div>
              <span className="text-slate-400">Temperature: </span>
              <strong className="text-red-400">{data.temperature}°C</strong>
            </div>
            <div>
              <span className="text-slate-400">Humidity: </span>
              <strong className="text-blue-400">{data.humidity}%</strong>
            </div>
          </div>
          <p className="text-[10px] text-amber-400 mt-2 pt-1 border-t border-slate-800 font-sans">
            👉 Click bar to inspect location details
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Heat Risk Across West Godavari
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparative risk score ranking across mandals. <strong className="text-amber-400">Click any bar</strong> to select.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Extreme
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> High
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Mod
          </span>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedLocations}
            margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const clicked = state.activePayload[0].payload;
                if (onSelectLocation) onSelectLocation(clicked);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={10}
              interval={0}
              angle={-45}
              textAnchor="end"
              tickLine={false}
            />
            <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} />
            <Bar dataKey="riskScore" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {sortedLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <Cell
                    key={loc.id}
                    fill={getBarColor(loc.riskCategory)}
                    opacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? "#ffffff" : "transparent"}
                    strokeWidth={isSelected ? 2 : 0}
                    className="cursor-pointer transition-all"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <span>Total Monitored Locations: <strong className="text-white font-mono">{locations.length}</strong></span>
        <span>
          Selected: <strong className="text-amber-400 font-semibold">{selectedLocation?.name}</strong>{" "}
          <span className="font-mono text-slate-300">({selectedLocation?.riskScore}/100 - {selectedLocation?.riskCategory})</span>
        </span>
      </div>
    </div>
  );
}

export default ForecastChart;
