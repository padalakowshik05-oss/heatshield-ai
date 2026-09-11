import React, { useState, useEffect } from "react";
import { MapPin, ChevronDown, Activity, Navigation, AlertCircle, X } from "lucide-react";
import { DISTRICT_LIST, WEST_GODAVARI_LOCATIONS } from "../data/mockData";

export function LocationSelector({
  districts = DISTRICT_LIST,
  selectedDistrict = "west_godavari",
  onSelectDistrict,
  areas = WEST_GODAVARI_LOCATIONS,
  analyzedArea,
  onAnalyzeArea,
  isLoading = false,
  lastUpdated = null,
}) {
  const [selectedAreaId, setSelectedAreaId] = useState(analyzedArea?.id || "tadepalligudem");
  const [geoError, setGeoError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (analyzedArea?.id) {
      setSelectedAreaId(analyzedArea.id);
    }
  }, [analyzedArea?.id]);

  // Manual selection handler
  const handleAnalyze = (e) => {
    if (e) e.preventDefault();
    setGeoError(null);
    const found = areas.find((a) => a.id === selectedAreaId) || areas[0];
    if (found && onAnalyzeArea) {
      const manualLocObj = {
        mode: "manual",
        id: found.id,
        name: found.name,
        district: districts.find((d) => d.id === selectedDistrict)?.name || "West Godavari",
        area: found.name,
        latitude: found.latitude,
        longitude: found.longitude,
        ...found,
        mode: "manual",
      };
      onAnalyzeArea(manualLocObj);
    }
  };

  // Geolocation handler - only runs when user clicks "Use My Current Location"
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoError("Geolocation is not supported by your browser. Please select a mandal manually.");
      return;
    }

    setGeoError(null);
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(4));
        const lng = Number(position.coords.longitude.toFixed(4));

        // Match closest administrative mandal for vulnerability context
        let closestMandal = areas[0] || null;
        let minDistance = Infinity;
        if (areas && areas.length > 0) {
          for (const a of areas) {
            if (a.latitude != null && a.longitude != null) {
              const d = Math.hypot(a.latitude - lat, a.longitude - lng);
              if (d < minDistance) {
                minDistance = d;
                closestMandal = a;
              }
            }
          }
        }

        const currentLocObj = {
          mode: "current",
          id: closestMandal ? `current-${closestMandal.id}` : "current-location",
          name: closestMandal ? `My Location (${closestMandal.name})` : "Current Location",
          district: districts.find((d) => d.id === selectedDistrict)?.name || "West Godavari",
          area: closestMandal ? closestMandal.name : "Current Location",
          ...(closestMandal || {}),
          latitude: lat,
          longitude: lng,
          mode: "current",
          name: closestMandal ? `My Location (${closestMandal.name})` : "Current Location",
          area: closestMandal ? closestMandal.name : "Current Location",
        };

        if (onAnalyzeArea) {
          onAnalyzeArea(currentLocObj);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Unable to retrieve your location. Please select an area manually.";
        if (err.code === 1) {
          msg = "Location permission denied. Please allow location access or select a mandal from the dropdown.";
        } else if (err.code === 2) {
          msg = "Location position unavailable. Please select your area manually.";
        } else if (err.code === 3) {
          msg = "Location request timed out. Please try again or select manually.";
        }
        setGeoError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const isPending = selectedAreaId !== analyzedArea?.id;
  const isCurrentMode = analyzedArea?.mode === "current";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          LOCATION SELECTION
        </div>
        {analyzedArea && (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
              isCurrentMode
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            {isCurrentMode ? "📍 GPS Current Location" : "🏛️ Manual Selection"}
          </span>
        )}
      </div>

      {/* 1. Selector Row: District, Area, Analyze Area, and Use Current Location Buttons */}
      <form onSubmit={handleAnalyze} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end">
        {/* District */}
        <div className="sm:col-span-3">
          <label htmlFor="district-select" className="block text-[11px] font-semibold text-slate-300 mb-1">
            District:
          </label>
          <div className="relative">
            <select
              id="district-select"
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict && onSelectDistrict(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-500/70 cursor-pointer appearance-none pr-8 hover:border-slate-600 transition-colors"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Area */}
        <div className="sm:col-span-4">
          <label htmlFor="area-select" className="block text-[11px] font-semibold text-slate-300 mb-1">
            Area / Mandal:
          </label>
          <div className="relative">
            <select
              id="area-select"
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-500/70 cursor-pointer appearance-none pr-8 hover:border-slate-600 transition-colors"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                  {a.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Analyze Area Button */}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isLoading || isLocating}
            className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isPending
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 ring-1 ring-amber-400/50"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>Analyze Area</span>
              </>
            )}
          </button>
        </div>

        {/* Use My Current Location Button */}
        <div className="sm:col-span-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLoading || isLocating}
            className="w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-blue-500/50 shadow-xs"
            title="Detect GPS coordinates using browser location"
          >
            {isLocating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-300">Locating GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span>Use My Location</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Geolocation Notice / Error Banner */}
      {geoError && (
        <div className="mt-2.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{geoError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoError(null)}
            className="text-amber-400 hover:text-white cursor-pointer ml-2 p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Prominent Currently Analyzing Banner */}
      <div className="mt-3 pt-3 border-t border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
        <div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-mono">
            📍 SELECTED LOCATION:
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {analyzedArea?.name || "Tadepalligudem"}, West Godavari
            </h2>
            <span className="text-xs text-slate-400">
              Andhra Pradesh
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          {lastUpdated && (
            <span className="text-slate-400 font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Last updated: {lastUpdated}
            </span>
          )}
          {analyzedArea?.latitude != null && analyzedArea?.longitude != null && (
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Station ({Number(analyzedArea.latitude).toFixed(4)}°N, {Number(analyzedArea.longitude).toFixed(4)}°E)
            </span>
          )}
          {analyzedArea?.riskCategory && (
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] border ${
                analyzedArea.riskCategory === "EXTREME"
                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                  : analyzedArea.riskCategory === "HIGH"
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}
            >
              {analyzedArea.riskCategory} ({Math.round(analyzedArea.riskScore || 0)}/100)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationSelector;
