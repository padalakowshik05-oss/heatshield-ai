// ============================================================================
// HeatShield AI — West Godavari District Demonstration Mock Data
//
// NOTE FOR HACKATHON EVALUATION & DEMO:
// // DEMO DATA — replace with FastAPI data later (/weather/current, /risk/calculate)
// These values represent realistic meteorological & biometeorological simulations
// across mandals and towns in West Godavari District, Andhra Pradesh.
// ============================================================================

export const DISTRICT_INFO = {
  name: "West Godavari",
  state: "Andhra Pradesh",
  country: "India",
  centerCoords: [16.75, 81.60],
  defaultZoom: 10,
};

export const DISTRICT_LIST = [
  { id: "west_godavari", name: "West Godavari", state: "Andhra Pradesh", supported: true },
];

export const WEST_GODAVARI_LOCATIONS = [
  {
    id: "tadepalligudem",
    name: "Tadepalligudem",
    mandals: "Tadepalligudem Urban & Agricultural Belt",
    latitude: 16.8152,
    longitude: 81.5267,
    temperature: 41.2,
    humidity: 68,
    windSpeed: 8,
    solarRadiation: 812,
    heatIndex: 54.8,
    wbgt: 34.7,
    utci: 43.2,
    riskScore: 86,
    riskCategory: "EXTREME",
    nightTemp: 31.4,
    mainRiskFactor: "Compounding extreme ambient heat (41.2°C) with 68% relative humidity and intense solar radiation (812 W/m²)",
    vulnerablePopulation: 18400,
    factors: {
      temperature: 95,
      humidity: 82,
      solarRadiation: 90,
      nightHeat: 84,
    },
    forecast: [
      { day: "Today", temp: 41.2, riskScore: 86, category: "EXTREME" },
      { day: "Tomorrow", temp: 42.0, riskScore: 88, category: "EXTREME" },
      { day: "Day 3", temp: 40.5, riskScore: 80, category: "EXTREME" },
      { day: "Day 4", temp: 39.2, riskScore: 71, category: "HIGH" },
      { day: "Day 5", temp: 38.0, riskScore: 62, category: "HIGH" },
    ],
  },
  {
    id: "tanuku",
    name: "Tanuku",
    mandals: "Tanuku Mandal & Agro-Industrial Corridor",
    latitude: 16.7570,
    longitude: 81.6820,
    temperature: 42.4,
    humidity: 64,
    windSpeed: 7,
    solarRadiation: 820,
    heatIndex: 47.8,
    wbgt: 31.2,
    utci: 43.6,
    riskScore: 88,
    riskCategory: "EXTREME",
    nightTemp: 31.2,
    mainRiskFactor: "Compounding high ambient heat with industrial surface heat and 64% humidity",
    vulnerablePopulation: 16200,
    factors: {
      temperature: 94,
      humidity: 74,
      solarRadiation: 89,
      nightHeat: 83,
    },
    forecast: [
      { day: "Today", temp: 42.4, riskScore: 88, category: "EXTREME" },
      { day: "Tomorrow", temp: 43.0, riskScore: 89, category: "EXTREME" },
      { day: "Day 3", temp: 41.5, riskScore: 80, category: "EXTREME" },
      { day: "Day 4", temp: 39.8, riskScore: 72, category: "HIGH" },
      { day: "Day 5", temp: 38.5, riskScore: 63, category: "HIGH" },
    ],
  },
  {
    id: "bhimavaram",
    name: "Bhimavaram",
    district: "West Godavari",
    mandals: "Bhimavaram Urban & Aqua Belt",
    latitude: 16.5449,
    longitude: 81.5212,
    temperature: 40.1,
    humidity: 66,
    windSpeed: 10,
    solarRadiation: 760,
    heatIndex: 50.2,
    wbgt: 32.5,
    utci: 40.8,
    riskScore: 72,
    riskCategory: "HIGH",
    nightTemp: 29.5,
    mainRiskFactor: "Urban heat accumulation and dense commercial aqua market exposure",
    vulnerablePopulation: 14200,
    factors: {
      temperature: 84,
      humidity: 76,
      solarRadiation: 78,
      nightHeat: 70,
    },
    forecast: [
      { day: "Today", temp: 40.1, riskScore: 72, category: "HIGH" },
      { day: "Tomorrow", temp: 41.0, riskScore: 75, category: "HIGH" },
      { day: "Day 3", temp: 39.5, riskScore: 69, category: "HIGH" },
      { day: "Day 4", temp: 38.2, riskScore: 59, category: "HIGH" },
      { day: "Day 5", temp: 37.0, riskScore: 50, category: "MODERATE" },
    ],
  },
  {
    id: "attili",
    name: "Attili",
    district: "West Godavari",
    mandals: "Central Delta Agro Corridor",
    latitude: 16.7000,
    longitude: 81.6000,
    temperature: 39.8,
    humidity: 67,
    windSpeed: 8,
    solarRadiation: 780,
    heatIndex: 49.5,
    wbgt: 32.1,
    utci: 40.2,
    riskScore: 70,
    riskCategory: "HIGH",
    nightTemp: 29.8,
    mainRiskFactor: "Midday agricultural solar exposure and canal moisture retention",
    vulnerablePopulation: 9200,
    factors: {
      temperature: 82,
      humidity: 77,
      solarRadiation: 79,
      nightHeat: 68,
    },
    forecast: [
      { day: "Today", temp: 39.8, riskScore: 70, category: "HIGH" },
      { day: "Tomorrow", temp: 40.5, riskScore: 74, category: "HIGH" },
      { day: "Day 3", temp: 39.2, riskScore: 68, category: "HIGH" },
      { day: "Day 4", temp: 38.0, riskScore: 60, category: "HIGH" },
      { day: "Day 5", temp: 37.2, riskScore: 52, category: "HIGH" },
    ],
  },
  {
    id: "jangareddygudem",
    name: "Jangareddygudem",
    mandals: "Agency / Foothills Border",
    latitude: 17.1264,
    longitude: 81.2949,
    temperature: 42.6,
    humidity: 58,
    windSpeed: 6,
    solarRadiation: 845,
    heatIndex: 52.4,
    wbgt: 34.1,
    utci: 43.8,
    riskScore: 82,
    riskCategory: "EXTREME",
    nightTemp: 31.9,
    mainRiskFactor: "Severe inland dry heat & intense direct shortwave solar radiation",
    vulnerablePopulation: 14600,
    factors: {
      temperature: 96,
      humidity: 62,
      solarRadiation: 94,
      nightHeat: 84,
    },
    forecast: [
      { day: "Today", temp: 42.6, riskScore: 82, category: "EXTREME" },
      { day: "Tomorrow", temp: 43.1, riskScore: 85, category: "EXTREME" },
      { day: "Day 3", temp: 41.8, riskScore: 79, category: "EXTREME" },
      { day: "Day 4", temp: 40.0, riskScore: 72, category: "HIGH" },
      { day: "Day 5", temp: 39.2, riskScore: 65, category: "HIGH" },
    ],
  },
  {
    id: "palakollu",
    name: "Palakollu",
    mandals: "Commercial Agro Hub",
    latitude: 16.5200,
    longitude: 81.7300,
    temperature: 38.7,
    humidity: 72,
    windSpeed: 10,
    solarRadiation: 750,
    heatIndex: 50.1,
    wbgt: 32.8,
    utci: 40.7,
    riskScore: 72,
    riskCategory: "HIGH",
    nightTemp: 29.5,
    mainRiskFactor: "Warm delta moisture retention & crowded market squares",
    vulnerablePopulation: 12800,
    factors: {
      temperature: 80,
      humidity: 86,
      solarRadiation: 74,
      nightHeat: 68,
    },
    forecast: [
      { day: "Today", temp: 38.7, riskScore: 72, category: "HIGH" },
      { day: "Tomorrow", temp: 39.4, riskScore: 76, category: "EXTREME" },
      { day: "Day 3", temp: 38.8, riskScore: 71, category: "HIGH" },
      { day: "Day 4", temp: 37.5, riskScore: 64, category: "HIGH" },
      { day: "Day 5", temp: 36.8, riskScore: 56, category: "HIGH" },
    ],
  },
  {
    id: "narsapur",
    name: "Narsapur",
    mandals: "Coastal Estuary Zone",
    latitude: 16.4365,
    longitude: 81.7018,
    temperature: 37.8,
    humidity: 76,
    windSpeed: 14,
    solarRadiation: 730,
    heatIndex: 49.5,
    wbgt: 32.2,
    utci: 39.8,
    riskScore: 69,
    riskCategory: "HIGH",
    nightTemp: 29.1,
    mainRiskFactor: "High estuarine humidity with partial sea breeze mitigation",
    vulnerablePopulation: 15300,
    factors: {
      temperature: 75,
      humidity: 92,
      solarRadiation: 71,
      nightHeat: 64,
    },
    forecast: [
      { day: "Today", temp: 37.8, riskScore: 69, category: "HIGH" },
      { day: "Tomorrow", temp: 38.5, riskScore: 73, category: "HIGH" },
      { day: "Day 3", temp: 38.0, riskScore: 70, category: "HIGH" },
      { day: "Day 4", temp: 37.0, riskScore: 61, category: "HIGH" },
      { day: "Day 5", temp: 36.2, riskScore: 52, category: "HIGH" },
    ],
  },
  {
    id: "nidadavole",
    name: "Nidadavole",
    mandals: "Canal Junction & Agro Belt",
    latitude: 16.9142,
    longitude: 81.6706,
    temperature: 37.8,
    humidity: 65,
    windSpeed: 9,
    solarRadiation: 720,
    heatIndex: 45.6,
    wbgt: 30.1,
    utci: 37.8,
    riskScore: 48,
    riskCategory: "MODERATE",
    nightTemp: 28.1,
    mainRiskFactor: "Open canal moisture and mid-tier solar exposure",
    vulnerablePopulation: 9800,
    factors: {
      temperature: 65,
      humidity: 62,
      solarRadiation: 58,
      nightHeat: 52,
    },
    forecast: [
      { day: "Today", temp: 37.8, riskScore: 48, category: "MODERATE" },
      { day: "Tomorrow", temp: 38.2, riskScore: 52, category: "HIGH" },
      { day: "Day 3", temp: 37.9, riskScore: 49, category: "MODERATE" },
      { day: "Day 4", temp: 37.0, riskScore: 44, category: "MODERATE" },
      { day: "Day 5", temp: 36.5, riskScore: 40, category: "MODERATE" },
    ],
  },
  {
    id: "kovvur",
    name: "Kovvur",
    mandals: "Godavari Riverfront",
    latitude: 17.0117,
    longitude: 81.7289,
    temperature: 37.2,
    humidity: 62,
    windSpeed: 12,
    solarRadiation: 720,
    heatIndex: 44.5,
    wbgt: 29.8,
    utci: 36.9,
    riskScore: 48,
    riskCategory: "MODERATE",
    nightTemp: 27.5,
    mainRiskFactor: "River breeze provides moderate natural cooling relief",
    vulnerablePopulation: 8500,
    factors: {
      temperature: 71,
      humidity: 68,
      solarRadiation: 69,
      nightHeat: 52,
    },
    forecast: [
      { day: "Today", temp: 37.2, riskScore: 48, category: "MODERATE" },
      { day: "Tomorrow", temp: 37.8, riskScore: 52, category: "HIGH" },
      { day: "Day 3", temp: 37.0, riskScore: 47, category: "MODERATE" },
      { day: "Day 4", temp: 36.2, riskScore: 42, category: "MODERATE" },
      { day: "Day 5", temp: 35.4, riskScore: 37, category: "MODERATE" },
    ],
  },
  {
    id: "achanta",
    name: "Achanta",
    mandals: "Rural Agricultural Mandal",
    latitude: 16.5986,
    longitude: 81.7944,
    temperature: 38.1,
    humidity: 70,
    windSpeed: 9,
    solarRadiation: 745,
    heatIndex: 48.2,
    wbgt: 31.5,
    utci: 39.1,
    riskScore: 61,
    riskCategory: "HIGH",
    nightTemp: 28.4,
    mainRiskFactor: "Paddy field laborers exposed to unshaded midday sun",
    vulnerablePopulation: 7600,
    factors: {
      temperature: 76,
      humidity: 82,
      solarRadiation: 72,
      nightHeat: 60,
    },
    forecast: [
      { day: "Today", temp: 38.1, riskScore: 61, category: "HIGH" },
      { day: "Tomorrow", temp: 38.8, riskScore: 66, category: "HIGH" },
      { day: "Day 3", temp: 38.0, riskScore: 60, category: "HIGH" },
      { day: "Day 4", temp: 37.2, riskScore: 53, category: "HIGH" },
      { day: "Day 5", temp: 36.1, riskScore: 44, category: "MODERATE" },
    ],
  },
  {
    id: "attili",
    name: "Attili",
    mandals: "Central Canal Belt",
    latitude: 16.6961,
    longitude: 81.5978,
    temperature: 39.0,
    humidity: 67,
    windSpeed: 8,
    solarRadiation: 765,
    heatIndex: 49.3,
    wbgt: 32.1,
    utci: 39.9,
    riskScore: 65,
    riskCategory: "HIGH",
    nightTemp: 29.0,
    mainRiskFactor: "Agricultural market transit & high humidity",
    vulnerablePopulation: 8900,
    factors: {
      temperature: 80,
      humidity: 76,
      solarRadiation: 75,
      nightHeat: 63,
    },
    forecast: [
      { day: "Today", temp: 39.0, riskScore: 65, category: "HIGH" },
      { day: "Tomorrow", temp: 39.6, riskScore: 70, category: "HIGH" },
      { day: "Day 3", temp: 38.7, riskScore: 63, category: "HIGH" },
      { day: "Day 4", temp: 37.5, riskScore: 56, category: "HIGH" },
      { day: "Day 5", temp: 36.4, riskScore: 46, category: "MODERATE" },
    ],
  },
  {
    id: "penugonda",
    name: "Penugonda",
    mandals: "Commercial & Agro Mandal",
    latitude: 16.6667,
    longitude: 81.7333,
    temperature: 38.4,
    humidity: 69,
    windSpeed: 9,
    solarRadiation: 750,
    heatIndex: 48.6,
    wbgt: 31.7,
    utci: 39.3,
    riskScore: 62,
    riskCategory: "HIGH",
    nightTemp: 28.6,
    mainRiskFactor: "Dense rural bazaar activity under high humidity",
    vulnerablePopulation: 7200,
    factors: {
      temperature: 77,
      humidity: 80,
      solarRadiation: 73,
      nightHeat: 61,
    },
    forecast: [
      { day: "Today", temp: 38.4, riskScore: 62, category: "HIGH" },
      { day: "Tomorrow", temp: 39.1, riskScore: 68, category: "HIGH" },
      { day: "Day 3", temp: 38.3, riskScore: 61, category: "HIGH" },
      { day: "Day 4", temp: 37.1, riskScore: 54, category: "HIGH" },
      { day: "Day 5", temp: 36.0, riskScore: 45, category: "MODERATE" },
    ],
  },
  {
    id: "penumantra",
    name: "Penumantra",
    mandals: "Farming Belt",
    latitude: 16.6347,
    longitude: 81.6508,
    temperature: 38.6,
    humidity: 68,
    windSpeed: 8,
    solarRadiation: 755,
    heatIndex: 48.7,
    wbgt: 31.8,
    utci: 39.4,
    riskScore: 63,
    riskCategory: "HIGH",
    nightTemp: 28.7,
    mainRiskFactor: "Unsheltered farm lands with high ground reflectance",
    vulnerablePopulation: 6800,
    factors: {
      temperature: 78,
      humidity: 78,
      solarRadiation: 74,
      nightHeat: 62,
    },
    forecast: [
      { day: "Today", temp: 38.6, riskScore: 63, category: "HIGH" },
      { day: "Tomorrow", temp: 39.2, riskScore: 68, category: "HIGH" },
      { day: "Day 3", temp: 38.4, riskScore: 62, category: "HIGH" },
      { day: "Day 4", temp: 37.3, riskScore: 55, category: "HIGH" },
      { day: "Day 5", temp: 36.2, riskScore: 46, category: "MODERATE" },
    ],
  },
  {
    id: "iragavaram",
    name: "Iragavaram",
    mandals: "Delta Interior Mandal",
    latitude: 16.7328,
    longitude: 81.6364,
    temperature: 38.9,
    humidity: 66,
    windSpeed: 8,
    solarRadiation: 760,
    heatIndex: 48.5,
    wbgt: 31.6,
    utci: 39.2,
    riskScore: 60,
    riskCategory: "HIGH",
    nightTemp: 28.5,
    mainRiskFactor: "High relative humidity trapped between canal banks",
    vulnerablePopulation: 6400,
    factors: {
      temperature: 79,
      humidity: 75,
      solarRadiation: 74,
      nightHeat: 61,
    },
    forecast: [
      { day: "Today", temp: 38.9, riskScore: 60, category: "HIGH" },
      { day: "Tomorrow", temp: 39.5, riskScore: 65, category: "HIGH" },
      { day: "Day 3", temp: 38.6, riskScore: 60, category: "HIGH" },
      { day: "Day 4", temp: 37.4, riskScore: 52, category: "HIGH" },
      { day: "Day 5", temp: 36.2, riskScore: 43, category: "MODERATE" },
    ],
  },
  {
    id: "undi",
    name: "Undi",
    mandals: "Aqua Farming Center",
    latitude: 16.5833,
    longitude: 81.4667,
    temperature: 39.4,
    humidity: 71,
    windSpeed: 10,
    solarRadiation: 775,
    heatIndex: 51.8,
    wbgt: 33.2,
    utci: 41.3,
    riskScore: 74,
    riskCategory: "HIGH",
    nightTemp: 30.1,
    mainRiskFactor: "Aquaculture pond moisture exacerbating heat sensation",
    vulnerablePopulation: 9300,
    factors: {
      temperature: 82,
      humidity: 84,
      solarRadiation: 77,
      nightHeat: 70,
    },
    forecast: [
      { day: "Today", temp: 39.4, riskScore: 74, category: "HIGH" },
      { day: "Tomorrow", temp: 40.1, riskScore: 78, category: "EXTREME" },
      { day: "Day 3", temp: 39.0, riskScore: 72, category: "HIGH" },
      { day: "Day 4", temp: 37.8, riskScore: 63, category: "HIGH" },
      { day: "Day 5", temp: 36.8, riskScore: 53, category: "HIGH" },
    ],
  },
  {
    id: "akividu",
    name: "Akividu",
    mandals: "Kolleru Lake Margin",
    latitude: 16.5861,
    longitude: 81.3806,
    temperature: 39.6,
    humidity: 73,
    windSpeed: 11,
    solarRadiation: 780,
    heatIndex: 52.6,
    wbgt: 33.6,
    utci: 41.8,
    riskScore: 76,
    riskCategory: "EXTREME",
    nightTemp: 30.5,
    mainRiskFactor: "Wetland evaporation keeping humidity high around the clock",
    vulnerablePopulation: 11800,
    factors: {
      temperature: 83,
      humidity: 88,
      solarRadiation: 78,
      nightHeat: 73,
    },
    forecast: [
      { day: "Today", temp: 39.6, riskScore: 76, category: "EXTREME" },
      { day: "Tomorrow", temp: 40.3, riskScore: 80, category: "EXTREME" },
      { day: "Day 3", temp: 39.2, riskScore: 74, category: "HIGH" },
      { day: "Day 4", temp: 38.1, riskScore: 66, category: "HIGH" },
      { day: "Day 5", temp: 37.0, riskScore: 56, category: "HIGH" },
    ],
  },
  {
    id: "mogalthur",
    name: "Mogalthur",
    mandals: "Coastal Southern Strip",
    latitude: 16.4167,
    longitude: 81.6000,
    temperature: 37.4,
    humidity: 77,
    windSpeed: 15,
    solarRadiation: 725,
    heatIndex: 49.0,
    wbgt: 32.0,
    utci: 39.4,
    riskScore: 66,
    riskCategory: "HIGH",
    nightTemp: 28.9,
    mainRiskFactor: "Severe marine humidity with coastal fisherman exposure",
    vulnerablePopulation: 8100,
    factors: {
      temperature: 73,
      humidity: 94,
      solarRadiation: 70,
      nightHeat: 62,
    },
    forecast: [
      { day: "Today", temp: 37.4, riskScore: 66, category: "HIGH" },
      { day: "Tomorrow", temp: 38.0, riskScore: 70, category: "HIGH" },
      { day: "Day 3", temp: 37.5, riskScore: 67, category: "HIGH" },
      { day: "Day 4", temp: 36.5, riskScore: 58, category: "HIGH" },
      { day: "Day 5", temp: 35.8, riskScore: 49, category: "MODERATE" },
    ],
  },
  {
    id: "poduru",
    name: "Poduru",
    mandals: "Rural Agro Mandal",
    latitude: 16.5667,
    longitude: 81.7167,
    temperature: 38.3,
    humidity: 71,
    windSpeed: 9,
    solarRadiation: 740,
    heatIndex: 48.4,
    wbgt: 31.6,
    utci: 39.2,
    riskScore: 62,
    riskCategory: "HIGH",
    nightTemp: 28.5,
    mainRiskFactor: "High humidity and open paddy field sun exposure",
    vulnerablePopulation: 6100,
    factors: {
      temperature: 76,
      humidity: 84,
      solarRadiation: 72,
      nightHeat: 61,
    },
    forecast: [
      { day: "Today", temp: 38.3, riskScore: 62, category: "HIGH" },
      { day: "Tomorrow", temp: 38.9, riskScore: 67, category: "HIGH" },
      { day: "Day 3", temp: 38.1, riskScore: 61, category: "HIGH" },
      { day: "Day 4", temp: 37.0, riskScore: 53, category: "HIGH" },
      { day: "Day 5", temp: 36.0, riskScore: 44, category: "MODERATE" },
    ],
  },
  {
    id: "veeravasaram",
    name: "Veeravasaram",
    mandals: "Central Delta Mandal",
    latitude: 16.5167,
    longitude: 81.6167,
    temperature: 38.8,
    humidity: 70,
    windSpeed: 9,
    solarRadiation: 755,
    heatIndex: 49.7,
    wbgt: 32.3,
    utci: 40.1,
    riskScore: 67,
    riskCategory: "HIGH",
    nightTemp: 29.2,
    mainRiskFactor: "Warm tropical moisture combined with lack of wind shelter",
    vulnerablePopulation: 7800,
    factors: {
      temperature: 79,
      humidity: 82,
      solarRadiation: 75,
      nightHeat: 65,
    },
    forecast: [
      { day: "Today", temp: 38.8, riskScore: 67, category: "HIGH" },
      { day: "Tomorrow", temp: 39.5, riskScore: 72, category: "HIGH" },
      { day: "Day 3", temp: 38.7, riskScore: 66, category: "HIGH" },
      { day: "Day 4", temp: 37.6, riskScore: 58, category: "HIGH" },
      { day: "Day 5", temp: 36.5, riskScore: 49, category: "MODERATE" },
    ],
  },
  {
    id: "kalla",
    name: "Kalla",
    mandals: "Western Aquaculture Zone",
    latitude: 16.5500,
    longitude: 81.4833,
    temperature: 39.1,
    humidity: 72,
    windSpeed: 10,
    solarRadiation: 765,
    heatIndex: 51.1,
    wbgt: 32.9,
    utci: 40.9,
    riskScore: 71,
    riskCategory: "HIGH",
    nightTemp: 29.8,
    mainRiskFactor: "Warm surface water ponds amplifying localized humidity",
    vulnerablePopulation: 8300,
    factors: {
      temperature: 80,
      humidity: 86,
      solarRadiation: 76,
      nightHeat: 68,
    },
    forecast: [
      { day: "Today", temp: 39.1, riskScore: 71, category: "HIGH" },
      { day: "Tomorrow", temp: 39.8, riskScore: 75, category: "EXTREME" },
      { day: "Day 3", temp: 38.9, riskScore: 69, category: "HIGH" },
      { day: "Day 4", temp: 37.8, riskScore: 61, category: "HIGH" },
      { day: "Day 5", temp: 36.7, riskScore: 51, category: "HIGH" },
    ],
  },
  {
    id: "palacole",
    name: "Palacole",
    mandals: "Palacole Rural & Peri-Urban",
    latitude: 16.5333,
    longitude: 81.7333,
    temperature: 38.5,
    humidity: 71,
    windSpeed: 10,
    solarRadiation: 745,
    heatIndex: 49.6,
    wbgt: 32.4,
    utci: 40.2,
    riskScore: 68,
    riskCategory: "HIGH",
    nightTemp: 29.3,
    mainRiskFactor: "Commercial market congestion with high ambient dew point",
    vulnerablePopulation: 10400,
    factors: {
      temperature: 78,
      humidity: 84,
      solarRadiation: 74,
      nightHeat: 66,
    },
    forecast: [
      { day: "Today", temp: 38.5, riskScore: 68, category: "HIGH" },
      { day: "Tomorrow", temp: 39.2, riskScore: 73, category: "HIGH" },
      { day: "Day 3", temp: 38.4, riskScore: 67, category: "HIGH" },
      { day: "Day 4", temp: 37.3, riskScore: 59, category: "HIGH" },
      { day: "Day 5", temp: 36.2, riskScore: 50, category: "MODERATE" },
    ],
  },
];

