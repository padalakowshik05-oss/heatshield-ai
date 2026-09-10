const API_URL = "http://localhost:8000";

export async function getCurrentWeather(latitude, longitude) {
  const response = await fetch(
    `${API_URL}/weather/current?latitude=${latitude}&longitude=${longitude}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }

  return response.json();
}