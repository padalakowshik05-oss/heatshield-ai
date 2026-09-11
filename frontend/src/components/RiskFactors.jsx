import React from "react";
import { Users, Info, ShieldAlert, HeartPulse, HardHat, Home, Building2, Baby } from "lucide-react";

export function RiskFactors({ location }) {
  const loc = location || {
    name: "Tadepalligudem",
    vulnerabilityScore: 55.0,
    vulnerabilityFactors: {
      elderly: 45.0,
      children: 40.0,
      outdoor_workers: 72.0,
      population_density: 65.0,
      housing_vulnerability: 55.0,
      healthcare_vulnerability: 40.0,
    },
  };

  const vf = loc.vulnerabilityFactors || {
    elderly: 45.0,
    children: 40.0,
    outdoor_workers: 72.0,
    population_density: 65.0,
    housing_vulnerability: 55.0,
    healthcare_vulnerability: 40.0,
  };

  const overallScore = loc.vulnerabilityScore != null ? loc.vulnerabilityScore : 55.0;

  const factors = [
    {
      label: "Elderly Population",
      weight: "20%",
      icon: <Users className="w-3.5 h-3.5 text-rose-400" />,
      value: Math.round(vf.elderly ?? 45),
      barColor: "bg-rose-500",
      description: "Age 65+ sensitivity",
    },
    {
      label: "Children (Under 5)",
      weight: "15%",
      icon: <Baby className="w-3.5 h-3.5 text-pink-400" />,
      value: Math.round(vf.children ?? 40),
      barColor: "bg-pink-500",
      description: "Pediatric heat stress",
    },
    {
      label: "Outdoor Workers",
      weight: "25%",
      icon: <HardHat className="w-3.5 h-3.5 text-amber-400" />,
      value: Math.round(vf.outdoor_workers ?? 72),
      barColor: "bg-amber-500",
      description: "Agri & labor exposure",
    },
    {
      label: "Population Density",
      weight: "15%",
      icon: <Building2 className="w-3.5 h-3.5 text-blue-400" />,
      value: Math.round(vf.population_density ?? 65),
      barColor: "bg-blue-500",
      description: "Urban heat trap",
    },
    {
      label: "Housing Vulnerability",
      weight: "15%",
      icon: <Home className="w-3.5 h-3.5 text-purple-400" />,
      value: Math.round(vf.housing_vulnerability ?? 55),
      barColor: "bg-purple-500",
      description: "Tin/asbestos roofing",
    },
    {
      label: "Healthcare Vulnerability",
      weight: "10%",
      icon: <HeartPulse className="w-3.5 h-3.5 text-teal-400" />,
      value: Math.round(vf.healthcare_vulnerability ?? 40),
      barColor: "bg-teal-500",
      description: "Inverted access deficit",
    },
  ];

  const disclaimerNote = "Vulnerability indicators are prototype values for demonstration and will be replaced with validated local datasets.";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">👥</span>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                VULNERABILITY PROFILE
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Demographic & Social Sensitivity • {loc.name}
            </p>
          </div>

          <div className="text-right">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-800/60 cursor-help"
              title={disclaimerNote}
            >
              <Info className="w-2.5 h-2.5" />
              PROTOTYPE DATA
            </span>
            <div className="flex items-baseline justify-end gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Overall:</span>
              <span className="text-sm sm:text-base font-black font-mono text-purple-400 tabular-nums">
                {overallScore}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
            </div>
          </div>
        </div>

        {/* 6 Compact Factor Bars */}
        <div className="space-y-2.5">
          {factors.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>{item.icon}</span>
                  <span className="text-[11px] text-slate-200">{item.label}</span>
                  <span className="text-[9px] font-mono text-slate-500">({item.weight})</span>
                </span>
                <span className="font-mono font-bold text-white text-xs tabular-nums">
                  {item.value} <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full ${item.barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honest Data Disclaimer Note */}
      <div className="pt-2.5 mt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-start gap-1.5 leading-snug">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>
          {disclaimerNote}
        </span>
      </div>
    </div>
  );
}

export default RiskFactors;