// Helper to get location by ID (defaults to Tadepalligudem)
export function getLocationData(locationId = "tadepalligudem") {
  const found = WEST_GODAVARI_LOCATIONS.find(
    (loc) => loc.id === locationId || loc.name.toLowerCase() === locationId.toLowerCase()
  );
  return found || WEST_GODAVARI_LOCATIONS[0];
}

// Recommended actions generator based on risk level
export function getRecommendedActions(riskCategory = "EXTREME") {
  if (riskCategory === "EXTREME" || riskCategory === "HIGH") {
    return [
      { icon: "🚰", text: "Increase water availability & mobile hydration stations" },
      { icon: "🏥", text: "Prepare nearby healthcare facilities & emergency heat-stroke beds" },
      { icon: "🧊", text: "Activate air-conditioned community cooling centers" },
      { icon: "👷", text: "Reduce or pause outdoor worker exposure during peak heat (12:00 – 16:30)" },
      { icon: "📱", text: "Send SMS & WhatsApp heat-health alerts to vulnerable residents" },
    ];
  }
  if (riskCategory === "MODERATE") {
    return [
      { icon: "👀", text: "Continue monitoring biometeorological conditions regularly" },
      { icon: "🚰", text: "Encourage frequent hydration for all field workers" },
      { icon: "🌳", text: "Promote resting in shaded, ventilated zones" },
    ];
  }
  return [
    { icon: "✅", text: "Normal precautions recommended. Routine hydration advised." },
  ];
}

