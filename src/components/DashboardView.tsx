import React, { useState } from "react";
import { SectorData, SensorNode, BatteryTelemetry, WaterPumpTelemetry } from "../types";
import { 
  Sprout, 
  Thermometer, 
  Droplets, 
  Sun, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Cpu, 
  RefreshCw,
  Flame,
  CloudSun,
  Eye,
  Sparkles,
  Layers,
  Clock,
  ArrowRight
} from "lucide-react";

interface DashboardViewProps {
  sectors: SectorData[];
  battery: BatteryTelemetry;
  pump: WaterPumpTelemetry;
  onTriggerIrrigation: (sectorId: string) => void;
  onModifyNodeMoisture: (sectorId: string, nodeId: string, newMoisture: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sectors,
  battery,
  pump,
  onTriggerIrrigation,
  onModifyNodeMoisture,
}) => {
  const [selectedSectorId, setSelectedSectorId] = useState<string>("sector-G14");
  const [selectedNode, setSelectedNode] = useState<SensorNode | null>(null);
  const [isSimulatingStress, setIsSimulatingStress] = useState<string | null>(null);

  // Active highlighted part of the Farm Digital Twin
  const [activeTwinComponent, setActiveTwinComponent] = useState<"tank" | "solar" | "g14" | "orchard" | "lines" | null>(null);

  // Climate control states
  const [isRainDetected, setIsRainDetected] = useState(false);
  const [roofState, setRoofState] = useState<"Open" | "Closed">("Open");
  const [roofControlMode, setRoofControlMode] = useState<"Auto" | "Manual">("Auto");

  const activeSector = sectors.find((s) => s.id === selectedSectorId) || sectors[0];
  const averageHealthScore = Math.round(sectors.reduce((acc, s) => acc + s.plantHealthIndex, 0) / sectors.length);

  const getScoreRating = (score: number) => {
    if (score === 100) {
      return { label: "Excellent", color: "text-emerald-400", border: "border-emerald-500", glow: "glow-emerald", desc: "Flourishing canopy" };
    }
    if (score >= 80) {
      return { label: "Healthy", color: "text-emerald-400", border: "border-emerald-550/40", glow: "glow-emerald", desc: "Stable metabolic flow" };
    }
    if (score >= 60) {
      return { label: "Needs Attention", color: "text-amber-400", border: "border-amber-500/20", glow: "glow-gold", desc: "Restricted soil moisture" };
    }
    return { label: "Critical Warning", color: "text-rose-500", border: "border-rose-550/30", glow: "glow-gold", desc: "Hypersensitive dehydration" };
  };

  const healthInfo = getScoreRating(averageHealthScore);

  const handleSelectNode = (node: SensorNode) => {
    setSelectedNode(node);
  };

  const handleSimulateStressor = (stressType: string) => {
    if (isSimulatingStress === stressType) {
      setIsSimulatingStress(null);
      activeSector.nodes.forEach(node => {
        const baselineMoisture = node.id.includes("Delta") ? 38.2 : 44.0;
        onModifyNodeMoisture(activeSector.id, node.id, baselineMoisture);
      });
    } else {
      setIsSimulatingStress(stressType);
      activeSector.nodes.forEach(node => {
        let changedMoisture = node.soilMoisture;
        if (stressType === "drought") {
          changedMoisture = Math.max(12, node.soilMoisture - 18);
        } else if (stressType === "flood") {
          changedMoisture = Math.min(85, node.soilMoisture + 25);
        } else if (stressType === "heat") {
          changedMoisture = Math.max(22, node.soilMoisture - 8);
        }
        onModifyNodeMoisture(activeSector.id, node.id, parseFloat(changedMoisture.toFixed(1)));
      });
    }
  };

  // Dedicated list of custom farm suggestions
  const aiRecommendations = [
    {
      id: "rec-1",
      title: "Intense Solar Transpiration Alert",
      priority: "high",
      msg: `Greenhouse G-14 is observing a peak raw sunlight level of ${activeSector.nodes[0]?.solarDose || 480}W. Triggering manual sector pulse within the next 3 hours is recommended to keep soil moisture above 45%.`
    },
    {
      id: "rec-2",
      title: "Optimized Water Tank Replenish",
      priority: "normal",
      msg: "Reservoir capacity stands at 75%. Solar output is at a daily peak; pump water into off-grid high-volume tanks now to leverage zero carbon energy costs."
    },
    {
      id: "rec-3",
      title: "Prevention of Leaf Moisture Spotting",
      priority: "low",
      msg: "Ambient evening rainfall is anticipated. Automate ventilator shields to locked down state [Closed] ahead of standard 19:00 timetables to block fungal development."
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Floating High-tech Auroras */}
      <div className="absolute top-[300px] left-[40%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none animate-pulse" />

      {/* Header and Telemetry Sector Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900/60 pb-5">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold block">OPERATING SYSTEM MODULE</span>
          <h2 className="text-xl md:text-3xl font-sans font-bold text-white tracking-tight flex items-center gap-2.5 mt-1 uppercase">
            <Activity className="w-6 h-6 text-emerald-400 animate-spin" style={{ animationDuration: "5s" }} />
            Farm Command Center
          </h2>
          <p className="text-xs font-mono text-zinc-500 font-bold mt-1">
            Space-grade telemetry logs and live agricultural intelligence.
          </p>
        </div>

        {/* Sector Switching Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 border border-zinc-900 rounded-xl shadow-inner self-start md:self-auto">
          {sectors.map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setSelectedSectorId(sec.id);
                setSelectedNode(null);
              }}
              className={`px-4.5 py-2.5 text-xs font-mono rounded-lg transition-all duration-300 uppercase cursor-pointer border ${
                selectedSectorId === sec.id
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                  : "text-zinc-550 hover:text-zinc-300 hover:bg-zinc-900/30 border-transparent"
              }`}
            >
              {sec.id === "sector-G14" ? "Greenhouse 14" : "Orchard Hub 7"}
            </button>
          ))}
        </div>
      </div>

      {/* CORE INTENSIFIED MONITOR STATS ROW: HEALTH, WATER, SOLAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* SECTION 1: FARM HEALTH SCORE */}
        <div className="bg-[#03090f]/70 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-widest font-bold">AGRICULTURE INDEX</span>
              <h3 className="text-sm font-sans font-bold text-zinc-200 mt-1 uppercase tracking-wider">Crop Health Score</h3>
            </div>
            <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded text-[9.5px] font-mono uppercase font-bold tracking-wider">Metabolic Flow</span>
          </div>

          <div className="flex items-center gap-6 my-4">
            {/* Elegant Circular Progress SVG */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#0e1b24" strokeWidth="6" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="6" fill="transparent" 
                        strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * averageHealthScore) / 100}
                        strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold font-mono text-white leading-none">{averageHealthScore}%</span>
                <span className="text-[9px] text-zinc-500 uppercase font-mono mt-1 font-semibold">Score</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className={`text-sm font-sans uppercase font-bold tracking-wider block ${healthInfo.color}`}>
                ● {healthInfo.label}
              </span>
              <p className="text-[11px] font-mono text-zinc-400 leading-normal font-bold">
                {healthInfo.desc}. Direct root transpiration indicators are stabilized this sequence.
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-900/60 pt-3 flex justify-between font-mono text-[9px] text-zinc-550 uppercase tracking-widest font-semibold">
            <span>CROP TYPE:</span>
            <span className="text-zinc-350">{activeSector.cropType.split(" ")[0]}</span>
          </div>
        </div>

        {/* SECTION 2: WATER INTELLIGENCE */}
        <div className="bg-[#03090f]/70 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-widest font-bold">HYDRO INTERFACE</span>
              <h3 className="text-sm font-sans font-bold text-zinc-200 mt-1 uppercase tracking-wider">Water Intelligence</h3>
            </div>
            <span className="p-1 px-2.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/15 rounded text-[9.5px] font-mono uppercase font-bold tracking-wider">ESP32 flow</span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-2 text-left">
            <div>
              <span className="text-[9px] font-mono text-zinc-550 block uppercase tracking-wider">HYDRO STATION LEVEL</span>
              <div className="text-lg font-bold font-mono text-zinc-100 mt-1 flex items-baseline">
                {pump.reservoirLevelPercent || 74}%
                <span className="text-[10px] font-sans text-zinc-550 font-normal ml-1">Volume</span>
              </div>
              <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden mt-1.5 border border-zinc-900">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${pump.reservoirLevelPercent || 74}%` }} />
              </div>
            </div>

            <div>
              <span className="text-[9px] font-mono text-zinc-550 block uppercase tracking-wider">VALVE PRESSURE</span>
              <div className="text-lg font-bold font-mono text-zinc-100 mt-1 flex items-baseline">
                {pump.pressureBar} <span className="text-[10px] font-sans font-normal text-zinc-550 ml-0.5">BAR</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-450 uppercase block font-semibold tracking-wider mt-1.5">● FLOW: {pump.flowRateLpm} LPM</span>
            </div>
          </div>

          <div className="border-t border-zinc-900/60 pt-3 flex justify-between font-mono text-[9px] text-zinc-550 uppercase tracking-widest font-semibold">
            <span>SCHEDULING:</span>
            <span className="text-cyan-300">Eco Hydrology ON</span>
          </div>
        </div>

        {/* SECTION 3: SOLAR INTELLIGENCE */}
        <div className="bg-[#03090f]/70 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-widest font-bold">CLEAN ENERGY POWER</span>
              <h3 className="text-sm font-sans font-bold text-zinc-200 mt-1 uppercase tracking-wider">Solar Intelligence</h3>
            </div>
            <span className="p-1 px-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/15 rounded text-[9.5px] font-mono uppercase font-bold tracking-wider">Solar Harvest</span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-2 text-left">
            <div>
              <span className="text-[9px] font-mono text-zinc-550 block uppercase tracking-wider">RAW GENERATION</span>
              <div className="text-lg font-bold font-mono text-zinc-100 mt-1 flex items-baseline">
                {battery.solarInputKw} <span className="text-[10px] font-sans font-normal text-zinc-550 ml-0.5">kW</span>
              </div>
              <span className="text-[9px] font-mono text-amber-400 uppercase block font-semibold tracking-wider mt-1.5">● Voltage {battery.voltage}V</span>
            </div>

            <div>
              <span className="text-[9px] font-mono text-zinc-550 block uppercase tracking-wider">BATTERY CHARGE</span>
              <div className="text-lg font-bold font-mono text-zinc-100 mt-1 flex items-baseline">
                {battery.chargePercent}%
                <span className="text-[10px] font-sans font-normal text-zinc-550 ml-1">lithium</span>
              </div>
              <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden mt-1.5 border border-zinc-900">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${battery.chargePercent}%` }} />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900/60 pt-3 flex justify-between font-mono text-[9px] text-zinc-550 uppercase tracking-widest font-semibold">
            <span>SAVINGS YTD:</span>
            <span className="text-amber-400">3,120 kW (Eco)</span>
          </div>
        </div>

      </div>

      {/* SECTION 4: AI RECOMMENDATIONS (DEDICATED PANEL OF TILES) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
          <Sparkles className="w-4.5 h-4.5 text-amber-400" />
          <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">AI Agriculture Policy Advice Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {aiRecommendations.map((rec) => (
            <div 
              key={rec.id}
              className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between group hover:border-[#FBBF24]/20 duration-300 ease-out"
            >
              {/* Highlight top-right color gradient */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">{rec.title}</span>
                  <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    rec.priority === "high" ? "bg-rose-550/15 text-rose-450 border border-rose-500/10" :
                    rec.priority === "normal" ? "bg-amber-550/15 text-amber-400 border border-amber-500/10" :
                    "bg-zinc-900 text-zinc-500"
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-xs text-zinc-350 font-sans leading-relaxed font-bold">
                  {rec.msg}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-900/60 mt-4 flex items-center justify-between text-[10px] font-mono text-zinc-550 font-bold">
                <span>POLICY CODE: {rec.id.toUpperCase()}</span>
                <span className="text-[#FBBF24] flex items-center gap-0.5">Automated target <ArrowRight className="w-3 h-3" /></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: THE INTERACTIVE FARM DIGITAL TWIN VECTOR MAP */}
      <div className="bg-neutral-950 rounded-[28px] border border-zinc-900/80 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Grated overlay panel */}
        <div className="absolute inset-0 bg-[#040e1a]/20 opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.012)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-mono text-[#22D3EE] uppercase tracking-widest font-bold flex items-center gap-1.5 animate-pulse">
              <Layers className="w-4.5 h-4.5" /> LIVE DIGITAL TWIN
            </span>
            <h3 className="text-lg md:text-xl font-bold font-sans text-white uppercase tracking-tight">Interactive Core Farm Twin Projection</h3>
          </div>

          {/* Quick interactive assistance */}
          <p className="text-[10.5px] font-mono text-zinc-500 uppercase tracking-wide font-bold hidden md:block">
            &lt; Tap components below to synchronize telemetry logs in realtime &gt;
          </p>
        </div>

        {/* Grid holding SVG layout + side details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
          
          <div className="lg:col-span-8 bg-[#040c14] border border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex items-center justify-center min-h-[300px]">
            
            {/* Pulsing indicator of active twin */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              STATUS: SYNC MODEL nominal
            </div>

            {/* Interactive Vector SVG Canvas of the Twin Map */}
            <svg 
              viewBox="0 0 800 400" 
              className="w-full max-w-2xl h-auto select-none"
              style={{ strokeLinecap: "round", strokeLinejoin: "round" }}
            >
              {/* Background ambient ground plane */}
              <polygon points="50,280 400,100 750,280 400,380" fill="#03060c" stroke="#0f1f33" strokeWidth="2" />
              
              {/* Grid guide projections lines */}
              <line x1="50" y1="280" x2="750" y2="280" stroke="#0d1b2b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="400" y1="100" x2="400" y2="380" stroke="#0d1b2b" strokeWidth="1" strokeDasharray="4 4" />

              {/* Water Tank Component */}
              <g 
                onClick={() => setActiveTwinComponent("tank")}
                className="cursor-pointer group"
              >
                <circle cx="160" cy="220" r="28" fill={activeTwinComponent === "tank" ? "#083344" : "#020810"} stroke={activeTwinComponent === "tank" ? "#22d3ee" : "#0f1f33"} strokeWidth="2" />
                <path d="M140,225 Q160,215 180,225" stroke="#22d3ee" strokeWidth="3" fill="none" className="animate-pulse" />
                <text x="160" y="223" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">TANK</text>
                <circle cx="160" cy="192" r="4" fill="#22d3ee" className="animate-ping" />
              </g>

              {/* Solar array Panel Component */}
              <g 
                onClick={() => setActiveTwinComponent("solar")}
                className="cursor-pointer group"
              >
                <polygon points="360,130 440,130 420,170 340,170" fill={activeTwinComponent === "solar" ? "#451a03" : "#020810"} stroke={activeTwinComponent === "solar" ? "#fbbf24" : "#0f1f33"} strokeWidth="2" />
                <line x1="390" y1="130" x2="370" y2="170" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
                <line x1="410" y1="130" x2="390" y2="170" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
                <text x="390" y="155" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">SOLAR</text>
              </g>

              {/* Irrigation Lines (Animating Glowing Paths connecting segments) */}
              <g 
                onClick={() => setActiveTwinComponent("lines")}
                className="cursor-pointer transition-all"
              >
                {/* Path from tank to Greenhouse G14 */}
                <path 
                  d="M188,220 L300,240" 
                  stroke={activeTwinComponent === "lines" || pump.status === "active" ? "#22d3ee" : "#0f1f33"} 
                  strokeWidth="3" 
                  fill="none" 
                  strokeDasharray={pump.status === "active" ? "6 6" : "0"} 
                  className={pump.status === "active" ? "animate-pulse" : ""} 
                />
                
                {/* Path from tank to Orchard Hub 7 */}
                <path 
                  d="M188,220 L400,280 L520,290" 
                  stroke={activeTwinComponent === "lines" || pump.status === "active" ? "#22d3ee" : "#0f1f33"} 
                  strokeWidth="2.5" 
                  fill="none" 
                  strokeDasharray={pump.status === "active" ? "4 4" : "0"} 
                />
              </g>

              {/* Greenhouse Crops Area Component */}
              <g 
                onClick={() => setActiveTwinComponent("g14")}
                className="cursor-pointer group"
              >
                <polygon points="300,210 440,210 400,270 260,270" fill={activeTwinComponent === "g14" ? "#064e3b" : "#010805"} stroke={activeTwinComponent === "g14" || selectedSectorId === "sector-G14" ? "#10b981" : "#0c1f14"} strokeWidth="2.5" />
                
                {/* Nodes inside Greenhouse G14 */}
                <circle cx="310" cy="240" r="4.5" fill="#10b981" className="animate-pulse" />
                <circle cx="370" cy="235" r="4.5" fill="#10b981" />
                <circle cx="340" cy="255" r="4.5" fill="#10b981" />

                <text x="340" y="228" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">GREENHOUSE G-14</text>
              </g>

              {/* Orchard Groves Segment Component */}
              <g 
                onClick={() => setActiveTwinComponent("orchard")}
                className="cursor-pointer group"
              >
                <polygon points="460,250 640,250 580,330 400,330" fill={activeTwinComponent === "orchard" ? "#064e40" : "#010807"} stroke={activeTwinComponent === "orchard" || selectedSectorId === "sector-7G" ? "#10b981" : "#0c1f14"} strokeWidth="2" />
                
                {/* Nodes inside Orchard */}
                <circle cx="480" cy="290" r="4" fill="#10b981" />
                <circle cx="540" cy="280" r="4" fill="#10b981" />
                <circle cx="510" cy="310" r="4" fill="#10b981" className="animate-pulse" />

                <text x="520" y="268" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">ORCHARD UNIT 7</text>
              </g>

            </svg>

          </div>

          {/* Interactive display sidebar of selected twin block */}
          <div className="lg:col-span-4 bg-[#03080d]/80 border border-zinc-900 rounded-2xl p-5 space-y-4 shadow-xl min-h-[300px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">SYMBOLS INTERPRETER</span>
                <span className="text-[9px] font-mono text-[#22D3EE] uppercase font-bold animate-pulse">Synchronized</span>
              </div>

              {activeTwinComponent ? (
                <div className="space-y-3 font-bold animate-fade-in text-xs">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/40 text-cyan-300 border border-cyan-805 rounded font-mono text-[9px] uppercase tracking-wider">
                    Twin Module: {activeTwinComponent.toUpperCase()}
                  </div>

                  {activeTwinComponent === "tank" && (
                    <p className="text-zinc-400 font-sans leading-normal">
                      The core reservoir tank tracking {pump.reservoirLevelPercent}% storage limits. Automatically pulsing water channels to root systems through active solenoid transceivers.
                    </p>
                  )}
                  {activeTwinComponent === "solar" && (
                    <p className="text-zinc-400 font-sans leading-normal">
                      High-efficiency silicon solar backplane collecting raw daylight at {battery.solarInputKw} kW. Powers off-grid water pumps and logs telemetry parameters securely.
                    </p>
                  )}
                  {activeTwinComponent === "g14" && (
                    <p className="text-zinc-400 font-sans leading-normal">
                      Greenhouse 14 tracking vine tomatoes and mixed crops. Average hydration index stands at {sectors[0]?.plantHealthIndex || 92}%, governed by automated climate roof ventilation.
                    </p>
                  )}
                  {activeTwinComponent === "orchard" && (
                    <p className="text-zinc-400 font-sans leading-normal">
                      Orchard Groves unit 7 housing dwarf orange crops. Managed on standard water interval profiles to achieve water conservation rate thresholds up to 35%.
                    </p>
                  )}
                  {activeTwinComponent === "lines" && (
                    <p className="text-zinc-400 font-sans leading-normal">
                      Water pressure pipeline indicators. Pump valve states are verified as {pump.status.toUpperCase()} at a pressure of {pump.pressureBar} BAR.
                    </p>
                  )}

                  <div className="space-y-1 pt-2 font-mono text-[10px] text-zinc-550 uppercase">
                    <div className="flex justify-between">
                      <span>Telemetry Code:</span>
                      <span className="text-zinc-300">MOD-{activeTwinComponent.toUpperCase()}-26</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operational Status:</span>
                      <span className="text-emerald-400">Nominal stable</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-650 font-mono leading-normal select-none">
                  &lt; Tap any labeled vector section on the digital twin schematic to inspect telemetry streams in real-time &gt;
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-900/40 font-mono text-[9.5px]">
              <span className="text-zinc-500 uppercase block font-semibold">Active Sector Displayed</span>
              <span className="text-zinc-200 mt-1 block font-bold uppercase">{activeSector.name} ({activeSector.cropType.split(" ")[0]})</span>
            </div>
          </div>

        </div>
      </div>

      {/* DETAILED SENSOR CHIPS GRID & INTERACTIVE OVERRIDES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Sensor Nodes Cards Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-sans font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
              Soil Moisture Nodes Matrix Array
            </h3>
            <span className="text-[10px] font-mono text-zinc-550 border border-zinc-900 bg-zinc-950 p-1 px-3 rounded-lg uppercase tracking-wider font-semibold">
              INDEX STATIONS: {activeSector.nodes.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSector.nodes.map((node) => {
              const isLow = node.soilMoisture < activeSector.moistureThresholdMin;
              const isHigh = node.soilMoisture > activeSector.moistureThresholdMax;

              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  className={`bg-zinc-950/40 backdrop-blur-sm border p-4.5 rounded-2xl cursor-pointer hover:bg-zinc-900/10 hover:border-zinc-800 transition-all duration-300 group relative overflow-hidden shadow-sm ${
                    selectedNode?.id === node.id
                      ? "border-emerald-500/80 ring-1 ring-emerald-500/10 shadow-lg shadow-emerald-950/15"
                      : "border-zinc-900"
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-1.5 h-full transition-all duration-300 ${
                    node.status === "nominal" && !isLow && !isHigh ? "bg-emerald-500/50" : 
                    isLow ? "bg-cyan-500/60 animate-pulse" : "bg-amber-500/60"
                  }`} />

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-zinc-200 flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                        {node.id}
                        <span className="text-[9px] font-normal text-zinc-500 block truncate max-w-[130px] font-sans font-semibold">{node.name}</span>
                      </h4>
                    </div>
                    <span className={`text-[8.5px] font-mono uppercase px-2 py-0.5 rounded border tracking-wide font-bold ${
                      node.status === "nominal" && !isLow && !isHigh
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                    }`}>
                      {isLow ? "Dehydration Low" : isHigh ? "Dampness High" : "Stable"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-zinc-900/60 pt-3 text-center text-xs font-bold font-mono">
                    <div>
                      <span className="text-[8.5px] font-mono text-zinc-555 block mb-1">MOISTURE</span>
                      <span className={`flex items-center justify-center gap-0.5 text-[11px] font-bold ${
                        isLow ? "text-cyan-405 font-bold" : isHigh ? "text-amber-500" : "text-emerald-400"
                      }`}>
                        <Droplets className="w-3.5 h-3.5 fill-current opacity-70 shrink-0" />
                        {node.soilMoisture}%
                      </span>
                    </div>

                    <div className="border-x border-zinc-900/60">
                      <span className="text-[8.5px] font-mono text-zinc-555 block mb-1">TEMP</span>
                      <span className="flex items-center justify-center gap-0.5 text-[11px] font-bold text-zinc-300">
                        <Thermometer className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        {node.temperature}°C
                      </span>
                    </div>

                    <div>
                      <span className="text-[8.5px] font-mono text-zinc-555 block mb-1">ENERGY</span>
                      <span className="flex items-center justify-center gap-0.5 text-[11px] font-bold text-zinc-400">
                        <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {node.solarDose}W
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md text-left">
            <div>
              <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} /> Manual Solenoid Water Override
              </h4>
              <p className="text-xs text-zinc-555 font-bold mt-1">Deliver a quick, gentle water pulse to root systems in the active Greenhouse sector field.</p>
            </div>
            <button
              onClick={() => onTriggerIrrigation(activeSector.id)}
              disabled={pump.status === "active" && pump.currentMode === "intensive"}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:bg-zinc-900 border border-emerald-400/20 disabled:border-zinc-850 text-neutral-950 disabled:text-zinc-600 font-sans text-xs uppercase tracking-widest font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 justify-center md:self-auto shrink-0 shadow-lg"
            >
              Start Watering
            </button>
          </div>
        </div>

        {/* Climate / Rain sensors and Stress simulations sidebar */}
        <div className="space-y-6">
          
          {/* Stress Simulator */}
          <div className="bg-[#03090f]/70 border border-zinc-900 rounded-2xl p-4.5 shadow-xl text-left">
            <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-900 pb-2.5 mb-3.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FBBF24] animate-pulse" />
              WEATHER SIMULATION STRESS LAB
            </h3>
            <p className="text-[11px] font-sans text-zinc-500 mb-4 leading-relaxed font-bold">
              Impose simulated environmental stress models to test ESP32 automatic feedback.
            </p>

            <div className="space-y-2.5 font-mono">
              <button
                onClick={() => handleSimulateStressor("drought")}
                className={`w-full py-2.5 px-4 border rounded-xl text-xs text-left transition-all duration-300 cursor-pointer flex items-center justify-between ${
                  isSimulatingStress === "drought"
                    ? "bg-rose-950/20 border-rose-500 text-rose-400"
                    : "bg-zinc-950/65 border-zinc-900 text-zinc-400 hover:bg-zinc-900/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Simulate Drought Profile
                </span>
                <span className="text-[9px] font-bold">{isSimulatingStress === "drought" ? "ACTIVE" : "OFF"}</span>
              </button>

              <button
                onClick={() => handleSimulateStressor("flood")}
                className={`w-full py-2.5 px-4 border rounded-xl text-xs text-left transition-all duration-300 cursor-pointer flex items-center justify-between ${
                  isSimulatingStress === "flood"
                    ? "bg-cyan-950/20 border-cyan-500 text-cyan-400"
                    : "bg-zinc-950/65 border-zinc-900 text-zinc-400 hover:bg-zinc-900/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-405" />
                  Simulate Flood Irrigation
                </span>
                <span className="text-[9px] font-bold">{isSimulatingStress === "flood" ? "ACTIVE" : "OFF"}</span>
              </button>

              <button
                onClick={() => handleSimulateStressor("heat")}
                className={`w-full py-2.5 px-4 border rounded-xl text-xs text-left transition-all duration-300 cursor-pointer flex items-center justify-between ${
                  isSimulatingStress === "heat"
                    ? "bg-amber-950/20 border-amber-500 text-amber-400"
                    : "bg-zinc-950/65 border-zinc-900 text-zinc-400 hover:bg-zinc-900/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-[#FBBF24]" />
                  Simulate Intense Heatwave
                </span>
                <span className="text-[9px] font-bold">{isSimulatingStress === "heat" ? "ACTIVE" : "OFF"}</span>
              </button>
            </div>

            {isSimulatingStress && (
              <div className="mt-3.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[9.5px] font-mono text-red-400 animate-pulse text-center font-bold uppercase tracking-wide">
                WARNING: Simulation overrides active on remote sensors...
              </div>
            )}
          </div>

          {/* Reading inspector */}
          <div className="bg-[#03090f]/70 border border-zinc-900 rounded-2xl p-4.5 shadow-xl text-left">
            <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-900 pb-2.5 mb-3 flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-emerald-400" />
              SENSOR REALTIME INSPECT
            </h3>
            {selectedNode ? (
              <div className="space-y-3.5 font-bold animate-fade-in">
                <div className="flex justify-between items-center bg-zinc-900/30 p-2 border border-zinc-900 rounded-lg">
                  <span className="text-xs font-mono font-bold text-emerald-405">{selectedNode.id}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">ONLINE FEED</span>
                </div>

                <div className="space-y-2 text-xs font-mono font-bold">
                  <div className="flex justify-between text-zinc-555">
                    <span>Node Label:</span>
                    <span className="text-zinc-300 font-sans">{selectedNode.name}</span>
                  </div>
                  <div className="flex justify-between text-zinc-555">
                    <span>Soil Humidity:</span>
                    <span className="text-zinc-200 font-bold">{selectedNode.soilMoisture}%</span>
                  </div>
                  <div className="flex justify-between text-zinc-555">
                    <span>Temperature:</span>
                    <span className="text-zinc-200 font-bold">{selectedNode.temperature}°C</span>
                  </div>
                  <div className="flex justify-between text-zinc-555">
                    <span>Sunlight Dose:</span>
                    <span className="text-zinc-200 font-bold">{selectedNode.solarDose} W/m²</span>
                  </div>
                  <div className="flex justify-between text-zinc-555 font-bold">
                    <span>Sensor Status:</span>
                    <span className="text-emerald-400 uppercase font-semibold">{selectedNode.status}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-900/60 pt-3 mt-1.5 flex items-center justify-between gap-2.5 font-mono">
                  <button 
                    onClick={() => onModifyNodeMoisture(activeSector.id, selectedNode.id, parseFloat((selectedNode.soilMoisture + 5).toFixed(1)))}
                    className="flex-1 py-2 px-1 hover:border-emerald-500/25 bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 text-zinc-300 text-[10px] uppercase rounded-lg text-center font-bold tracking-wider transition-all cursor-pointer"
                  >
                    +5% Water
                  </button>
                  <button 
                    onClick={() => onModifyNodeMoisture(activeSector.id, selectedNode.id, parseFloat((selectedNode.soilMoisture - 5).toFixed(1)))} 
                    className="flex-1 py-2 px-1 hover:border-rose-500/25 bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 text-zinc-300 text-[10px] uppercase rounded-lg text-center font-bold tracking-wider transition-all cursor-pointer"
                  >
                    -5% Dry
                  </button>
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-[10.5px] font-mono text-zinc-600 font-bold leading-normal">
                &lt; Choose any soil node checkbox card on the left to display hardware telemetry parameters &gt;
              </p>
            )}
          </div>

          {/* Automated climate ventilator */}
          <div className="bg-[#03090f]/70 border border-zinc-900 rounded-2xl p-4.5 shadow-xl text-left space-y-3.5">
            <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-900 pb-2.5 mb-2 flex items-center gap-1.5">
              <CloudSun className="w-4.5 h-4.5 text-cyan-405" />
              Automated Climate Ventilator
            </h3>

            {/* Status indicators row */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="bg-zinc-900/40 p-2.5 border border-zinc-900/60 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] text-zinc-500 font-semibold uppercase block">WATER DROP SENSOR</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isRainDetected ? "bg-cyan-400 animate-ping" : "bg-zinc-700"}`} />
                  <span className={`text-[10px] font-bold ${isRainDetected ? "text-cyan-400" : "text-zinc-500"}`}>
                    {isRainDetected ? "RAIN DETECTION" : "SHIELD CLEAR"}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/40 p-2.5 border border-zinc-900/60 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] text-zinc-505 font-semibold uppercase block">ACTUATOR ROOF</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${roofState === "Open" ? "bg-emerald-400" : "bg-amber-500"}`} />
                  <span className="text-[10px] font-bold text-zinc-200">
                    {roofState.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actuators control buttons */}
            <div className="space-y-2 font-mono">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const nextMode = roofControlMode === "Auto" ? "Manual" : "Auto";
                    setRoofControlMode(nextMode);
                    if (nextMode === "Auto" && isRainDetected) {
                      setRoofState("Closed");
                    }
                  }}
                  className={`flex-1 py-2 px-1 border text-[10px] uppercase rounded-xl text-center font-bold transition-all cursor-pointer select-none ${
                    roofControlMode === "Auto" 
                      ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800" 
                      : "bg-amber-950/20 border-amber-850 text-amber-500"
                  }`}
                >
                  Mode: {roofControlMode === "Auto" ? "AUTO" : "MANUAL"}
                </button>

                <button
                  onClick={() => {
                    if (roofControlMode === "Auto") return;
                    setRoofState(roofState === "Open" ? "Closed" : "Open");
                  }}
                  disabled={roofControlMode === "Auto"}
                  className="flex-1 py-2 px-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-800 text-zinc-300 text-[10px] uppercase rounded-xl text-center font-bold tracking-wide transition-all cursor-pointer"
                >
                  ACTUATOR: {roofState === "Open" ? "CLOSE" : "OPEN"}
                </button>
              </div>

              {/* Rain simulation trigger */}
              <button
                onClick={() => {
                  const rain = !isRainDetected;
                  setIsRainDetected(rain);
                  if (rain && roofControlMode === "Auto") {
                    setRoofState("Closed");
                  }
                }}
                className={`w-full py-2.5 px-4 border rounded-xl text-[10.5px] transition-all cursor-pointer flex items-center justify-between ${
                  isRainDetected 
                    ? "bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                    : "bg-zinc-950/65 border-zinc-900 text-zinc-400 hover:bg-zinc-900/40"
                }`}
              >
                <span>🌧️ Simulate Ambient Rain</span>
                <span className="text-[9px] font-bold">{isRainDetected ? "ACTIVE" : "OFF"}</span>
              </button>
            </div>

            {/* Emergency Valve Pulsing Overlay Trigger */}
            <button
              onClick={() => {
                onTriggerIrrigation(activeSector.id);
              }}
              className="w-full py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-neutral-950 text-rose-400 text-[9.5px] font-mono font-bold uppercase rounded-xl tracking-wider cursor-pointer transition-all active:scale-95 text-center block"
            >
              🚨 EMERGENCY WATERING VALVE ACTION SEQUENCE
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
