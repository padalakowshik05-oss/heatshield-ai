import { useEffect, useState } from "react";
import WeatherCard from "../components/WeatherCard";
import { getCurrentWeather } from "../services/weatherService";

function Dashboard() {

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const latitude = 16.3067;
  const longitude = 80.4365;

  useEffect(() => {

    async function loadWeather() {

      try {

        const data = await getCurrentWeather(
          latitude,
          longitude
        );

        setWeather(data);

      } catch (err) {

        setError(err.message);

      } finally {

        setLoading(false);

      }
    }

    loadWeather();

  }, []);

  if (loading) {
    return <p>Loading weather...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="p-8">

      <h1 className="text-4xl font-bold">
        HeatShield AI
      </h1>

      <p className="mt-2 text-gray-500">
        Heat-Health Early Warning System
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-4">

        <WeatherCard
          title="Temperature"
          value={weather.current.temperature_2m}
          unit="°C"
          icon="🌡️"
        />

        <WeatherCard
          title="Humidity"
          value={weather.current.relative_humidity_2m}
          unit="%"
          icon="💧"
        />

        <WeatherCard
          title="Wind Speed"
          value={weather.current.wind_speed_10m}
          unit="km/h"
          icon="💨"
        />

        <WeatherCard
          title="Solar Radiation"
          value={weather.current.shortwave_radiation}
          unit="W/m²"
          icon="☀️"
        />

      </div>

    </div>
  );
}

export default Dashboard;