// Pre-built interactive Q&A for the AI Assistant
export const AI_SUGGESTED_QUESTIONS = [
  "Why is the risk high?",
  "Which location is most vulnerable?",
  "What action should authorities take?",
  "What will happen tomorrow?",
];

export function getAiAssistantResponse(question, currentLocation) {
  const q = question.toLowerCase();
  const loc = currentLocation || WEST_GODAVARI_LOCATIONS[0];

  if (q.includes("why is the risk high") || q.includes("why is") || q.includes("risk high")) {
    return `${loc.name} is experiencing an ${loc.riskCategory} heat-health risk (Score: ${loc.riskScore}/100) primarily due to ${loc.mainRiskFactor}. At ${loc.temperature}°C with ${loc.humidity}% relative humidity, the human body cannot cool itself effectively through sweat evaporation, resulting in an apparent Heat Index of ${loc.heatIndex}°C.`;
  }

  if (q.includes("most vulnerable") || q.includes("which location")) {
    return `In West Godavari, Tadepalligudem (86/100, Extreme) and Jangareddygudem (82/100, Extreme) are currently exhibiting the highest thermal stress scores, closely followed by Bhimavaram (78/100, Extreme). Jangareddygudem has the highest temperature (42.6°C), while Bhimavaram has dangerous coastal humidity (74%).`;
  }

  if (q.includes("action") || q.includes("authorities") || q.includes("precaution")) {
    return `For ${loc.name} (${loc.riskCategory} Risk), municipal authorities should immediately: 1) Deploy mobile drinking water tankers with ORS electrolytes, 2) Open public air-conditioned cooling shelters, 3) Issue mandatory rest breaks for outdoor laborers between 12:00 PM and 4:30 PM, and 4) Put local primary health centres (PHCs) on heat-stroke alert.`;
  }

  if (q.includes("tomorrow") || q.includes("future") || q.includes("forecast")) {
    const tmrw = loc.forecast[1];
    return `Tomorrow in ${loc.name}, the forecast projects a high of ${tmrw.temp}°C with a risk score of ${tmrw.riskScore}/100 (${tmrw.category} Risk). Conditions will remain severe, so emergency heat-health protocols must remain active.`;
  }

  return `Currently in ${loc.name}, conditions show a temperature of ${loc.temperature}°C, humidity of ${loc.humidity}%, and an estimated Heat Index of ${loc.heatIndex}°C. The overall risk level is ${loc.riskCategory}. Citizens should remain hydrated and avoid strenuous direct sunlight exposure.`;
}

