import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Calendar, RefreshCw, AlertCircle, CloudSun, Loader2 } from "lucide-react";

export function ForecastChart({
  location,
  forecastData = null,
  isLoading = false,
  error = null,
  onRetry = null,
}) {
  const locName = location?.name || "Tadepalligudem";

  // Priority: live forecastData -> location.forecast -> empty (never fake demo data)
  const rawList = forecastData && forecastData.length > 0
    ? forecastData
    : (location?.forecast && location.forecast.length > 0 ? location.forecast : []);

  const chartData = rawList.map((item) => {
    const tempVal = item.temperature ?? item.temp ?? 32.0;
    const riskVal = item.heat_risk_indicator ?? item.riskScore ?? Math.round(tempVal * 1.8);
    return {
      day: item.day || item.date || "Day",
      date: item.date,
      temp: Math.round(tempVal * 10) / 10,
      riskScore: Math.round(riskVal * 10) / 10,
      category: item.category || "MODERATE",
    };
  });

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono">
          <div className="font-bold text-white mb-1.5 flex items-center justify-between gap-3">
            <span>{label} {data.date ? `(${data.date})` : ""}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                data.category === "EXTREME"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : data.category === "HIGH"
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {data.category}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Forecast Temperature:
              </span>
              <strong className="text-white">{data.temp}°C</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Synoptic Heat Risk Index:
              </span>
              <strong className="text-amber-300">{data.riskScore}/100</strong>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-slate-800 text-[9px] text-slate-400">
            *Synoptic indicator derived from daily forecast weather (not 6h ML prediction).
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 mb-2.5 gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                5-DAY SYNOPTIC HEAT & RISK FORECAST
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Open-Meteo Synoptic Forecast for <strong>{locName}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating forecast...
              </span>
            )}
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
              <CloudSun className="w-3 h-3 text-cyan-400" />
              Real Weather Forecast
            </span>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && !chartData.length ? (
          <div className="h-44 sm:h-48 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 font-mono">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <span>Retrieving 5-day Open-Meteo forecast for {locName}...</span>
          </div>
        ) : error ? (
          <div className="h-44 sm:h-48 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 font-mono">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span className="text-slate-300">{error}</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Forecast</span>
              </button>
            )}
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-44 sm:h-48 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 font-mono">
            <CloudSun className="w-6 h-6 text-slate-500" />
            <span className="text-slate-300">5-day synoptic forecast data unavailable for {locName}.</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Forecast</span>
              </button>
            )}
          </div>
        ) : (
          /* Recharts Canvas */
          <div className="h-44 sm:h-48 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                />
                {/* Left Y-axis: Risk Score 0 to 100 */}
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                {/* Right Y-axis: Temperature 20 to 48°C */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[20, 48]}
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  unit="°"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                />
                {/* Synoptic Heat Risk Indicator Bar */}
                <Bar
                  yAxisId="left"
                  dataKey="riskScore"
                  name="Synoptic Heat Risk Index"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  opacity={0.4}
                  maxBarSize={28}
                />
                {/* Forecast Temperature Line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="temp"
                  name="Forecast Max Temp (°C)"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#ef4444", strokeWidth: 1, stroke: "#ffffff" }}
                  activeDot={{ r: 6, fill: "#ef4444" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick 5-day trajectory summary tiles */}
      {chartData.length > 0 && (
        <div className="pt-2.5 mt-2 border-t border-slate-800 grid grid-cols-5 gap-1.5 text-center font-mono text-[11px]">
          {chartData.map((d, i) => (
            <div key={i} className="bg-slate-950 p-1.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block truncate">{d.day}</span>
              <span className="font-bold text-white block mt-0.5">{d.temp}°C</span>
              <span
                className={`text-[9px] font-bold block ${
                  d.riskScore >= 75 ? "text-red-400" : d.riskScore >= 50 ? "text-orange-400" : "text-amber-400"
                }`}
              >
                Risk {d.riskScore}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Scientific Distinction Footnote */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>* Synoptic Heat Risk Index is derived from forecast temperature & humidity.</span>
        <span className="text-amber-400 font-semibold">Distinguish from 6-Hour ML Model Prediction</span>
      </div>
    </div>
  );
}

export default ForecastChart;
