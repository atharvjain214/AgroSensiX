import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  Activity, 
  Terminal, 
  Sliders, 
  Droplet, 
  Trash2, 
  Layers, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { offlineStorage, IrrigationLog, WaterTankLog, ESP32Settings, FarmNotification } from "../utils/offlineStorage";

interface OfflineManagerProps {
  isOnline: boolean;
  forceOffline: boolean;
  onSetForceOffline: (val: boolean) => void;
  onTriggerIrrigation: (sectorId: string) => void;
  onUpdateReservoirLevel: (level: number) => void;
}

export const OfflineManager: React.FC<OfflineManagerProps> = ({
  isOnline,
  forceOffline,
  onSetForceOffline,
  onTriggerIrrigation,
  onUpdateReservoirLevel,
}) => {
  // ESP32 Settings
  const [settings, setSettings] = useState<ESP32Settings>(() => offlineStorage.getSettings());
  const [esp32IpInput, setEsp32IpInput] = useState(settings.esp32IpAddress);
  const [successMsg, setSuccessMsg] = useState("");

  // Storage Logs State
  const [irrigationLogs, setIrrigationLogs] = useState<IrrigationLog[]>([]);
  const [tankLogs, setTankLogs] = useState<WaterTankLog[]>([]);
  const [queuedChangesCount, setQueuedChangesCount] = useState(0);

  // ESP32 Terminal Log output
  const [terminalLogs, setTerminalLogs] = useState<string>("SYSTEM STANDBY. Direct ESP32 Wi-Fi LAN Bridge is inactive.\nTrigger 'Diagnostic Ping Test' to verify local network transceiver.");
  const [isPinging, setIsPinging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh data list on mount
  const refreshStorageData = () => {
    setIrrigationLogs(offlineStorage.getIrrigationHistory());
    setTankLogs(offlineStorage.getWaterTankHistory());
    setQueuedChangesCount(offlineStorage.getQueuedChanges().length);
  };

  useEffect(() => {
    refreshStorageData();
    // Refresh queue status periodically
    const interval = setInterval(() => {
      setQueuedChangesCount(offlineStorage.getQueuedChanges().length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...settings,
      esp32IpAddress: esp32IpInput.trim()
    };
    setSettings(updated);
    offlineStorage.saveSettings(updated);
    setSuccessMsg("Settings cached locally successfully!");
    offlineStorage.addNotification(
      "ESP32 Destination Saved",
      `Target LAN transceiver destination adjusted to: ${updated.esp32IpAddress}`,
      "info"
    );
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleToggleLanOverride = () => {
    const updated = {
      ...settings,
      directLanEnabled: !settings.directLanEnabled
    };
    setSettings(updated);
    offlineStorage.saveSettings(updated);
    offlineStorage.addNotification(
      "Lan Bridge Toggled",
      `Offline Direct ESP32 LAN communications ${updated.directLanEnabled ? "Activated" : "Deactivated"}.`,
      updated.directLanEnabled ? "success" : "info"
    );
  };

  const handleTestPing = async () => {
    setIsPinging(true);
    setTerminalLogs("OPENING DIRECT TCP PORT LINK...\nRESOLVING IP ROUTING PATHWAY...\nSENDING TRANSCEIVER STATUS BEACON...");
    
    const pingResult = await offlineStorage.simulateESP32Fetch(settings.esp32IpAddress);
    
    setIsPinging(false);
    setTerminalLogs(pingResult.logs);
    
    if (pingResult.success) {
      offlineStorage.addNotification(
        "ESP32 Transceiver Connected",
        `Direct physical ping test to ESP32 on ${settings.esp32IpAddress} succeeded with low latency.`,
        "success"
      );
    }
  };

  const handleForceManualSync = async () => {
    if (!isOnline || forceOffline) {
      setTerminalLogs("BLOCKED: Cannot push queue to database. Device must be connected ONLINE to cloud servers to synchronize.");
      return;
    }

    setIsSyncing(true);
    setTerminalLogs("CONNECTING TO CLOUD... SECURING SSL WRAPPER...\nUPLOADING OFFLINE BACKLOG TO FIRESTORE...");
    
    try {
      const result = await offlineStorage.syncLocalDataToCloud();
      setIsSyncing(false);
      setQueuedChangesCount(0);
      refreshStorageData();
      setTerminalLogs(`SYNCHRONIZATION COMPLETED NOMINALLY!\nItems Synced: ${result.successCount}\nErrors: ${result.errors.length}`);
    } catch {
      setIsSyncing(false);
      setTerminalLogs("ERROR: Sync transmission aborted due to network failure.");
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all offline irrigation and reservoir water tank history log books from local memory?")) {
      offlineStorage.saveIrrigationHistory([]);
      offlineStorage.saveWaterTankHistory([]);
      refreshStorageData();
      offlineStorage.addNotification(
        "Audit Trail Cleared",
        "Offline hydrological log archives physically cleared from local memory cache.",
        "warning"
      );
    }
  };

  // Quick offline log seeding
  const handleSeedMockLogs = () => {
    offlineStorage.addIrrigationLog({
      sectorId: "sector-G14",
      sectorName: "Greenhouse 14 (Mixed Crops)",
      durationSec: 15,
      litresDispensed: 12.5,
      mode: "Eco-Hydrology Mode"
    });
    offlineStorage.addIrrigationLog({
      sectorId: "sector-7G",
      sectorName: "Orchard Hub 7 (Dwarf Oranges)",
      durationSec: 15,
      litresDispensed: 18.0,
      mode: "Standard Mode"
    });
    offlineStorage.addWaterTankLog({
      prevLevelPercent: 72,
      newLevelPercent: 82,
      refillVolumeLitres: 120.0,
      actionType: "refill"
    });
    
    refreshStorageData();
    setTerminalLogs("Hydrological logs seeded with offline tracking points!");
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4.5">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-450 animate-bounce" />
            Offline Operational Hub
          </h2>
          <p className="text-xs font-mono text-zinc-500 font-bold">
            Monitor local database sync queues, map ESP32 transceivers, and view hydrological logs offline.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onSetForceOffline(!forceOffline)}
            className={`px-3.5 py-1.5 rounded-xl border font-mono text-[9.5px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm ${
              forceOffline
                ? "bg-amber-950/30 border-amber-500/40 text-amber-400"
                : "bg-zinc-950/80 hover:bg-zinc-900 border-zinc-900/60 text-zinc-400"
            }`}
          >
            {forceOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-emerald-450" />}
            {forceOffline ? "SYSTEM: FORCE OFFLINE ON" : "SYSTEM: CONNECTED CLOUD"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ESP32 Controls */}
        <div className="lg:col-span-1 bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-900/60 pb-2.5 mb-4">
              ESP32 LAN Transceiver
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-zinc-500 uppercase tracking-wide block mb-1.5 font-bold">ESP32 Destination Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={esp32IpInput}
                    onChange={(e) => setEsp32IpInput(e.target.value)}
                    placeholder="e.g. 192.168.4.1"
                    className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-emerald-500/40 focus:outline-none rounded-xl py-2 px-3 text-zinc-200 text-xs font-bold"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-zinc-900 text-emerald-450 border border-zinc-800 hover:border-emerald-500/30 rounded-xl font-bold cursor-pointer transition"
                  >
                    Save
                  </button>
                </div>
                {successMsg && <span className="text-[10px] text-emerald-400 font-bold mt-1 block">{successMsg}</span>}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center bg-zinc-950/90 border border-zinc-900 p-3 rounded-xl">
                  <div>
                    <span className="text-zinc-300 font-bold block leading-tight">Direct LAN Control</span>
                    <span className="text-[9px] text-zinc-500">Communicate physical relays over Local LAN</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleLanOverride}
                    className="focus:outline-none cursor-pointer"
                  >
                    {settings.directLanEnabled ? (
                      <CheckCircle className="w-6 h-6 text-emerald-450" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-zinc-800" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 mt-5 text-mono text-[10px] text-zinc-500 leading-normal font-bold">
              <span className="text-emerald-400 block font-bold uppercase mb-1 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> LAN Configuration Specs
              </span>
              <p>SSID Host: <span className="text-zinc-300">AgroSensiX-WIFI-TRANSMIT</span></p>
              <p>Relay Status: <span className="text-emerald-400">NOMINAL (SAFE)</span></p>
              <p>Offline Buffer: <span className="text-zinc-300">Infinite Offline Retires</span></p>
            </div>
          </div>

          <div className="pt-4.5 border-t border-zinc-900">
            <button
              onClick={handleTestPing}
              disabled={isPinging}
              className="w-full py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 hover:border-emerald-400 text-emerald-455 text-xs font-mono uppercase tracking-wider rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isPinging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              {isPinging ? "SENDING TCP BEACON..." : "Diagnostic Ping Test"}
            </button>
          </div>
        </div>

        {/* Sync Backlog Terminal */}
        <div className="lg:col-span-2 bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex justify-between items-center border-b border-zinc-900/60 pb-2.5">
              <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-450" />
                Offline Transceiver Terminal Logs
              </h3>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wide">
                    Queued to Cloud: {queuedChangesCount}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${queuedChangesCount > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                </div>
                {/* Visual Progress/Status Indicator */}
                <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${queuedChangesCount > 0 ? "bg-amber-500" : "bg-emerald-500"}`} 
                    style={{ width: queuedChangesCount > 0 ? `${Math.min(100, (queuedChangesCount / 10) * 100)}%` : '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Terminal screen panel */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl min-h-[160px] font-mono text-[10.5px] text-emerald-500/90 whitespace-pre-wrap overflow-y-auto leading-relaxed max-h-[180px] shadow-inner">
              {terminalLogs}
            </div>
          </div>

          {/* Sync actions buttons */}
          <div className="grid grid-cols-2 gap-3.5 pt-4.5 border-t border-zinc-900">
            <button
              onClick={handleForceManualSync}
              disabled={isSyncing}
              className="py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Push Cache Sync
            </button>
            <button
              onClick={handleSeedMockLogs}
              className="py-2.5 bg-emerald-500 text-black border border-emerald-400/25 text-xs font-mono uppercase tracking-wider rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              Seed Offline Logs
            </button>
          </div>
        </div>

      </div>

      {/* Hydrological Audit logs tables */}
      <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-2.5">
          <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
            <Droplet className="w-4 h-4 text-emerald-555" />
            Hydrological Audit Trail & Local Records
          </h3>
          <button
            onClick={handleClearHistory}
            className="text-[10px] font-mono hover:text-red-400 text-zinc-500 flex items-center gap-1.5 uppercase transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Books
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Irrigation logs columns */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider mb-2 border-b border-zinc-900/60 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Irrigation History ({irrigationLogs.length})
            </h4>

            {irrigationLogs.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 font-mono text-xs border border-zinc-900/30 rounded-xl bg-zinc-950/20">
                No offline irrigation logs recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {irrigationLogs.map((log) => (
                  <div key={log.id} className="bg-zinc-950 hover:bg-zinc-900/60 border border-zinc-900 p-3 rounded-xl flex items-center justify-between transition text-xs font-mono text-left">
                    <div className="space-y-1">
                      <span className="text-zinc-200 font-bold block">{log.sectorName}</span>
                      <div className="flex flex-wrap items-center gap-2.5 text-[9.5px] text-zinc-500 font-bold">
                        <span className="text-zinc-550">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span>|</span>
                        <span>Duration: {log.durationSec}s</span>
                        <span>|</span>
                        <span>{log.mode}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-emerald-455 font-bold block">+{log.litresDispensed}L</span>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${log.syncStatus === "synced" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500 animate-pulse"}`}>
                        {log.syncStatus === "synced" ? "SYNCED" : "LOCAL"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reservoir refill history logs columns */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider mb-2 border-b border-zinc-900/60 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              Water Tank Logs ({tankLogs.length})
            </h4>

            {tankLogs.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 font-mono text-xs border border-zinc-900/30 rounded-xl bg-zinc-950/20">
                No offline tank replenishment events recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {tankLogs.map((log) => (
                  <div key={log.id} className="bg-zinc-950 hover:bg-zinc-900/60 border border-zinc-900 p-3 rounded-xl flex items-center justify-between transition text-xs font-mono text-left">
                    <div className="space-y-1">
                      <span className="text-zinc-200 font-bold block">
                        {log.actionType === "refill" ? "RESERVOIR REPLEMISHMENT" : "WATER EXTRACTION"}
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5 text-[9.5px] text-zinc-500 font-bold">
                        <span className="text-zinc-550">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span>|</span>
                        <span>Status: {log.prevLevelPercent}% → {log.newLevelPercent}% Tank</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-cyan-455 font-bold block">+{log.refillVolumeLitres} Liters</span>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${log.syncStatus === "synced" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500 animate-pulse"}`}>
                        {log.syncStatus === "synced" ? "SYNCED" : "LOCAL"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
