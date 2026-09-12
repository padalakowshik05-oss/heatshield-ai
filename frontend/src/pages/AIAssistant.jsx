import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { askAiAssistant, getAssistantStatus } from "../services/api";

const SUGGESTED_QUESTIONS = [
  "Why is this area at high risk?",
  "What should outdoor workers do now?",
  "What happens in the next 6 hours?",
  "Which factor contributes most to the risk?",
  "Why did the alert trigger?",
  "Why is humidity important?",
  "What does WBGT mean?",
  "Which nearby area has the highest risk?",
];

export function AIAssistant({ selectedLocation }) {
  const loc = selectedLocation || {
    name: "Tadepalligudem",
    latitude: 16.8152,
    longitude: 81.5267,
  };

  const riskDisplay = loc.riskScore != null ? `${loc.riskScore}/100` : "Assessing...";
  const catDisplay = loc.riskCategory ? ` • ${loc.riskCategory}` : "";

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello! I am your **HeatShield AI Decision Support Assistant** for West Godavari.\n\nCurrently analyzing **${loc.name}** (Risk: ${riskDisplay}${catDisplay}).\n\nAsk me about biometeorological attribution, physiological heat strain, 6-hour projections, or advised municipal countermeasures.`,
      time: "Active Context",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState("HeatShield Grounded Engine");
  const scrollRef = useRef(null);

  // Check assistant provider status
  useEffect(() => {
    getAssistantStatus()
      .then((res) => {
        if (res && res.provider === "gemini") {
          setProviderInfo("Google Gemini 1.5 (Grounded)");
        } else {
          setProviderInfo("HeatShield Grounded Engine");
        }
      })
      .catch(() => {
        setProviderInfo("HeatShield Grounded Engine");
      });
  }, []);

  // When selectedLocation changes, switch context
  useEffect(() => {
    const rDisp = loc.riskScore != null ? `${loc.riskScore}/100` : "Assessing...";
    const cDisp = loc.riskCategory ? ` • ${loc.riskCategory}` : "";
    setMessages([
      {
        id: `context-${loc.name}-${Date.now()}`,
        sender: "ai",
        text: `Switched context to **${loc.name}** (Risk: ${rDisp}${cDisp}).\n\nHow can I assist with local heat health countermeasures?`,
        time: "Just now",
      },
    ]);
  }, [loc.id, loc.name]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (queryText) => {
    const query = queryText || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const response = await askAiAssistant(query, loc);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const tempText = loc.temperature != null ? `high temperature (${loc.temperature}°C)` : "elevated ambient temperature";
      const humidText = loc.humidity != null ? `elevated humidity (${loc.humidity}%)` : "humidity";
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `The combination of ${tempText} and ${humidText} in ${loc.name} impairs human evaporative cooling, requiring urgent municipal shade and hydration directives.`,
          time: "Offline Fallback",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              AI Decision Support Assistant
            </h1>
            <p className="text-xs text-slate-400">
              Selected Context: <strong className="text-amber-300">📍 {loc.name}</strong>, West Godavari ({loc.riskCategory ?? "HIGH"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1 font-semibold">
            <Cpu className="w-3 h-3 text-emerald-400" />
            {providerInfo}
          </span>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
        {/* Suggested questions header chips */}
        <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1 font-mono">
            Suggested:
          </span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-2.5 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <span>{q}</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-950 border border-slate-800 text-amber-400"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[84%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? "bg-slate-800 text-white rounded-tr-none border border-slate-700"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1.5 block text-right">
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-tl-none px-3.5 py-2 text-xs text-slate-400">
                Evaluating HeatShield biometeorological attribution for {loc.name}...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about heat risk, interventions, or projections in ${loc.name}...`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500/60 font-sans"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Scientific Transparency & Disclaimer Banner */}
      <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 font-mono">
        <span>⚠️ Scientific Notice: Grounded in biometeorological indices (estimated WBGT & UTCI) and demographic vulnerability.</span>
        <span className="text-amber-400/90 font-semibold">Decision Support Only • Not Official Medical Diagnosis</span>
      </div>
    </div>
  );
}

export default AIAssistant;
