import React from "react";
import { ArrowRight } from "lucide-react";
import { getAlertInfo } from "../data/mockData";

export function AlertBanner({ location, onOpenDetails }) {
  if (!location) return null;

  const alert = getAlertInfo(location.riskScore);
  const isExtreme = alert.level === "EXTREME";
  const isHigh = alert.level === "HIGH";

  const recommendedAction = isExtreme
    ? "Increase water availability and reduce prolonged outdoor exposure."
    : isHigh
    ? "Increase drinking water availability and restrict unshaded outdoor work."
    : "Maintain routine hydration and monitor vulnerable individuals.";

  const statusText = isExtreme
    ? "Immediate attention required"
    : isHigh
    ? "Elevated vigilance required"
    : "Routine precautions";

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all shadow-xs ${
        isExtreme
          ? "bg-red-950/40 border-red-500/60 text-red-100"
          : isHigh
          ? "bg-orange-950/40 border-orange-500/60 text-orange-100"
          : "bg-amber-950/40 border-amber-500/60 text-amber-100"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <h3 className="text-base sm:text-lg font-black tracking-tight uppercase text-white">
              {alert.level} HEAT ALERT
            </h3>
          </div>

          {/* Statement */}
          <p className="text-sm font-medium mt-1 text-slate-200">
            <strong className="text-white">{location.name}</strong> is currently experiencing {alert.level.toLowerCase()} heat-health conditions.
          </p>

          {/* Grid with Risk Score, Status & Recommended */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px] font-sans font-medium">Risk Score:</span>
              <strong className="text-base font-bold tabular-nums text-white">
                {location.riskScore} / 100
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-sans font-medium">Status:</span>
              <strong className="text-xs font-sans font-bold text-amber-300">
                {statusText}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-sans font-medium">Recommended Action:</span>
              <span className="font-sans font-semibold text-xs text-slate-200">
                {recommendedAction}
              </span>
            </div>
          </div>
        </div>

        {/* View Alert Details button */}
        {onOpenDetails && (
          <div className="shrink-0 flex items-center">
            <button
              onClick={() => onOpenDetails(location, "details")}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>View Alert Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertBanner;
