import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Crosshair,
  MapPin,
  Layers,
  ShieldAlert,
  Info,
  Thermometer,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getWardsData } from "../services/api";
import {
  getWardRiskColor,
  getWardRiskCategory,
  getWardTemperatureColor,
  WARD_PROTOTYPE_DISCLAIMER,
  WARD_SECTION_BADGE,
} from "../data/wardData";
import { getAlertLevel } from "../data/mockData";

// Helper component inside MapContainer to smoothly re-center map on coordinates
function MapCenterController({ center, zoom = 13, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      Array.isArray(center) &&
      typeof center[0] === "number" &&
      !isNaN(center[0]) &&
      typeof center[1] === "number" &&
      !isNaN(center[1])
    ) {
      try {
        map.flyTo(center, zoom, { animate: true, duration: 0.7 });
      } catch (err) {
        console.warn("Leaflet map flyTo error:", err);
      }
    }
  }, [center, zoom, trigger, map]);
  return null;
}

// Generate polished custom DivIcons for Wards
function createWardMarkerIcon(ward, isSelected, layerMode = "risk") {
  const isTemp = layerMode === "temperature";
  const color = isTemp
    ? getWardTemperatureColor(ward.temperature)
    : getWardRiskColor(ward.riskScore);
  const displayLabel = isTemp ? `${ward.temperature}°` : ward.wardNumber;

  if (isSelected) {
    return L.divIcon({
      className: "selected-ward-marker",
      html: `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translate(-50%, -100%);
          cursor: pointer;
          z-index: 1000;
        ">
          <div style="
            background: #0f172a;
            color: #ffffff;
            border: 2px solid ${color};
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 6px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.7), 0 0 12px ${color}66;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
          ">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${color}; box-shadow:0 0 6px ${color};"></span>
            <span>★ ${displayLabel}</span>
            <span style="font-size:9px; background:${color}22; color:${color}; border:1px solid ${color}44; padding:0 3px; border-radius:3px;">SELECTED</span>
          </div>
          <div style="
            width: 18px;
            height: 18px;
            background-color: ${color};
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 0 5px ${color}44, 0 4px 10px rgba(0,0,0,0.5);
            margin-top: 3px;
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  return L.divIcon({
    className: "ward-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -50%);
        cursor: pointer;
        transition: transform 0.15s ease-out;
      " onmouseover="this.style.transform='translate(-50%, -50%) scale(1.18)'" onmouseout="this.style.transform='translate(-50%, -50%) scale(1)'">
        <div style="
          background: #0f172a;
          color: #f8fafc;
          border: 1.5px solid ${color};
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.6);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${color};"></span>
          <span>${displayLabel}</span>
        </div>
        <div style="
          width: 8px;
          height: 8px;
          background-color: ${color};
          border: 1.5px solid #ffffff;
          border-radius: 50%;
          margin-top: 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// DivIcon for GPS Current Location
function createGpsUserIcon() {
  return L.divIcon({
    className: "gps-user-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        cursor: pointer;
        z-index: 1200;
      ">
        <div style="
          background: #0284c7;
          color: #ffffff;
          font-family: system-ui, sans-serif;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(2, 132, 199, 0.5);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          border: 1px solid #38bdf8;
        ">
          <span>📍 YOU ARE HERE</span>
        </div>
        <div style="
          width: 14px;
          height: 14px;
          background-color: #38bdf8;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.4);
          margin-top: 2px;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// Marker for Secondary Nearby Areas View
function createNearbyAreaIcon(loc) {
  const alert = getAlertLevel(loc.riskScore);
  const color = alert.color;
  return L.divIcon({
    className: "nearby-area-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -50%);
        cursor: pointer;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background-color: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.6);
        "></div>
        <div style="
          font-family: system-ui, sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #e2e8f0;
          margin-top: 2px;
          background-color: rgba(11, 15, 25, 0.95);
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid #334155;
          white-space: nowrap;
        ">
          ${loc.name}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function RiskMap({
  selectedLocation,
  locations = [],
  onAnalyzeArea,
  heightClassName = "h-[390px] sm:h-[440px]",
}) {
  // 1. Determine active base location & coordinates
  const areaName = selectedLocation?.name || selectedLocation?.area || "Tadepalligudem";
  const rawLat = selectedLocation?.latitude != null ? Number(selectedLocation.latitude) : 16.8152;
  const rawLng = selectedLocation?.longitude != null ? Number(selectedLocation.longitude) : 81.5267;
  const lat = !isNaN(rawLat) && rawLat !== 0 ? rawLat : 16.8152;
  const lng = !isNaN(rawLng) && rawLng !== 0 ? rawLng : 81.5267;
  const centerCoords = [lat, lng];

  // 2. UI State
  const [layerMode, setLayerMode] = useState("risk"); // 'risk' | 'temperature'
  const [activeView, setActiveView] = useState("wards"); // 'wards' | 'nearby'
  const [selectedWard, setSelectedWard] = useState(null);
  const [wardNotice, setWardNotice] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // 3. Ward Data Fetching
  const [wardDataState, setWardDataState] = useState({
    isLoading: true,
    available: false,
    wards: [],
    message: null,
  });

  useEffect(() => {
    let isMounted = true;
    setWardDataState((prev) => ({ ...prev, isLoading: true }));

    getWardsData(areaName)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.available && res.wards && res.wards.length > 0) {
          setWardDataState({
            isLoading: false,
            available: true,
            wards: res.wards,
            message: null,
          });
          // Default select Ward 07 or first ward
          const defaultWard = res.wards.find((w) => w.wardNumber === "Ward 07") || res.wards[0];
          setSelectedWard(defaultWard);
        } else {
          setWardDataState({
            isLoading: false,
            available: false,
            wards: [],
            message: res?.message || `Ward-level data is not available for this location yet.`,
          });
          setSelectedWard(null);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setWardDataState({
          isLoading: false,
          available: false,
          wards: [],
          message: `Ward-level data is not available for this location yet.`,
        });
        setSelectedWard(null);
      });

    return () => {
      isMounted = false;
    };
  }, [areaName]);

  // Center button handler
  const handleCenterOnLocation = () => {
    setRecenterTrigger((prev) => prev + 1);
  };

  // Analyze This Ward handler
  const handleAnalyzeWard = (ward) => {
    setSelectedWard(ward);
    setWardNotice(
      `Selected ${ward.wardNumber || ward.name}. Note: Ward-level detailed analysis is not available yet.`
    );
    // Auto-clear notice after 6 seconds
    setTimeout(() => {
      setWardNotice((curr) =>
        curr && curr.includes(ward.wardNumber) ? null : curr
      );
    }, 6000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* Header Bar */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800 bg-slate-950/70 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base">🗺</span>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              HYPERLOCAL WARD HEAT MAP
            </h3>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {WARD_SECTION_BADGE}
            </span>
            {selectedLocation?.mode === "current" && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                GPS Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Heat-health risk across wards in <strong className="text-white">{areaName}</strong>
          </p>
        </div>

        {/* Controls: Center on Location, Layer Switcher, and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Wards vs Nearby Areas */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveView("wards")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeView === "wards"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Wards ({wardDataState.wards.length})
            </button>
            <button
              onClick={() => setActiveView("nearby")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeView === "nearby"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Nearby Areas
            </button>
          </div>

          {/* Layer Mode Toggle: Risk vs Temperature */}
          {activeView === "wards" && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setLayerMode("risk")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  layerMode === "risk"
                    ? "bg-red-950/80 text-red-300 border border-red-800/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Color-code wards by Risk Score"
              >
                <Activity className="w-3 h-3 text-red-400" />
                <span>Risk</span>
              </button>
              <button
                onClick={() => setLayerMode("temperature")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  layerMode === "temperature"
                    ? "bg-amber-950/80 text-amber-300 border border-amber-800/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Color-code wards by Temperature"
              >
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span>Temperature</span>
              </button>
            </div>
          )}

          {/* Center on Location Button */}
          <button
            onClick={handleCenterOnLocation}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700 shadow-xs"
            title="Recenter map on active location"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Center on Location</span>
            <span className="sm:hidden">Center</span>
          </button>
        </div>
      </div>

      {/* Unsupported Location Warning Banner (if no ward data available) */}
      {!wardDataState.isLoading && !wardDataState.available && activeView === "wards" && (
        <div className="bg-amber-950/40 border-b border-amber-800/50 px-3.5 py-2.5 text-xs text-amber-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Ward-level data is not available for this location yet.</span>
            <span className="text-amber-300/80 block sm:inline sm:ml-1">
              Showing base geographic view. Hyperlocal ward-level heat risk mapping requires municipal boundary data and localized telemetry.
            </span>
          </div>
        </div>
      )}

      {/* Inline Notice when user clicks 'Analyze This Ward' */}
      {wardNotice && (
        <div className="bg-blue-950/60 border-b border-blue-800/50 px-3.5 py-2 text-xs text-blue-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{wardNotice}</span>
          </div>
          <button
            onClick={() => setWardNotice(null)}
            className="text-blue-400 hover:text-blue-200 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className={`${heightClassName} w-full relative bg-slate-950`}>
        <MapContainer
          center={centerCoords}
          zoom={activeView === "wards" && wardDataState.available ? 13 : 11}
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full z-10"
          style={{ background: "#0b1329" }}
        >
          <ZoomControl position="topright" />
          <MapCenterController
            center={centerCoords}
            zoom={activeView === "wards" && wardDataState.available ? 13 : 11}
            trigger={recenterTrigger}
          />

          {/* Standard OpenStreetMap Tile Layer — 100% Free, NO API KEY REQUIRED */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* 1. Ward Markers (Primary View) */}
          {activeView === "wards" &&
            wardDataState.available &&
            wardDataState.wards.map((ward) => {
              const isSelected = selectedWard?.id === ward.id;
              const cat = getWardRiskCategory(ward.riskScore);
              const catColor = getWardRiskColor(ward.riskScore);

              return (
                <Marker
                  key={ward.id}
                  position={[ward.latitude, ward.longitude]}
                  icon={createWardMarkerIcon(ward, isSelected, layerMode)}
                  zIndexOffset={isSelected ? 1000 : 100}
                >
                  <Popup className="custom-ward-popup" minWidth={220} maxWidth={260}>
                    <div className="p-2.5 text-xs text-slate-100 font-sans">
                      {/* Ward Header */}
                      <div className="border-b border-slate-700 pb-1.5 mb-2">
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-sm font-bold text-white tracking-wide">
                            {ward.wardNumber || ward.name.split("-")[0].trim()}
                          </strong>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider"
                            style={{
                              backgroundColor: `${catColor}25`,
                              color: catColor,
                              border: `1px solid ${catColor}55`,
                            }}
                          >
                            {cat} HEAT RISK
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {ward.name}
                        </p>
                      </div>

                      {/* Metrics: Risk Score, Temperature, Humidity */}
                      <div className="space-y-1.5 font-mono text-[11px] mb-2.5 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-sans text-[11px]">Risk Score:</span>
                          <strong className="text-white font-bold">
                            {ward.riskScore} <span className="text-slate-400 font-normal">/ 100</span>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-sans text-[11px]">Temperature:</span>
                          <strong className="text-red-400 font-bold">
                            {ward.temperature}°C
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-sans text-[11px]">Humidity:</span>
                          <strong className="text-blue-400 font-bold">
                            {ward.humidity}%
                          </strong>
                        </div>
                      </div>

                      {/* Risk Drivers */}
                      <div className="mb-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Risk Drivers
                        </div>
                        <ul className="space-y-0.5 text-[10px] text-slate-300">
                          {ward.riskDrivers && ward.riskDrivers.length > 0 ? (
                            ward.riskDrivers.map((driver, idx) => (
                              <li key={idx} className="flex items-start gap-1 leading-tight">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>{driver}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400">• High thermal stress</li>
                          )}
                        </ul>
                      </div>

                      {/* Action Button: Analyze This Ward */}
                      <button
                        onClick={() => handleAnalyzeWard(ward)}
                        className={`w-full py-1.5 px-2 font-bold rounded text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm ${
                          isSelected
                            ? "bg-slate-800 text-amber-300 border border-amber-500/40"
                            : "bg-red-600 hover:bg-red-500 text-white"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ward Selected</span>
                          </>
                        ) : (
                          <span>Analyze This Ward</span>
                        )}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* 2. Secondary Nearby Areas View */}
          {activeView === "nearby" &&
            locations
              .filter(
                (loc) =>
                  loc &&
                  loc.latitude != null &&
                  !isNaN(Number(loc.latitude)) &&
                  loc.longitude != null &&
                  !isNaN(Number(loc.longitude))
              )
              .map((loc) => {
                const isSelected =
                  loc.name?.toLowerCase() === areaName.toLowerCase();
                return (
                  <Marker
                    key={loc.id || loc.name}
                    position={[Number(loc.latitude), Number(loc.longitude)]}
                    icon={createNearbyAreaIcon(loc)}
                  >
                    <Popup className="custom-area-popup">
                      <div className="p-2.5 text-xs text-slate-200 min-w-[180px]">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-2">
                          <strong className="text-white font-bold">{loc.name}</strong>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">
                            {loc.riskScore}/100
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 space-y-0.5 mb-2">
                          <div>Temp: {loc.temperature}°C</div>
                          <div>Humidity: {loc.humidity}%</div>
                        </div>
                        <button
                          onClick={() => {
                            if (onAnalyzeArea) onAnalyzeArea(loc);
                            setActiveView("wards");
                          }}
                          className="w-full py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs cursor-pointer"
                        >
                          Analyze This Area
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

          {/* 3. Current GPS User Position Marker (if GPS mode active) */}
          {selectedLocation?.mode === "current" && (
            <Marker position={[lat, lng]} icon={createGpsUserIcon()} zIndexOffset={2000}>
              <Popup className="custom-area-popup">
                <div className="p-2.5 text-xs text-slate-200">
                  <div className="font-bold text-white flex items-center gap-1 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span>Current GPS Position</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Detected via browser geolocation
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Footer Bar: Legend, Risk Score, and Ethical Notice */}
      <div className="p-2.5 sm:px-3.5 sm:py-2 bg-slate-950/80 text-slate-400 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800">
        {/* Risk Legend */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[10px] uppercase font-bold text-slate-300">
            {layerMode === "risk" ? "Risk Score: 0–100" : "Temperature: °C"}:
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>LOW</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>MODERATE</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
            <span>HIGH</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            <span>EXTREME</span>
          </span>
        </div>

        {/* Prototype Ethical Note */}
        <div className="text-[10px] text-slate-400 font-sans italic">
          *{WARD_PROTOTYPE_DISCLAIMER}
        </div>
      </div>
    </div>
  );
}

export default RiskMap;
