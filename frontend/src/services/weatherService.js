// ============================================================================
// HeatShield AI — Weather & Thermal Service
// ============================================================================

import { API_BASE_URL, getCandidateUrls, handleApiResponse } from "./api";

const API_URL = API_BASE_URL;

export { API_URL };

async function fetchWithCandidateFallback(url) {
  const urls = getCandidateUrls(url);
  let lastError = null;
  for (const u of urls) {
    try {
      const res = await fetch(u);
      return await handleApiResponse(res, u);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Failed to fetch from ${url}`);
}

export async function getCurrentWeather(latitude, longitude) {
  return await fetchWithCandidateFallback(
    `${API_URL}/weather/current?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`
  );
}

export async function getWeatherForecast(latitude, longitude) {
  return await fetchWithCandidateFallback(
    `${API_URL}/weather/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`
  );
}

export async function getThermalMetrics(temperature, humidity, windSpeed = 0, solarRadiation = 0) {
  const params = new URLSearchParams({
    temperature: String(temperature),
    humidity: String(humidity),
    wind_speed: String(windSpeed),
    solar_radiation: String(solarRadiation),
  });
  return await fetchWithCandidateFallback(
    `${API_URL}/thermal/metrics?${params.toString()}`
  );
}

export default {
  API_URL,
  getCurrentWeather,
  getWeatherForecast,
  getThermalMetrics,
};
