/**
 * HeatShield AI — Ward-Level Hyperlocal Dataset (Prototype)
 * =========================================================
 * Centralized ward data structure for urban centers in West Godavari.
 * 
 * IMPORTANT DATA HONESTY NOTICE:
 * Ward boundaries and risk values in this dataset are prototype estimates
 * for demonstrating hyperlocal heat-health early warning capabilities.
 * They are NOT official government administrative boundary measurements.
 */

export const WARD_PROTOTYPE_DISCLAIMER =
  "Ward-level risk values are prototype estimates for demonstration.";

export const WARD_SECTION_BADGE = "WARD-LEVEL PROTOTYPE VIEW";

export function getWardRiskCategory(score) {
  const num = Number(score) || 0;
  if (num >= 75) return "EXTREME";
  if (num >= 50) return "HIGH";
  if (num >= 25) return "MODERATE";
  return "LOW";
}

export function getWardRiskColor(score) {
  const cat = getWardRiskCategory(score);
  switch (cat) {
    case "EXTREME":
      return "#ef4444"; // red-500
    case "HIGH":
      return "#f97316"; // orange-500
    case "MODERATE":
      return "#eab308"; // yellow / amber-500
    case "LOW":
    default:
      return "#10b981"; // emerald / green-500
  }
}

export function getWardTemperatureColor(temp) {
  const num = Number(temp) || 0;
  if (num >= 41.0) return "#ef4444"; // red
  if (num >= 38.5) return "#f97316"; // orange
  if (num >= 35.0) return "#eab308"; // yellow
  return "#10b981"; // green
}

