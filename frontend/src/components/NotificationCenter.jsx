import React, { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";

export function NotificationCenter({
  notifications = [],
  onSelectNotification,
  onMarkAllAsRead,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
        aria-label="Notifications"
        title="Heat Health Notifications"
      >
        <span className="text-sm">🔔</span>
        <span className="font-mono text-xs font-bold text-white">
          {notifications.length}
        </span>
        {unreadCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Notifications
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllAsRead}
                className="text-[11px] text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
              >
                Mark all read
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Alert List */}
          <div className="divide-y divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No active notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (onSelectNotification) onSelectNotification(notif);
                    setIsOpen(false);
                  }}
                  className={`p-3 hover:bg-slate-800/70 transition-colors cursor-pointer flex items-start gap-2.5 ${
                    !notif.read ? "bg-red-500/10" : ""
                  }`}
                >
                  <span className="text-sm mt-0.5 shrink-0">
                    {notif.level === "EXTREME" ? "🔴" : "🟠"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white block">
                      {notif.type}
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-slate-950/80 text-center text-[10px] text-slate-400 border-t border-slate-800 font-mono">
            Demo data alerts for active area
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
