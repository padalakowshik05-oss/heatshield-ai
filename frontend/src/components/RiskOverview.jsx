import React from "react";
import { Info, RefreshCw, AlertCircle, ShieldAlert, Thermometer, Users } from "lucide-react";

export function RiskOverview({
  location,
  isLoading = false,
  error = null,
  isLive = false,
  onRetry,
}) {
  const loc = location || {
    name: "Tadepalligudem",
    riskScore: 39.5,
    riskCategory: "MODERATE",
    thermalStressScore: 32.8,
    vulnerabilityScore: 55.0,
    heatIndex: 32.8,
    wbgt: 26.7,
    utci: 30.8,
    mainRiskFactor: "Population vulnerability is significantly increasing the overall heat-health risk.",
  };

  const finalScore = loc.riskScore != null ? loc.riskScore : (loc.thermalStressScore ?? 0);
  const currentCategory = loc.riskCategory || loc.thermalStressCategory || "MODERATE";

  const getStyle = (category) => {
    switch (category) {
      case "EXTREME":
        return {
          borderColor: "border-red-500/40",
          badgeBg: "bg-red-500/20 text-red-300 border border-red-500/50",
          strokeColor: "#ef4444",
          scoreColor: "text-red-400",
        };
      case "HIGH":
        return {
          borderColor: "border-orange-500/40",
          badgeBg: "bg-orange-500/20 text-orange-300 border border-orange-500/50",
          strokeColor: "#f97316",
          scoreColor: "text-orange-400",
        };
      case "MODERATE":
        return {
          borderColor: "border-amber-500/40",
          badgeBg: "bg-amber-500/20 text-amber-300 border border-amber-500/50",
          strokeColor: "#f59e0b",
          scoreColor: "text-amber-400",
        };
      default:
        return {
          borderColor: "border-emerald-500/40",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50",
          strokeColor: "#10b981",
          scoreColor: "text-emerald-400",
        };
    }
  };

  const style = getStyle(currentCategory);

  // SVG circular gauge
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(finalScore, 0), 100) / 100) * circumference;

  const estimationTooltip = "Estimated from available meteorological data. Dedicated globe/wet-bulb/radiation measurements are not available.";

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border ${style.borderColor} rounded-xl p-4 sm:p-5 shadow-xs h-full flex flex-col justify-between transition-colors duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            HEAT HEALTH RISK
          </h2>
          {isLive ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE ASSESSMENT • 70% THERMAL / 30% VULNERABILITY
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
              LOCAL BASELINE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="hidden md:inline">Evaluating...</span>
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider rounded-md ${style.badgeBg}`}
          >
            {currentCategory}
          </span>
        </div>
      </div>

      {/* Error Fallback Banner */}
      {error && (
        <div className="my-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Unable to calculate full risk assessment. Showing verified station baseline.</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-3 px-2 py-1 rounded text-[11px] font-medium bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Main Score & Single Clean Circular Gauge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Final Heat-Health Risk Score
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${style.scoreColor} tabular-nums`}>
              {finalScore}
            </span>
            <span className="text-xl font-mono text-slate-500 font-bold">/ 100</span>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-md leading-relaxed">
            {loc.mainRiskFactor || loc.riskExplanation || "Compound evaluation combining atmospheric thermal hazard and demographic vulnerability."}
          </p>
        </div>

        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-32 h-32 sm:w-36 sm:h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="#1e293b"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={style.strokeColor}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-2xl font-bold font-mono ${style.scoreColor}`}>
              {Math.round(finalScore)}%
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Final Risk
            </span>
          </div>
        </div>
      </div>

      {/* Distinction Strip: Thermal Stress (70%) vs Population Vulnerability (30%) */}
      <div className="grid grid-cols-2 gap-2.5 py-2.5 border-y border-slate-800/80 bg-slate-950/40 rounded-lg px-3 my-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-slate-300">Thermal Stress</span>
            <span className="text-[10px] font-mono text-slate-500">(70% weight)</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-bold font-mono text-orange-400 tabular-nums">
              {loc.thermalStressScore != null ? loc.thermalStressScore : "--"}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Environmental heat hazard
          </span>
        </div>

        <div className="flex flex-col border-l border-slate-800 pl-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-slate-300">Vulnerability</span>
            <span className="text-[10px] font-mono text-slate-500">(30% weight)</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-bold font-mono text-purple-400 tabular-nums">
              {loc.vulnerabilityScore != null ? loc.vulnerabilityScore : "--"}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Population & context sensitivity
          </span>
        </div>
      </div>

      {/* 3 Real Thermal Indices */}
      <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
        {/* 1. Heat Index */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block">Heat Index</span>
          <span className="text-base sm:text-lg font-bold font-mono text-red-400 mt-0.5 block tabular-nums">
            {loc.heatIndex != null ? `${loc.heatIndex}°C` : "--"}
          </span>
          <span className="text-[9px] text-slate-500">Apparent Temp</span>
        </div>

        {/* 2. Estimated WBGT */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1" title={estimationTooltip}>
            <span className="text-[11px] font-medium text-slate-400">Estimated WBGT</span>
            <Info className="w-3 h-3 text-slate-500 cursor-help" />
          </div>
          <span className="text-base sm:text-lg font-bold font-mono text-orange-400 mt-0.5 block tabular-nums">
            {loc.wbgt != null ? `${loc.wbgt}°C` : "--"}
          </span>
          <span className="text-[9px] text-slate-500">Labor Safety Ceiling</span>
        </div>

        {/* 3. Estimated UTCI */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1" title={estimationTooltip}>
            <span className="text-[11px] font-medium text-slate-400">Estimated UTCI</span>
            <Info className="w-3 h-3 text-slate-500 cursor-help" />
          </div>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-0.5 block tabular-nums">
            {loc.utci != null ? `${loc.utci}°C` : "--"}
          </span>
          <span className="text-[9px] text-slate-500">Universal Thermal</span>
        </div>
      </div>
    </div>
  );
}

export default RiskOverview;