export const TADEPALLIGUDEM_WARDS = [
  {
    id: "tpg-ward-01",
    wardNumber: "Ward 01",
    name: "Ward 01 - Railway Colony & Siding",
    area: "Tadepalligudem",
    latitude: 16.8205,
    longitude: 81.5220,
    riskScore: 82,
    riskCategory: "EXTREME",
    temperature: 41.5,
    humidity: 65,
    vulnerablePopulation: "1,450 residents (transit & siding laborers)",
    alertLevel: "EXTREME",
    riskDrivers: [
      "Extreme thermal stress from asphalt & rail ballast",
      "Outdoor-worker exposure",
      "Elevated night-time heat retention",
    ],
  },
  {
    id: "tpg-ward-02",
    wardNumber: "Ward 02",
    name: "Ward 02 - Market Yard & Old Bus Stand",
    area: "Tadepalligudem",
    latitude: 16.8160,
    longitude: 81.5275,
    riskScore: 86,
    riskCategory: "EXTREME",
    temperature: 41.8,
    humidity: 68,
    vulnerablePopulation: "2,100 residents (market vendors & porters)",
    alertLevel: "EXTREME",
    riskDrivers: [
      "High thermal stress",
      "Outdoor-worker exposure",
      "Dense market crowding and tin-sheet heat trap",
    ],
  },
  {
    id: "tpg-ward-03",
    wardNumber: "Ward 03",
    name: "Ward 03 - K.N. Road Commercial Strip",
    area: "Tadepalligudem",
    latitude: 16.8140,
    longitude: 81.5290,
    riskScore: 78,
    riskCategory: "EXTREME",
    temperature: 41.0,
    humidity: 66,
    vulnerablePopulation: "1,320 residents (retail staff & shoppers)",
    alertLevel: "EXTREME",
    riskDrivers: [
      "High thermal stress",
      "Urban heat canyon effect between commercial blocks",
      "Limited public shade infrastructure",
    ],
  },
  {
    id: "tpg-ward-04",
    wardNumber: "Ward 04",
    name: "Ward 04 - Housing Board Colony",
    area: "Tadepalligudem",
    latitude: 16.8115,
    longitude: 81.5330,
    riskScore: 62,
    riskCategory: "HIGH",
    temperature: 39.8,
    humidity: 63,
    vulnerablePopulation: "980 residents (elderly pensioners)",
    alertLevel: "HIGH",
    riskDrivers: [
      "Elevated indoor thermal accumulation",
      "High elderly population vulnerability",
      "Moderate building density",
    ],
  },
  {
    id: "tpg-ward-05",
    wardNumber: "Ward 05",
    name: "Ward 05 - Subba Rao Peta Residential",
    area: "Tadepalligudem",
    latitude: 16.8185,
    longitude: 81.5310,
    riskScore: 69,
    riskCategory: "HIGH",
    temperature: 40.2,
    humidity: 65,
    vulnerablePopulation: "1,150 residents",
    alertLevel: "HIGH",
    riskDrivers: [
      "High thermal stress",
      "Narrow streets trapping ambient warmth",
      "Outdoor sanitation staff exposure",
    ],
  },
  {
    id: "tpg-ward-06",
    wardNumber: "Ward 06",
    name: "Ward 06 - Sasibhushan Rao Peta",
    area: "Tadepalligudem",
    latitude: 16.8230,
    longitude: 81.5280,
    riskScore: 58,
    riskCategory: "HIGH",
    temperature: 39.4,
    humidity: 64,
    vulnerablePopulation: "850 residents",
    alertLevel: "HIGH",
    riskDrivers: [
      "Moderate domestic thermal buildup",
      "Partial shade from residential tree canopy",
      "Elevated population vulnerability",
    ],
  },
  {
    id: "tpg-ward-07",
    wardNumber: "Ward 07",
    name: "Ward 07 - Pentapadu Bypass Junction",
    area: "Tadepalligudem",
    latitude: 16.8070,
    longitude: 81.5210,
    riskScore: 68,
    riskCategory: "HIGH",
    temperature: 40.1,
    humidity: 64,
    vulnerablePopulation: "1,180 residents (transport & highway laborers)",
    alertLevel: "HIGH",
    riskDrivers: [
      "High thermal stress",
      "Outdoor-worker exposure",
      "Elevated population vulnerability",
    ],
  },
  {
    id: "tpg-ward-08",
    wardNumber: "Ward 08",
    name: "Ward 08 - Weavers Colony & Agro-Textile",
    area: "Tadepalligudem",
    latitude: 16.8220,
    longitude: 81.5360,
    riskScore: 74,
    riskCategory: "HIGH",
    temperature: 40.8,
    humidity: 67,
    vulnerablePopulation: "1,650 residents (handloom & textile workers)",
    alertLevel: "HIGH",
    riskDrivers: [
      "High indoor thermal buildup in tin-roof sheds",
      "High physical exertion under elevated humidity",
      "Informal home-based worker vulnerability",
    ],
  },
  {
    id: "tpg-ward-09",
    wardNumber: "Ward 09",
    name: "Ward 09 - Municipal Office & Clock Tower",
    area: "Tadepalligudem",
    latitude: 16.8130,
    longitude: 81.5250,
    riskScore: 64,
    riskCategory: "HIGH",
    temperature: 39.9,
    humidity: 62,
    vulnerablePopulation: "820 residents",
    alertLevel: "HIGH",
    riskDrivers: [
      "High impervious paved surface fraction",
      "Civic center transit congregation",
      "Outdoor civic worker exposure",
    ],
  },
  {
    id: "tpg-ward-10",
    wardNumber: "Ward 10",
    name: "Ward 10 - Madhavaram Agricultural Fringe",
    area: "Tadepalligudem",
    latitude: 16.8310,
    longitude: 81.5180,
    riskScore: 72,
    riskCategory: "HIGH",
    temperature: 41.2,
    humidity: 61,
    vulnerablePopulation: "1,280 residents (farm workers & day laborers)",
    alertLevel: "HIGH",
    riskDrivers: [
      "Intense direct solar radiation over open fields",
      "Outdoor-worker exposure",
      "Lack of emergency hydration shelters",
    ],
  },
  {
    id: "tpg-ward-11",
    wardNumber: "Ward 11",
    name: "Ward 11 - DRG Degree College Zone",
    area: "Tadepalligudem",
    latitude: 16.8175,
    longitude: 81.5390,
    riskScore: 48,
    riskCategory: "MODERATE",
    temperature: 38.6,
    humidity: 60,
    vulnerablePopulation: "650 students & staff",
    alertLevel: "MODERATE",
    riskDrivers: [
      "Moderate daytime heat exposure during class transit",
      "Buffer from campus green trees",
      "Access to indoor shaded spaces",
    ],
  },
  {
    id: "tpg-ward-12",
    wardNumber: "Ward 12",
    name: "Ward 12 - Gollagudem Canal Green Belt",
    area: "Tadepalligudem",
    latitude: 16.8030,
    longitude: 81.5350,
    riskScore: 42,
    riskCategory: "MODERATE",
    temperature: 37.9,
    humidity: 69,
    vulnerablePopulation: "520 residents",
    alertLevel: "MODERATE",
    riskDrivers: [
      "Microclimate evaporative cooling along irrigation canal",
      "Riparian vegetation buffer moderating heat",
      "Open airflow across water body",
    ],
  },
];

