import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { SectorData, SensorNode, BatteryTelemetry, WaterPumpTelemetry } from "./types";
import { mockSectors, mockBattery, mockPump } from "./mockData";

/**
 * Seed the database with high-fidelity, nominal agricultural node settings on first launch.
 */
export async function seedDatabaseIfEmpty() {
  try {
    const sectorsCol = collection(db, "sectors");
    const snapshot = await getDocs(sectorsCol);
    
    if (snapshot.empty) {
      console.log("Firestore database is empty. Initializing custom agronomist telemetry schemas...");

      // 1. Seed Sectors & Sub-Nodes
      for (const sector of mockSectors) {
        const sectorRef = doc(db, "sectors", sector.id);
        const sectorPayload = {
          id: sector.id,
          name: sector.name,
          cropType: sector.cropType,
          plantHealthIndex: sector.plantHealthIndex,
          moistureThresholdMin: sector.moistureThresholdMin,
          moistureThresholdMax: sector.moistureThresholdMax,
          activeAlertsCount: sector.activeAlertsCount
        };

        await setDoc(sectorRef, sectorPayload);

        // Seed sub-nodes
        for (const node of sector.nodes) {
          const nodeRef = doc(db, "sectors", sector.id, "nodes", node.id);
          const nodePayload = {
            id: node.id,
            name: node.name,
            status: node.status,
            soilMoisture: node.soilMoisture,
            temperature: node.temperature,
            humidity: node.humidity,
            solarDose: node.solarDose,
            lastUpdated: node.lastUpdated
          };
          await setDoc(nodeRef, nodePayload);
        }
      }

      // 2. Seed Battery Telemetry
      const batteryRef = doc(db, "telemetry", "battery");
      await setDoc(batteryRef, mockBattery);

      // 3. Seed Water Pump Telemetry
      const pumpRef = doc(db, "telemetry", "pump");
      await setDoc(pumpRef, mockPump);

      console.log("Database successfully populated with agricultural cell telemetry.");
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "sectors/seed");
  }
}

/**
 * Updates individual topological agricultural sector metadata.
 */
export async function updateFirestoreSector(sectorId: string, updates: Partial<SectorData>) {
  try {
    const ref = doc(db, "sectors", sectorId);
    await updateDoc(ref, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `sectors/${sectorId}`);
  }
}

/**
 * Updates sensory micro-node readings in localized subsoil.
 */
export async function updateFirestoreNode(sectorId: string, nodeId: string, updates: Partial<SensorNode>) {
  try {
    const ref = doc(db, "sectors", sectorId, "nodes", nodeId);
    await updateDoc(ref, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `sectors/${sectorId}/nodes/${nodeId}`);
  }
}

/**
 * Modifies central grid energy battery configurations.
 */
export async function updateFirestoreBattery(updates: Partial<BatteryTelemetry>) {
  try {
    const ref = doc(db, "telemetry", "battery");
    await updateDoc(ref, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, "telemetry/battery");
  }
}

/**
 * Alters liquid irrigation backhaul modes and pulses.
 */
export async function updateFirestorePump(updates: Partial<WaterPumpTelemetry>) {
  try {
    const ref = doc(db, "telemetry", "pump");
    await updateDoc(ref, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, "telemetry/pump");
  }
}
