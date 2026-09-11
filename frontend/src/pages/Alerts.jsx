import React, { useState, useEffect } from "react";
import { AlertTriangle, Flame, ArrowRight, ShieldAlert, CheckCircle, Clock, History, Check } from "lucide-react";
import { getDistrictActiveAlerts, WEST_GODAVARI_LOCATIONS } from "../data/mockData";
import { getAreaAlertHistory, markAlertRead } from "../services/api";

export function Alerts({ onSelectAreaAndNavigate, onOpenDetails, selectedLocation }) {
  const [activeTab, setActiveTab] = useState("ACTIVE"); // 'ACTIVE' | 'HISTORY'
  const [filter, setFilter] = useState("ALL"); // 'ALL' | 'EXTREME' | 'HIGH'
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const locName = selectedLocation?.name || "Tadepalligudem";

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const data = await getAreaAlertHistory(locName);
        if (isMounted && data?.alerts) {
          setHistoryList(data.alerts);
        }
      } catch (err) {
        console.warn("Failed to load alert history:", err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }

    if (activeTab === "HISTORY") {
      loadHistory();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, locName]);

  const handleMarkRead = async (alertId) => {
    try {
      await markAlertRead(alertId);
      setHistoryList((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      );
    } catch (err) {
      console.warn("Error marking alert as read:", err);
    }
  };

  const allAlerts = getDistrictActiveAlerts();

  const filteredAlerts = allAlerts.filter((item) => {
    if (filter === "EXTREME") return item.category === "EXTREME";
    if (filter === "HIGH") return item.category === "HIGH";
    return true;
  });

  const handleAnalyzeClick = (alertItem) => {
    const found = WEST_GODAVARI_LOCATIONS.find((l) => l.id === alertItem.locationId);
    if (found && onSelectAreaAndNavigate) {
      onSelectAreaAndNavigate(found);
    }
  };

  // Group history items by Today vs Earlier
  const todayDateStr = new Date().toDateString();
  const todayHistory = historyList.filter((item) => {
    if (!item.timestamp) return true;
    return new Date(item.timestamp).toDateString() === todayDateStr;
  });
  const earlierHistory = historyList.filter((item) => {
    if (!item.timestamp) return false;
    return new Date(item.timestamp).toDateString() !== todayDateStr;
  });

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      {/* Page Header with Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
              Heat-Health Alerts Command
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time heat-health warnings & historical alert records for West Godavari District
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ACTIVE"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Active Alerts</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono">
              {filteredAlerts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "HISTORY"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Alert History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE DISTRICT ALERTS */}
      {activeTab === "ACTIVE" && (
        <div className="space-y-3.5">
          {/* Subheader with Filter Pills */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold">
              District Stations ({filteredAlerts.length} Reporting)
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              {["ALL", "EXTREME", "HIGH"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer text-[11px] ${
                    filter === f
                      ? "bg-slate-800 text-white shadow-xs font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f === "ALL" ? "All" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAlerts.map((alert) => {
              const isExtreme = alert.category === "EXTREME";

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all shadow-xs ${
                    isExtreme
                      ? "bg-red-950/20 border-red-500/40 text-red-100"
                      : "bg-orange-950/20 border-orange-500/40 text-orange-100"
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          isExtreme
                            ? "bg-red-500/20 text-red-300 border-red-500/40"
                            : "bg-orange-500/20 text-orange-300 border-orange-500/40"
                        }`}
                      >
                        {alert.category}
                      </span>

                      <span
                        className={`text-[11px] font-semibold font-sans ${
                          isExtreme ? "text-red-400" : "text-orange-400"
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>

                    {/* Location & Score */}
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {alert.name}
                      </h3>
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-xl font-bold text-white tabular-nums">
                          {alert.riskScore}
                        </span>
                        <span className="text-xs text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-snug line-clamp-2 mb-3">
                      {alert.mainRiskFactor}
                    </p>

                    {/* Telemetry Strip */}
                    <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-center font-mono text-[11px] mb-3">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans">Temp</span>
                        <strong className="text-red-400">{alert.temperature}°C</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans">Humidity</span>
                        <strong className="text-blue-400">{alert.humidity}%</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-sans">WBGT</span>
                        <strong className="text-orange-400">{alert.wbgt}°C</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        const loc = WEST_GODAVARI_LOCATIONS.find((l) => l.id === alert.locationId);
                        if (loc && onOpenDetails) onOpenDetails(loc);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleAnalyzeClick(alert)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ALERT HISTORY (Selected Area Timeline) */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" />
                Alert History Timeline
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                In-memory chronology for <strong className="text-slate-200">{locName}</strong>
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              * Resets on backend restart
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading alert chronology...
            </div>
          ) : historyList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
              No historical alerts recorded for {locName} yet.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Today's Section */}
              {todayHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Today</span>
                  </div>
                  <div className="space-y-2">
                    {todayHistory.map((item) => (
                      <HistoryItemRow
                        key={item.id}
                        item={item}
                        onMarkRead={() => handleMarkRead(item.id)}
                        onOpenDetails={() => {
                          const loc = WEST_GODAVARI_LOCATIONS.find(
                            (l) => l.name.toLowerCase() === (item.area || "").toLowerCase()
                          ) || selectedLocation;
                          if (loc && onOpenDetails) onOpenDetails(loc);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Earlier / Yesterday Section */}
              {earlierHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider font-bold pt-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Yesterday & Earlier</span>
                  </div>
                  <div className="space-y-2">
                    {earlierHistory.map((item) => (
                      <HistoryItemRow
                        key={item.id}
                        item={item}
                        onMarkRead={() => handleMarkRead(item.id)}
                        onOpenDetails={() => {
                          const loc = WEST_GODAVARI_LOCATIONS.find(
                            (l) => l.name.toLowerCase() === (item.area || "").toLowerCase()
                          ) || selectedLocation;
                          if (loc && onOpenDetails) onOpenDetails(loc);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryItemRow({ item, onMarkRead, onOpenDetails }) {
  const isExtreme = item.level === "EXTREME";
  const isHigh = item.level === "HIGH";
  const isModerate = item.level === "MODERATE";

  const icon = isExtreme ? "🚨" : isHigh ? "⚠️" : isModerate ? "🟡" : "ℹ️";
  const scoreColor = isExtreme ? "text-red-400" : isHigh ? "text-orange-400" : isModerate ? "text-amber-400" : "text-emerald-400";
  const timeStr = item.timestamp
    ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Earlier";

  return (
    <div
      className={`p-3.5 rounded-xl border bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        !item.read ? "border-amber-500/30 bg-slate-900/90" : "border-slate-800/80 opacity-80"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-xl shrink-0 mt-0.5">{icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-mono text-slate-400 font-semibold">{timeStr}</span>
            <span className="text-xs font-bold text-white">{item.title}</span>
            <span className="text-[11px] text-slate-300 font-medium">📍 {item.area}</span>
            <span className={`text-xs font-mono font-bold ${scoreColor}`}>
              {item.risk_score != null ? `${Math.round(item.risk_score)}/100` : ""}
            </span>
            {!item.read ? (
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                Unread
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">Read</span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-snug line-clamp-1">{item.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {!item.read && (
          <button
            onClick={onMarkRead}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            title="Mark as read"
          >
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Mark read</span>
          </button>
        )}
        <button
          onClick={onOpenDetails}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold transition-colors cursor-pointer border border-slate-700"
        >
          Details
        </button>
      </div>
    </div>
  );
}

export default Alerts;
