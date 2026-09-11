import React, { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { AlertDetails } from "./components/AlertDetails";
import { SettingsModal } from "./components/SettingsModal";
import { Dashboard } from "./pages/Dashboard";
import { Alerts } from "./pages/Alerts";
import { AIAssistant } from "./pages/AIAssistant";
import { AuthPage } from "./pages/AuthPage";
import { RiskMap } from "./components/RiskMap";
import {
  DISTRICT_LIST,
  WEST_GODAVARI_LOCATIONS,
  generateAreaNotifications,
} from "./data/mockData";
import {
  getCurrentWeather,
  getThermalMetrics,
  calculateFinalRisk,
  getFuturePrediction,
  getAreaAlert,
  getAreaExplanation,
  getAreaAlertStatus,
  getAreaAlertHistory,
  markAlertRead,
  markAllAlertsRead,
  getDashboardSummary,
  getWeatherForecast,
  getCurrentUser,
  logoutUser,
  evaluateEmailAlert,
  setMonitoredLocation,
} from "./services/api";

const POLLING_INTERVAL_MS = 60000; // 60-second polling for active selected area

const INITIAL_LOCATION = {
  mode: "manual",
  id: "tadepalligudem",
  name: "Tadepalligudem",
  district: "West Godavari",
  area: "Tadepalligudem",
  latitude: 16.8152,
  longitude: 81.5267,
  ...WEST_GODAVARI_LOCATIONS[0],
};


export function App() {
  // Authentication State (Persistent via localStorage / sessionStorage)
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("heatshield_token") ||
      sessionStorage.getItem("heatshield_token") ||
      null
    );
  });

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw =
      localStorage.getItem("heatshield_user") ||
      sessionStorage.getItem("heatshield_user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Verify token on mount with /auth/me
  useEffect(() => {
    if (authToken) {
      getCurrentUser(authToken)
        .then((user) => {
          if (user) {
            setCurrentUser(user);
          } else {
            setAuthToken(null);
            setCurrentUser(null);
            localStorage.removeItem("heatshield_token");
            localStorage.removeItem("heatshield_user");
            sessionStorage.removeItem("heatshield_token");
            sessionStorage.removeItem("heatshield_user");
          }
        })
        .catch(() => {
          // Retain session if transient network glitch
        });
    }
  }, [authToken]);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await logoutUser(authToken);
      } catch {
        // ignore
      }
    }
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem("heatshield_token");
    localStorage.removeItem("heatshield_user");
    sessionStorage.removeItem("heatshield_token");
    sessionStorage.removeItem("heatshield_user");
  };

  const [activeNav, setActiveNav] = useState("dashboard"); // 'dashboard' | 'map' | 'alerts' | 'assistant'
  const [selectedDistrict, setSelectedDistrict] = useState("west_godavari");

  // Default: Tadepalligudem (West Godavari)
  const [selectedLocation, setSelectedLocation] = useState(INITIAL_LOCATION);
  const [notifications, setNotifications] = useState(() =>
    generateAreaNotifications(WEST_GODAVARI_LOCATIONS[0])
  );

  // Modals & Drawers
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [modalLocation, setModalLocation] = useState(WEST_GODAVARI_LOCATIONS[0]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Backend Live Weather State (Step 2 Open-Meteo)
  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  // Backend Live Thermal State (Step 3 Thermal Stress Engine)
  const [liveThermal, setLiveThermal] = useState(null);
  const [isLoadingThermal, setIsLoadingThermal] = useState(false);
  const [thermalError, setThermalError] = useState(null);

  // Backend Live Risk & Vulnerability State (Step 4 Assessment)
  const [liveRisk, setLiveRisk] = useState(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [riskError, setRiskError] = useState(null);

  // Backend Live Prediction State (Step 5 ML Model)
  const [livePrediction, setLivePrediction] = useState(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  // Backend Live Alert & SHAP State (Step 6 Alert & Explanation Engine)
  const [liveAlert, setLiveAlert] = useState(null);
  const [liveExplanation, setLiveExplanation] = useState(null);
  const [isLoadingAlert, setIsLoadingAlert] = useState(false);
  const [alertError, setAlertError] = useState(null);

  // Backend Live Forecast State (Step 9 5-Day Forecast)
  const [liveForecast, setLiveForecast] = useState(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState(null);

  // Backend Live Nearby Summary State (Step 9)
  const [liveNearby, setLiveNearby] = useState(null);

  // Backend Data Freshness Timestamp (Step 9)
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  // Step 7: Real-time Connection & Notification Preferences
  const [connectionStatus, setConnectionStatus] = useState("live"); // 'live' | 'updating' | 'error'
  const [browserPermission, setBrowserPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState(null);

  // Email Alerts Preference (Default ON)
  const [isEmailAlertsEnabled, setIsEmailAlertsEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("heatshield_email_alerts_enabled");
    return stored !== null ? stored === "true" : true;
  });

  const handleToggleEmailAlerts = useCallback(() => {
    setIsEmailAlertsEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("heatshield_email_alerts_enabled", String(next));
      }
      return next;
    });
  }, []);

  // Sync actively monitored location with backend autonomous background scheduler
  useEffect(() => {
    if (authToken && selectedLocation && selectedLocation.lat != null && selectedLocation.lon != null) {
      setMonitoredLocation(
        {
          latitude: Number(selectedLocation.lat),
          longitude: Number(selectedLocation.lon),
          location_name: String(selectedLocation.name || "Tadepalligudem"),
          monitoring_enabled: Boolean(isEmailAlertsEnabled),
        },
        authToken
      ).catch((err) => {
        console.warn("[Monitoring] Could not sync monitored location:", err);
      });
    }
  }, [selectedLocation, isEmailAlertsEnabled, authToken]);

  // Previous alert state cache for transition detection
  const lastStateRef = useRef({});
  const activeRequestIdRef = useRef(0);

  // Audio beep using Web Audio API oscillator
  const playAlertBeep = useCallback((priority = "WARNING") => {
    if (!isSoundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = priority === "CRITICAL" ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(priority === "CRITICAL" ? 880 : 587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, [isSoundEnabled]);

  // Request browser notification permission explicitly
  const handleRequestBrowserPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === "granted") {
          new Notification("HeatShield AI Notifications Enabled", {
            body: "Real-time desktop alerts will notify you when severe heat warnings are issued for your monitored area.",
            icon: "/favicon.ico",
          });
        }
      } catch (err) {
        console.warn("Notification permission request failed:", err);
      }
    }
  }, []);

  // Trigger browser notification with deduplication
  const triggerBrowserNotification = useCallback((notif) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const dedupKey = `heatshield_last_notification_${(notif.area || "").toLowerCase()}`;
    const lastNotified = localStorage.getItem(dedupKey);
    const scoreVal = Math.round(notif.risk_score || notif.riskScore || 0);
    const currentFingerprint = `${notif.level}-${scoreVal}-${notif.title}`;

    if (lastNotified === currentFingerprint) {
      return; // Suppress duplicate
    }

    try {
      new Notification(`HeatShield AI: ${notif.title}`, {
        body: `${notif.area || "Monitored Area"}: Risk ${scoreVal}/100. ${notif.message}`,
        icon: "/favicon.ico",
      });
      localStorage.setItem(dedupKey, currentFingerprint);
    } catch (e) {
      console.warn("Browser notification trigger failed:", e);
    }
  }, []);

  // Fetch live weather, thermal, risk, prediction, alert, and forecast metrics from FastAPI
  const loadLocationData = useCallback(async (loc) => {
    if (!loc || loc.latitude == null || loc.longitude == null) return;
    const currentReqId = ++activeRequestIdRef.current;

    // 1. Reset metrics and trigger section loading indicators (prevent stale displays)
    setIsLoadingWeather(true);
    setIsLoadingThermal(true);
    setIsLoadingRisk(true);
    setIsLoadingPrediction(true);
    setIsLoadingAlert(true);
    setIsLoadingForecast(true);

    setWeatherError(null);
    setThermalError(null);
    setRiskError(null);
    setPredictionError(null);
    setAlertError(null);
    setForecastError(null);

    // Primary Unified Route: Consolidated Dashboard Summary (Step 9)
    try {
      const summary = await getDashboardSummary(loc.name, loc.latitude, loc.longitude);
      if (currentReqId !== activeRequestIdRef.current) return;

      if (summary) {
        // Weather
        if (summary.weather) {
          setLiveWeather({
            temperature: summary.weather.temperature,
            humidity: summary.weather.humidity,
            windSpeed: summary.weather.wind_speed,
            solarRadiation: summary.weather.solar_radiation,
            timestamp: summary.weather.timestamp || summary.timestamp,
          });
          setIsLiveBackend(true);
          setWeatherError(summary.weather.error || null);
        }

        // Thermal
        if (summary.thermal) {
          setLiveThermal({
            heatIndex: summary.thermal.heat_index,
            heatIndexStatus: "calculated",
            wbgt: summary.thermal.estimated_wbgt,
            wbgtType: "estimated",
            wbgtMethod: "prototype outdoor estimation",
            utci: summary.thermal.estimated_utci,
            utciType: "estimated",
            utciStatus: "valid",
            thermalStressScore: summary.thermal.thermal_stress_score,
            thermalStressCategory: summary.thermal.thermal_stress_category,
          });
          setThermalError(summary.thermal.error || null);
        }

        // Risk & Vulnerability
        if (summary.risk) {
          setLiveRisk({
            riskScore: summary.risk.score,
            riskCategory: summary.risk.category,
            explanation: summary.risk.explanation,
            vulnerabilityScore: summary.vulnerability?.vulnerability_score,
            vulnerabilityFactors: summary.vulnerability,
          });
          setRiskError(null);
        }

        // ML 6-Hour Prediction
        if (summary.prediction) {
          setLivePrediction(summary.prediction);
          setPredictionError(null);
        } else if (summary.prediction_error) {
          setLivePrediction(null);
          setPredictionError(summary.prediction_error);
        }

        // Alert & SHAP Explanation
        if (summary.alert) {
          setLiveAlert(summary);
          setAlertError(null);
        }
        if (summary.explanation) {
          setLiveExplanation(summary.explanation);
        }

        // 5-Day Synoptic Weather Forecast
        if (summary.forecast && summary.forecast.length > 0) {
          setLiveForecast(summary.forecast);
          setForecastError(null);
        } else if (summary.forecast_error) {
          setForecastError(summary.forecast_error);
        }

        // Nearby mandal risk summaries
        if (summary.nearby_summary) {
          setLiveNearby(summary.nearby_summary);
        }

        // Backend Timestamp
        if (summary.last_updated) {
          setLastUpdatedTime(summary.last_updated);
        }

        // Notification feed dynamic update
        if (summary.alert && summary.alert.level !== "LOW") {
          const al = summary.alert;
          const alertLevel = al.level || "MODERATE";
          const newNotif = {
            id: `live-alert-${loc.id}-${Date.now()}`,
            locationId: loc.id,
            locationName: loc.name,
            title: al.title || `${alertLevel} Heat Warning`,
            message: al.message || `Risk score: ${summary.risk?.score != null ? summary.risk.score.toFixed(1) : "N/A"}`,
            severity: alertLevel === "EXTREME" ? "critical" : alertLevel === "HIGH" ? "warning" : "advisory",
            timestamp: "Just now",
            read: false,
            category: alertLevel,
            priority: al.priority,
          };
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.locationId !== loc.id)]);

          // Evaluate email alert dispatch for actively monitored area (HIGH and EXTREME only)
          if (isEmailAlertsEnabled && authToken && currentUser?.email) {
            const cleanLvl = alertLevel.toUpperCase();
            if (cleanLvl === "HIGH" || cleanLvl === "EXTREME") {
              evaluateEmailAlert({
                alert_id: newNotif.id,
                alert_level: cleanLvl,
                location: loc.name,
                temperature: summary.weather?.temperature ?? 38.0,
                risk_score: summary.risk?.score ?? 65.0,
                risk_category: summary.risk?.category ?? cleanLvl,
                humidity: summary.weather?.humidity,
                heat_index: summary.thermal?.heat_index,
                wbgt: summary.thermal?.estimated_wbgt,
                utci: summary.thermal?.estimated_utci,
                thermal_stress_score: summary.thermal?.thermal_stress_score,
                timestamp: new Date().toISOString(),
              }, authToken).catch((err) => {
                console.warn("[Email Alert] Notification evaluation error:", err);
              });
            }
          }
        }

        setIsLoadingWeather(false);
        setIsLoadingThermal(false);
        setIsLoadingRisk(false);
        setIsLoadingPrediction(false);
        setIsLoadingAlert(false);
        setIsLoadingForecast(false);
        return;
      }
    } catch (unifiedErr) {
      console.warn("Consolidated summary error, falling back to individual endpoints:", unifiedErr.message);
    }

    // Fallback: Individual Endpoints
    if (currentReqId !== activeRequestIdRef.current) return;
    try {
      const riskData = await calculateFinalRisk(loc.name, loc.latitude, loc.longitude);
      if (currentReqId !== activeRequestIdRef.current) return;
      if (riskData.weather) {
        setLiveWeather({
          temperature: riskData.weather.temperature,
          humidity: riskData.weather.humidity,
          windSpeed: riskData.weather.wind_speed,
          solarRadiation: riskData.weather.solar_radiation,
          timestamp: new Date().toISOString(),
        });
        setIsLiveBackend(true);
      }
      if (riskData.thermal) {
        setLiveThermal({
          heatIndex: riskData.thermal.heat_index,
          heatIndexStatus: "calculated",
          wbgt: riskData.thermal.wbgt,
          wbgtType: "estimated",
          wbgtMethod: "prototype outdoor estimation",
          utci: riskData.thermal.utci,
          utciType: "estimated",
          utciStatus: "valid",
          thermalStressScore: riskData.thermal.thermal_stress_score,
          thermalStressCategory: riskData.thermal.thermal_stress_category,
        });
      }
      setLiveRisk({
        riskScore: riskData.riskScore,
        riskCategory: riskData.riskCategory,
        explanation: riskData.explanation,
        vulnerabilityScore: riskData.vulnerability?.vulnerability_score,
        vulnerabilityFactors: riskData.vulnerability,
      });
    } catch (err) {
      if (currentReqId === activeRequestIdRef.current) {
        setWeatherError("Weather temporarily unavailable");
        setThermalError("Thermal metrics unavailable");
        setRiskError("Risk assessment unavailable");
      }
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setIsLoadingWeather(false);
        setIsLoadingThermal(false);
        setIsLoadingRisk(false);
      }
    }

    // Individual Prediction
    try {
      const predData = await getFuturePrediction(loc.name, loc.latitude, loc.longitude);
      if (currentReqId !== activeRequestIdRef.current) return;
      setLivePrediction(predData);
    } catch (pErr) {
      if (currentReqId === activeRequestIdRef.current) {
        setPredictionError(pErr.message || "Prediction unavailable");
        setLivePrediction(null);
      }
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setIsLoadingPrediction(false);
      }
    }

    // Individual Alert
    try {
      const alertData = await getAreaAlert(loc.name, loc.latitude, loc.longitude);
      if (currentReqId !== activeRequestIdRef.current) return;
      setLiveAlert(alertData);
      if (alertData.explanation) setLiveExplanation(alertData.explanation);
    } catch (aErr) {
      if (currentReqId === activeRequestIdRef.current) {
        setAlertError(aErr.message || "Alert unavailable");
        setLiveAlert(null);
      }
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setIsLoadingAlert(false);
      }
    }

    // Individual Forecast
    try {
      const fData = await getWeatherForecast(loc.latitude, loc.longitude);
      if (currentReqId !== activeRequestIdRef.current) return;
      if (fData.forecast) {
        setLiveForecast(fData.forecast);
      }
    } catch (fErr) {
      if (currentReqId === activeRequestIdRef.current) {
        setForecastError("Forecast unavailable");
      }
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setIsLoadingForecast(false);
      }
    }
  }, [isEmailAlertsEnabled, authToken, currentUser]);

  // Periodic 60-second polling for active selected area
  const pollSelectedAreaStatus = useCallback(async (loc) => {
    if (!loc) return;
    setConnectionStatus("updating");

    try {
      const statusData = await getAreaAlertStatus(loc.name, loc.latitude, loc.longitude);
      setConnectionStatus("live");

      const normName = loc.name.trim().toLowerCase();
      const prevState = lastStateRef.current[normName];

      // Initial state caching on first poll
      if (!prevState) {
        lastStateRef.current[normName] = statusData;
        return;
      }

      const pState = prevState.alert_state;
      const cState = statusData.alert_state;
      const pRisk = Number(prevState.risk_score || 0);
      const cRisk = Number(statusData.risk_score || 0);
      const pPred = Number(prevState.predicted_risk_score || pRisk);
      const cPred = Number(statusData.predicted_risk_score || cRisk);
      const deltaRisk = cRisk - pRisk;

      let newNotification = null;

      // 1. Alert state transition
      if (cState !== pState) {
        let title = "Heat Alert Updated";
        let prio = statusData.priority || "WARNING";
        let msg = statusData.message;

        if (cState === "EXTREME_HEAT_EMERGENCY") {
          title = "Extreme Heat Alert";
          msg = `Extreme heat alert issued for ${loc.name}.`;
          prio = "CRITICAL";
        } else if (cState === "HEAT_WARNING") {
          title = "Heat Warning";
          msg = `Heat Warning issued for ${loc.name}.`;
          prio = "WARNING";
        } else if (cState === "HEAT_WATCH") {
          title = "Heat Watch";
          msg = `Heat Watch issued for ${loc.name}.`;
          prio = "WATCH";
        } else {
          title = "Conditions Normalized";
          msg = `Heat alert for ${loc.name} has subsided to normal baseline.`;
          prio = "INFO";
        }

        newNotification = {
          id: `alert-trans-${Date.now()}`,
          area: loc.name,
          locationId: loc.id,
          locationName: loc.name,
          type: "ALERT_TRANSITION",
          level: statusData.alert_level,
          priority: prio,
          title,
          message: msg,
          risk_score: cRisk,
          timestamp: new Date().toISOString(),
          read: false,
        };
      }
      // 2. Predictive early warning escalation
      else if (25 <= cRisk && cRisk < 50 && 50 <= cPred && cPred < 75 && pPred < 50) {
        newNotification = {
          id: `alert-pred-${Date.now()}`,
          area: loc.name,
          locationId: loc.id,
          locationName: loc.name,
          type: "PREDICTION_WARNING",
          level: "HIGH",
          priority: "WARNING",
          title: "Heat Warning Expected (6H)",
          message: `High heat risk is expected in ${loc.name} within 6 hours (Forecast: ${cPred.toFixed(0)}/100).`,
          risk_score: cRisk,
          timestamp: new Date().toISOString(),
          read: false,
        };
      } else if (50 <= cRisk && cRisk < 75 && cPred >= 75 && pPred < 75) {
        newNotification = {
          id: `alert-pred-ext-${Date.now()}`,
          area: loc.name,
          locationId: loc.id,
          locationName: loc.name,
          type: "PREDICTION_EMERGENCY",
          level: "EXTREME",
          priority: "CRITICAL",
          title: "Extreme Heat Expected (6H)",
          message: `Extreme heat risk is expected in ${loc.name} within 6 hours (Forecast: ${cPred.toFixed(0)}/100).`,
          risk_score: cRisk,
          timestamp: new Date().toISOString(),
          read: false,
        };
      }
      // 3. Significant risk score shift (>= 5 points)
      else if (Math.abs(deltaRisk) >= 5.0) {
        const dir = deltaRisk > 0 ? "increased" : "decreased";
        newNotification = {
          id: `alert-shift-${Date.now()}`,
          area: loc.name,
          locationId: loc.id,
          locationName: loc.name,
          type: "RISK_CHANGE",
          level: statusData.alert_level,
          priority: statusData.priority,
          title: `Heat Risk ${dir.charAt(0).toUpperCase() + dir.slice(1)}`,
          message: `Heat risk ${dir} in ${loc.name} from ${pRisk.toFixed(0)} to ${cRisk.toFixed(0)}.`,
          risk_score: cRisk,
          timestamp: new Date().toISOString(),
          read: false,
        };
      }

      // If meaningful change occurred, dispatch notification
      if (newNotification) {
        setNotifications((prev) => [newNotification, ...prev]);
        triggerBrowserNotification(newNotification);
        playAlertBeep(newNotification.priority);

        // Evaluate automated email dispatch on transition to HIGH or EXTREME
        if (isEmailAlertsEnabled && authToken && currentUser?.email) {
          const notifLvl = (newNotification.level || "").toUpperCase();
          if (notifLvl === "HIGH" || notifLvl === "EXTREME") {
            evaluateEmailAlert({
              alert_id: newNotification.id,
              alert_level: notifLvl,
              location: loc.name,
              temperature: Number(statusData.temperature || 38.0),
              risk_score: cRisk,
              risk_category: notifLvl,
              timestamp: new Date().toISOString(),
            }, authToken).catch((err) => {
              console.warn("[Email Alert] Polling notification evaluation error:", err);
            });
          }
        }
      }

      // Update cached state
      lastStateRef.current[normName] = statusData;
    } catch (err) {
      console.warn("Polling alert status error:", err);
      setConnectionStatus("error");
    }
  }, [triggerBrowserNotification, playAlertBeep, isEmailAlertsEnabled, authToken, currentUser]);

  // 60-second polling effect for active selected area
  useEffect(() => {
    if (!selectedLocation) return;

    // Run periodic polling on 60-second interval
    const intervalTimer = setInterval(() => {
      pollSelectedAreaStatus(selectedLocation);
    }, POLLING_INTERVAL_MS);

    return () => {
      clearInterval(intervalTimer); // Clean teardown on area change or unmount
    };
  }, [selectedLocation, pollSelectedAreaStatus]);

  // Demo alert simulator handler
  const handleSimulateAlert = useCallback((type) => {
    if (type === "RESET") {
      setActiveSimulation(null);
      return;
    }

    const areaName = selectedLocation?.name || "Tadepalligudem";
    let simNotif = null;

    if (type === "HEAT_WARNING") {
      simNotif = {
        id: `sim-${Date.now()}`,
        area: areaName,
        locationId: selectedLocation?.id,
        locationName: areaName,
        type: "SIMULATION",
        level: "HIGH",
        priority: "WARNING",
        title: "⚠️ Heat Warning (Simulated)",
        message: `High heat risk simulated for ${areaName} (Score: 68/100).`,
        risk_score: 68.0,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setActiveSimulation("Heat Warning (68/100)");
    } else if (type === "EXTREME_HEAT_EMERGENCY") {
      simNotif = {
        id: `sim-${Date.now()}`,
        area: areaName,
        locationId: selectedLocation?.id,
        locationName: areaName,
        type: "SIMULATION",
        level: "EXTREME",
        priority: "CRITICAL",
        title: "🚨 Extreme Heat Alert (Simulated)",
        message: `Critical heat emergency simulated for ${areaName} (Score: 86/100).`,
        risk_score: 86.0,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setActiveSimulation("Extreme Emergency (86/100)");
    } else if (type === "RISK_SURGE") {
      simNotif = {
        id: `sim-${Date.now()}`,
        area: areaName,
        locationId: selectedLocation?.id,
        locationName: areaName,
        type: "SIMULATION",
        level: "HIGH",
        priority: "WARNING",
        title: "📈 Heat Risk Increased (Simulated)",
        message: `Heat risk increased in ${areaName} from 64 to 72 (+8 points).`,
        risk_score: 72.0,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setActiveSimulation("Risk Shift (+8 points)");
    }

    if (simNotif) {
      setNotifications((prev) => [simNotif, ...prev]);
      triggerBrowserNotification(simNotif);
      playAlertBeep(simNotif.priority);
    }
  }, [selectedLocation, triggerBrowserNotification, playAlertBeep]);

  // Fetch live weather, thermal, and risk calculations for initial default location on mount
  useEffect(() => {
    loadLocationData(WEST_GODAVARI_LOCATIONS[0]);
  }, [loadLocationData]);

  // Merge live telemetry if backend is reachable, otherwise fallback to verified mock baseline
  const activeLocation = {
    ...selectedLocation,
    mode: selectedLocation?.mode || "manual",
    id: selectedLocation?.id || "tadepalligudem",
    name: selectedLocation?.name || "Tadepalligudem",
    district: selectedLocation?.district || "West Godavari",
    area: selectedLocation?.area || selectedLocation?.name || "Tadepalligudem",
    latitude: selectedLocation?.latitude != null ? Number(selectedLocation.latitude) : 16.8152,
    longitude: selectedLocation?.longitude != null ? Number(selectedLocation.longitude) : 81.5267,
    ...(isLiveBackend && liveWeather
      ? {
          temperature: liveWeather.temperature,
          humidity: liveWeather.humidity,
          windSpeed: liveWeather.windSpeed,
          solarRadiation: liveWeather.solarRadiation,
        }
      : {}),
    ...(liveThermal
      ? {
          heatIndex: liveThermal.heatIndex,
          heatIndexStatus: liveThermal.heatIndexStatus,
          wbgt: liveThermal.wbgt,
          wbgtType: liveThermal.wbgtType,
          wbgtMethod: liveThermal.wbgtMethod,
          utci: liveThermal.utci,
          utciType: liveThermal.utciType,
          utciStatus: liveThermal.utciStatus,
          thermalStressScore: liveThermal.thermalStressScore,
          thermalStressCategory: liveThermal.thermalStressCategory,
        }
      : {}),
    ...(liveRisk
      ? {
          riskScore: liveRisk.riskScore,
          riskCategory: liveRisk.riskCategory,
          mainRiskFactor: liveRisk.explanation,
          vulnerabilityScore: liveRisk.vulnerabilityScore,
          vulnerabilityFactors: liveRisk.vulnerabilityFactors,
        }
      : {}),
    ...(livePrediction?.prediction
      ? {
          predictedRisk: livePrediction.prediction.predicted_risk_score,
          predictedCategory: livePrediction.prediction.predicted_risk_category,
          trend: livePrediction.prediction.trend,
          trendDiff: livePrediction.prediction.trend_diff,
        }
      : {}),
    ...(liveAlert?.alert
      ? {
          alertLevel: liveAlert.alert.level,
          alertPriority: liveAlert.alert.priority,
          alertTitle: liveAlert.alert.title,
          alertMessage: liveAlert.alert.message,
          recommendedActions: liveAlert.recommended_actions,
        }
      : {}),
    ...(liveForecast ? { forecast: liveForecast } : {}),
    ...(liveNearby ? { nearbySummary: liveNearby } : {}),
    ...(lastUpdatedTime ? { lastUpdated: lastUpdatedTime } : {}),
  };

  // Single area analysis switch (dropdown, nearby alert, or map popup click)
  const handleAnalyzeArea = (area) => {
    if (!area) return;
    const normalizedArea = {
      mode: area.mode || "manual",
      id: area.id || (area.name ? area.name.toLowerCase().replace(/\s+/g, "-") : "selected-area"),
      name: area.name || "Selected Area",
      district: area.district || "West Godavari",
      area: area.area || area.name || "Selected Area",
      latitude: area.latitude != null ? Number(area.latitude) : 16.8152,
      longitude: area.longitude != null ? Number(area.longitude) : 81.5267,
      ...area,
    };
    setSelectedLocation(normalizedArea);
    setNotifications(generateAreaNotifications(normalizedArea));
    loadLocationData(normalizedArea);
  };

  // Open Alert Details modal
  const handleOpenAlertDetails = (location) => {
    const targetLoc = location?.id === activeLocation.id ? activeLocation : (location || activeLocation);
    setModalLocation(targetLoc);
    setIsAlertModalOpen(true);
  };

  // Notification selection with mark as read
  const handleSelectNotification = async (notif) => {
    if (!notif) return;
    try {
      if (notif.id && !notif.id.startsWith("sim-")) {
        await markAlertRead(notif.id);
      }
    } catch (e) {
      console.warn("Mark alert as read error:", e);
    }
    const found = WEST_GODAVARI_LOCATIONS.find(
      (l) => l.id === notif.locationId || l.name.toLowerCase() === (notif.area || "").toLowerCase()
    );
    if (found) {
      handleAnalyzeArea(found);
      setModalLocation(found);
      setIsAlertModalOpen(true);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (activeLocation.name) {
        await markAllAlertsRead(activeLocation.name);
      }
    } catch (e) {
      console.warn("Mark all read error:", e);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Active alerts count for sidebar badge
  const activeAlertCount = WEST_GODAVARI_LOCATIONS.filter(
    (l) => l.riskCategory === "EXTREME"
  ).length;

  // Unauthenticated Gating: Show Login / Sign Up Page
  if (!authToken || !currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-slate-800 selection:text-white antialiased">
      {/* 1. Compact Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        activeAlertCount={activeAlertCount}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* 2. Main Application Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          notifications={notifications}
          onSelectNotification={handleSelectNotification}
          onMarkAllAsRead={handleMarkAllAsRead}
          connectionStatus={connectionStatus}
          browserPermission={browserPermission}
          onRequestBrowserPermission={handleRequestBrowserPermission}
          lastUpdated={lastUpdatedTime}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {activeNav === "dashboard" && (
            <Dashboard
              location={activeLocation}
              locations={WEST_GODAVARI_LOCATIONS}
              districts={DISTRICT_LIST}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
              onAnalyzeArea={handleAnalyzeArea}
              onOpenDetails={handleOpenAlertDetails}
              isLoadingWeather={isLoadingWeather}
              weatherError={weatherError}
              isLiveBackend={isLiveBackend}
              onRetryWeather={() => loadLocationData(selectedLocation)}
              isLoadingThermal={isLoadingThermal}
              thermalError={thermalError}
              isLiveThermal={Boolean(liveThermal)}
              onRetryThermal={() => loadLocationData(selectedLocation)}
              predictionData={livePrediction}
              isLoadingPrediction={isLoadingPrediction}
              predictionError={predictionError}
              onRetryPrediction={() => loadLocationData(selectedLocation)}
              alertData={liveAlert}
              explanationData={liveExplanation}
              isLoadingAlert={isLoadingAlert}
              alertError={alertError}
              onRetryAlert={() => loadLocationData(selectedLocation)}
              forecastData={liveForecast}
              isLoadingForecast={isLoadingForecast}
              forecastError={forecastError}
              onRetryForecast={() => loadLocationData(selectedLocation)}
              nearbyData={liveNearby}
              lastUpdatedTime={lastUpdatedTime}
            />
          )}

          {activeNav === "map" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗺</span>
                    <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                      Interactive Heat Risk Map
                    </h1>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Full district geographic context. Click any nearby station popup to switch primary analysis.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Selected Area:</span>
                  <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-white font-bold">
                    📍 {activeLocation.name}
                  </span>
                </div>
              </div>

              <RiskMap
                selectedLocation={activeLocation}
                locations={WEST_GODAVARI_LOCATIONS}
                onAnalyzeArea={(loc) => {
                  handleAnalyzeArea(loc);
                  setActiveNav("dashboard");
                }}
                heightClassName="h-[560px]"
              />
            </div>
          )}

          {activeNav === "alerts" && (
            <Alerts
              onSelectAreaAndNavigate={(loc) => {
                handleAnalyzeArea(loc);
                setActiveNav("dashboard");
              }}
              onOpenDetails={handleOpenAlertDetails}
              selectedLocation={activeLocation}
            />
          )}

          {activeNav === "assistant" && (
            <AIAssistant selectedLocation={activeLocation} />
          )}
        </main>

        {/* Clean Command Center Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 py-3.5 text-xs text-slate-400 text-center mt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-semibold text-slate-300">
              🔥 HeatShield AI — Hyperlocal Heat-Health Early Warning System
            </p>
            <p className="font-mono text-[11px] text-slate-400">
              Pilot District: West Godavari, Andhra Pradesh • Early Warning Command Center
            </p>
          </div>
        </footer>
      </div>

      {/* Global Alert Details Modal */}
      <AlertDetails
        location={modalLocation}
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alertData={liveAlert}
        explanationData={liveExplanation}
      />

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        browserPermission={browserPermission}
        onRequestBrowserPermission={handleRequestBrowserPermission}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
        onSimulateAlert={handleSimulateAlert}
        activeSimulation={activeSimulation}
        user={currentUser}
        token={authToken}
        selectedLocation={selectedLocation}
        isEmailAlertsEnabled={isEmailAlertsEnabled}
        onToggleEmailAlerts={handleToggleEmailAlerts}
      />
    </div>
  );
}

export default App;
