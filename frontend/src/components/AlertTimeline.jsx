import React, { useState } from "react";
import { Clock, AlertTriangle, Flame } from "lucide-react";
import { ALERT_TIMELINE_DATA } from "../data/mockData";

export function AlertTimeline({ location }) {
  const [selectedSlot, setSelectedSlot] = useState(ALERT_TIMELINE_DATA[2]); // Default 2 PM peak

  const getSlotColor = (level) => {
    if (level === "EXTREME") return "bg-red-500 border-red-400 text-red-400";
    if (level === "HIGH") return "bg-orange-500 border-orange-400 text-orange-400";
    return "bg-amber-500 border-amber-400 text-amber-400";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Heat Risk Timeline (Today)
            </h3>
            <p className="text-xs text-slate-400">
              Diurnal progression of heat-health danger window for {location?.name || "selected area"}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
          Peak Danger: 12:00 PM – 4:30 PM
        </span>
      </div>

      {/* Interactive Timeline Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {ALERT_TIMELINE_DATA.map((slot) => {
          const isSelected = selectedSlot.time === slot.time;
          return (
            <button
              key={slot.time}
              onClick={() => setSelectedSlot(slot)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-slate-950 border-amber-500 shadow-xs ring-1 ring-amber-500/30"
                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span className="text-xs font-bold text-white">{slot.label}</span>
                {slot.isPeak && <Flame className="w-3.5 h-3.5 text-red-400" />}
              </div>

              <div className="flex items-center gap-1.5 my-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    slot.level === "EXTREME"
                      ? "bg-red-500"
                      : slot.level === "HIGH"
                      ? "bg-orange-500"
                      : "bg-amber-500"
                  }`}
                />
                <span
                  className={`text-[11px] font-bold font-mono ${
                    slot.level === "EXTREME"
                      ? "text-red-400"
                      : slot.level === "HIGH"
                      ? "text-orange-400"
                      : "text-amber-400"
                  }`}
                >
                  {slot.status}
                </span>
              </div>

              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Risk: {slot.score}/100
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Slot Information */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
        <div>
          <span className="text-slate-400">At {selectedSlot.time}:</span>{" "}
          <strong className="text-white">{selectedSlot.status}</strong> thermal strain projected.
          {selectedSlot.isPeak && (
            <span className="text-red-400 ml-1.5 font-medium">
              (Mandatory shade & hydration stops required)
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Biometeorology Diurnal Cycle Model
        </span>
      </div>
    </div>
  );
}

export default AlertTimeline;
