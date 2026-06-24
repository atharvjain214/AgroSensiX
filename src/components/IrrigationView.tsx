import React, { useState, useEffect } from "react";
import { WaterPumpTelemetry, SectorData } from "../types";
import { offlineStorage, IrrigationLog } from "../utils/offlineStorage";
import { 
  Droplet, 
  Settings, 
  Clock, 
  ToggleLeft, 
  ToggleRight, 
  Activity, 
  Play,
  CheckCircle,
  TrendingUp,
  Sliders
} from "lucide-react";

interface IrrigationViewProps {
  pump: WaterPumpTelemetry;
  sectors: SectorData[];
  onTriggerIrrigation: (sectorId: string) => void;
  onUpdatePumpMode: (mode: "eco" | "intensive" | "biological" | "off") => void;
  onUpdateReservoirLevel: (level: number) => void;
}

export const IrrigationView: React.FC<IrrigationViewProps> = ({
  pump,
  sectors,
  onTriggerIrrigation,
  onUpdatePumpMode,
  onUpdateReservoirLevel,
}) => {
  const [schedulerActive, setSchedulerActive] = useState(true);
  const [pulseDuration, setPulseDuration] = useState(180); // 3 minutes standard (180 secs)
  const [activePresetMode, setActivePresetMode] = useState<"eco" | "intensive" | "biological" | "off">(pump.currentMode);
  
  // Local state for valve toggles
  const [valves, setValves] = useState({
    "valve-G14-A": true,
    "valve-G14-B": true,
    "valve-G14-C": false,
    "valve-G14-D": false,
    "valve-7G-A": true,
    "valve-7G-B": false,
  });

  const [irrigationHistory, setIrrigationHistory] = useState<IrrigationLog[]>([]);

  // Keep preset mode synchronized with prop state
  useEffect(() => {
    setActivePresetMode(pump.currentMode);
  }, [pump.currentMode]);

  useEffect(() => {
    // Load irrigation history on mount and keep polling
    const fetchHistory = () => {
      setIrrigationHistory(offlineStorage.getIrrigationHistory());
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleValve = (valveId: keyof typeof valves) => {
    setValves((prev) => ({
      ...prev,
      [valveId]: !prev[valveId],
    }));
  };

  const handleSelectPreset = (mode: "eco" | "intensive" | "biological" | "off") => {
    setActivePresetMode(mode);
    onUpdatePumpMode(mode);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4.5">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Droplet className="w-5 h-5 text-emerald-450 animate-bounce" />
            Water Control Hub
          </h2>
          <p className="text-xs font-mono text-zinc-500 font-bold">
            Control water pumps, set schedules, and manage garden valves.
          </p>
        </div>

        <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-900/80 flex items-center gap-2 text-xs font-mono text-zinc-400 font-semibold px-4.5 uppercase text-nowrap self-start md:self-auto shadow-sm">
          <Activity className="w-4 h-4 text-emerald-500" />
          PUMP STATUS: 
          <span className={`font-bold ml-1 ${pump.status === "active" ? "text-emerald-400" : "text-amber-555"}`}>
            {pump.status === "active" ? "RUNNING" : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Grid: Reservoir indicator & manual pulsing overrides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Animated Fluid Level Indicator */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-900/60 pb-2.5 mb-4.5">
              Water Tank Level
            </h3>

            {/* Simulated Glass Cylinder */}
            <div className="relative w-32 h-56 mx-auto bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-end shadow-inner mb-4.5">
              {/* Scale Tick marks */}
              <div className="absolute top-0 left-0 w-full h-full p-3 flex flex-col justify-between text-[8px] font-mono text-zinc-650 select-none pointer-events-none z-10">
                <span>100% - FULL</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0% - NEED WATER</span>
              </div>

              {/* Dynamic Fluid Volume representation */}
              <div 
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border-t-2 border-emerald-400 relative transition-all duration-1000 group cursor-pointer" 
                style={{ height: `${pump.reservoirLevelPercent}%` }}
                onClick={() => {
                  const refill = Math.min(100, pump.reservoirLevelPercent + 10);
                  onUpdateReservoirLevel(parseFloat(refill.toFixed(1)));
                }}
              >
                {/* Fluid shine shine */}
                <div className="absolute inset-0 bg-transparent opacity-15 group-hover:opacity-25 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-t from-transparent to-emerald-400" />
                </div>
                
                {/* Liquid center percent readout */}
                <span className="absolute bottom-5 left-0 w-full text-center text-xs font-mono font-semibold text-emerald-200 tracking-widest">
                  {pump.reservoirLevelPercent}%
                </span>
              </div>
            </div>
            
            <p className="text-[10px] font-mono text-zinc-500 text-center leading-relaxed font-bold">
              *The water tank is currently active. Click on the tank above to simulate refilling it (+10% water volume).*
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-4 mt-5 flex justify-between items-center text-xs font-mono text-zinc-400 uppercase font-bold">
            <span>TOTAL WATER USED:</span>
            <span className="text-emerald-455 font-bold">{pump.totalLitresDispensed.toFixed(1)} LITERS</span>
          </div>
        </div>

        {/* Pulse sequences manual adjustments */}
        <div className="lg:col-span-2 bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-mono font-bold text-zinc-350 uppercase tracking-widest border-b border-zinc-900/60 pb-2.5">
            Water Scheduler
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Automatic Preset Sequencers */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-555 block uppercase mb-1 font-bold">WATER FLOW PRESETS</span>
                <p className="text-xs font-sans text-zinc-500 leading-normal font-bold">
                  Choose a preset mode to automatically adjust how much and how often your field gets watered:
                </p>
              </div>

              <div className="space-y-2.5 font-mono text-xs font-bold">
                {/* ECO preset */}
                <button
                  onClick={() => handleSelectPreset("eco")}
                  className={`w-full p-4.5 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                    activePresetMode === "eco"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg"
                      : "bg-zinc-950/50 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-semibold uppercase text-xs">Eco Watering Mode</h4>
                    <span className="text-[9.5px] text-zinc-500 block leading-snug mt-0.5 font-bold">Uses the least amount of water; ideal for saving water with short, light watering bursts.</span>
                  </div>
                  <span className="text-[9.5px] uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 shrink-0 select-none font-bold">ECO</span>
                </button>

                {/* Biological/Standard Preset */}
                <button
                  onClick={() => handleSelectPreset("biological")}
                  className={`w-full p-4.5 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                    activePresetMode === "biological"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg"
                      : "bg-zinc-950/50 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-semibold uppercase text-xs">Standard Watering Mode</h4>
                    <span className="text-[9.5px] text-zinc-500 block leading-snug mt-0.5 font-bold">Standard watering mode. Balanced watering guided by daylight cycles.</span>
                  </div>
                  <span className="text-[9.5px] uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-emerald-550 shrink-0 select-none animate-pulse font-bold">STANDARD</span>
                </button>

                {/* Intensive Preset */}
                <button
                  onClick={() => handleSelectPreset("intensive")}
                  className={`w-full p-4.5 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                    activePresetMode === "intensive"
                      ? "bg-amber-500/10 border-amber-550/30 text-amber-500 shadow-lg"
                      : "bg-zinc-950/50 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-semibold uppercase text-xs">Heavy Watering Mode</h4>
                    <span className="text-[9.5px] text-zinc-500 block leading-snug mt-0.5 font-bold">Runs the water pump heavy to thoroughly soak dry fields and replenish dry soil.</span>
                  </div>
                  <span className="text-[9.5px] uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-amber-500 shrink-0 select-none font-bold">MAX</span>
                </button>
              </div>
            </div>

            {/* Manual pulse duration adjuster and trigger */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-zinc-900/80 pt-4.5 md:pt-0 md:pl-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-555 block uppercase tracking-wider font-bold">Manual Watering Controller</span>
                  <span className="text-[10px] font-mono text-zinc-600 block font-bold">Set a manual watering timer for custom watering events.</span>
                </div>

                {/* Duration Slider input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-zinc-400 font-semibold uppercase">
                    <span>WATERING TIME:</span>
                    <span className="text-emerald-455 font-bold">{pulseDuration} SECONDS</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="600"
                    step="30"
                    value={pulseDuration}
                    onChange={(e) => setPulseDuration(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8.5px] font-mono text-zinc-650 font-bold">
                    <span>30s Test</span>
                    <span>10m Soak</span>
                  </div>
                </div>

                {/* Scheduler state toggle */}
                <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-900/80">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <div>
                      <span className="text-xs font-mono font-bold text-zinc-300 block leading-tight">AUTOMATIC TIMER</span>
                      <span className="text-[9px] font-mono text-zinc-600 font-bold">Turn on automatic watering schedules</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSchedulerActive(!schedulerActive)}
                    className="text-emerald-400 focus:outline-none cursor-pointer"
                  >
                    {schedulerActive ? (
                      <ToggleRight className="w-8 h-8 text-emerald-455" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-700" />
                    )}
                  </button>
                </div>
              </div>

              {/* Instant Manual Sector Pulsing Block */}
              <div className="space-y-2 pt-4">
                <button
                  onClick={() => onTriggerIrrigation("sector-G14")}
                  className="w-full py-2.5 px-3.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] border border-emerald-500/20 hover:border-emerald-400 text-emerald-455 text-xs font-mono uppercase tracking-wider rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Water Greenhouse 14
                </button>
                <button
                  onClick={() => onTriggerIrrigation("sector-7G")}
                  className="w-full py-2.5 px-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono uppercase tracking-wider rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Water Orchard Hub 7
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Valve Array Controls */}
      <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl text-left">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 mb-4">
          <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-500" />
            Individual Valve Controls
          </h3>
          <span className="text-[10px] font-mono text-zinc-555 font-bold">VALVE CONNECTIONS: NOMINAL (OK)</span>
        </div>

        <p className="text-[11px] font-sans text-zinc-555 mb-4 leading-relaxed font-bold">
          Each valve below regulates water flow to a specific area of your farm. You can turn them on or off manually to control water where it is needed:
        </p>

        {/* Valve Grid lists */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 uppercase font-mono text-[10.5px]">
          {Object.entries(valves).map(([valveId, value]) => (
            <div 
              key={valveId}
              onClick={() => toggleValve(valveId as keyof typeof valves)}
              className={`border p-3.5 rounded-xl text-center cursor-pointer transition-all duration-300 select-none ${
                value 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/5" 
                  : "bg-zinc-950/65 border-zinc-900 text-zinc-550 hover:bg-zinc-900/40 hover:border-zinc-850"
              }`}
            >
              <div className="font-bold tracking-wide text-zinc-200">
                {valveId.replace("valve-", "").replace("G14", "Greenhouse 14").replace("7G", "Orchard Hub 7")}
              </div>
              <span className={`text-[8.5px] font-bold inline-block px-2.5 py-0.5 rounded-full mt-2.5 transition-colors tracking-wide ${
                value ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-900 text-zinc-650"
              }`}>
                {value ? "VALVE ON" : "VALVE CLOSED"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Irrigation Event History Log */}
      <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl text-left">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 mb-4">
          <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            Recent Irrigation History
          </h3>
          <span className="text-[10px] font-mono text-zinc-555 font-bold">LATEST RECORDS</span>
        </div>

        {irrigationHistory.length === 0 ? (
          <div className="text-center py-6 text-zinc-600 font-mono text-xs border border-zinc-900/30 rounded-xl bg-zinc-950/20">
            No recent irrigation events recorded.
          </div>
        ) : (
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {irrigationHistory.slice().reverse().map((log) => (
              <div key={log.id} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between text-xs font-mono text-left">
                <div className="space-y-1">
                  <span className="text-zinc-200 font-bold block">{log.sectorName}</span>
                  <div className="flex flex-wrap items-center gap-2.5 text-[9.5px] text-zinc-500 font-bold">
                    <span className="text-zinc-550">{new Date(log.timestamp).toLocaleString()}</span>
                    <span>|</span>
                    <span>Duration: {log.durationSec}s</span>
                    <span>|</span>
                    <span className="text-emerald-500/80">{log.mode}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-emerald-455 font-bold block">+{log.litresDispensed} L</span>
                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${log.syncStatus === "synced" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500 animate-pulse"}`}>
                    {log.syncStatus === "synced" ? "SYNCED" : "LOCAL PENDING"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