// ============================================================================
// ALERT CLASSIFICATION & DYNAMIC GENERATION
// ============================================================================

// Standardized Alert Level Function (0-24 LOW, 25-49 MODERATE, 50-74 HIGH, 75-100 EXTREME)
export function getAlertLevel(riskScore) {
  const score = Number(riskScore) || 0;
  if (score >= 75) {
    return {
      level: "EXTREME",
      label: "EMERGENCY",
      status: "IMMEDIATE ATTENTION REQUIRED",
      color: "#ef4444",
      dot: "🔴",
      textColor: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/40",
      badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
    };
  }
  if (score >= 50) {
    return {
      level: "HIGH",
      label: "WARNING",
      status: "ELEVATED VIGILANCE REQUIRED",
      color: "#f97316",
      dot: "🟠",
      textColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/40",
      badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    };
  }
  if (score >= 25) {
    return {
      level: "MODERATE",
      label: "WATCH",
      status: "HEAT ADVISORY ACTIVE",
      color: "#f59e0b",
      dot: "🟡",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/40",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    };
  }
  return {
    level: "LOW",
    label: "NORMAL",
    status: "ROUTINE CONDITIONS",
    color: "#10b981",
    dot: "🟢",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/40",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  };
}

// Calculate nearby stations relative to selected location with approximate km distance
export function getNearbyLocations(selectedId, limit = 5) {
  const current = WEST_GODAVARI_LOCATIONS.find((l) => l.id === selectedId) || WEST_GODAVARI_LOCATIONS[0];
  return WEST_GODAVARI_LOCATIONS
    .filter((loc) => loc.id !== current.id)
    .map((loc) => {
      const dLat = (loc.latitude - current.latitude) * 111;
      const dLon = (loc.longitude - current.longitude) * 106.7;
      const distanceKm = Math.max(1, Math.round(Math.hypot(dLat, dLon)));
      const alertInfo = getAlertLevel(loc.riskScore);
      return {
        ...loc,
        distanceKm,
        alertInfo,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function getAlertInfo(riskScore) {
  if (riskScore >= 75) {
    return {
      level: "EXTREME",
      type: "EXTREME HEAT EMERGENCY",
      badgeText: "EMERGENCY",
      color: "#ef4444",
      textColor: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/40",
      badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
      status: "Action Required",
      requiresAction: true,
      headline: "Extreme heat-health conditions detected.",
      summary: "Dangerous thermal stress. Severe risk of heat exhaustion and heat stroke during unprotected daytime exposure.",
    };
  }
  if (riskScore >= 50) {
    return {
      level: "HIGH",
      type: "HEAT WARNING",
      badgeText: "WARNING",
      color: "#f97316",
      textColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/40",
      badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      status: "Monitor Closely",
      requiresAction: true,
      headline: "Elevated heat strain warning in effect.",
      summary: "Significant thermal discomfort. Mandatory hydration schedules and shaded labor breaks recommended.",
    };
  }
  if (riskScore >= 25) {
    return {
      level: "MODERATE",
      type: "HEAT WATCH",
      badgeText: "WATCH",
      color: "#f59e0b",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/40",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      status: "Advisory Active",
      requiresAction: false,
      headline: "Heat watch advisory active.",
      summary: "Noticeable thermal discomfort. Caution advised during strenuous outdoor exertion.",
    };
  }
  return {
    level: "LOW",
    type: "NO ALERT",
    badgeText: "NORMAL",
    color: "#10b981",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/40",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    status: "Normal Conditions",
    requiresAction: false,
    headline: "Conditions within normal parameters.",
    summary: "Normal precautions recommended. Routine hydration advised.",
  };
}

// Generate active notifications dynamically from locations
export function generateNotifications(locations = WEST_GODAVARI_LOCATIONS) {
  // Ensure Tanuku (88), Tadepalligudem (76), Bhimavaram (42) and high risk mandals are represented
  const highRiskLocations = [...locations]
    .filter((loc) => loc.riskScore >= 40)
    .sort((a, b) => b.riskScore - a.riskScore);

  const times = ["Just now", "12 min ago", "25 min ago", "45 min ago", "1 hour ago", "2 hours ago"];

  return highRiskLocations.map((loc, idx) => {
    const info = getAlertInfo(loc.riskScore);
    return {
      id: `alert-${loc.id}`,
      locationId: loc.id,
      locationName: loc.name,
      level: info.level,
      type: info.type,
      riskScore: loc.riskScore,
      temperature: loc.temperature,
      humidity: loc.humidity,
      wbgt: loc.wbgt,
      message: `${loc.name} is experiencing ${info.level.toLowerCase()} heat-health conditions (Risk Score: ${loc.riskScore}/100).`,
      time: times[idx] || "Recent",
      read: idx > 1, // First 2 unread by default for realistic demo
      isCritical: loc.riskScore >= 75,
      isWarning: loc.riskScore >= 25 && loc.riskScore < 75,
    };
  });
}

// Generate active notifications strictly for the single analyzed area (simple, 2 items)
export function generateAreaNotifications(area) {
  if (!area) return [];
  const notifications = [];

  if (area.riskCategory === "EXTREME") {
    notifications.push({
      id: `alert-1-${area.id}`,
      locationId: area.id,
      locationName: area.name,
      level: "EXTREME",
      type: "Extreme heat risk",
      riskScore: area.riskScore,
      temperature: area.temperature,
      humidity: area.humidity,
      wbgt: area.wbgt,
      message: `${area.name} — Risk ${area.riskScore}`,
      time: "Just now",
      read: false,
      isCritical: true,
      isWarning: false,
    });
    notifications.push({
      id: `alert-2-${area.id}`,
      locationId: area.id,
      locationName: area.name,
      level: "HIGH",
      type: "High heat risk",
      riskScore: area.riskScore,
      temperature: area.temperature,
      humidity: area.humidity,
      wbgt: area.wbgt,
      message: `${area.name} expected to remain high tomorrow`,
      time: "15 min ago",
      read: false,
      isCritical: false,
      isWarning: true,
    });
  } else if (area.riskCategory === "HIGH") {
    notifications.push({
      id: `alert-1-${area.id}`,
      locationId: area.id,
      locationName: area.name,
      level: "HIGH",
      type: "High heat risk",
      riskScore: area.riskScore,
      temperature: area.temperature,
      humidity: area.humidity,
      wbgt: area.wbgt,
      message: `${area.name} — Risk ${area.riskScore}`,
      time: "Just now",
      read: false,
      isCritical: false,
      isWarning: true,
    });
    notifications.push({
      id: `alert-2-${area.id}`,
      locationId: area.id,
      locationName: area.name,
      level: "MODERATE",
      type: "Moderate heat risk",
      riskScore: area.riskScore,
      temperature: area.temperature,
      humidity: area.humidity,
      wbgt: area.wbgt,
      message: `${area.name} conditions persisting through tomorrow`,
      time: "20 min ago",
      read: false,
      isCritical: false,
      isWarning: true,
    });
  } else {
    notifications.push({
      id: `alert-1-${area.id}`,
      locationId: area.id,
      locationName: area.name,
      level: "MODERATE",
      type: "Moderate heat risk",
      riskScore: area.riskScore,
      temperature: area.temperature,
      humidity: area.humidity,
      wbgt: area.wbgt,
      message: `${area.name} — Risk ${area.riskScore}`,
      time: "Just now",
      read: false,
      isCritical: false,
      isWarning: true,
    });
    notifications.push({
      id: `alert-2-${area.id}`,
      locationId: area.id,
      locationName: area.name,
      level: "LOW",
      type: "Normal conditions",
      riskScore: area.riskScore,
      temperature: area.temperature,
      humidity: area.humidity,
      wbgt: area.wbgt,
      message: `${area.name} within standard physiological limits`,
      time: "30 min ago",
      read: true,
      isCritical: false,
      isWarning: false,
    });
  }

  return notifications;
}

// Alert Timeline (Diurnal progression for current day)
export const ALERT_TIMELINE_DATA = [
  { time: "10:00 AM", label: "10:00 AM", level: "MODERATE", status: "Moderate", score: 38, isPeak: false },
  { time: "12:00 PM", label: "12:00 PM", level: "HIGH", status: "High", score: 68, isPeak: false },
  { time: "02:00 PM", label: "02:00 PM", level: "EXTREME", status: "Extreme ⚠️", score: 88, isPeak: true },
  { time: "04:00 PM", label: "04:00 PM", level: "HIGH", status: "High", score: 72, isPeak: false },
  { time: "06:00 PM", label: "06:00 PM", level: "MODERATE", status: "Moderate", score: 45, isPeak: false },
  { time: "08:00 PM", label: "08:00 PM", level: "LOW", status: "Low", score: 22, isPeak: false },
];

// Predictive Future Alerts (Next 24 Hours Early Warning)
export const PREDICTIVE_ALERTS = [
  {
    id: "pred-1",
    timeWindow: "Tomorrow at 13:00 (1:00 PM)",
    locationName: "Tanuku",
    locationId: "tanuku",
    predictedRisk: 89,
    category: "EXTREME",
    predictedTemp: 43.0,
    message: "Expected to reach EXTREME at 13:00 tomorrow (Score 89). Severe thermal strain expected.",
    leadTime: "24h Advance Warning",
  },
  {
    id: "pred-2",
    timeWindow: "Tomorrow at 12:30 PM",
    locationName: "Tadepalligudem",
    locationId: "tadepalligudem",
    predictedRisk: 78,
    category: "HIGH",
    predictedTemp: 41.5,
    message: "Expected to reach HIGH at 12:30 tomorrow (Score 78). High midday radiant load.",
    leadTime: "23h Advance Warning",
  },
  {
    id: "pred-3",
    timeWindow: "Tomorrow at 11:00 AM",
    locationName: "Nidadavole",
    locationId: "nidadavole",
    predictedRisk: 48,
    category: "MODERATE",
    predictedTemp: 38.0,
    message: "Expected to enter MODERATE at 11:00 tomorrow (Score 48). Hydration advisories recommended.",
    leadTime: "21h Advance Warning",
  },
];

// AI 6-Hour Risk Prediction Generator
export function getAreaPrediction(location) {
  if (!location) {
    return {
      window: "Next 6 Hours",
      predictedRisk: 89,
      category: "EXTREME",
      probability: 87,
      trend: "↑ Increasing",
      explanation: "Heat-health risk is expected to remain extremely high during the next few hours.",
      model: "XGBoost Heat Health Classifier v1.2",
    };
  }

  const isExtreme = location.riskCategory === "EXTREME";
  const isHigh = location.riskCategory === "HIGH";

  if (isExtreme) {
    return {
      window: "Next 6 Hours",
      predictedRisk: Math.min(96, location.riskScore + 3),
      category: "EXTREME",
      probability: 87,
      trend: "↑ Increasing",
      explanation: "Heat-health risk is expected to remain extremely high during the next few hours.",
      model: "XGBoost Heat Health Classifier v1.2",
    };
  }

  if (isHigh) {
    const nextScore = Math.min(84, location.riskScore + 4);
    return {
      window: "Next 6 Hours",
      predictedRisk: nextScore,
      category: nextScore >= 80 ? "EXTREME" : "HIGH",
      probability: 82,
      trend: "↑ Increasing",
      explanation: "Thermal stress is projected to escalate over the afternoon as relative humidity remains elevated.",
      model: "XGBoost Heat Health Classifier v1.2",
    };
  }

  return {
    window: "Next 6 Hours",
    predictedRisk: Math.min(58, location.riskScore + 3),
    category: "MODERATE",
    probability: 76,
    trend: "→ Stable",
    explanation: "Thermal conditions expected to remain moderate with diurnal cooling by late afternoon.",
    model: "XGBoost Heat Health Classifier v1.2",
  };
}

// District Active Alerts across West Godavari
export function getDistrictActiveAlerts() {
  return WEST_GODAVARI_LOCATIONS
    .filter((loc) => loc.riskCategory === "EXTREME" || loc.riskCategory === "HIGH")
    .map((loc) => ({
      id: `alert-dist-${loc.id}`,
      locationId: loc.id,
      name: loc.name,
      mandals: loc.mandals,
      riskScore: loc.riskScore,
      category: loc.riskCategory,
      status: loc.riskCategory === "EXTREME" ? "Immediate Action" : "Monitor Closely",
      temperature: loc.temperature,
      humidity: loc.humidity,
      wbgt: loc.wbgt,
      heatIndex: loc.heatIndex,
      utci: loc.utci,
      mainRiskFactor: loc.mainRiskFactor,
      time: "Active Now",
    }))
    .sort((a, b) => b.riskScore - a.riskScore);
}

