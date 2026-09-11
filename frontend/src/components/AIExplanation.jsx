import React, { useState, useEffect } from "react";
import { Bot, Sparkles, TrendingUp, TrendingDown, Send, Loader2, MessageSquare, ShieldAlert } from "lucide-react";
import { askAiAssistant } from "../services/api";

const PRESET_QUESTIONS = [
  { id: "why", label: "Why is this area at high risk?", prompt: "Why is this area at high risk?" },
  { id: "actions", label: "What should outdoor workers do now?", prompt: "What should outdoor workers do now?" },
  { id: "next6hours", label: "What happens in the next 6 hours?", prompt: "What will happen in the next 6 hours?" },
  { id: "factor", label: "Which factor is driving the risk?", prompt: "Which factor contributes most to the risk?" },
  { id: "alert", label: "Why did the alert trigger?", prompt: "Why did the alert trigger?" },
  { id: "wbgt", label: "What does WBGT mean?", prompt: "What does WBGT mean?" },
  { id: "nearby", label: "Which nearby area has higher risk?", prompt: "Which nearby area has the highest risk?" },
];

export function AIExplanation({ location, explanationData = null, isLoading = false }) {
  const [activeQuestionId, setActiveQuestionId] = useState("why");
  const [customQuestion, setCustomQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [lastQuery, setLastQuery] = useState("Why is this area at high risk?");

  const loc = location || {
    name: "Tadepalligudem",
    riskCategory: "HIGH",
    riskScore: 60.7,
    temperature: 32.0,
    humidity: 75,
  };

  const topFactors = explanationData?.top_factors || [
    { label: "Ambient Temperature", impact_level: "High impact", direction: "increases_risk", value: loc.temperature || 32.0 },
    { label: "Relative Humidity", impact_level: "High impact", direction: "increases_risk", value: loc.humidity || 75.0 },
    { label: "Outdoor Worker Exposure", impact_level: "Moderate impact", direction: "increases_risk", value: 72.0 },
    { label: "Solar Radiation", impact_level: "Moderate impact", direction: "increases_risk", value: 450.0 },
  ];

  // Default initial summary
  const defaultSummary = explanationData?.summary ||
    `${loc.name} is experiencing elevated heat-health risk driven by high ambient thermal stress and local population sensitivity.`;

  // Fetch response when location or activeQuestion changes
  useEffect(() => {
    let isMounted = true;
    const fetchPresetAnswer = async () => {
      const preset = PRESET_QUESTIONS.find((q) => q.id === activeQuestionId);
      const prompt = preset ? preset.prompt : "Why is this area at high risk?";
      setLastQuery(preset ? preset.label : prompt);
      setIsQuerying(true);

      try {
        const response = await askAiAssistant(prompt, loc);
        if (isMounted) {
          setCurrentAnswer(response);
        }
      } catch {
        if (isMounted) {
          setCurrentAnswer(defaultSummary);
        }
      } finally {
        if (isMounted) {
          setIsQuerying(false);
        }
      }
    };

    fetchPresetAnswer();
    return () => {
      isMounted = false;
    };
  }, [loc.name, loc.id, activeQuestionId]);

  const handleCustomSubmit = async (e) => {
    if (e) e.preventDefault();
    const query = customQuestion.trim();
    if (!query || isQuerying) return;

    setActiveQuestionId(null);
    setLastQuery(query);
    setCustomQuestion("");
    setIsQuerying(true);

    try {
      const response = await askAiAssistant(query, loc);
      setCurrentAnswer(response);
    } catch {
      setCurrentAnswer(
        `${loc.name} records a risk score of ${loc.riskScore ?? 60}/100 (${loc.riskCategory ?? "HIGH"}). Key precautions include drinking fluids regularly and avoiding unshaded outdoor exertion.`
      );
    } finally {
      setIsQuerying(false);
    }
  };

  const getImpactBadge = (level) => {
    switch (level) {
      case "High impact":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "Moderate impact":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              AI HEAT-HEALTH ASSISTANT — {loc.name.toUpperCase()}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Grounded Natural-Language Explanations • SHAP Attribution
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Decision Support Model
          </span>
        </div>
      </div>

      {/* Top Contributing Factors Grid */}
      <div className="mb-3">
        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-1.5 font-bold">
          Top Contributing Factors (SHAP Feature Importance):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {topFactors.slice(0, 4).map((factor, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-slate-200 line-clamp-1" title={factor.label}>
                  {factor.label}
                </span>
                {factor.direction === "increases_risk" ? (
                  <TrendingUp className="w-3 h-3 text-red-400 shrink-0 mt-0.5" title="Increases Risk" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" title="Decreases Risk" />
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${getImpactBadge(factor.impact_level)}`}>
                  {factor.impact_level}
                </span>
                <span className="text-slate-400">
                  {factor.direction === "increases_risk" ? "+ Risk Driver" : "- Mitigating"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Question Chips */}
      <div className="mb-3">
        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-1.5 font-semibold">
          Ask the Assistant about {loc.name}:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => setActiveQuestionId(q.id)}
              disabled={isQuerying}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                activeQuestionId === q.id
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Grounded Response Box */}
      <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-white flex items-center gap-1.5 text-xs">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            {lastQuery}
          </span>
          {isQuerying && (
            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Grounded inference...
            </span>
          )}
        </div>

        {isQuerying ? (
          <div className="py-3 flex items-center gap-2 text-slate-400 italic">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            Analyzing HeatShield biometeorological conditions for {loc.name}...
          </div>
        ) : (
          <div className="text-slate-200 leading-relaxed whitespace-pre-line space-y-1">
            {currentAnswer}
          </div>
        )}
      </div>

      {/* Custom Question Input */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder={`Ask anything about ${loc.name} heat conditions, forecasts, or safety...`}
          disabled={isQuerying}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500/60 font-sans disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!customQuestion.trim() || isQuerying}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          {isQuerying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>

      {/* Scientific Transparency Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-400 font-mono">
        <span>Attribution: SHAP TreeExplainer • Grounded on Open-Meteo & West Godavari Baseline</span>
        <span className="text-slate-400">Decision Support Only • Not Medical Diagnosis</span>
      </div>
    </div>
  );
}

export default AIExplanation;
