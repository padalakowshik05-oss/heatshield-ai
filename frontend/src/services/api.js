// ============================================================================
// HeatShield AI — Unified API Service Layer
//
// All backend interactions connect to FastAPI at http://localhost:8001.
// Keeps fetch logic centralized; React components do NOT call fetch directly.
// ============================================================================

import {
  WEST_GODAVARI_LOCATIONS,
  getLocationData,
  getRecommendedActions,
  getAiAssistantResponse,
} from "../data/mockData";
import { getWardsForArea, WARD_PROTOTYPE_DISCLAIMER } from "../data/wardData";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8001"
    : "")
).replace(/\/+$/, "");

export function isMissingApiBaseUrl() {
  if (API_BASE_URL) return false;
  if (typeof window === "undefined") return false;
  return window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
}

const REQUEST_TIMEOUT_MS = 4000;

/**
 * Returns candidate URLs to attempt.
 * In local dev, falls back between localhost and 127.0.0.1 for Windows IPv6/IPv4 compatibility.
 * In production, returns only the configured URL.
 */
export function getCandidateUrls(url) {
  if (!url) return [];
  if (url.includes("localhost:8001")) {
    return [url, url.replace("localhost:8001", "127.0.0.1:8001")];
  }
  if (url.includes("127.0.0.1:8001")) {
    return [url, url.replace("127.0.0.1:8001", "localhost:8001")];
  }
  return [url];
}

/**
 * Safely parse HTTP responses from the backend or hosting layer.
 * Prevents "Unexpected end of JSON input" errors when responses are empty, HTML, or error pages.
 */
export async function handleApiResponse(response, requestUrl = "") {
  let text = "";
  try {
    text = await response.text();
  } catch (err) {
    throw new Error(`Failed to read response from server: ${err.message}`);
  }

  let json = null;
  let isJson = false;
  if (text && text.trim()) {
    try {
      json = JSON.parse(text);
      isJson = true;
    } catch {
      isJson = false;
    }
  }

  if (!response.ok) {
    // 1. Structured JSON errors from FastAPI / Pydantic
    if (isJson && json) {
      const msg = json.detail || json.message || json.error;
      if (typeof msg === "string" && msg.trim()) {
        throw new Error(msg);
      }
      if (Array.isArray(msg) && msg.length > 0) {
        const combined = msg
          .map((m) => (typeof m === "object" && m.msg ? m.msg : String(m)))
          .join(", ");
        if (combined) throw new Error(combined);
      }
      if (typeof json === "object") {
        try {
          const str = JSON.stringify(json);
          if (str && str !== "{}") throw new Error(str);
        } catch {
          // continue
        }
      }
    }

    // 2. HTTP 405 Method Not Allowed (Static SPA host intercepted API POST)
    if (response.status === 405) {
      throw new Error(
        `HTTP 405 Method Not Allowed: The request was sent to a static host rather than the backend API. Please configure VITE_API_BASE_URL to point to your live backend server.`
      );
    }

    // 3. HTTP 404 Not Found
    if (response.status === 404) {
      throw new Error(`API endpoint not found (HTTP 404): ${requestUrl}`);
    }

    // 4. HTTP 502 / 503 / 504 Bad Gateway / Service Unavailable
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error(
        `Backend service is unavailable (HTTP ${response.status}). Please check backend deployment status.`
      );
    }

    // 5. Short plain-text error from server
    if (text && !text.startsWith("<!") && text.length < 200) {
      throw new Error(text.trim());
    }

    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
  }

  if (isJson && json !== null) {
    return json;
  }

  if (!text || !text.trim()) {
    return {};
  }

  if (text.startsWith("<!doctype") || text.startsWith("<html")) {
    throw new Error(
      `Received HTML page instead of API JSON from ${requestUrl}. Ensure VITE_API_BASE_URL points to the live backend server.`
    );
  }

  return { raw: text };
}

/**
 * Helper to fetch JSON with timeout, retry on 127.0.0.1 for Windows IPv6/IPv4 mismatch
 */
