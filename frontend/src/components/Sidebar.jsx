import React from "react";
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Bot,
  Settings,
  X,
  Flame,
  Shield,
} from "lucide-react";

export function Sidebar({
  activeNav = "dashboard",
  onSelectNav,
  activeAlertCount = 2,
  isOpen = false,
  onClose,
  onOpenSettings,
}) {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "map",
      label: "Risk Map",
      icon: Map,
      badge: null,
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : null,
      badgeColor: "bg-red-500 text-white",
    },
    {
      id: "assistant",
      label: "AI Assistant",
      icon: Bot,
      badge: "AI",
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    },
  ];

  const handleNavClick = (id) => {
    if (onSelectNav) onSelectNav(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">
                  HeatShield AI
                </span>
                <span className="text-[9px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/30 px-1 py-0.2 rounded font-semibold">
                  EWS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">
                Heat-Health Command
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-amber-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      item.badgeColor || "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pilot Indicator Card */}
        <div className="p-3 mx-3 mb-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1.5 font-sans font-semibold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Pilot Operational
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            West Godavari District, AP
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-400">
            <span>Model: XGBoost v1.2</span>
            <span>Synoptic 15m</span>
          </div>
        </div>

        {/* Bottom: Settings */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              if (onClose) onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
