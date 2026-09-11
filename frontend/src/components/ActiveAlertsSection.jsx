import React from "react";
import { Flame, AlertTriangle, Clock, ArrowRight, Sparkles, ShieldAlert } from "lucide-react";
import { getAlertInfo, PREDICTIVE_ALERTS } from "../data/mockData";

export function ActiveAlertsSection({
  locations = [],
  selectedLocation,
  onSelectLocation,
  onOpenDetails,
}) {
  // Filter top locations with HIGH or EXTREME risk
  const highRiskLocations = [...locations]
    .filter((loc) => loc.riskScore >= 65)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 1. Active Heat Alerts Across West Godavari */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              <Flame className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                🚨 Active Heat Alerts (West Godavari)
              </h3>
              <p className="text-xs text-slate-400">
                Mandals currently breaching critical biometeorological safety thresholds
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {highRiskLocations.length} Critical Zones Active
          </span>
        </div>

        {/* Alert Level Tiers Definition Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs font-mono">
          <span className="text-slate-300 font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Alert Level Tiers:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span><strong>0–24</strong> LOW RISK</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span><strong>25–49</strong> MODERATE (Watch)</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-300">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span><strong>50–74</strong> HIGH (Warning)</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span><strong>75–100</strong> EXTREME (Emergency)</span>
            </div>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {highRiskLocations.map((loc) => {
            const alert = getAlertInfo(loc.riskScore);
            const isExtreme = alert.level === "EXTREME";
            const isSelected = selectedLocation?.id === loc.id;
            const statusLabel = loc.riskScore >= 75 ? "Active (Urgent)" : "Active (Monitoring)";

            return (
              <div
                key={loc.id}
                className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-950 border-amber-500/60 shadow-xs ring-1 ring-amber-500/30"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Top status line */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isExtreme
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : "bg-orange-500/20 text-orange-300 border-orange-500/40"
                      }`}
                    >
                      {alert.level}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-slate-300">
                      Score: <strong className="text-white">{loc.riskScore}/100</strong>
                    </span>
                  </div>

                  {/* Location & Temp */}
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {loc.name}
                  </h4>

                  {/* Thermal Metrics Grid: Heat Index & Wet Bulb */}
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Heat Index</span>
                      <strong className="text-amber-400">{loc.heatIndex}°C</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Wet Bulb</span>
                      <strong className="text-blue-400">{loc.wbgt}°C</strong>
                    </div>
                  </div>

                  {/* Trigger Reason */}
                  <div className="mt-2.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                      Trigger Reason:
                    </span>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {loc.mainRiskFactor}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2 text-[10px] font-mono">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`font-bold ${
                        isExtreme ? "text-red-400" : "text-orange-400"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        onSelectLocation(loc);
                        onOpenDetails(loc, "details");
                      }}
                      className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium text-center transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        onSelectLocation(loc);
                        onOpenDetails(loc, "confirm_send");
                      }}
                      className="px-2 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold text-center transition-colors cursor-pointer"
                    >
                      Send Alert
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Predictive Upcoming Heat Alerts (Early Warning) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                🔮 Upcoming Heat Alerts (Early Warning Forecast)
              </h3>
              <p className="text-xs text-slate-400">
                Machine learning model projection for peak diurnal strain windows tomorrow
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded">
            24-Hour Advance Warning
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {PREDICTIVE_ALERTS.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
                  <span>{item.timeWindow}</span>
                  <span className="text-purple-400 text-[10px] font-medium bg-purple-500/10 px-1.5 py-0.5 rounded">
                    {item.leadTime}
                  </span>
                </div>

                <div className="flex items-center justify-between my-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">{item.locationName}</h4>
                  <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded border border-red-500/30">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 my-2 font-mono">
                  <span className="text-xs text-slate-400">Predicted Risk:</span>
                  <span className="text-lg font-bold text-white">{item.predictedRisk} / 100</span>
                  <span className="text-xs text-red-400">({item.predictedTemp}°C)</span>
                </div>

                <p className="text-xs text-amber-300/90 leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800">
                  ⚠️ {item.message}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    const found = locations.find((l) => l.id === item.locationId);
                    if (found) {
                      onSelectLocation(found);
                      onOpenDetails(found);
                    }
                  }}
                  className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1"
                >
                  <span>View Precaution Protocol</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ActiveAlertsSection;