async function fetchJson(url) {
  const urls = getCandidateUrls(url);
  let lastError = null;

  for (const candidate of urls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(candidate, { signal: controller.signal });
      clearTimeout(timeoutId);
      return await handleApiResponse(response, candidate);
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to fetch JSON from ${url}`);
}

/**
 * 1. Get Current Weather from FastAPI
 * Endpoint: GET /weather/current?latitude={lat}&longitude={lon}
 */
export async function getCurrentWeather(latitude, longitude) {
  const url = `${API_BASE_URL}/weather/current?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
  const data = await fetchJson(url);

  return {
    latitude: data.latitude ?? data.location?.latitude ?? latitude,
    longitude: data.longitude ?? data.location?.longitude ?? longitude,
    temperature: data.temperature ?? data.current?.temperature,
    humidity: data.humidity ?? data.current?.humidity,
    windSpeed: data.wind_speed ?? data.current?.wind_speed ?? data.windSpeed,
    solarRadiation: data.solar_radiation ?? data.current?.solar_radiation ?? data.solarRadiation,
    timestamp: data.timestamp ?? new Date().toISOString(),
    raw: data,
  };
}

/**
 * 2. Get Thermal Metrics (Heat Index, Estimated WBGT, Estimated UTCI, Thermal Stress Score) from FastAPI
 * Endpoint: GET /thermal/calculate?latitude={lat}&longitude={lon}
 */
export async function getThermalMetrics(latitude, longitude) {
  const url = `${API_BASE_URL}/thermal/calculate?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
  const data = await fetchJson(url);

  return {
    heatIndex: data.heat_index?.value ?? data.thermal_metrics?.heat_index,
    heatIndexStatus: data.heat_index?.status,
    estimatedWbgt: data.wbgt?.value ?? data.thermal_metrics?.estimated_wbgt,
    wbgtType: data.wbgt?.type ?? "estimated",
    wbgtMethod: data.wbgt?.method,
    estimatedUtci: data.utci?.value ?? data.thermal_metrics?.estimated_utci,
    utciType: data.utci?.type ?? "estimated",
    utciStatus: data.utci?.status,
    thermalStressScore: data.thermal_stress_score ?? data.thermal_metrics?.thermal_stress_score,
    thermalStressCategory: data.thermal_stress_category ?? data.thermal_metrics?.thermal_stress_category,
    weather: data.weather,
    location: data.location,
    raw: data,
  };
}

/**
 * 3. Get Combined Heat-Health Risk Score & Category from FastAPI (Step 4 End-to-End)
 * Endpoint: GET /risk/calculate?area_name={area}&latitude={lat}&longitude={lon}
 */
export async function calculateFinalRisk(areaName, latitude, longitude) {
  const params = new URLSearchParams({
    area_name: String(areaName),
    latitude: String(latitude),
    longitude: String(longitude),
  });

  const url = `${API_BASE_URL}/risk/calculate?${params.toString()}`;
  const data = await fetchJson(url);

  return {
    area: data.area,
    weather: data.weather,
    thermal: data.thermal,
    vulnerability: data.vulnerability,
    risk: data.risk,
    riskScore: data.risk?.score ?? data.risk_score,
    riskCategory: data.risk?.category ?? data.risk_category,
    explanation: data.risk?.explanation,
    raw: data,
  };
}

/**
 * 4. Get Area Vulnerability Profile from FastAPI
 * Endpoint: GET /vulnerability/{area_name}
 */
export async function getAreaVulnerability(areaName) {
  const url = `${API_BASE_URL}/vulnerability/${encodeURIComponent(areaName)}`;
  const data = await fetchJson(url);
  return data;
}

/**
 * 5. Direct Risk calculation (Legacy fallback)
 * Endpoint: GET /risk/calculate?thermal_stress={ts}&vulnerability={v}
 */
export async function getRisk(thermalStress, vulnerability) {
  const params = new URLSearchParams({
    thermal_stress: String(thermalStress),
    vulnerability: String(vulnerability),
  });

  const url = `${API_BASE_URL}/risk/calculate?${params.toString()}`;
  const data = await fetchJson(url);

  return {
    riskScore: data.risk?.score ?? data.risk_score,
    riskCategory: data.risk?.category ?? data.risk_category,
    raw: data,
  };
}

/**
 * 4. Get 5-Day Weather Forecast from FastAPI
 * Endpoint: GET /weather/forecast?latitude={lat}&longitude={lon}
 */
export async function getWeatherForecast(latitude, longitude) {
  const url = `${API_BASE_URL}/weather/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
  return await fetchJson(url);
}

/**
 * 5. Get 6-Hour Machine Learning Future HeatShield Risk Prediction from FastAPI
 * Endpoint: POST /prediction/predict
 */
export async function getFuturePrediction(areaName, latitude, longitude) {
  const payload = JSON.stringify({
    area_name: String(areaName),
    latitude: Number(latitude),
    longitude: Number(longitude),
  });

  const urls = getCandidateUrls(`${API_BASE_URL}/prediction/predict`);

  let lastError = null;
  for (const url of urls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await handleApiResponse(response, url);
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to connect to prediction API");
}

export const getPrediction = getFuturePrediction;

/**
 * 6. Get Comprehensive Alert Payload from FastAPI (Step 6)
 * Endpoint: GET /alerts/{area_name}?latitude={lat}&longitude={lon}
 */
export async function getAreaAlert(areaName, latitude, longitude) {
  let url = `${API_BASE_URL}/alerts/${encodeURIComponent(areaName)}`;
  if (latitude != null && longitude != null) {
    url += `?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
  }
  return await fetchJson(url);
}

/**
 * 7. Get SHAP Explanation from FastAPI (Step 6)
 * Endpoint: POST /explanation
 */
export async function getAreaExplanation(areaName, latitude, longitude) {
  const payload = JSON.stringify({
    area_name: String(areaName),
    latitude: Number(latitude),
    longitude: Number(longitude),
  });

  const urls = getCandidateUrls(`${API_BASE_URL}/explanation`);

  let lastError = null;
  for (const url of urls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await handleApiResponse(response, url);
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to fetch SHAP explanation");
}

/**
 * 8. Get Area Alert Status (Lightweight endpoint for 60s change detection polling)
 * Endpoint: GET /alerts/status/{area_name}?latitude={lat}&longitude={lon}
 */
export async function getAreaAlertStatus(areaName, latitude, longitude) {
  let url = `${API_BASE_URL}/alerts/status/${encodeURIComponent(areaName)}`;
  if (latitude != null && longitude != null) {
    url += `?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
  }
  return await fetchJson(url);
}

/**
 * 9. Get In-Memory Alert History for an Area
 * Endpoint: GET /alerts/history/{area_name}
 */
export async function getAreaAlertHistory(areaName) {
  const url = `${API_BASE_URL}/alerts/history/${encodeURIComponent(areaName)}`;
  return await fetchJson(url);
}

/**
 * 10. Acknowledge / Mark Alert as Read
 * Endpoint: POST /alerts/{alert_id}/read
 */
export async function markAlertRead(alertId) {
  const urls = getCandidateUrls(`${API_BASE_URL}/alerts/${encodeURIComponent(alertId)}/read`);

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return await handleApiResponse(response, url);
    } catch {
      // try next
    }
  }
  return { success: false, alert_id: alertId };
}

