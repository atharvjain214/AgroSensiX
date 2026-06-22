import { SensorNode, SectorData, BatteryTelemetry, WaterPumpTelemetry } from "./types";

// Seed nodes for Sector G-14 (Greenhouse 14 - Crop: Tomatoes)
export const initialNodesG14: SensorNode[] = [
  {
    id: "G-14-A",
    name: "Root Sensor Alpha",
    status: "nominal",
    soilMoisture: 44.5,
    temperature: 24.1,
    humidity: 58.2,
    solarDose: 480,
    lastUpdated: "Just Now",
  },
  {
    id: "G-14-B",
    name: "Air & Leaf Sensor Beta",
    status: "nominal",
    soilMoisture: 42.1,
    temperature: 24.8,
    humidity: 57.5,
    solarDose: 510,
    lastUpdated: "Just Now",
  },
  {
    id: "G-14-C",
    name: "Deep Soil Sensor Gamma",
    status: "nominal",
    soilMoisture: 43.8,
    temperature: 23.4,
    humidity: 59.1,
    solarDose: 430,
    lastUpdated: "2m ago",
  },
  {
    id: "G-14-D",
    name: "Stem Sensor Delta",
    status: "degraded", // Simulating slightly low moisture or sensor degradation for realism
    soilMoisture: 38.2,
    temperature: 25.1,
    humidity: 56.4,
    solarDose: 520,
    lastUpdated: "5m ago",
  }
];

// Seed nodes for Sector 7G (Orchard Hub 7 - Crop: Dwarf Navel Oranges)
export const initialNodes7G: SensorNode[] = [
  {
    id: "7G-A",
    name: "Deep Soil Sensor Alpha",
    status: "nominal",
    soilMoisture: 52.4,
    temperature: 22.8,
    humidity: 62.1,
    solarDose: 680,
    lastUpdated: "Just Now",
  },
  {
    id: "7G-B",
    name: "Root Soil Sensor Beta",
    status: "nominal",
    soilMoisture: 49.3,
    temperature: 23.0,
    humidity: 61.8,
    solarDose: 700,
    lastUpdated: "Just Now",
  },
  {
    id: "7G-C",
    name: "Top Soil Sensor Gamma",
    status: "critical", // Needs hydration, moisture threshold has crashed below minimums
    soilMoisture: 29.8,
    temperature: 25.4,
    humidity: 55.2,
    solarDose: 790,
    lastUpdated: "1m ago",
  }
];

export const mockSectors: SectorData[] = [
  {
    id: "sector-G14",
    name: "Greenhouse 14",
    cropType: "Vine Tomatoes (Hydroponic)",
    plantHealthIndex: 92,
    moistureThresholdMin: 35.0,
    moistureThresholdMax: 60.0,
    nodes: initialNodesG14,
    activeAlertsCount: 1, // Node Delta has lowered moisture
  },
  {
    id: "sector-7G",
    name: "Orchard Hub 7",
    cropType: "Dwarf Navel Oranges",
    plantHealthIndex: 84,
    moistureThresholdMin: 40.0,
    moistureThresholdMax: 65.0,
    nodes: initialNodes7G,
    activeAlertsCount: 2, // Node Gamma critical + low moisture
  }
];

// Smart Solar Power Storage & Status Metrics
export const mockBattery: BatteryTelemetry = {
  chargePercent: 88.5,
  voltage: 27.4, 
  healthPercent: 96.8,
  solarInputKw: 4.25,
  gridPowerUsedKw: 0.00, // 0 because it runs 100% offgrid solar
  loadKw: 1.15,
  chargingState: "harvesting"
};

// Automatic Water Pump status
export const mockPump: WaterPumpTelemetry = {
  status: "active",
  flowRateLpm: 12.4,
  pressureBar: 3.2,
  totalLitresDispensed: 8452.8,
  reservoirLevelPercent: 78.5,
  currentMode: "biological", // Keep matching types as enum string "biological" represents standard under the hood
  pulsingTimerSec: 0
};

// Precise chronological data matrixs (24-hour logs) for charts!
export interface ChronoMetric {
  time: string;
  soilMoistureG14: number;
  soilMoisture7G: number;
  solarHarvestKw: number;
  ambientTempC: number;
  airHumidityPct: number;
  flowRateLpm: number;
  reservoirLevelPercent: number;
  irrigationUsedLiters: number;
}

