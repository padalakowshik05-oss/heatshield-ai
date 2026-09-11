import React from "react";
import { ArrowRight, AlertCircle, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { getAlertLevel } from "../data/mockData";

export function AlertCard({
  location,
  alertData = null,
  isLoading = false,
  error = null,
  onOpenDetails,
}) {
  if (!location) return null;

  // Use live alert response if available, otherwise derive from location
  const riskScore = alertData?.current_risk?.score ?? location.riskScore ?? 50;
  const alertInfo = getAlertLevel(riskScore);
  
  const alert = alertData?.alert || {};
  const level = alert.level || alertInfo.level;
  const priority = alert.priority || alertInfo.priority || "WATCH";
  const title = alert.title || `🚨 ${level} HEAT ALERT`;
  const message = alert.message || alert.status_headline || alertInfo.status;
  
  const isExtreme = level === "EXTREME";
  const isHigh = level === "HIGH";

  const currentCategory = alertData?.current_risk?.category || location.riskCategory || level;
  const predictedCategory = alertData?.prediction?.predicted_risk_category || location.predictedCategory || "MODERATE";

  // Actions from backend or fallback baseline
  const actions = alertData?.recommended_actions && alertData.recommended_actions.length > 0
    ? alertData.recommended_actions
    : isExtreme
    ? [
        { icon: "🚰", action: "Increase water availability", detail: "Mobilize drinking water kiosks" },
        { icon: "🧊", action: "Activate cooling centers", detail: "Open public shaded cooling shelters" },
        { icon: "🏥", action: "Prepare healthcare facilities", detail: "Alert clinics for heat cases" },
        { icon: "👷", action: "Reduce outdoor exposure", detail: "Suspend manual labor 12 PM - 4 PM" },
      ]
    : isHigh
    ? [
        { icon: "🚰", action: "Increase hydration frequency", detail: "Drink fluids every 20 minutes" },
        { icon: "🧊", action: "Open shaded transit zones", detail: "Provide shaded rest points" },
        { icon: "🏥", action: "Prepare healthcare resources", detail: "Equip primary health centers" },
        { icon: "👷", action: "Provide worker heat guidance", detail: "Enforce shaded break intervals" },
      ]
    : [
        { icon: "🚰", action: "Maintain routine hydration", detail: "Drink water frequently" },
        { icon: "🧊", action: "Monitor sensitive individuals", detail: "Check on vulnerable neighbors" },
        { icon: "🏥", action: "Equip primary health centers", detail: "Standard primary preparedness" },
        { icon: "📱", action: "Follow local weather bulletins", detail: "Monitor afternoon advisories" },
      ];

  const getPriorityBadgeStyle = (prio) => {
    switch (prio) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "WARNING":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "WATCH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all shadow-xs h-full flex flex-col justify-between ${
        isExtreme
          ? "bg-gradient-to-br from-red-950/40 via-red-950/20 to-slate-900 border-red-500/50 text-red-100"
          : isHigh
          ? "bg-gradient-to-br from-orange-950/40 via-orange-950/20 to-slate-900 border-orange-500/50 text-orange-100"
          : "bg-gradient-to-br from-amber-950/40 via-amber-950/20 to-slate-900 border-amber-500/50 text-amber-100"
      }`}
    >
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
                SELECTED AREA ALERT
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Level 1 Early Warning
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getPriorityBadgeStyle(priority)}`}
          >
            {priority} • {level}
          </span>
        </div>

        {/* Headline & Location */}
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className={`text-xs font-mono font-bold uppercase tracking-wide ${alertInfo.textColor}`}>
              {title}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {location.name}
            </h2>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 font-sans block">Risk Score</span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                {riskScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
          </div>
        </div>

        {/* Current vs Next 6 Hours Status Strip (Section 16 Specification) */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center font-mono text-xs mb-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Current</span>
            <strong className={`text-xs block mt-0.5 font-bold uppercase ${alertInfo.textColor}`}>
              {currentCategory}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Next 6 Hours</span>
            <strong className="text-amber-400 text-xs block mt-0.5 font-bold uppercase">
              {predictedCategory}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Alert Status</span>
            <strong className="text-[10px] sm:text-[11px] block mt-0.5 font-sans uppercase font-bold leading-tight text-white truncate">
              {alert.status_headline || alertInfo.status}
            </strong>
          </div>
        </div>

        {/* Recommended Immediate Actions */}
        <div>
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-mono">
            Recommended Actions:
          </span>
          <div className="space-y-1 text-xs text-slate-200">
            {actions.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-800/80"
              >
                <span className="text-sm shrink-0">{item.icon || "•"}</span>
                <span className="truncate font-medium">{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Button: View Full Alert */}
      <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-mono">
          {alert.trigger || `Threshold Rule: Score ≥ 25`}
        </span>
        <button
          onClick={() => onOpenDetails && onOpenDetails(location, "details")}
          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-red-600/30"
        >
          <span>View Full Alert</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default AlertCard;