/**
 * 11. Mark All Alerts as Read for an Area
 * Endpoint: POST /alerts/history/{area_name}/read-all
 */
export async function markAllAlertsRead(areaName) {
  const url = `${API_BASE_URL}/alerts/history/${encodeURIComponent(areaName)}/read-all`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return await handleApiResponse(response, url);
  } catch {
    // fallback
  }
  return { success: false };
}

/**
 * 12. Health check to test if FastAPI is reachable
 */
export async function checkBackendHealth() {
  const data = await fetchJson(`${API_BASE_URL}/`);
  return data;
}

/**
 * Helper to fetch all demonstration locations
 */
export async function fetchLocations() {
  return Promise.resolve(WEST_GODAVARI_LOCATIONS);
}

/**
 * Helper to get recommended public health actions
 */
export function fetchRecommendedActions(riskCategory) {
  return getRecommendedActions(riskCategory);
}

/**
 * Helper to ask AI Assistant a question
 * Connects to FastAPI endpoint: POST /assistant/chat
 * Falls back gracefully to local grounded synthesis if server unreachable
 */
export async function askAiAssistant(question, currentLocation) {
  const areaName = typeof currentLocation === "string"
    ? currentLocation
    : currentLocation?.name || currentLocation?.area || "Tadepalligudem";

  const payload = {
    area_name: areaName,
    message: question,
    latitude: currentLocation?.latitude ?? null,
    longitude: currentLocation?.longitude ?? null,
  };

  const urls = getCandidateUrls(`${API_BASE_URL}/assistant/chat`);

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await handleApiResponse(response, url);
      if (data && data.response) {
        return data.response;
      }
    } catch {
      // try fallback url
    }
  }

  // Graceful client fallback if offline
  return getAiAssistantResponse(question, currentLocation);
}

