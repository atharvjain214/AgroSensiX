import React, { useState } from "react";
import { Cpu, Server, Database, Sparkles, CheckCircle, Network, Code, Globe } from "lucide-react";

export const BlueprintView: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const systemComponents = [
    {
      id: 1,
      name: "SMART FIELD SENSORS",
      role: "Solar-powered soil sensors. Measures underground soil moisture, air temperature, and air humidity. Highly accurate and powered completely by the sun.",
      icon: Cpu,
      status: "NOMINAL",
      pos: "Field Zone"
    },
    {
      id: 2,
      name: "WATER VALVE CONTROLLER",
      role: "Connects your farm sensors together. Automatically controls water valve switching, timers, and monitors pipes for pressure spikes.",
      icon: Network,
      status: "ACTIVE",
      pos: "Valve Zone"
    },
    {
      id: 3,
      name: "CENTRAL DATABASE SYSTEM",
      role: "Coordinates clean data delivery. Safely records and caches soil moisture, sensor status, and weather trends to show on your dashboard.",
      icon: Server,
      status: "STABLE",
      pos: "Server Core"
    },
    {
      id: 4,
      name: "GEMINI AI ASSISTANT",
      role: "Powered by Gemini AI model. Provides instant crop tips, warning alerts, and recommends smart watering schedules.",
      icon: Sparkles,
      status: "NOMINAL",
      pos: "AI Cloud Brain"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4.5">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-450" />
            System Diagram
          </h2>
          <p className="text-xs font-mono text-zinc-500 font-bold">
            A clear diagram showing how your sensors, valve controllers, database, and AI assistant connect with each other.
          </p>
        </div>

        <div className="text-[9.5px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-mono px-3.5 py-1.5 rounded-xl uppercase tracking-wider select-none font-semibold self-start md:self-auto">
          ALL SYSTEMS: OPERATIONAL (OK)
        </div>
      </div>

      {/* SVG Loop Map */}
      <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest mb-6 relative z-10 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-405 shrink-0 animate-pulse" />
          Interactive Connection Diagram
        </h3>

        {/* Visual SVG Scheme */}
        <div className="w-full max-w-4xl mx-auto overflow-hidden relative z-10 py-6">
          <svg viewBox="0 0 800 280" className="w-full h-auto overflow-visible select-none">
            {/* Definitions for gradient indicators */}
            <defs>
              <linearGradient id="glow-edge" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="glow-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Backplane Connections & Data Lines */}
            <path
              d="M 120 140 H 280 M 360 140 H 520 M 600 140 H 680"
              stroke="#182c2e"
              strokeWidth={2}
              strokeDasharray="5,5"
              fill="none"
            />

            {/* Dynamic Animated Glowing Data Line (Edge Processor to Cloud Server) */}
            <line
              x1="120"
              y1="140"
              x2="280"
              y2="140"
              stroke="url(#glow-edge)"
              strokeWidth={2}
              className="animate-pulse"
            />
            <line
              x1="360"
              y1="140"
              x2="480"
              y2="140"
              stroke="url(#glow-cyan)"
              strokeWidth={2.5}
            />
            <line
              x1="520"
              y1="140"
              x2="680"
              y2="140"
              stroke="#10b981"
              strokeWidth={1.5}
            />

            {/* Step Node 1: SENSORS */}
            <g 
              className="cursor-pointer group" 
              onClick={() => setActiveStep(1)}
              onMouseEnter={() => setActiveStep(1)}
            >
              <rect x="20" y="80" width="100" height="120" rx="12" fill="#030708" stroke={activeStep === 1 ? "#10b981" : "#132326"} strokeWidth={2} />
              <circle cx="70" cy="120" r="18" fill="#091b1d" />
              <text x="70" y="125" textAnchor="middle" fill="#10b981" fontWeight="bold" fontSize="14.5" className="font-mono">SEN</text>
              <text x="70" y="170" textAnchor="middle" fill="#a1a1aa" fontSize="12.25" className="font-semibold font-sans">SENSORS</text>
              <text x="70" y="184" textAnchor="middle" fill="#3f3f46" fontSize="10" className="font-mono">[STEP 1]</text>
            </g>

            {/* Step Node 2: WATER VALVES */}
            <g 
              className="cursor-pointer" 
              onClick={() => setActiveStep(2)}
              onMouseEnter={() => setActiveStep(2)}
            >
              <rect x="260" y="80" width="100" height="120" rx="12" fill="#030708" stroke={activeStep === 2 ? "#06b6d4" : "#132326"} strokeWidth={2} />
              <circle cx="310" cy="120" r="18" fill="#091b1e" />
              <text x="310" y="125" textAnchor="middle" fill="#06b6d4" fontWeight="bold" fontSize="14.5" className="font-mono font-bold">VALVES</text>
              <text x="310" y="170" textAnchor="middle" fill="#a1a1aa" fontSize="11.25" className="font-semibold font-sans">VALVE BOARD</text>
              <text x="310" y="184" textAnchor="middle" fill="#3f3f46" fontSize="10" className="font-mono">[STEP 2]</text>
            </g>

            {/* Step Node 3: DATABASE */}
            <g 
              className="cursor-pointer" 
              onClick={() => setActiveStep(3)}
              onMouseEnter={() => setActiveStep(3)}
            >
              <rect x="500" y="80" width="100" height="120" rx="12" fill="#030708" stroke={activeStep === 3 ? "#3b82f6" : "#132326"} strokeWidth={2} />
              <circle cx="550" cy="120" r="18" fill="#071524" />
              <text x="550" y="125" textAnchor="middle" fill="#3b82f6" fontWeight="bold" fontSize="14.5" className="font-mono">DB</text>
              <text x="550" y="170" textAnchor="middle" fill="#a1a1aa" fontSize="12.25" className="font-semibold font-sans">DATABASE</text>
              <text x="550" y="184" textAnchor="middle" fill="#3f3f46" fontSize="10" className="font-mono">[STEP 3]</text>
            </g>

            {/* Step Node 4: GEMINI AI */}
            <g 
              className="cursor-pointer" 
              onClick={() => setActiveStep(4)}
              onMouseEnter={() => setActiveStep(4)}
            >
              <rect x="680" y="80" width="100" height="120" rx="12" fill="#030708" stroke={activeStep === 4 ? "#a855f7" : "#132326"} strokeWidth={2} />
              <circle cx="730" cy="120" r="18" fill="#1b0c26" />
              <text x="730" y="125" textAnchor="middle" fill="#a855f7" fontWeight="bold" fontSize="14.5" className="font-mono">GEM</text>
              <text x="730" y="170" textAnchor="middle" fill="#a1a1aa" fontSize="12.25" className="font-semibold font-sans">AI ASSISTANT</text>
              <text x="730" y="184" textAnchor="middle" fill="#3f3f46" fontSize="10" className="font-mono">[STEP 4]</text>
            </g>
          </svg>
        </div>

        {/* Dynamic Detail Panel explaining the hovered loop step */}
        <div className="mt-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-xl p-4.5 min-h-[100px] flex items-start gap-4">
          {activeStep ? (
            <>
              {(() => {
                const step = systemComponents.find((s) => s.id === activeStep);
                if (!step) return null;
                const IconComponent = step.icon;

                return (
                  <>
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
                      <IconComponent className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1.5 flex-1 text-left">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <h4 className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wide">{step.name}</h4>
                        <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full text-emerald-400 uppercase tracking-widest font-semibold self-start sm:self-auto">
                          {step.pos} • {step.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed font-bold">{step.role}</p>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="w-full text-center py-5 text-xs font-mono text-zinc-650 uppercase tracking-widest select-none leading-relaxed">
              &lt;Hover over or tap any block in the diagram above to learn how it works&gt;
            </div>
          )}
        </div>

      </div>

      {/* Technical Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[11px] leading-relaxed">
        
        <div className="bg-zinc-950/45 border border-zinc-900 rounded-2xl p-5 shadow-xl text-left">
          <h4 className="text-xs text-zinc-300 font-bold border-b border-zinc-900 pb-2 mb-3 uppercase flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-455" />
            Field Sensor Hardware Specifications
          </h4>
          <ul className="space-y-2.5 text-zinc-500 font-bold">
            <li>• Processor: Standard ESP32 ultra-low power dual-core processor chip.</li>
            <li>• Wireless Connection: Secure 915Mhz long-range farm wireless connection.</li>
            <li>• Power Source: Rechargeable durable long-life battery. Automatically charged by a built-in solar panel.</li>
            <li>• Soil Sensors: Non-corrosive precise moisture meters designed for outdoor field environments.</li>
          </ul>
        </div>

        <div className="bg-zinc-950/45 border border-zinc-900 rounded-2xl p-5 shadow-xl text-left">
          <h4 className="text-xs text-zinc-300 font-bold border-b border-zinc-900 pb-2 mb-3 uppercase flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-455" />
            Farming Platform Software Tech
          </h4>
          <ul className="space-y-2.5 text-zinc-500 font-bold">
            <li>• User Interface: Modern, responsive web app styled with simple Tailwind CSS.</li>
            <li>• Central Server: Reliable and lightweight Node.js/Express server.</li>
            <li>• Smart Brain: Guided by Gemini AI to suggest customized watering solutions and answer questions.</li>
            <li>• Durable Logging: Automatically saves local setting data in your browser so you do not lose it.</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
