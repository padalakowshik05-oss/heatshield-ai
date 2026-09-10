import { useEffect, useState } from "react";

import { getCurrentWeather } from "./services/weatherService";

import ThermalRiskCard from "./components/ThermalRiskCard";

import RiskExplanation from "./components/RiskExplanation";


function App() {

  // --------------------------------
  // State
  // --------------------------------

  const [weather, setWeather] = useState(null);

  const [thermal, setThermal] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);


  // --------------------------------
  // Location
  // --------------------------------

  const latitude = 16.3067;

  const longitude = 80.4365;


  // --------------------------------
  // Load Data
  // --------------------------------

  useEffect(() => {

    async function loadData() {

      try {

        setLoading(true);

        setError(null);


        // Get weather

        const weatherData =
          await getCurrentWeather(
            latitude,
            longitude
          );


        setWeather(weatherData);


        // Get thermal data

        const current =
          weatherData.current;


        const thermalResponse =
          await fetch(
            `http://localhost:8000/thermal/calculate` +
            `?temperature=${current.temperature}` +
            `&humidity=${current.humidity}` +
            `&wind_speed=${current.wind_speed}` +
            `&solar_radiation=${current.solar_radiation}`
          );


        if (!thermalResponse.ok) {

          throw new Error(
            "Failed to fetch thermal data"
          );

        }


        const thermalData =
          await thermalResponse.json();


        setThermal(thermalData);

      }

      catch (err) {

        console.error(
          "Dashboard error:",
          err
        );


        setError(
          "Unable to load weather and thermal data."
        );

      }

      finally {

        setLoading(false);

      }

    }


    loadData();

  }, []);


  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {

    return (

      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

        <div className="text-center">

          <div className="text-5xl mb-5">
            🔥
          </div>


          <h1 className="text-3xl font-bold">
            HeatShield AI
          </h1>


          <p className="text-slate-400 mt-2">
            Loading thermal conditions...
          </p>

        </div>

      </div>

    );

  }


  // --------------------------------
  // Error
  // --------------------------------

  if (error) {

    return (

      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

        <div className="text-center">

          <div className="text-5xl mb-5">
            ⚠️
          </div>


          <h1 className="text-3xl font-bold">
            HeatShield AI
          </h1>


          <p className="text-red-400 mt-3">
            {error}
          </p>


          <p className="text-slate-500 mt-2">
            Make sure the FastAPI server is running.
          </p>

        </div>

      </div>

    );

  }


  // --------------------------------
  // Weather Values
  // --------------------------------

  const temperature =
    weather?.current?.temperature;

  const humidity =
    weather?.current?.humidity;

  const wind =
    weather?.current?.wind_speed;

  const solar =
    weather?.current?.solar_radiation;


  // --------------------------------
  // Thermal Values
  // --------------------------------

  const heatIndex =
    thermal?.thermal_metrics?.heat_index;

  const wbgt =
    thermal?.thermal_metrics?.estimated_wbgt;

  const utci =
    thermal?.thermal_metrics?.utci;

  const thermalScore =
    thermal?.thermal_stress_score;

  const riskCategory =
    thermal?.risk_category;


  // --------------------------------
  // Dashboard
  // --------------------------------

  return (

    <div className="min-h-screen bg-slate-950 text-white">


      {/* =================================
          HEADER
      ================================= */}

      <header className="border-b border-slate-800">

        <div className="max-w-6xl mx-auto px-6 py-6">

          <h1 className="text-3xl font-bold">
            🔥 HeatShield AI
          </h1>


          <p className="text-slate-400 mt-1">
            Heat-Health Early Warning System
          </p>

        </div>

      </header>


      {/* =================================
          MAIN
      ================================= */}

      <main className="max-w-6xl mx-auto px-6 py-10">


        {/* =================================
            CURRENT WEATHER
        ================================= */}

        <section>

          <h2 className="text-xl font-semibold mb-5">
            Current Weather
          </h2>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">


            {/* Temperature */}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="text-3xl">
                🌡️
              </div>


              <p className="text-slate-400 mt-4">
                Temperature
              </p>


              <p className="text-3xl font-bold mt-1">

                {temperature !== undefined
                  ? `${temperature}°C`
                  : "--"}

              </p>

            </div>


            {/* Humidity */}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="text-3xl">
                💧
              </div>


              <p className="text-slate-400 mt-4">
                Humidity
              </p>


              <p className="text-3xl font-bold mt-1">

                {humidity !== undefined
                  ? `${humidity}%`
                  : "--"}

              </p>

            </div>


            {/* Wind */}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="text-3xl">
                💨
              </div>


              <p className="text-slate-400 mt-4">
                Wind
              </p>


              <p className="text-3xl font-bold mt-1">

                {wind !== undefined
                  ? `${wind} km/h`
                  : "--"}

              </p>

            </div>


            {/* Solar */}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="text-3xl">
                ☀️
              </div>


              <p className="text-slate-400 mt-4">
                Solar Radiation
              </p>


              <p className="text-3xl font-bold mt-1">

                {solar !== undefined
                  ? `${solar} W/m²`
                  : "--"}

              </p>

            </div>

          </div>

        </section>


        {/* =================================
            THERMAL STRESS
        ================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-semibold mb-5">
            Thermal Stress
          </h2>


          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">


            {/* Thermal Metrics */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


              {/* Heat Index */}

              <div>

                <div className="text-3xl">
                  🔥
                </div>


                <p className="text-slate-400 mt-3">
                  Heat Index
                </p>


                <p className="text-3xl font-bold mt-1">

                  {heatIndex !== undefined
                    ? `${heatIndex}°C`
                    : "--"}

                </p>

              </div>


              {/* WBGT */}

              <div>

                <div className="text-3xl">
                  🌡️
                </div>


                <p className="text-slate-400 mt-3">
                  Estimated WBGT
                </p>


                <p className="text-3xl font-bold mt-1">

                  {wbgt !== undefined
                    ? `${wbgt}°C`
                    : "--"}

                </p>

              </div>


              {/* UTCI */}

              <div>

                <div className="text-3xl">
                  🌍
                </div>


                <p className="text-slate-400 mt-3">
                  UTCI
                </p>


                <p className="text-3xl font-bold mt-1">

                  {utci !== undefined
                    ? `${utci}°C`
                    : "--"}

                </p>

              </div>

            </div>


            {/* Risk Card */}

            <div className="mt-8">

              <ThermalRiskCard
                riskCategory={riskCategory}
                thermalScore={thermalScore}
              />

            </div>


            {/* Risk Explanation */}

            <div className="mt-6">

              <RiskExplanation
                temperature={temperature}
                humidity={humidity}
                solarRadiation={solar}
                windSpeed={wind}
              />

            </div>


          </div>

        </section>


        {/* =================================
            FOOTER
        ================================= */}

        <footer className="text-center text-slate-500 mt-10 pb-6">

          <p>
            HeatShield AI • Heat-Health Early Warning System
          </p>

        </footer>


      </main>

    </div>

  );

}


export default App;