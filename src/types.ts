/**
 * Global Type Definitions for AgroSensiX Biological Intelligence Platform
 */

export enum NavigationPage {
  HOME = "home",
  DASHBOARD = "dashboard",
  ANALYTICS = "analytics",
  AI_ASSISTANT = "ai_assistant",
  IRRIGATION_CONTROL = "irrigation_control",
  IMPACT = "impact",
  OFFLINE_HUB = "offline_hub",
  ARCHITECTURE = "architecture",
  ABOUT = "about",
  SETTINGS = "settings",
  LOGIN = "login",
  GMAIL = "gmail"
}

export interface SensorNode {
  id: string;
  name: string;
  status: "nominal" | "degraded" | "critical" | "inactive";
  soilMoisture: number; // % VWC
  temperature: number;  // °C
  humidity: number;     // % RH
  solarDose: number;    // W/m² (PAR)
  lastUpdated: string;  // Time string
}

export interface SectorData {
  id: string;
  name: string;
  cropType: string;
  plantHealthIndex: number; // 0 - 100
  moistureThresholdMin: number; // % VWC
  moistureThresholdMax: number; // % VWC
  nodes: SensorNode[];
  activeAlertsCount: number;
}

export interface BatteryTelemetry {
  chargePercent: number;
  voltage: number;
  healthPercent: number;
  solarInputKw: number;
  gridPowerUsedKw: number;
  loadKw: number;
  chargingState: "harvesting" | "discharging" | "idle" | "trickle";
}

export interface WaterPumpTelemetry {
  status: "active" | "standby" | "fault" | "shutdown";
  flowRateLpm: number;
  pressureBar: number;
  totalLitresDispensed: number;
  reservoirLevelPercent: number;
  currentMode: "eco" | "intensive" | "biological" | "off";
  pulsingTimerSec: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  detectedLanguage?: string;
}