/**
 * Check AI Assistant status and active provider (Gemini vs grounded deterministic)
 * Endpoint: GET /assistant/status
 */
export async function getAssistantStatus() {
  try {
    return await fetchJson(`${API_BASE_URL}/assistant/status`);
  } catch {
    return { status: "operational", provider: "grounded_deterministic" };
  }
}

/**
 * 13. Get Consolidated Dashboard Summary (Step 9)
 * Endpoint: GET /dashboard/summary?area_name={area}&latitude={lat}&longitude={lon}
 */
export async function getDashboardSummary(areaName, latitude, longitude) {
  let url = `${API_BASE_URL}/dashboard/summary?area_name=${encodeURIComponent(areaName)}`;
  if (latitude != null && longitude != null) {
    url += `&latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
  }
  return await fetchJson(url);
}

/**
 * 14. Get Hyperlocal Ward Data for Area
 * Endpoint: GET /risk/wards/{area_name}
 * Graceful fallback to client-side prototype dataset if backend is unreachable.
 */
export async function getWardsData(areaName) {
  if (!areaName) return null;
  const cleanArea = areaName.toLowerCase().trim();

  // 1. Try backend API
  const url = `${API_BASE_URL}/risk/wards/${encodeURIComponent(cleanArea)}`;
  try {
    const data = await fetchJson(url);
    if (data && data.wards && data.wards.length > 0) {
      return {
        available: true,
        area: data.area || areaName,
        dataType: data.data_type || "prototype",
        disclaimer: data.disclaimer || WARD_PROTOTYPE_DISCLAIMER,
        wards: data.wards.map(w => ({
          id: w.id,
          wardNumber: w.ward_number || w.wardNumber,
          name: w.name,
          latitude: w.latitude,
          longitude: w.longitude,
          riskScore: w.risk_score != null ? w.risk_score : w.riskScore,
          riskCategory: w.risk_category || w.riskCategory,
          temperature: w.temperature,
          humidity: w.humidity,
          vulnerablePopulation: w.vulnerable_population || w.vulnerablePopulation,
          alertLevel: w.alert_level || w.alertLevel,
          riskDrivers: w.risk_drivers || w.riskDrivers || []
        }))
      };
    }
  } catch {
    // Backend not reached or 404, fallback below
  }

  // 2. Client-side prototype dataset fallback
  const localWards = getWardsForArea(areaName);
  if (localWards && localWards.length > 0) {
    return {
      available: true,
      area: areaName,
      dataType: "prototype",
      disclaimer: WARD_PROTOTYPE_DISCLAIMER,
      wards: localWards
    };
  }

  return {
    available: false,
    area: areaName,
    message: `Ward-level data is not available for ${areaName} yet.`,
    wards: []
  };
}

/**
 * 15. Authentication APIs
 */

export async function loginUser(identifier, password, rememberMe = false) {
  if (isMissingApiBaseUrl()) {
    throw new Error(
      "Backend API URL is not configured. Please configure VITE_API_BASE_URL in your deployment environment variables (e.g. Vercel) to point to your live backend server."
    );
  }

  const url = `${API_BASE_URL}/auth/login`;
  const urls = getCandidateUrls(url);

  let lastError = null;
  for (const u of urls) {
    try {
      const response = await fetch(u, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: identifier,
          password: password,
          remember_me: rememberMe,
        }),
      });

      return await handleApiResponse(response, u);
    } catch (err) {
      lastError = err;
      if (
        err.message &&
        !err.message.includes("404") &&
        !err.message.includes("405") &&
        !err.message.includes("Failed to fetch") &&
        !err.message.includes("NetworkError")
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to connect to authentication service");
}

export async function registerUser({ fullName, email, password, username }) {
  if (isMissingApiBaseUrl()) {
    throw new Error(
      "Backend API URL is not configured. Please configure VITE_API_BASE_URL in your deployment environment variables (e.g. Vercel) to point to your live backend server."
    );
  }

  const primaryUrl = `${API_BASE_URL}/auth/register`;
  const fallbackUrl = `${API_BASE_URL}/auth/signup`;
  const primaryCandidates = getCandidateUrls(primaryUrl);
  const fallbackCandidates = getCandidateUrls(fallbackUrl);
  const urls = [...primaryCandidates, ...fallbackCandidates];

  let lastError = null;
  for (const u of urls) {
    try {
      const response = await fetch(u, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password,
          username: username || email.split("@")[0],
        }),
      });

      return await handleApiResponse(response, u);
    } catch (err) {
      lastError = err;
      if (
        err.message &&
        !err.message.includes("404") &&
        !err.message.includes("405") &&
        !err.message.includes("Failed to fetch") &&
        !err.message.includes("NetworkError")
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to connect to registration service");
}

export async function getCurrentUser(token) {
  if (!token) return null;
  const url = `${API_BASE_URL}/auth/me`;
  const urls = getCandidateUrls(url);

  for (const u of urls) {
    try {
      const response = await fetch(u, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response, u);
    } catch {
      // try next url
    }
  }
  return null;
}

export async function logoutUser(token) {
  if (!token) return;
  const url = `${API_BASE_URL}/auth/logout`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // ignore
  }
}

/**
 * 16. Email Notification APIs (HIGH and EXTREME Alert Dispatch)
 */

export async function evaluateEmailAlert(alertPayload, token) {
  if (!token) return { sent: false, error: "No auth token" };
  const url = `${API_BASE_URL}/alerts/notify-email`;
  const urls = getCandidateUrls(url);

  for (const u of urls) {
    try {
      const response = await fetch(u, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(alertPayload),
      });
      return await handleApiResponse(response, u);
    } catch {
      // try next url
    }
  }
  return { sent: false, error: "Failed to connect to email alert service" };
}

export async function sendDemoEmail(token) {
  if (!token) throw new Error("Authentication required to send demo alert email");
  const url = `${API_BASE_URL}/alerts/demo-email`;
  const urls = getCandidateUrls(url);

  let lastError = null;
  for (const u of urls) {
    try {
      const response = await fetch(u, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleApiResponse(response, u);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to connect to demo email service");
}

export async function setMonitoredLocation(locationPayload, token) {
  if (!token) return null;
  const url = `${API_BASE_URL}/alerts/monitor-location`;
  const urls = getCandidateUrls(url);

  for (const u of urls) {
    try {
      const response = await fetch(u, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(locationPayload),
      });
      return await handleApiResponse(response, u);
    } catch {
      // try next url
    }
  }
  return null;
}

export async function getMonitoredLocation(token) {
  if (!token) return null;
  const url = `${API_BASE_URL}/alerts/monitor-location`;
  const urls = getCandidateUrls(url);

  for (const u of urls) {
    try {
      const response = await fetch(u, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response, u);
    } catch {
      // try next url
    }
  }
  return null;
}

export async function getEmailAlertHistory(token) {
  if (!token) return { recipient: null, logs: [], count: 0 };
  const url = `${API_BASE_URL}/alerts/email-history`;
  const urls = getCandidateUrls(url);

  for (const u of urls) {
    try {
      const response = await fetch(u, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response, u);
    } catch {
      // try next url
    }
  }
  return { recipient: null, logs: [], count: 0 };
}

export async function getEmailStatus(token) {
  if (!token) return { status: "Not configured", enabled: false, configured: false };
  const url = `${API_BASE_URL}/alerts/email-status`;
  const urls = getCandidateUrls(url);

  for (const u of urls) {
    try {
      const response = await fetch(u, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await handleApiResponse(response, u);
    } catch {
      // try next url
    }
  }
  return { status: "Not configured", enabled: false, configured: false };
}




