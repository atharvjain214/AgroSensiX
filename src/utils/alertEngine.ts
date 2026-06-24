import { SectorData, BatteryTelemetry, WaterPumpTelemetry } from "../types";
import { getCachedAccessToken } from "./workspaceAuth";
import { offlineStorage } from "./offlineStorage";

// Cooldown throttle: 10 minutes in milliseconds
const ALERT_COOLDOWN_MS = 600000;

// Helper to base64url encode a unicode string
function b64EncodeUnicode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Dispatches an email via the Gmail API using the cached OAuth token.
 */
async function sendGmailAlert(recipient: string, subject: string, htmlBody: string): Promise<boolean> {
  const token = getCachedAccessToken();
  if (!token) return false;

  try {
    const emailLines = [
      `To: ${recipient}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      htmlBody
    ];
    const rawMsg = b64EncodeUnicode(emailLines.join("\r\n"));

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: rawMsg })
    });

    return response.ok;
  } catch (error) {
    console.error("[Alert Engine] Gmail API send failed:", error);
    return false;
  }
}

/**
 * Runs active biosensor checking to send out warning dispatches when thresholds are violated.
 */
export async function checkAndTriggerEmailAlerts(
  sectors: SectorData[],
  battery: BatteryTelemetry,
  pump: WaterPumpTelemetry
) {
  const token = getCachedAccessToken();
  if (!token) return;

  const recipient = localStorage.getItem("agrosensix_alert_recipients") || "";
  if (!recipient.trim()) return;

  const now = Date.now();

  // 1. Check Soil Moisture Alerts
  const enableMoisture = localStorage.getItem("agrosensix_alert_moisture") !== "false";
  if (enableMoisture) {
    const lastMoistureSentStr = localStorage.getItem("agrosensix_last_moisture_alert_time") || "0";
    const lastMoistureSent = parseInt(lastMoistureSentStr, 10);

    if (now - lastMoistureSent > ALERT_COOLDOWN_MS) {
      // Search for any dehydrated node
      let dehydratedNodeName = "";
      let dehydratedSectorName = "";
      let currentMoisture = 0;
      let minThreshold = 0;

      for (const sector of sectors) {
        for (const node of sector.nodes) {
          if (node.soilMoisture < sector.moistureThresholdMin && node.status !== "inactive") {
            dehydratedNodeName = node.name;
            dehydratedSectorName = sector.name;
            currentMoisture = node.soilMoisture;
            minThreshold = sector.moistureThresholdMin;
            break;
          }
        }
        if (dehydratedNodeName) break;
      }

      if (dehydratedNodeName) {
        const subject = `⚠️ [AgroSensiX Alert] Critical Soil Dehydration in Sector ${dehydratedSectorName}`;
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background-color: #0c0a09; color: #f5f5f4; padding: 20px; border-radius: 12px; border: 1px solid #dc2626;">
            <h2 style="color: #ef4444; margin-top: 0;">⚠️ Sensor Alert: Critical Low Moisture</h2>
            <p style="font-size: 13px; color: #d6d3d1;">An ecological threshold violation has been detected at the node gateway.</p>
            
            <div style="background-color: #1c1917; border: 1px solid #292524; padding: 12px; border-radius: 8px; margin: 15px 0;">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr>
                  <td style="color: #a8a29e; padding: 4px 0;">Sector:</td>
                  <td style="text-align: right; color: #fafaf9;"><strong>${dehydratedSectorName}</strong></td>
                </tr>
                <tr>
                  <td style="color: #a8a29e; padding: 4px 0;">Sensor Node:</td>
                  <td style="text-align: right; color: #fafaf9;"><strong>${dehydratedNodeName}</strong></td>
                </tr>
                <tr>
                  <td style="color: #a8a29e; padding: 4px 0;">Current Moisture:</td>
                  <td style="text-align: right; color: #f87171;"><strong>${currentMoisture}% VWC</strong></td>
                </tr>
                <tr>
                  <td style="color: #a8a29e; padding: 4px 0;">Minimum Required Threshold:</td>
                  <td style="text-align: right; color: #a8a29e;"><strong>${minThreshold}% VWC</strong></td>
                </tr>
              </table>
            </div>

            <p style="font-size: 12px; color: #a8a29e; line-height: 1.5;"><strong>Recommended Action:</strong> Access the Water Intelligence tab to trigger a manual pulse sequence on the eco pump, or check the ESP32 diagnostics system for sensor degradation.</p>
            <hr style="border: 0; border-top: 1px solid #292524; margin: 15px 0;" />
            <p style="font-size: 9px; color: #78716c; text-align: center; margin: 0;">Dispatched automatically by AgroSensiX Systems.</p>
          </div>
        `;

        localStorage.setItem("agrosensix_last_moisture_alert_time", String(now));
        const success = await sendGmailAlert(recipient, subject, htmlBody);
        if (success) {
          offlineStorage.addNotification(
            "Gmail Dispatch",
            `Soil Dehydration Email alert sent to ${recipient}`,
            "warning"
          );
        }
      }
    }
  }

  // 2. Check Solar Battery Alerts
  const enableBattery = localStorage.getItem("agrosensix_alert_battery") !== "false";
  if (enableBattery && battery.chargePercent < 20) {
    const lastBatterySentStr = localStorage.getItem("agrosensix_last_battery_alert_time") || "0";
    const lastBatterySent = parseInt(lastBatterySentStr, 10);

    if (now - lastBatterySent > ALERT_COOLDOWN_MS) {
      const subject = `⚠️ [AgroSensiX Alert] Critical Solar Battery Level - ${battery.chargePercent}%`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background-color: #0c0a09; color: #f5f5f4; padding: 20px; border-radius: 12px; border: 1px solid #d97706;">
          <h2 style="color: #f59e0b; margin-top: 0;">⚠️ Microgrid Power Warning</h2>
          <p style="font-size: 13px; color: #d6d3d1;">The solar battery telemetry indicates a critical power depletion state.</p>
          
          <div style="background-color: #1c1917; border: 1px solid #292524; padding: 12px; border-radius: 8px; margin: 15px 0;">
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr>
                <td style="color: #a8a29e; padding: 4px 0;">Charge Level:</td>
                <td style="text-align: right; color: #fbbf24;"><strong>${battery.chargePercent}%</strong></td>
              </tr>
              <tr>
                <td style="color: #a8a29e; padding: 4px 0;">Current Solar Input:</td>
                <td style="text-align: right; color: #fafaf9;"><strong>${battery.solarInputKw} kW</strong></td>
              </tr>
              <tr>
                <td style="color: #a8a29e; padding: 4px 0;">Microgrid State:</td>
                <td style="text-align: right; color: #fafaf9;"><strong>${battery.chargingState.toUpperCase()}</strong></td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #a8a29e; line-height: 1.5;"><strong>Recommended Action:</strong> Disable high-power intensive pump mode. System will trigger local power-saving modes to safeguard biosensor transmission integrity.</p>
          <hr style="border: 0; border-top: 1px solid #292524; margin: 15px 0;" />
          <p style="font-size: 9px; color: #78716c; text-align: center; margin: 0;">Dispatched automatically by AgroSensiX Systems.</p>
        </div>
      `;

      localStorage.setItem("agrosensix_last_battery_alert_time", String(now));
      const success = await sendGmailAlert(recipient, subject, htmlBody);
      if (success) {
        offlineStorage.addNotification(
          "Gmail Dispatch",
          `Low Battery Email alert dispatched to ${recipient}`,
          "info"
        );
      }
    }
  }

  // 3. Check Reservoir Depletion Alerts
  const enableReservoir = localStorage.getItem("agrosensix_alert_reservoir") !== "false";
  if (enableReservoir && pump.reservoirLevelPercent < 15) {
    const lastReservoirSentStr = localStorage.getItem("agrosensix_last_reservoir_alert_time") || "0";
    const lastReservoirSent = parseInt(lastReservoirSentStr, 10);

    if (now - lastReservoirSent > ALERT_COOLDOWN_MS) {
      const subject = `⚠️ [AgroSensiX Alert] Low Water Reservoir Level - ${pump.reservoirLevelPercent}%`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background-color: #0c0a09; color: #f5f5f4; padding: 20px; border-radius: 12px; border: 1px solid #2563eb;">
          <h2 style="color: #3b82f6; margin-top: 0;">⚠️ Reservoir Capacity Shortage</h2>
          <p style="font-size: 13px; color: #d6d3d1;">The ecological water storage reservoir level is critically low.</p>
          
          <div style="background-color: #1c1917; border: 1px solid #292524; padding: 12px; border-radius: 8px; margin: 15px 0;">
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr>
                <td style="color: #a8a29e; padding: 4px 0;">Reservoir Capacity:</td>
                <td style="text-align: right; color: #60a5fa;"><strong>${pump.reservoirLevelPercent}% Remaining</strong></td>
              </tr>
              <tr>
                <td style="color: #a8a29e; padding: 4px 0;">Pump State:</td>
                <td style="text-align: right; color: #fafaf9;"><strong>${pump.status.toUpperCase()}</strong></td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #a8a29e; line-height: 1.5;"><strong>Recommended Action:</strong> Refill the secondary backup water tank immediately. Pump operation has been set to safe limits to prevent cavitation damage.</p>
          <hr style="border: 0; border-top: 1px solid #292524; margin: 15px 0;" />
          <p style="font-size: 9px; color: #78716c; text-align: center; margin: 0;">Dispatched automatically by AgroSensiX Systems.</p>
        </div>
      `;

      localStorage.setItem("agrosensix_last_reservoir_alert_time", String(now));
      const success = await sendGmailAlert(recipient, subject, htmlBody);
      if (success) {
        offlineStorage.addNotification(
          "Gmail Dispatch",
          `Reservoir Low Capacity Email alert sent to ${recipient}`,
          "info"
        );
      }
    }
  }
}
