import React from "react";
import { Sprout, Sun, Droplets, LineChart, Shield, Cpu, BookOpen, Atom, Users } from "lucide-react";

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-10 animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="border-b border-zinc-900 pb-4.5">
        <h2 className="text-xl md:text-2xl font-sans font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-450" />
          The Method Behind Smart Farming
        </h2>
        <p className="text-xs font-mono text-zinc-555">
          AgroSensiX principles, our farming team experience, and our mission for modern agriculture.
        </p>
      </div>

      {/* Grid: Robust side-by-side split row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-zinc-950/45 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Left side: narrative */}
        <div className="lg:col-span-7 p-6 md:p-10 space-y-5 flex flex-col justify-center relative z-10">
          <span className="inline-flex items-center gap-1.5 text-[9.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono px-3.5 py-1 rounded-full uppercase tracking-widest font-semibold self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Our Core Mission
          </span>
          <h3 className="text-2xl font-sans font-bold text-zinc-100 tracking-tight leading-snug uppercase">
            Root-Zone Soil Monitoring and Smart Watering Cycles
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed font-sans">
            AgroSensiX was founded to bridge the gap between classic farming experience and modern, easy-to-use watering technology. By integrating durable sensors directly inside the root zone, we track soil moisture in real-time.
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans">
            This continuous stream of soil indicators is analyzed by our system to coordinate gentle, exact watering schedules when crops begin to dry out. The result is a major savings in water consumption, healthy roots, and a much better harvest.
          </p>
        </div>

        {/* Right side: large stock image */}
        <div className="lg:col-span-5 h-[320px] lg:h-auto min-h-[300px] relative bg-neutral-900 border-t lg:border-t-0 lg:border-l border-zinc-900/60">
          <img 
            src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=850" 
            alt="Soil sensor installed in farmland" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-zinc-950 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Meet our Team and Field Experts */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2.5 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Our Farming & Agricultural Team</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Scientist 1 Component */}
          <div className="bg-zinc-950/45 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-800 transition-all duration-300 flex flex-col sm:flex-row h-full">
            <div className="sm:w-2/5 h-48 sm:h-auto min-h-[160px] relative bg-neutral-900 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=400" 
                alt="Elena Vance" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-zinc-950/90 to-transparent pointer-events-none" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center">
              <div className="space-y-1 mb-3">
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Farming Lead
                </span>
                <h4 className="text-sm font-sans font-bold text-zinc-200">Dr. Elena Vance</h4>
                <p className="text-[10px] font-mono text-zinc-555 uppercase">Stanford Plant Biology PhD</p>
              </div>
              <p className="text-[11px] font-sans text-zinc-400 leading-relaxed">
                Supervises how sensor readings match real crop water needs. Elena is responsible for designing the systems that calculate leaf spot, mold, and plant disease risks.
              </p>
            </div>
          </div>

          {/* Specialist 2 Component */}
          <div className="bg-zinc-950/45 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-800 transition-all duration-300 flex flex-col sm:flex-row h-full">
            <div className="sm:w-2/5 h-48 sm:h-auto min-h-[160px] relative bg-neutral-900 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1550147760-44c9966d6bc7?auto=format&fit=crop&q=80&w=400" 
                alt="Marcus Thorne" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-zinc-950/90 to-transparent pointer-events-none" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center">
              <div className="space-y-1 mb-3">
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Farming Specialist
                </span>
                <h4 className="text-sm font-sans font-bold text-zinc-200">Marcus Thorne</h4>
                <p className="text-[10px] font-mono text-zinc-555 uppercase">Third-Gen Certified Agriculturist</p>
              </div>
              <p className="text-[11px] font-sans text-zinc-400 leading-relaxed">
                Manages Greenhouse 14 field tests. Marcus ensures the automatic water pumps are calibrated for physical farm tasks and sandy-loam soil drainage.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Structured core values grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Core Value 1 */}
        <div className="bg-zinc-950/40 backdrop-blur-sm border border-zinc-900/80 p-5 rounded-2xl space-y-3.5 text-left hover:border-emerald-500/20 transition-all duration-300">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-max">
            <Cpu className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">High-Accuracy Sensors</h4>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans">
            Measuring precise soil moisture values without metal deterioration, rust, mineral buildup, or salt drift.
          </p>
        </div>

        {/* Core Value 2 */}
        <div className="bg-zinc-950/40 backdrop-blur-sm border border-zinc-900/80 p-5 rounded-2xl space-y-3.5 text-left hover:border-emerald-500/20 transition-all duration-300">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-max">
            <Sun className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">100% Solar Powered</h4>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans font-bold">
            Completely off-grid water systems powered by solar energy, charging powerful batteries without requiring manual oversight.
          </p>
        </div>

        {/* Core Value 3 */}
        <div className="bg-zinc-950/40 backdrop-blur-sm border border-zinc-900/80 p-5 rounded-2xl space-y-3.5 text-left hover:border-emerald-500/20 transition-all duration-300">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-max">
            <Droplets className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">Smart Precise Watering</h4>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans">
            Gentle watering schedules deliver small, precise amounts of water right to the roots instead of wasteful flooding, allowing roots to breathe.
          </p>
        </div>

        {/* Core Value 4 */}
        <div className="bg-zinc-950/40 backdrop-blur-sm border border-zinc-900/80 p-5 rounded-2xl space-y-3.5 text-left hover:border-emerald-500/20 transition-all duration-300">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-max">
            <LineChart className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">Crop Growth Models</h4>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans font-bold">
            Utilizes long-term history values to estimate future crop yields, helping you make better decisions for density and planting schedules.
          </p>
        </div>

      </div>

      {/* Security Verification & Certification */}
      <div className="bg-zinc-950/60 border border-zinc-900 p-5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 text-left">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 rounded-xl shrink-0">
          <Shield className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wider">SECURE FARM DATA & PRIVACY</h4>
          <p className="text-xs text-zinc-555 leading-relaxed mt-1.5">
            AgroSensiX keeps your water and watering equipment secure. We set up safe, encrypted local connections to guarantee absolute crop data privacy and prevent any bad actors or outside interference with your physical watering valves. All updates are handled over secure servers.
          </p>
        </div>
      </div>

    </div>
  );
};
