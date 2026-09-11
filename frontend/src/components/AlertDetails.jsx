import React, { useState } from "react";
import {
  X,
  Send,
  CheckCircle2,
  Users,
  ShieldAlert,
  Thermometer,
  Droplets,
  Sun,
  Flame,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { getAlertLevel } from "../data/mockData";

export function AlertDetails({
  location,
  isOpen,
  onClose,
  onViewLocation,
  alertData = null,
  explanationData = null,
}) {
  const [isSent, setIsSent] = useState(false);

  if (!isOpen || !location) return null;

  const currentScore = alertData?.current_risk?.score ?? location.riskScore ?? 50;
  const currentCategory = alertData?.current_risk?.category ?? location.riskCategory ?? "MODERATE";
  const predictedScore = alertData?.prediction?.predicted_risk_score ?? location.predictedRisk ?? currentScore;
  const predictedCategory = alertData?.prediction?.predicted_risk_category ?? location.predictedCategory ?? currentCategory;

  const alertTier = getAlertLevel(currentScore);
  const isExtreme = alertTier.level === "EXTREME";

  // Telemetry metrics
  const temp = location.temperature != null ? Number(location.temperature).toFixed(1) : "--";
  const humidity = location.humidity != null ? Number(location.humidity).toFixed(0) : "--";
  const heatIndex = location.heatIndex != null ? Number(location.heatIndex).toFixed(1) : "--";
  const wbgt = location.wbgt != null ? Number(location.wbgt).toFixed(1) : "--";
  const utci = location.utci != null ? Number(location.utci).toFixed(1) : "--";
  const thermalScore = location.thermalStressScore != null ? Number(location.thermalStressScore).toFixed(1) : "--";
  const vulnScore = location.vulnerabilityScore != null ? Number(location.vulnerabilityScore).toFixed(1) : "--";

  // SHAP Top Factors
  const topFactors = explanationData?.top_factors || alertData?.explanation?.top_factors || [
    { label: "Ambient Temperature", impact_level: "High impact", direction: "increases_risk", value: temp },
    { label: "Relative Humidity", impact_level: "High impact", direction: "increases_risk", value: humidity },
    { label: "Outdoor Worker Exposure", impact_level: "Moderate impact", direction: "increases_risk", value: 72.0 },
  ];

  // Actions
  const actions = alertData?.recommended_actions && alertData.recommended_actions.length > 0
    ? alertData.recommended_actions
    : [
        { icon: "🚰", action: "Increase water availability", detail: "Deploy drinking water and ORS kiosks in public corridors." },
        { icon: "🧊", action: "Activate cooling centers", detail: "Open public shaded cooling shelters." },
        { icon: "🏥", action: "Prepare healthcare facilities", detail: "Alert Primary Health Centers for heat-exhaustion symptoms." },
        { icon: "👷", action: "Reduce outdoor exposure", detail: "Suspend manual labor between 12 PM and 4 PM." },
      ];

  const handleClose = () => {
    setIsSent(false);
    onClose();
  };

  const handleSend = () => {
    setIsSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                isExtreme
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              }`}
            >
              {isExtreme ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isExtreme
                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                      : "bg-orange-500/20 text-orange-300 border-orange-500/40"
                  }`}
                >
                  🚨 {alertTier.level} HEAT ALERT
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  West Godavari
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1 tracking-tight">
                Heat-Health Advisory — {location.name}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {isSent ? (
            /* Sent Simulation View (Section 19 Specification) */
            <div className="py-6 text-center space-y-3 bg-slate-950 p-6 rounded-xl border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-in zoom-in duration-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">
                Demo alert generated successfully.
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Demonstration notification simulation completed for {location.name}. External messaging protocols verified.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                Simulation Mode • No real SMS, WhatsApp, or email delivered
              </div>
            </div>
          ) : (
            /* Full Details View (Section 18 Specification) */
            <>
              {/* Selected Area & Comparative Risk Overview */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
                <div className="pr-2 border-r border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Current Risk:
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <strong className={`text-2xl font-black font-mono tabular-nums ${alertTier.textColor}`}>
                      {currentScore}
                    </strong>
                    <span className="text-xs font-mono text-slate-400 font-bold">/ 100</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border inline-block mt-1 ${alertTier.badgeBg}`}>
                    {currentCategory}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-semibold">
                    Predicted 6-Hour Risk:
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <strong className="text-2xl font-black font-mono tabular-nums text-amber-400">
                      {predictedScore}
                    </strong>
                    <span className="text-xs font-mono text-slate-400 font-bold">/ 100</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/40 inline-block mt-1">
                    {predictedCategory}
                  </span>
                </div>
              </div>

              {/* Thermal & Weather Telemetry Grid */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  Biometeorological Telemetry
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Temp</span>
                    <strong className="text-red-400 block mt-0.5">{temp}°C</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Humidity</span>
                    <strong className="text-blue-400 block mt-0.5">{humidity}%</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Heat Index</span>
                    <strong className="text-amber-400 block mt-0.5">{heatIndex}°C</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Est. WBGT</span>
                    <strong className="text-orange-400 block mt-0.5">{wbgt}°C</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Est. UTCI</span>
                    <strong className="text-purple-400 block mt-0.5">{utci}°C</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Thermal Stress</span>
                    <strong className="text-pink-400 block mt-0.5">{thermalScore}</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 col-span-3 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block font-sans">Vulnerability</span>
                    <strong className="text-cyan-400 block mt-0.5">{vulnScore}</strong>
                  </div>
                </div>
              </div>

              {/* Why? Top SHAP Contributors */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Why? Top Contributing Factors (SHAP Analysis):
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                  {topFactors.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      <div className="flex items-center gap-2">
                        {f.direction === "increases_risk" ? (
                          <TrendingUp className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-medium text-slate-200">{f.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {f.impact_level || `${f.impact} impact`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2 flex items-center gap-1.5 font-mono">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Recommended Public Health Actions:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {actions.slice(0, 4).map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      <span className="text-sm shrink-0">{act.icon || "•"}</span>
                      <div>
                        <strong className="text-slate-100 block">{act.action}</strong>
                        {act.detail && <span className="text-[11px] text-slate-400 block mt-0.5">{act.detail}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="text-[10px] text-slate-400 font-mono">
            Demo Protocol • Early Warning System
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>

            {!isSent && (
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Alert — DEMO</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertDetails;
