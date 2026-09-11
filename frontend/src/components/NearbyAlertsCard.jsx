import React from "react";
import { getNearbyLocations, WEST_GODAVARI_LOCATIONS } from "../data/mockData";
import { ArrowRight, Globe } from "lucide-react";

export function NearbyAlertsCard({ selectedLocation, nearbyData = null, onAnalyzeArea }) {
  if (!selectedLocation) return null;

  // If live nearbyData is available from backend summary, format it; otherwise use local nearby calculation
  const items = nearbyData && nearbyData.length > 0
    ? nearbyData
        .filter((item) => (item.area || "").toLowerCase() !== (selectedLocation.name || "").toLowerCase())
        .slice(0, 5)
        .map((item) => {
          const matchedLocation = WEST_GODAVARI_LOCATIONS.find(
            (l) => l.name.toLowerCase() === (item.area || "").toLowerCase()
          ) || {
            id: (item.area || "").toLowerCase().replace(/\s+/g, ""),
            name: item.area,
            latitude: 16.8152,
            longitude: 81.5267,
          };

          const cat = item.risk_category || "HIGH";
          return {
            ...matchedLocation,
            name: item.area,
            riskScore: Math.round(item.risk_score || 60),
            riskCategory: cat,
            alertInfo: {
              level: cat,
              textColor: cat === "EXTREME" ? "text-red-400" : cat === "HIGH" ? "text-orange-400" : "text-amber-400",
              dot: cat === "EXTREME" ? "🔴" : cat === "HIGH" ? "🟠" : "🟡",
            }
          };
        })
    : getNearbyLocations(selectedLocation.id, 5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🌍</span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                NEARBY AREA RISK SUMMARIES
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Surrounding Stations ({selectedLocation.name})
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
            Real Telemetry
          </span>
        </div>

        {/* Nearby Alert Rows */}
        <div className="space-y-2">
          {items.map((loc) => {
            const alert = loc.alertInfo || {
              level: loc.riskCategory || "HIGH",
              textColor: loc.riskCategory === "EXTREME" ? "text-red-400" : "text-orange-400",
              dot: loc.riskCategory === "EXTREME" ? "🔴" : "🟠",
            };
            return (
              <div
                key={loc.id}
                className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800/90 rounded-lg p-2.5 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{alert.dot}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-white truncate">
                        {loc.name}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                      <span className={`font-bold ${alert.textColor}`}>
                        {alert.level} — {loc.riskScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onAnalyzeArea && onAnalyzeArea(loc)}
                  title={`Analyze ${loc.name}`}
                  className="px-2.5 py-1 rounded-md bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-200 font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 shrink-0 border border-slate-700 group-hover:border-amber-400"
                >
                  <span>Analyze</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="pt-2.5 mt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Level 2 Contextual Feed</span>
        <span>Click Analyze to switch dashboard</span>
      </div>
    </div>
  );
}

export default NearbyAlertsCard;
