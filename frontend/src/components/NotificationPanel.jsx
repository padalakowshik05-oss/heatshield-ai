import React, { useRef, useEffect } from "react";
import { X, Check, BellRing, Bell, ShieldAlert, CheckCircle2 } from "lucide-react";

export function NotificationPanel({
  notifications = [],
  onClose,
  onSelectNotification,
  onMarkAllAsRead,
  browserPermission = "default", // 'default' | 'granted' | 'denied'
  onRequestBrowserPermission,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getSeverityIcon = (level, priority) => {
    const lvl = (level || "").toUpperCase();
    const prio = (priority || "").toUpperCase();
    if (lvl === "EXTREME" || prio === "CRITICAL") return "🚨";
    if (lvl === "HIGH" || prio === "WARNING") return "⚠️";
    if (lvl === "MODERATE" || prio === "WATCH") return "⚠️";
    return "ℹ️";
  };

  const getScoreColor = (level, score) => {
    const lvl = (level || "").toUpperCase();
    if (lvl === "EXTREME" || score >= 75) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (lvl === "HIGH" || score >= 50) return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    if (lvl === "MODERATE" || score >= 25) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-84 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            NOTIFICATIONS
          </span>
          {unreadCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono text-[10px] font-bold border border-red-500/30">
              {unreadCount} unread
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
              all read
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] text-slate-400 hover:text-white font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Mark all notifications as read"
            >
              <Check className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Browser Notification Opt-In Control */}
      {browserPermission !== "granted" && onRequestBrowserPermission && (
        <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Enable desktop alerts for critical events</span>
          </div>
          <button
            onClick={onRequestBrowserPermission}
            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold transition-colors cursor-pointer shrink-0"
          >
            Enable Alerts
          </button>
        </div>
      )}

      {/* Alert List */}
      <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No active notifications. System monitoring active.
          </div>
        ) : (
          notifications.map((notif) => {
            const icon = getSeverityIcon(notif.level, notif.priority);
            const scorePill = getScoreColor(notif.level, notif.risk_score || notif.riskScore);
            const scoreVal = notif.risk_score ?? notif.riskScore;

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (onSelectNotification) onSelectNotification(notif);
                }}
                className={`p-3.5 hover:bg-slate-800/70 transition-colors cursor-pointer flex items-start gap-3 ${
                  !notif.read ? "bg-slate-800/40 border-l-2 border-red-500" : "opacity-85"
                }`}
              >
                <span className="text-base mt-0.5 shrink-0 select-none">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-xs font-bold text-white truncate leading-snug">
                      {notif.title || "Heat-Health Alert"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (notif.time || "Just now")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] text-slate-300 font-semibold truncate">
                      📍 {notif.area || notif.locationName || "West Godavari"}
                    </span>
                    {scoreVal != null && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold ${scorePill}`}>
                        Risk {Math.round(scoreVal)}/100
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 font-normal leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">
                      {notif.priority ? `Priority: ${notif.priority}` : "Prototype Early Warning"}
                    </span>
                    {!notif.read && (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer note */}
      <div className="p-2 bg-slate-950/80 text-center text-[10px] text-slate-400 border-t border-slate-800 font-mono flex items-center justify-between px-3">
        <span>Active Alerts Feed • Step 7</span>
        <span className="text-amber-400 font-semibold">Deterministic Early Warning</span>
      </div>
    </div>
  );
}

export default NotificationPanel;
