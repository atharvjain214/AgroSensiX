import React, { useState } from "react";
import { historical24hData } from "../mockData";
import { CustomChart } from "./CustomChart";
import { 
  BarChart, 
  TrendingUp, 
  Cpu, 
  Layers, 
  ArrowUpRight,
  TrendingDown
} from "lucide-react";

export const AnalyticsView: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState<"G14" | "7G">("G14");
  const [metricTab, setMetricTab] = useState<"soil" | "climate" | "solar" | "tank" | "irrigation">("soil");

  const linesToDraw = {
    soil: [
      {
        key: selectedSector === "G14" ? "soilMoistureG14" : "soilMoisture7G",
        color: "#10b981",
        name: `${selectedSector === "G14" ? "Greenhouse 14" : "Orchard Hub 7"} Soil Moisture (%)`,
        strokeWidth: 2.5
      }
    ],
    climate: [
      {
        key: "ambientTempC",
        color: "#f97316",
        name: "Air Temperature (°C)",
        strokeWidth: 2
      },
      {
        key: "airHumidityPct",
        color: "#3b82f6",
        name: "Air Humidity (%)",
        strokeWidth: 2
      }
    ],
    solar: [
      {
        key: "solarHarvestKw",
        color: "#f59e0b",
        name: "Solar Energy Harvested (kW)",
        strokeWidth: 2.2
      }
    ],
    tank: [
      {
        key: "reservoirLevelPercent",
        color: "#06b6d4",
        name: "Water Tank Level (%)",
        strokeWidth: 2.5
      }
    ],
    irrigation: [
      {
        key: "irrigationUsedLiters",
        color: "#3b82f6",
        name: "Irrigation Flow Dispensed (Liters)",
        strokeWidth: 2.5
      }
    ]
  };

  const getMetricTitle = () => {
    switch (metricTab) {
      case "soil": return "24-Hour Soil Moisture History";
      case "climate": return "24-Hour Temperature & Humidity Records";
      case "solar": return "Solar Energy Production History";
      case "tank": return "Water Tank Capacity History";
      case "irrigation": return "Water Dispersion History (Liters)";
    }
  };

  const getYLabel = () => {
    switch (metricTab) {
      case "soil": return "%";
      case "climate": return "";
      case "solar": return "kW";
      case "tank": return "%";
      case "irrigation": return "L";
    }
  };

  // Static Matrix data for the crop Yield Prediction
  const yieldFactors = [
    { name: "Sunlight Exposure", status: "Optimal", impact: "+12.4%", value: "32.8 mol/m²/day", positive: true },
    { name: "Soil Root Temperature", status: "Nominal", impact: "+4.1%", value: "24.1°C Mean", positive: true },
    { name: "Water Pressure Interval", status: "Too Dry", impact: "-3.5%", value: "Under watered Greenhouse 14", positive: false },
    { name: "Soil Nutrient Level", status: "Stable", impact: "+2.8%", value: "1.8 mS/cm EC", positive: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Top Selector Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900/60 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <BarChart className="w-5 h-5 text-emerald-400" />
            Weather & Environment Analytics
          </h2>
          <p className="text-xs font-mono text-zinc-500 font-bold">
            Detailed records of soil moisture, weather, and estimated harvest improvements.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sector selector */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value as "G14" | "7G")}
            className="bg-zinc-950 border border-zinc-900/80 rounded-xl text-xs font-mono text-zinc-300 py-2 px-4.5 focus:outline-none focus:border-emerald-555 cursor-pointer shadow-md select-none"
          >
            <option value="G14">Greenhouse 14 (Mixed Crops)</option>
            <option value="7G">Orchard Hub 7 (Dwarf Oranges)</option>
          </select>

          {/* Quick metric select buttons */}
          <div className="bg-zinc-950 p-1.5 rounded-xl border border-zinc-900 flex flex-wrap gap-1 shadow-inner select-none">
            <button
              onClick={() => setMetricTab("soil")}
              className={`px-3 py-1.5 text-[10px] font-mono rounded-lg cursor-pointer border ${
                metricTab === "soil" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)]" 
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              }`}
            >
              SOIL MOISTURE
            </button>
            <button
              onClick={() => setMetricTab("tank")}
              className={`px-3 py-1.5 text-[10px] font-mono rounded-lg cursor-pointer border ${
                metricTab === "tank" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)]" 
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              }`}
            >
              WATER TANK
            </button>
            <button
              onClick={() => setMetricTab("climate")}
              className={`px-3 py-1.5 text-[10px] font-mono rounded-lg cursor-pointer border ${
                metricTab === "climate" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)]" 
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              }`}
            >
              TEMPERATURE
            </button>
            <button
              onClick={() => setMetricTab("irrigation")}
              className={`px-3 py-1.5 text-[10px] font-mono rounded-lg cursor-pointer border ${
                metricTab === "irrigation" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)]" 
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              }`}
            >
              IRRIGATION
            </button>
            <button
              onClick={() => setMetricTab("solar")}
              className={`px-3 py-1.5 text-[10px] font-mono rounded-lg cursor-pointer border ${
                metricTab === "solar" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)]" 
                  : "text-zinc-500 hover:text-zinc-300 border-transparent"
              }`}
            >
              SOLAR PRODUCTION
            </button>
          </div>
        </div>
      </div>

      {/* Custom Reusable Chart Canvas layout */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/45 p-4.5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <CustomChart
          data={historical24hData}
          xAxisKey="time"
          lines={linesToDraw[metricTab]}
          title={getMetricTitle()}
          yLabel={getYLabel()}
        />
      </div>

      {/* Bottom Insights Section: Matrix & Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Yield Prediction Matrix */}
        <div className="lg:col-span-2 bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3 mb-4.5">
            <h3 className="text-sm font-sans font-semibold text-zinc-350 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
              Estimated Harvest Improvement Model
            </h3>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full text-emerald-450 font-mono text-[9.5px] uppercase font-bold tracking-wider">
              Confidence Score: 94%
            </span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed mb-4.5 font-bold">
            By analyzing current soil and weather trends, the system predicts a positive impact on your harvest:
          </p>

          <div className="space-y-3 font-bold">
            {yieldFactors.map((factor, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-950/65 p-3.5 rounded-xl border border-zinc-900/80 flex justify-between items-center hover:bg-zinc-900/30 hover:border-emerald-500/20 transition-all duration-300"
              >
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">{factor.name}</h4>
                  <span className={`text-[10px] font-mono flex items-center gap-2 mt-1 ${
                    factor.positive ? "text-emerald-455" : "text-amber-500"
                  }`}>
                    Value: {factor.value} • Status: {factor.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold font-mono tracking-tight flex items-center gap-1 ${
                    factor.positive ? "text-emerald-400" : "text-amber-500"
                  }`}>
                    {factor.positive ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-amber-500" />
                    )}
                    {factor.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Aggregated Predicted yield sum */}
          <div className="mt-6 border-t border-zinc-900 pt-5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
            <div>
              <span className="text-[9.5px] text-zinc-505 block uppercase tracking-wider font-semibold">TOTAL PROJECTED BENEFIT</span>
              <span className="text-xs text-zinc-500">Estimated crop improvements compared to a standard baseline season:</span>
            </div>
            <div className="bg-emerald-500/10 px-4.5 py-2.5 border border-emerald-500/20 text-emerald-400 rounded-xl text-right font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-400 animate-bounce" />
              <span className="text-xs uppercase tracking-wide font-sans font-bold">+15.8% Est. Better Crops & Water Saved</span>
            </div>
          </div>
        </div>

        {/* Intelligence Briefing */}
        <div className="space-y-6">
          <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest border-b border-zinc-900 pb-2.5 mb-3.5 flex items-center gap-1.5 font-bold">
                <Layers className="w-4 h-4 text-emerald-400" />
                Farmer Tips & Insights
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed space-y-4 font-bold">
                <span className="block mb-2">
                  At current root soil moisture levels (around **42.5%** in Greenhouse 14), the tomato plants are getting the perfect amount of water. Their leaves are open, healthy, and growing strong.
                </span>
                <span className="block font-bold">
                  However, Orchard Hub 7 soil moisture has dropped below **30%**. If this is not resolved, the developing oranges could dry out within a day. Please increase watering timers or trigger a manual watering session for Orchard Hub 7.
                </span>
              </p>
            </div>

            <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-900/80 text-[10px] font-mono text-zinc-450 mt-5 shadow-inner">
              <span className="text-emerald-455 font-bold block uppercase tracking-wider mb-1">FARM HEALTH SUMMARY</span>
              Crop moisture status is registering at <span className="text-emerald-400 font-bold">97.1 (Extremely Stable)</span>.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