export const BHIMAVARAM_WARDS = [
  {
    id: "bvrm-ward-01",
    wardNumber: "Ward 01",
    name: "Ward 01 - Town Railway Station & Market",
    area: "Bhimavaram",
    latitude: 16.5455,
    longitude: 81.5225,
    riskScore: 83,
    riskCategory: "EXTREME",
    temperature: 40.8,
    humidity: 67,
    vulnerablePopulation: "1,780 residents",
    alertLevel: "EXTREME",
    riskDrivers: [
      "Extreme thermal loading in rail and transit zone",
      "High concentration of unorganized transport workers",
      "Dense commercial shop fronts",
    ],
  },
  {
    id: "bvrm-ward-02",
    wardNumber: "Ward 02",
    name: "Ward 02 - Someswara Swamy Temple Street",
    area: "Bhimavaram",
    latitude: 16.5410,
    longitude: 81.5240,
    riskScore: 67,
    riskCategory: "HIGH",
    temperature: 39.7,
    humidity: 66,
    vulnerablePopulation: "1,240 residents",
    alertLevel: "HIGH",
    riskDrivers: [
      "High foot-traffic over stone pavements",
      "Elderly pilgrimage and resident demographics",
      "Limited canopy shade",
    ],
  },
  {
    id: "bvrm-ward-03",
    wardNumber: "Ward 03",
    name: "Ward 03 - Aqua Processing & Cold Hub",
    area: "Bhimavaram",
    latitude: 16.5350,
    longitude: 81.5160,
    riskScore: 76,
    riskCategory: "EXTREME",
    temperature: 40.5,
    humidity: 70,
    vulnerablePopulation: "1,920 workers",
    alertLevel: "EXTREME",
    riskDrivers: [
      "Thermal shock between cold processing & outdoor heat",
      "Outdoor-worker exposure",
      "Elevated coastal humidity index",
    ],
  },
  {
    id: "bvrm-ward-04",
    wardNumber: "Ward 04",
    name: "Ward 04 - DNR College Campus & Residential",
    area: "Bhimavaram",
    latitude: 16.5490,
    longitude: 81.5310,
    riskScore: 46,
    riskCategory: "MODERATE",
    temperature: 38.2,
    humidity: 62,
    vulnerablePopulation: "710 residents",
    alertLevel: "MODERATE",
    riskDrivers: [
      "Campus green spaces buffering ground heat",
      "Low built density with good airflow",
      "Adequate access to indoor shaded corridors",
    ],
  },
];

export const TANUKU_WARDS = [
  {
    id: "tnk-ward-01",
    wardNumber: "Ward 01",
    name: "Ward 01 - Industrial Estate & Machinery Belt",
    area: "Tanuku",
    latitude: 16.7590,
    longitude: 81.6840,
    riskScore: 87,
    riskCategory: "EXTREME",
    temperature: 42.4,
    humidity: 64,
    vulnerablePopulation: "1,850 workers",
    alertLevel: "EXTREME",
    riskDrivers: [
      "Waste heat from agro-industrial processing mills",
      "Metal roof workshops with intense radiative heat",
      "Heavy manual labor during afternoon peak",
    ],
  },
  {
    id: "tnk-ward-02",
    wardNumber: "Ward 02",
    name: "Ward 02 - Town Center & Clock Tower",
    area: "Tanuku",
    latitude: 16.7550,
    longitude: 81.6800,
    riskScore: 75,
    riskCategory: "EXTREME",
    temperature: 41.2,
    humidity: 65,
    vulnerablePopulation: "1,340 residents",
    alertLevel: "EXTREME",
    riskDrivers: [
      "Dense urban fabric and motorized traffic heat",
      "High proportion of street hawkers and transit users",
      "Asphalt heat retention past sunset",
    ],
  },
  {
    id: "tnk-ward-03",
    wardNumber: "Ward 03",
    name: "Ward 03 - Gosthani Riverbank Colony",
    area: "Tanuku",
    latitude: 16.7620,
    longitude: 81.6740,
    riskScore: 45,
    riskCategory: "MODERATE",
    temperature: 38.4,
    humidity: 68,
    vulnerablePopulation: "690 residents",
    alertLevel: "MODERATE",
    riskDrivers: [
      "Riverine evaporative cooling",
      "Moderate daytime heat with active natural breezes",
      "Buffer of coconut groves and foliage",
    ],
  },
];

export const WARDS_BY_LOCALITY = {
  tadepalligudem: TADEPALLIGUDEM_WARDS,
  bhimavaram: BHIMAVARAM_WARDS,
  tanuku: TANUKU_WARDS,
};

/**
 * Get wards for a given area name (case-insensitive fuzzy match)
 */
export function getWardsForArea(areaName) {
  if (!areaName) return null;
  const clean = areaName.toLowerCase().replace(/[\s\-_,]/g, "");
  for (const [key, wards] of Object.entries(WARDS_BY_LOCALITY)) {
    if (clean.includes(key) || key.includes(clean)) {
      return wards;
    }
  }
  return null;
}
