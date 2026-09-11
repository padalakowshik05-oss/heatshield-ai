import React from "react";
import { LocationSelector } from "../components/LocationSelector";
import { WeatherCards } from "../components/WeatherCards";
import { RiskOverview } from "../components/RiskOverview";
import { AlertCard } from "../components/AlertCard";
import { PredictionCard } from "../components/PredictionCard";
import { RiskFactors } from "../components/RiskFactors";
import { ForecastChart } from "../components/ForecastChart";
import { RecommendedActions } from "../components/RecommendedActions";
import { RiskMap } from "../components/RiskMap";
import { NearbyAlertsCard } from "../components/NearbyAlertsCard";
import { AIExplanation } from "../components/AIExplanation";
import { RefreshCw, AlertCircle } from "lucide-react";

export function Dashboard({
  location,
  locations = [],
  districts = [],
  selectedDistrict = "west_godavari",
  onSelectDistrict,
  onAnalyzeArea,
  onOpenDetails,
  isLoadingWeather = false,
  weatherError = null,
  isLiveBackend = false,
  onRetryWeather,
  isLoadingThermal = false,
  thermalError = null,
  isLiveThermal = false,
  onRetryThermal,
  predictionData = null,
  isLoadingPrediction = false,
  predictionError = null,
  onRetryPrediction,
  alertData = null,
  explanationData = null,
  isLoadingAlert = false,
  alertError = null,
  onRetryAlert,
  forecastData = null,
  isLoadingForecast = false,
  forecastError = null,
  onRetryForecast,
  nearbyData = null,
  lastUpdatedTime = null,
}) {
  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      {/* 1. Location Selection (District, Area, Analyze, and Active Indicator) */}
      <section aria-label="Location Selection">
        <LocationSelector
          districts={districts}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={onSelectDistrict}
          areas={locations}
          analyzedArea={location}
          onAnalyzeArea={onAnalyzeArea}
          isLoading={isLoadingWeather || isLoadingThermal}
          lastUpdated={lastUpdatedTime}
        />
      </section>

      {/* Row 1: 4 Compact Weather Cards */}
      <section aria-label="Current Weather">
        <WeatherCards
          location={location}
          isLoading={isLoadingWeather}
          error={weatherError}
          isLive={isLiveBackend}
          onRetry={onRetryWeather}
        />
      </section>

      {/* Row 2: Heat Health Risk (6 cols) + Level 1 Selected Area Alert (6 cols) */}
      <section aria-label="Heat Health Risk & Alert" className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-6 flex flex-col">
          <RiskOverview
            location={location}
            isLoading={isLoadingThermal}
            error={thermalError}
            isLive={isLiveThermal}
            onRetry={onRetryThermal}
          />
        </div>
        <div className="lg:col-span-6 flex flex-col">
          <AlertCard
            location={location}
            alertData={alertData}
            isLoading={isLoadingAlert}
            error={alertError}
            onOpenDetails={onOpenDetails}
          />
        </div>
      </section>

      {/* Row 3: Risk Factors (6 cols) + AI Risk Prediction (6 cols) */}
      <section aria-label="Attribution & Prediction" className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-6 flex flex-col">
          <RiskFactors location={location} />
        </div>
        <div className="lg:col-span-6 flex flex-col">
          <PredictionCard
            location={location}
            predictionData={predictionData}
            isLoading={isLoadingPrediction}
            error={predictionError}
            isLive={Boolean(predictionData)}
            onRetry={onRetryPrediction}
          />
        </div>
      </section>

      {/* Row 4: 5-Day Heat & Risk Forecast */}
      <section aria-label="5-Day Forecast">
        <ForecastChart
          location={location}
          forecastData={forecastData}
          isLoading={isLoadingForecast}
          error={forecastError}
          onRetry={onRetryForecast}
        />
      </section>

      {/* Row 5: Recommended Actions (5 Compact Directive Cards) */}
      <section aria-label="Recommended Actions">
        <RecommendedActions location={location} alertData={alertData} />
      </section>

      {/* Row 6: Geographic Map (8 cols) + Nearby Area Alerts (4 cols) */}
      <section aria-label="Geographic Context and Nearby Alerts" className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <RiskMap
            selectedLocation={location}
            locations={locations}
            onAnalyzeArea={onAnalyzeArea}
            heightClassName="h-[370px] sm:h-[400px]"
          />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <NearbyAlertsCard
            selectedLocation={location}
            nearbyData={nearbyData}
            onAnalyzeArea={onAnalyzeArea}
          />
        </div>
      </section>

      {/* Row 7: AI Heat Assistant (Interactive Decision Support) */}
      <section aria-label="AI Heat Assistant">
        <AIExplanation
          location={location}
          explanationData={explanationData}
          isLoading={isLoadingAlert}
        />
      </section>
    </div>
  );
}

export default Dashboard;
