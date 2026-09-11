import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, ArrowRight } from "lucide-react";
import { AI_SUGGESTED_QUESTIONS } from "../data/mockData";
import { askAiAssistant } from "../services/api";

export function AIAssistant({ selectedLocation }) {
  const [messages, setMessages] = useState([
    {
      id: "intro",
      sender: "ai",
      text: `Hello! I am your **HeatShield AI Decision Support Assistant** for West Godavari.\n\nCurrently monitoring **${selectedLocation?.name}** (Risk Score: ${selectedLocation?.riskScore}/100, ${selectedLocation?.riskCategory}). How can I assist you with biometeorological conditions or municipal directives?`,
      time: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

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
      const response = await askAiAssistant(query, selectedLocation);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "Unable to retrieve advisory at this moment.",
          time: "Error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
      {/* Assistant Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              HeatShield AI Assistant
            </h3>
            <p className="text-[11px] text-slate-400">
              Ask questions about heat risk and recommended actions for {selectedLocation?.name}.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-800">
          FastAPI / LLM Ready
        </span>
      </div>

      {/* Suggested Questions Quick Chips */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1">
          Suggestions:
        </span>
        {AI_SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
          >
            <span>{q}</span>
            <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
          </button>
        ))}
      </div>

      {/* Message Chat List */}
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
                className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
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
              Analyzing biometeorological data for {selectedLocation?.name}...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Box */}
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
          placeholder={`Ask about heat risk in ${selectedLocation?.name}...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0"
        >
          <span>Send</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}

export default AIAssistant;
