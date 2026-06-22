import React, { useState } from "react";
import { 
  Droplet, 
  Zap, 
  Sun, 
  Leaf, 
  Compass, 
  CheckCircle, 
  ArrowUpRight, 
  Sparkle,
  Bookmark,
  Award
} from "lucide-react";

export const ImpactView: React.FC = () => {
  const [impactTimeframe, setImpactTimeframe] = useState<"month" | "season" | "total">("season");

  // Dynamic values depending on selected timeframe
  const metrics = {
    month: {
      waterSaved: 8450,
      electricitySaved: 95,
      solarGenerated: 320,
      carbonReduction: 78,
      irrigationCycles: 34,
      cropsProtected: 1200,
    },
    season: {
      waterSaved: 34250,
      electricitySaved: 420,
      solarGenerated: 1280,
      carbonReduction: 310,
      irrigationCycles: 112,
      cropsProtected: 2400,
    },
    total: {
      waterSaved: 118400,
      electricitySaved: 1540,
      solarGenerated: 4850,
      carbonReduction: 1220,
      irrigationCycles: 489,
      cropsProtected: 2400,
    }
  };

  const active = metrics[impactTimeframe];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Absolute floating blurred background accent lights */}
      <div className="absolute top-[30%] right-[15%] w-60 h-60 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[25%] left-[10%] w-72 h-72 bg-teal-500/5 rounded-full blur-[110px] pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900/60 pb-5">
        <div>
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold mb-2">
            <Award className="w-3.5 h-3.5" /> Sustainable Resource Tracking
          </span>
          <h2 className="text-xl md:text-2xl font-sans font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
            Our Environmental Impact
          </h2>
          <p className="text-xs font-mono text-zinc-500 font-bold">
            Real-time calculations of resource conservation, solar independence, and crop safety scores.
          </p>
        </div>

        {/* Timeframe buttons */}
        <div className="bg-zinc-950 p-1.5 rounded-xl border border-zinc-900 flex gap-1 shadow-inner select-none self-start md:self-auto font-mono text-[9px]">
          <button
            onClick={() => setImpactTimeframe("month")}
            className={`px-3.5 py-2 rounded-lg cursor-pointer uppercase font-bold transition-all ${
              impactTimeframe === "month" 
                ? "bg-emerald-500 text-neutral-950 shadow-md" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setImpactTimeframe("season")}
            className={`px-3.5 py-2 rounded-lg cursor-pointer uppercase font-bold transition-all ${
              impactTimeframe === "season" 
                ? "bg-emerald-500 text-neutral-950 shadow-md" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            This Season
          </button>
          <button
            onClick={() => setImpactTimeframe("total")}
            className={`px-3.5 py-2 rounded-lg cursor-pointer uppercase font-bold transition-all ${
              impactTimeframe === "total" 
                ? "bg-emerald-500 text-neutral-950 shadow-md" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Primary Impact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Water Saved Card */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between h-52 hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-sky-500/10 transition-all duration-350" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400 shrink-0">
              <Droplet className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-900 text-sky-400 px-2.5 py-1 rounded-md uppercase tracking-wide font-bold">RESOURCE</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-555 block uppercase tracking-widest font-bold">TOTAL WATER SAVED</span>
            <div className="text-3xl font-bold font-mono text-zinc-100 tracking-tight mt-1 flex items-baseline gap-1.5">
              {active.waterSaved.toLocaleString()} <span className="text-sm font-sans font-semibold text-zinc-500">Liters</span>
            </div>
            <p className="text-[10px] text-zinc-555 font-bold mt-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Save of ~35% over static timers
            </p>
          </div>
        </div>

        {/* Solar Energy Generated Card */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between h-52 hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-amber-500/10 transition-all duration-350" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 shrink-0">
              <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-900 text-amber-400 px-2.5 py-1 rounded-md uppercase tracking-wide font-bold">SOLAR</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-555 block uppercase tracking-widest font-bold">SOLAR HARVEST</span>
            <div className="text-3xl font-bold font-mono text-zinc-100 tracking-tight mt-1 flex items-baseline gap-1.5">
              {active.solarGenerated.toLocaleString()} <span className="text-sm font-sans font-semibold text-zinc-500">kWh</span>
            </div>
            <p className="text-[10px] text-zinc-555 font-bold mt-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> 100% off-grid clean energy
            </p>
          </div>
        </div>

        {/* Electricity Saved Card */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between h-52 hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-350" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-900 text-emerald-400 px-2.5 py-1 rounded-md uppercase tracking-wide font-bold">POWER SAVED</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-555 block uppercase tracking-widest font-bold">ELECTRICITY CONSERVED</span>
            <div className="text-3xl font-bold font-mono text-zinc-100 tracking-tight mt-1 flex items-baseline gap-1.5">
              {active.electricitySaved.toLocaleString()} <span className="text-sm font-sans font-semibold text-zinc-500">kWh</span>
            </div>
            <p className="text-[10px] text-zinc-555 font-bold mt-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Grid power draw reduced to zero
            </p>
          </div>
        </div>

        {/* Estimated Carbon Reduction Card */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between h-52 hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-teal-500/10 transition-all duration-350" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-teal-405 shrink-0">
              <Leaf className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-900 text-teal-450 px-2.5 py-1 rounded-md uppercase tracking-wide font-bold">ECOLOGY</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-555 block uppercase tracking-widest font-bold">ESTEMATED CARBON REDUCTION</span>
            <div className="text-3xl font-bold font-mono text-zinc-100 tracking-tight mt-1 flex items-baseline gap-1.5">
              {active.carbonReduction.toLocaleString()} <span className="text-sm font-sans font-semibold text-zinc-500">kg CO₂</span>
            </div>
            <p className="text-[10px] text-zinc-555 font-bold mt-1.5 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Equivalent to planting 20 trees
            </p>
          </div>
        </div>

        {/* Irrigation Cycles Completed Card */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between h-52 hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/10 transition-all duration-350" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-900 text-purple-400 px-2.5 py-1 rounded-md uppercase tracking-wide font-bold">OPERATIONS</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-555 block uppercase tracking-widest font-bold">WATERING CYCLES RUN</span>
            <div className="text-3xl font-bold font-mono text-zinc-100 tracking-tight mt-1 flex items-baseline gap-1.5">
              {active.irrigationCycles.toLocaleString()} <span className="text-sm font-sans font-semibold text-zinc-500">Cycles</span>
            </div>
            <p className="text-[10px] text-zinc-555 font-bold mt-1.5 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Controlled pulsing via soil probes
            </p>
          </div>
        </div>

        {/* Crops Protected Card */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between h-52 hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-rose-500/10 transition-all duration-350" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 shrink-0">
              <Sparkle className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-900 text-rose-400 px-2.5 py-1 rounded-md uppercase tracking-wide font-bold">ASSETS</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-555 block uppercase tracking-widest font-bold">TOTAL CROPS SECURED</span>
            <div className="text-3xl font-bold font-mono text-zinc-100 tracking-tight mt-1 flex items-baseline gap-1.5">
              {active.cropsProtected.toLocaleString()} <span className="text-sm font-sans font-semibold text-zinc-500">Plants</span>
            </div>
            <p className="text-[10px] text-zinc-555 font-bold mt-1.5 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Protected from root-rot and dryouts
            </p>
          </div>
        </div>

      </div>

      {/* Narrative Section */}
      <div className="bg-zinc-950/30 border border-zinc-900 p-6 md:p-8 rounded-3xl flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="space-y-2 max-w-xl text-left">
          <h4 className="text-sm font-sans font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
            <Bookmark className="w-4.5 h-4.5 text-emerald-405" /> Sustainable Smart Farming Philosophy
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed font-bold">
            Classic field-watering can waste up to 40% of the water through pooling and evaporation. AgroSensiX solves this waste by using direct root soil moisture sensors, shutting off valves the absolute minute root dampness hits the plant's optimal line. Powered entirely by offgrid solar systems, we minimize carbon draws while fully securing crop safety.
          </p>
        </div>
        <div className="bg-emerald-500/15 border border-emerald-500/25 p-5 rounded-2xl text-center md:text-left shrink-0 font-mono text-[11px] max-w-sm uppercase text-emerald-400 font-bold">
          🌱 Certified Sustainable Agriculture Model Approved for State Environmental Subsidies.
        </div>
      </div>
      
    </div>
  );
};
