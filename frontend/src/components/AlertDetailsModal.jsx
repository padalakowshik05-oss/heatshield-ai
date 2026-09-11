import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Flame,
  Send,
  CheckCircle2,
  Users,
  ShieldAlert,
  Thermometer,
  Droplets,
  Sun,
  Activity,
  Check,
  Clock,
} from "lucide-react";
import { getAlertInfo } from "../data/mockData";

export function AlertDetailsModal({
  location,
  isOpen,
  onClose,
  onViewLocation,
  initialStep = "details",
}) {
  const [step, setStep] = useState(initialStep); // 'details' | 'confirm_send' | 'sent_success'
  const [targets, setTargets] = useState({
    authorities: true,
    hospitals: true,
    workers: true,
    vulnerable: true,
  });

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || "details");
    }
  }, [isOpen, initialStep]);

  if (!isOpen || !location) return null;

  const alert = getAlertInfo(location.riskScore);
  const isExtreme = alert.level === "EXTREME";

  const handleResetAndClose = () => {
    setStep("details");
    onClose();
  };

  const toggleTarget = (key) => {
    setTargets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/70">
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
                  className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${alert.badgeBg}`}
                >
                  🚨 {alert.type}
                </span>
                <span className="text-xs text-slate-400 font-mono">West Godavari</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1 tracking-tight">
                Heat-Health Emergency Alert — {location.name} Mandal
              </h3>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: STEP 1 - DETAILS */}
        {step === "details" && (
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* 1. Alert Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  1. Alert Summary
                </span>
                <span className="font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Today, 14:15 IST (Live Early Warning)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Severity Level & Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black font-mono text-white tabular-nums">
                      {location.riskScore}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">/ 100</span>
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ml-2 ${
                        isExtreme
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : "bg-orange-500/20 text-orange-300 border-orange-500/40"
                      }`}
                    >
                      {alert.level}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs font-mono">
                  <div className="text-amber-400 font-bold">{alert.status}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Threshold Exceeded</div>
                </div>
              </div>
            </div>

            {/* 2. Trigger Conditions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                2. Trigger Conditions
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-sans">Ambient Temp</span>
                  <strong className="text-base text-red-400 block mt-0.5">{location.temperature}°C</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-sans">Heat Index</span>
                  <strong className="text-base text-amber-400 block mt-0.5">{location.heatIndex}°C</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-sans">Wet Bulb Globe</span>
                  <strong className="text-base text-blue-400 block mt-0.5">{location.wbgt}°C</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-sans">Humidity</span>
                  <strong className="text-base text-cyan-400 block mt-0.5">{location.humidity}%</strong>
                </div>
              </div>
            </div>

            {/* 3. Vulnerable Groups at Immediate Risk */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                3. Vulnerable Groups at Immediate Risk:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2.5 text-slate-200">
                  <span className="text-base">🌾</span>
                  <span>Outdoor agricultural workers</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2.5 text-slate-200">
                  <span className="text-base">👴</span>
                  <span>Elderly citizens (65+)</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2.5 text-slate-200">
                  <span className="text-base">👷</span>
                  <span>Construction / Brick kiln laborers</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2.5 text-slate-200">
                  <span className="text-base">👶</span>
                  <span>Children under 5</span>
                </div>
              </div>
            </div>

            {/* 4. Recommended Immediate Responses */}
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                4. Recommended Immediate Responses:
              </h4>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">⚠️</span>
                  <span><strong>Suspend outdoor physical labor</strong> between 12:00 PM – 4:00 PM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">🧊</span>
                  <span><strong>Open primary health center cooling rooms</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">🚰</span>
                  <span><strong>Distribute ORS sachets and drinking water kiosks</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">🚑</span>
                  <span><strong>Standby ambulance</strong> for heat exhaustion / stroke cases</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal Body: STEP 2 - CONFIRM SEND */}
        {step === "confirm_send" && (
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                  Interactive Demo
                </span>
                <span className="text-xs text-slate-400">Emergency Broadcast Console</span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Send Heat-Health Alert — {location.name} Mandal
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Select target emergency channels for automated early-warning dispatch:
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Choose Alert Target Channels:
              </span>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-200 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={targets.phc}
                  onChange={() => toggleTarget("phc")}
                  className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Primary Health Centers</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-200 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={targets.volunteers}
                  onChange={() => toggleTarget("volunteers")}
                  className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Ward Sachivalayam / Village Volunteers</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-200 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={targets.broadcast}
                  onChange={() => toggleTarget("broadcast")}
                  className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Public WhatsApp / SMS Broadcast</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-200 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={targets.ddma}
                  onChange={() => toggleTarget("ddma")}
                  className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>District Disaster Management Authority</span>
              </label>
            </div>

            {/* Message Preview */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Message Preview:
              </span>
              <p className="text-xs font-mono text-amber-300 leading-relaxed bg-slate-900/80 p-2.5 rounded border border-slate-800">
                "HeatShield AI Alert: {location.name} is experiencing Extreme Heat Risk (Score {location.riskScore}). WBGT {location.wbgt}°C. Suspend outdoor work immediately."
              </p>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              * Live demonstration simulation: Dispatches automated early warning webhooks across 4 government channels.
            </div>
          </div>
        )}

        {/* Modal Body: STEP 3 - SENT SUCCESS */}
        {step === "sent_success" && (
          <div className="p-7 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-in zoom-in-50 duration-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                ✅ Alert Dispatched Successfully
              </h4>
              <p className="text-sm font-semibold text-emerald-300 mt-1">
                Dispatched to 4 channels. 18,320 citizens and 42 health workers alerted.
              </p>
              <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                Alert dispatched to District Collector, PHC Network, and WhatsApp broadcast (12,450 recipients).
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono text-left max-w-sm mx-auto space-y-1">
              <div className="text-emerald-400 font-semibold">Status: 200 OK — Delivery Confirmed</div>
              <div>Mandal: {location.name}, West Godavari</div>
              <div>Timestamp: {new Date().toLocaleTimeString()} IST</div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          {step === "details" && (
            <>
              <button
                onClick={() => {
                  onViewLocation(location);
                  handleResetAndClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                View on Map
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetAndClose}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => setStep("confirm_send")}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Emergency Alert</span>
                </button>
              </div>
            </>
          )}

          {step === "confirm_send" && (
            <>
              <button
                onClick={() => setStep("details")}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Back to Details
              </button>

              <button
                onClick={() => setStep("sent_success")}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Dispatch</span>
              </button>
            </>
          )}

          {step === "sent_success" && (
            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Done & Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertDetailsModal;
