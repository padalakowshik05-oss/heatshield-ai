import React from "react";

export function RecommendedActions({ location, alertData = null }) {
  const loc = location || {
    name: "Tadepalligudem",
    riskCategory: "EXTREME",
  };

  const defaultActions = [
    {
      icon: "🚰",
      title: "Water Availability",
      desc: "Ensure drinking water is accessible.",
    },
    {
      icon: "🧊",
      title: "Cooling Centers",
      desc: "Activate nearby cooling spaces.",
    },
    {
      icon: "🏥",
      title: "Healthcare Readiness",
      desc: "Prepare healthcare facilities for heat-related cases.",
    },
    {
      icon: "👷",
      title: "Outdoor Work",
      desc: "Reduce outdoor exposure during peak heat.",
    },
    {
      icon: "📢",
      title: "Public Warning",
      desc: "Issue heat-risk guidance to vulnerable groups.",
    },
  ];

  const actions = alertData?.recommended_actions && alertData.recommended_actions.length > 0
    ? alertData.recommended_actions.map((act) => ({
        icon: act.icon || "🛡️",
        title: act.action || act.title,
        desc: act.detail || act.desc,
        driver: act.driver || null,
      }))
    : defaultActions;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            RECOMMENDED ACTIONS
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Operational Directives for {loc.name}
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-medium">
          {loc.riskCategory === "EXTREME" ? "Mandatory Protocol" : "Advisory Protocol"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {actions.map((act) => (
          <div
            key={act.title}
            className="bg-slate-950 hover:bg-slate-800/50 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xl sm:text-2xl">{act.icon}</span>
                {act.driver && (
                  <span className="text-[9px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate max-w-[120px]" title={act.driver}>
                    {act.driver}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white leading-snug">{act.title}</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{act.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendedActions;
