import { useEffect, useState } from "react";

import { getCurrentWeather } from "./services/weatherService";

import ThermalRiskCard from "./components/ThermalRiskCard";

import RiskExplanation from "./components/RiskExplanation";


function App() {

  // ============================================================
  // STATE
  // ============================================================

  const [weather, setWeather] = useState(null);

  const [thermal, setThermal] = useState(null);

  const [vulnerability, setVulnerability] = useState(null);

  const [risk, setRisk] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);


  // ============================================================
  // LOCATION
  // ============================================================

  const latitude = 16.3067;

  const longitude = 80.4365;


  // ============================================================
  // DEMO VULNERABILITY DATA
  //
  // Later this will come from Supabase.
  // ============================================================

  const vulnerabilityData = {

    elderly: 15,

    children: 20,

    outdoor_workers: 40,

    population_density: 10000,

    housing_vulnerability: 0.6,

    healthcare_access: 0.7

  };


  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {

    async function loadData() {

      try {

        setLoading(true);

        setError(null);


        // ======================================================
        // 1. GET CURRENT WEATHER
        // ======================================================

        const weatherData =
          await getCurrentWeather(
            latitude,
            longitude
          );

        setWeather(weatherData);


        const current =
          weatherData.current;


        // ======================================================
        // 2. GET THERMAL METRICS
        // ======================================================

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


        // ======================================================
        // 3. GET VULNERABILITY
        // ======================================================

        const vulnerabilityResponse =
          await fetch(
            `http://localhost:8000/vulnerability/calculate` +
            `?elderly=${vulnerabilityData.elderly}` +
            `&children=${vulnerabilityData.children}` +
            `&outdoor_workers=${vulnerabilityData.outdoor_workers}` +
            `&population_density=${vulnerabilityData.population_density}` +
            `&housing_vulnerability=${vulnerabilityData.housing_vulnerability}` +
            `&healthcare_access=${vulnerabilityData.healthcare_access}`
          );


        if (!vulnerabilityResponse.ok) {

          throw new Error(
            "Failed to fetch vulnerability data"
          );

        }


        const vulnerabilityResult =
          await vulnerabilityResponse.json();


        setVulnerability(
          vulnerabilityResult
        );


        // ======================================================
        // 4. GET HEAT-HEALTH RISK
        //
        // UTCI is not required here because the thermal
        // endpoint currently returns the existing thermal
        // metrics only.
        //
        // The current thermal stress score will be available
        // after UTCI integration.
        // ======================================================

        if (
          thermalData.thermal_stress_score !== undefined &&
          thermalData.thermal_stress_score !== null
        ) {

          const riskResponse =
            await fetch(
              `http://localhost:8000/risk/calculate` +
              `?thermal_stress=${thermalData.thermal_stress_score}` +
              `&vulnerability=${vulnerabilityResult.vulnerability_score}`
            );


          if (!riskResponse.ok) {

            throw new Error(
              "Failed to fetch risk data"
            );

          }


          const riskData =
            await riskResponse.json();


          setRisk(riskData);

        }

      }

      catch (err) {

        console.error(
          "Dashboard error:",
          err
        );


        setError(
          err.message ||
          "Unable to load dashboard data."
        );

      }

      finally {

        setLoading(false);

      }

    }


    loadData();

  }, []);


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="
        min-h-screen
        bg-slate-950
        text-white
        flex
        items-center
        justify-center
      ">

        <div className="text-center">

          <div className="text-5xl mb-5">
            🔥
          </div>

          <h1 className="text-3xl font-bold">
            HeatShield AI
          </h1>

          <p className="text-slate-400 mt-2">
            Loading heat-health conditions...
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (

      <div className="
        min-h-screen
        bg-slate-950
        text-white
        flex
        items-center
        justify-center
      ">

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


  // ============================================================
  // WEATHER VALUES
  // ============================================================

  const temperature =
    weather?.current?.temperature;

  const humidity =
    weather?.current?.humidity;

  const wind =
    weather?.current?.wind_speed;

  const solar =
    weather?.current?.solar_radiation;


  // ============================================================
  // THERMAL VALUES
  // ============================================================

  const heatIndex =
    thermal?.thermal_metrics?.heat_index;

  const wbgt =
    thermal?.thermal_metrics?.estimated_wbgt;

  const utci =
    thermal?.thermal_metrics?.utci;

  const thermalScore =
    thermal?.thermal_stress_score;


  // ============================================================
  // VULNERABILITY VALUES
  // ============================================================

  const vulnerabilityScore =
    vulnerability?.vulnerability_score;

  const vulnerabilityCategory =
    vulnerability?.category;


  // ============================================================
  // RISK VALUES
  // ============================================================

  const riskScore =
    risk?.risk_score;

  const riskCategory =
    risk?.risk_category;


  // ============================================================
  // DASHBOARD
  // ============================================================

  return (

    <div className="
      min-h-screen
      bg-slate-950
      text-white
    ">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="
        border-b
        border-slate-800
      ">

        <div className="
          max-w-6xl
          mx-auto
          px-6
          py-6
        ">

          <h1 className="
            text-3xl
            font-bold
          ">
            🔥 HeatShield AI
          </h1>

          <p className="
            text-slate-400
            mt-1
          ">
            Heat-Health Early Warning System
          </p>

        </div>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="
        max-w-6xl
        mx-auto
        px-6
        py-10
      ">


        {/* ====================================================
            WEATHER
        ==================================================== */}

        <section>

          <h2 className="
            text-xl
            font-semibold
            mb-5
          ">
            Weather
          </h2>


          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-4
            gap-5
          ">


            {/* Temperature */}

            <div className="
              bg-slate-900
              border
              border-slate-800
              rounded-xl
              p-6
            ">

              <div className="text-3xl">
                🌡️
              </div>

              <p className="
                text-slate-400
                mt-4
              ">
                Temperature
              </p>

              <p className="
                text-3xl
                font-bold
                mt-1
              ">

                {temperature !== undefined
                  ? `${temperature}°C`
                  : "--"}

              </p>

            </div>


            {/* Humidity */}

            <div className="
              bg-slate-900
              border
              border-slate-800
              rounded-xl
              p-6
            ">

              <div className="text-3xl">
                💧
              </div>

              <p className="
                text-slate-400
                mt-4
              ">
                Humidity
              </p>

              <p className="
                text-3xl
                font-bold
                mt-1
              ">

                {humidity !== undefined
                  ? `${humidity}%`
                  : "--"}

              </p>

            </div>


            {/* Wind */}

            <div className="
              bg-slate-900
              border
              border-slate-800
              rounded-xl
              p-6
            ">

              <div className="text-3xl">
                💨
              </div>

              <p className="
                text-slate-400
                mt-4
              ">
                Wind
              </p>

              <p className="
                text-3xl
                font-bold
                mt-1
              ">

                {wind !== undefined
                  ? `${wind} km/h`
                  : "--"}

              </p>

            </div>


            {/* Solar */}

            <div className="
              bg-slate-900
              border
              border-slate-800
              rounded-xl
              p-6
            ">

              <div className="text-3xl">
                ☀️
              </div>

              <p className="
                text-slate-400
                mt-4
              ">
                Solar Radiation
              </p>

              <p className="
                text-3xl
                font-bold
                mt-1
              ">

                {solar !== undefined
                  ? `${solar} W/m²`
                  : "--"}

              </p>

            </div>

          </div>

        </section>


        {/* ====================================================
            THERMAL STRESS
        ==================================================== */}

        <section className="mt-10">

          <h2 className="
            text-xl
            font-semibold
            mb-5
          ">
            Thermal Stress
          </h2>


          <div className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-8
          ">


            <div className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-6
            ">


              {/* Heat Index */}

              <div>

                <div className="text-3xl">
                  🔥
                </div>

                <p className="
                  text-slate-400
                  mt-3
                ">
                  Heat Index
                </p>

                <p className="
                  text-3xl
                  font-bold
                  mt-1
                ">

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

                <p className="
                  text-slate-400
                  mt-3
                ">
                  Estimated WBGT
                </p>

                <p className="
                  text-3xl
                  font-bold
                  mt-1
                ">

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

                <p className="
                  text-slate-400
                  mt-3
                ">
                  UTCI
                </p>

                <p className="
                  text-3xl
                  font-bold
                  mt-1
                ">

                  {utci !== undefined &&
                  utci !== null
                    ? `${utci}°C`
                    : "--"}

                </p>

              </div>

            </div>


            {/* Thermal Score */}

            <div className="
              border-t
              border-slate-800
              mt-8
              pt-6
            ">

              <p className="
                text-slate-400
              ">
                Thermal Stress Score
              </p>

              <p className="
                text-4xl
                font-bold
                mt-1
              ">

                {thermalScore !== undefined &&
                thermalScore !== null
                  ? `${thermalScore} / 100`
                  : "--"}

              </p>

            </div>


          </div>

        </section>


        {/* ====================================================
            VULNERABILITY
        ==================================================== */}

        <section className="mt-10">

          <h2 className="
            text-xl
            font-semibold
            mb-5
          ">
            Vulnerability
          </h2>


          <div className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-8
          ">

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-8
            ">


              {/* Score */}

              <div>

                <p className="
                  text-slate-400
                ">
                  Vulnerability Score
                </p>

                <p className="
                  text-5xl
                  font-bold
                  mt-2
                ">

                  {vulnerabilityScore !== undefined
                    ? vulnerabilityScore
                    : "--"}

                </p>

                <p className="
                  text-slate-500
                  mt-2
                ">
                  Out of 100
                </p>

              </div>


              {/* Category */}

              <div>

                <p className="
                  text-slate-400
                ">
                  Vulnerability Category
                </p>

                <p className="
                  text-3xl
                  font-bold
                  mt-2
                  text-orange-400
                ">

                  {vulnerabilityCategory || "--"}

                </p>

                <p className="
                  text-slate-500
                  mt-2
                ">
                  Based on population vulnerability factors
                </p>

              </div>

            </div>


            <div className="
              border-t
              border-slate-800
              mt-8
              pt-5
            ">

              <p className="
                text-xs
                text-slate-500
              ">
                Demo vulnerability profile. This will later
                be replaced with location-specific data from
                Supabase.
              </p>

            </div>

          </div>

        </section>


        {/* ====================================================
            HEAT HEALTH RISK
        ==================================================== */}

        <section className="mt-10">

          <h2 className="
            text-xl
            font-semibold
            mb-5
          ">
            Heat Health Risk
          </h2>


          <div className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-8
          ">


            {/* Risk Card */}

            <ThermalRiskCard
              riskCategory={riskCategory}
              thermalScore={riskScore}
            />


            {/* Risk Explanation */}

            <div className="mt-6">

              <RiskExplanation
                temperature={temperature}
                humidity={humidity}
                solarRadiation={solar}
                windSpeed={wind}
                heatIndex={heatIndex}
                wbgt={wbgt}
                utci={utci}
                thermalScore={thermalScore}
                vulnerabilityScore={vulnerabilityScore}
                vulnerabilityCategory={
                  vulnerabilityCategory
                }
                riskScore={riskScore}
                riskCategory={riskCategory}
              />

            </div>

          </div>

        </section>


        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="
          text-center
          text-slate-500
          mt-10
          pb-6
        ">

          <p>
            HeatShield AI • Heat-Health Early Warning System
          </p>

        </footer>


      </main>

    </div>

  );
}


export default App;