export const historical24hData: ChronoMetric[] = [
  { time: "00:00", soilMoistureG14: 45.1, soilMoisture7G: 51.2, solarHarvestKw: 0.0, ambientTempC: 18.2, airHumidityPct: 75.4, flowRateLpm: 0.0, reservoirLevelPercent: 95.0, irrigationUsedLiters: 0.0 },
  { time: "02:00", soilMoistureG14: 44.8, soilMoisture7G: 50.9, solarHarvestKw: 0.0, ambientTempC: 17.8, airHumidityPct: 77.2, flowRateLpm: 0.0, reservoirLevelPercent: 95.0, irrigationUsedLiters: 0.0 },
  { time: "04:00", soilMoistureG14: 44.2, soilMoisture7G: 50.5, solarHarvestKw: 0.0, ambientTempC: 17.5, airHumidityPct: 79.1, flowRateLpm: 3.5, reservoirLevelPercent: 94.2, irrigationUsedLiters: 15.0 }, // Minor pulsing
  { time: "06:00", soilMoistureG14: 46.5, soilMoisture7G: 49.8, solarHarvestKw: 0.8, ambientTempC: 19.1, airHumidityPct: 72.8, flowRateLpm: 6.2, reservoirLevelPercent: 93.5, irrigationUsedLiters: 35.0 },
  { time: "08:00", soilMoistureG14: 45.8, soilMoisture7G: 48.2, solarHarvestKw: 2.1, ambientTempC: 21.4, airHumidityPct: 65.0, flowRateLpm: 8.4, reservoirLevelPercent: 92.1, irrigationUsedLiters: 45.0 },
  { time: "10:00", soilMoistureG14: 44.9, soilMoisture7G: 45.1, solarHarvestKw: 3.8, ambientTempC: 23.5, airHumidityPct: 59.2, flowRateLpm: 12.1, reservoirLevelPercent: 88.3, irrigationUsedLiters: 60.0 },
  { time: "12:00", soilMoistureG14: 43.1, soilMoisture7G: 41.5, solarHarvestKw: 4.2, ambientTempC: 24.8, airHumidityPct: 56.4, flowRateLpm: 12.4, reservoirLevelPercent: 84.1, irrigationUsedLiters: 75.0 }, // Peak sunshine
  { time: "14:00", soilMoistureG14: 42.2, soilMoisture7G: 38.2, solarHarvestKw: 3.9, ambientTempC: 25.1, airHumidityPct: 55.1, flowRateLpm: 12.2, reservoirLevelPercent: 78.5, irrigationUsedLiters: 80.0 },
  { time: "16:00", soilMoistureG14: 41.8, soilMoisture7G: 34.6, solarHarvestKw: 2.8, ambientTempC: 24.2, airHumidityPct: 58.7, flowRateLpm: 12.4, reservoirLevelPercent: 72.3, irrigationUsedLiters: 80.0 },
  { time: "18:00", soilMoistureG14: 43.5, soilMoisture7G: 48.5, solarHarvestKw: 1.1, ambientTempC: 21.9, airHumidityPct: 62.3, flowRateLpm: 8.5, reservoirLevelPercent: 82.0, irrigationUsedLiters: 30.0 }, // Post-watering recover / tank refilled slightly
  { time: "20:00", soilMoistureG14: 44.2, soilMoisture7G: 49.1, solarHarvestKw: 0.0, ambientTempC: 19.8, airHumidityPct: 68.9, flowRateLpm: 0.0, reservoirLevelPercent: 81.5, irrigationUsedLiters: 0.0 },
  { time: "22:00", soilMoistureG14: 43.8, soilMoisture7G: 48.8, solarHarvestKw: 0.0, ambientTempC: 18.7, airHumidityPct: 71.5, flowRateLpm: 0.0, reservoirLevelPercent: 81.0, irrigationUsedLiters: 0.0 }
];

export const preloadedSuggestivePrompts = [
  "Explain Greenhouse 14 soil dryness limits.",
  "Draft optimal watering schedule for navel orange trees in Orchard Hub 7.",
  "Identify risks of tomato disease outbreaks when relative humidity is high.",
  "How does soil moisture relate to saving solar battery power?"
];
