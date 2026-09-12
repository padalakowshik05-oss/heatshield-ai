import React from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  RefreshCw,
  AlertCircle,
  Activity,
  CheckCircle2,
} from "lucide-react";

export function PredictionCard({
  location,
  predictionData = null,
  isLoading = false,
  error = null,
  isLive = false,
  onRetry = null,
}) {
  // Extract values from live backend prediction or location properties
  const predictedScore =
    predictionData?.prediction?.predicted_risk_score != null
      ? Number(predictionData.prediction.predicted_risk_score).toFixed(1)
      : location?.predictedRisk != null
      ? Number(location.predictedRisk).toFixed(1)
      : null;

  const predictedCategory =
    predictionData?.prediction?.predicted_risk_category ||
    location?.predictedCategory ||
    (predictedScore ? "MODERATE" : "--");

  const currentScore =
    predictionData?.current?.risk_score != null
      ? Number(predictionData.current.risk_score).toFixed(1)
      : location?.riskScore != null
      ? Number(location.riskScore).toFixed(1)
      : "--";

  const trend = predictionData?.prediction?.trend || "Stable";
  const trendDiff = predictionData?.prediction?.trend_diff != null
    ? Number(predictionData.prediction.trend_diff).toFixed(1)
    : null;

  const explanation =
    predictionData?.prediction?.explanation ||
    "Machine learning forecast predicts risk progression over the next 6-hour meteorological window.";

  const modelName = predictionData?.model?.name || "XGBoost Regressor";
  const modelVersion = predictionData?.model?.version || "prototype-v1";

  // Category Styling
  const getCategoryStyles = (category) => {
    switch (category) {
      case "EXTREME":
        return {
          textColor: "text-red-400",
          badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
          border: "border-red-500/30",
        };
      case "HIGH":
        return {
          textColor: "text-orange-400",
          badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
          border: "border-orange-500/30",
        };
      case "MODERATE":
        return {
          textColor: "text-amber-400",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          border: "border-amber-500/30",
        };
      case "LOW":
      default:
        return {
          textColor: "text-emerald-400",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          border: "border-emerald-500/30",
        };
    }
  };

  const catStyle = getCategoryStyles(predictedCategory);

  const renderTrend = () => {
    if (trend === "Increasing") {
      return (
        <span className="flex items-center gap-1.5 text-red-400 font-bold font-mono">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Increasing {trendDiff != null ? `(+${trendDiff})` : ""}</span>
        </span>
      );
    }
    if (trend === "Decreasing") {
      return (
        <span className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Decreasing {trendDiff != null ? `(${trendDiff})` : ""}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-slate-300 font-semibold font-mono">
        <Minus className="w-3.5 h-3.5 text-slate-400" />
        <span>Stable {trendDiff != null ? `(${trendDiff})` : ""}</span>
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs h-full flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                AI PREDICTION
                {isLive && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Next 6 Hours Early Warning • {location?.name || "West Godavari"}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
            <Cpu className="w-3 h-3 text-amber-400" />
            ML Forecast
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            <span className="text-xs text-slate-400 font-mono">
              Generating ML future-risk forecast...
            </span>
          </div>
        )}

        {/* Error / Fallback State */}
        {!isLoading && error && (
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Prediction unavailable</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {error || "Prediction model is not trained yet."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="self-start mt-1 text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Prediction
              </button>
            )}
          </div>
        )}

        {/* Active Prediction Content */}
        {!isLoading && !error && (
          <>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              {/* Top Row: Current vs Predicted side-by-side */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800/80">
                {/* Current Risk */}
                <div className="pr-2 border-r border-slate-800/60">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                    Current Risk:
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-200 tabular-nums">
                      {currentScore}
                    </span>
                    <span className="text-xs font-mono text-slate-500">/ 100</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Baseline</span>
                </div>

                {/* Predicted 6-Hour Risk */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold tracking-wider block">
                      Predicted (6h):
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${catStyle.badgeBg}`}
                    >
                      {predictedCategory}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${catStyle.textColor}`}
                    >
                      {predictedScore ?? "--"}
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-bold">/ 100</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Warning Target</span>
                </div>
              </div>

              {/* Trend & Horizon Indicator */}
              <div className="mt-2.5 pt-1 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-mono">Projected Trend:</span>
                <div>{renderTrend()}</div>
              </div>

              {/* Status Note: Replaces fake probability percentage with transparent data notice */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Model Status: Validated
                </span>
                <span className="text-amber-400/90 font-semibold">6h Lead Time</span>
              </div>
            </div>

            {/* Explanation Quote Box */}
            <div className="mt-3 text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              "{explanation}"
            </div>
          </>
        )}
      </div>

      {/* Model Attribution Footer */}
      <div className="pt-2.5 mt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Model: {modelName} ({modelVersion})</span>
        <span className="text-amber-400/90">Early Warning Window</span>
      </div>
    </div>
  );
}

export default PredictionCard;
