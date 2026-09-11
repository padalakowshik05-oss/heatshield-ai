import React, { useState, useEffect } from "react";
import { Clock, Menu, User, Bell, LogOut } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";

export function Header({
  onToggleSidebar,
  notifications = [],
  onSelectNotification,
  onMarkAllAsRead,
  connectionStatus = "live", // 'live' | 'updating' | 'error'
  browserPermission = "default",
  onRequestBrowserPermission,
  lastUpdated = null,
  currentUser = null,
  onLogout,
}) {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) + " • " +
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 h-14 flex items-center px-4 sm:px-6">
      <div className="w-full flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Brand Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-wider uppercase">
                HEATSHIELD AI
              </h1>
              <span className="hidden sm:inline-flex text-[9px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                Pilot Command Center
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden xs:block">
              Hyperlocal Heat-Health Early Warning System
            </p>
          </div>
        </div>

        {/* Right: Status Indicator, Notification Bell, Time */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Subtle Connection Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono">
            {connectionStatus === "live" && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold">● Live</span>
                {lastUpdated && (
                  <span className="text-slate-400 border-l border-slate-800 pl-1.5 ml-1">
                    {lastUpdated}
                  </span>
                )}
              </>
            )}
            {connectionStatus === "updating" && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-bold">● Updating</span>
              </>
            )}
            {connectionStatus === "error" && (
              <>
                <span className="w-2 h-2 rounded-full border border-slate-500 bg-transparent" />
                <span className="text-slate-400 font-medium">○ Connection unavailable</span>
              </>
            )}
          </div>

          {/* Current Time Clock */}
          <div className="hidden lg:flex items-center gap-1 text-slate-400 text-xs font-mono bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[11px]">{currentDateTime}</span>
          </div>

          {/* Notification Bell with Badge & Dropdown Panel */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              aria-label="View notifications"
              title="Heat-Health Alerts"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-xs font-bold text-white">
                {unreadCount > 0 ? unreadCount : notifications.length}
              </span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-1 ring-2 ring-slate-900" />
              )}
            </button>

            {isNotifOpen && (
              <NotificationPanel
                notifications={notifications}
                onClose={() => setIsNotifOpen(false)}
                onSelectNotification={(n) => {
                  if (onSelectNotification) onSelectNotification(n);
                  setIsNotifOpen(false);
                }}
                onMarkAllAsRead={onMarkAllAsRead}
                browserPermission={browserPermission}
                onRequestBrowserPermission={onRequestBrowserPermission}
              />
            )}
          </div>

          {/* User / Profile & Logout */}
          <div className="flex items-center gap-2 pl-1.5 sm:border-l sm:border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-red-600 border border-amber-400/40 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {currentUser?.full_name ? (
                  currentUser.full_name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-200 leading-none truncate max-w-[140px]">
                  {currentUser?.full_name || currentUser?.username || "User"}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-950/60 border border-slate-800 hover:border-red-800/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer flex items-center gap-1"
                title="Log out of HeatShield AI"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                <span className="hidden md:inline text-[10px] font-semibold">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
