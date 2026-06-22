import React, { useState, useEffect } from "react";
import { NavigationPage } from "../types";
import { 
  Sprout, 
  Sun, 
  Droplets, 
  Bot, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Zap, 
  Globe, 
  ShieldAlert, 
  CloudRain, 
  Eye, 
  Award, 
  Smartphone, 
  CheckCircle,
  Volume2
} from "lucide-react";

interface HomeViewProps {
  onNavigate: (page: NavigationPage) => void;
  plantHealthIndexG14: number;
  plantHealthIndex7G: number;
  userName: string;
  isLoggedIn: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  onNavigate, 
  plantHealthIndexG14,
  plantHealthIndex7G,
  userName,
  isLoggedIn
}) => {
  // Counters for the Live Impact section with incremental animation state
  const [waterSavedCount, setWaterSavedCount] = useState(0);
  const [solarGeneratedCount, setSolarGeneratedCount] = useState(0);
  const [cropsProtectedCount, setCropsProtectedCount] = useState(0);
  const [energySavedCount, setEnergySavedCount] = useState(0);
  const [carbonReductionCount, setCarbonReductionCount] = useState(0);

  // Active language for the centerpiece AI farming assistant
  const [activeLang, setActiveLang] = useState<"en" | "hi" | "pa" | "mr" | "bn" | "ta" | "te" | "gu">("en");
  const [aiResponseText, setAiResponseText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Video/Demo Modal
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Counters initialization
  useEffect(() => {
    const duration = 2000; // ms
    const steps = 60;
    const intervalTime = duration / steps;
    
    let currentStep = 0;
    
    const targets = {
      water: 148350,
      solar: 5490,
      crops: 94250,
      energy: 3120,
      carbon: 12450
    };

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setWaterSavedCount(targets.water);
        setSolarGeneratedCount(targets.solar);
        setCropsProtectedCount(targets.crops);
        setEnergySavedCount(targets.energy * 0.1);
        setCarbonReductionCount(targets.carbon * 0.1);
        clearInterval(timer);
      } else {
        const ratio = currentStep / steps;
        // Ease-out quad
        const easeRatio = ratio * (2 - ratio);
        setWaterSavedCount(Math.round(targets.water * easeRatio));
        setSolarGeneratedCount(Math.round(targets.solar * easeRatio));
        setCropsProtectedCount(Math.round(targets.crops * easeRatio));
        setEnergySavedCount(targets.energy * 0.1 * easeRatio);
        setCarbonReductionCount(targets.carbon * 0.1 * easeRatio);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Multi-lingual AI response data
  const aiResponses = {
    en: {
      question: "What is my soil status in Greenhouse 14?",
      answer: "Your soil is becoming dry. Irrigation may be required soon. Direct solar backup is nominal at 4.8 kW."
    },
    hi: {
      question: "ग्रीनहाउस 14 में मिट्टी की स्थिति क्या है?",
      answer: "आपकी मिट्टी सूखी हो रही है। जल्द ही सिंचाई की आवश्यकता हो सकती है। सौर बैकअप 4.8 kW पर सामान्य है।"
    },
    pa: {
      question: "ਗ੍ਰੀਨਹਾਉਸ 14 ਵਿੱਚ ਮਿੱਟੀ ਦੀ ਸਥਿਤੀ ਕੀ ਹੈ?",
      answer: "ਤੁਹਾਡੀ ਮਿੱਟੀ ਖੁਸ਼ਕ ਹੋ ਰਹੀ ਹੈ। ਜਲਦੀ ਹੀ ਸਿੰਚਾਈ ਦੀ ਲੋੜ ਹੋ ਸਕਦੀ ਹੈ। ਸੌਰ ਬੈਕਅੱਪ 4.8 kW 'ਤੇ ਸਧਾਰਨ ਹੈ।"
    },
    mr: {
      question: "ग्रीनहाऊस 14 मधील जमिनीची स्थिती काय आहे?",
      answer: "तुमची जमीन कोरडी होत आहे. लवकरच सिंचनाची आवश्यकता भासू शकते. सौर बॅकअप 4.8 kW वर सामान्य आहे।"
    },
    bn: {
      question: "গ্রিনহাউস 14-এ মাটির অবস্থা কী রকম?",
      answer: "আপনার মাটি শুষ্ক হয়ে যাচ্ছে। শীঘ্রই সেচের প্রয়োজন হতে পারে। সোলার ব্যাকআপ 4.8 kW-এ স্বাভাবিক।"
    },
    ta: {
      question: "கிரீன்ஹவுஸ் 14 இல் மண்ணின் நிலை என்ன?",
      answer: "உங்கள் மண் வறண்டு வருகிறது. விரைவில் பாசனம் தேவைப்படலாம். சோலார் பேக்கப் 4.8 kW இல் சாதாரணமாக உள்ளது."
    },
    te: {
      question: "గ్రీన్హౌస్ 14 లో నా నేల పరిస్థితి ఎలా ఉంది?",
      answer: "మీ నేల పొడిగా మారుతోంది. త్వరలోనే సాగు నీరు అవసరం కావచ్చు. సోలార్ బ్యాకప్ 4.8 kW వద్ద సాధారణంగా ఉంది."
    },
    gu: {
      question: "ગ્રીનહાઉસ 14 માં જમીનની સ્થિતિ કેવી છે?",
      answer: "તમારી જમીન સુકાઈ રહી છે. ટૂંક સમયમાં સિંચાઈની જરૂર પડી શકે છે. સોલાર બેકઅપ 4.8 kW પર સામાન્ય છે."
    }
  };

  // Trigger typewriter effect when language changes
  useEffect(() => {
    setIsAiTyping(true);
    setAiResponseText("");
    const text = aiResponses[activeLang].answer;
    let index = 0;
    
    // Quick typing simulation
    const typeTimer = setInterval(() => {
      setAiResponseText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(typeTimer);
        setIsAiTyping(false);
      }
    }, 15);

    return () => clearInterval(typeTimer);
  }, [activeLang]);

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "mr", name: "मराठी (Marathi)" },
    { code: "bn", name: "বাংলা (Bengali)" },
    { code: "ta", name: "தமிழ் (Tamil)" },
    { code: "te", name: "తెలుగు (Telugu)" },
    { code: "gu", name: "ગુજરાતી (Gujarati)" }
  ];

  return (
    <div className="space-y-16 animate-fade-in text-left">
      
      {/* Absolute floating aurora background lights */}
      <div className="absolute top-[80px] left-[5%] w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[110px] pointer-events-none animate-aurora-cyan" />
      <div className="absolute top-[280px] right-[5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none animate-aurora-gold" />
      <div className="absolute top-[1200px] left-[15%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <div className="relative rounded-[32px] overflow-hidden border border-zinc-900/80 bg-neutral-950 shadow-2xl">
        {/* Dynamic mesh linear gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c233c] via-[#050e18] to-black opacity-90" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 md:py-28 text-center space-y-8">
          {/* Animated Glass Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-mono text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.15)] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 shrink-0" />
            AgroSensiX OS v3.0 • The Future of Farming
          </div>

          {/* Massively Bold display Hero Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white font-sans uppercase">
              FUTURE OF FARMING <br className="hidden md:block"/>
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300 bg-clip-text text-transparent">
                STARTS HERE.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm md:text-lg text-zinc-350 font-normal leading-relaxed">
              AI-Powered Agricultural Intelligence for Smarter, Safer, and More Sustainable Farming. Elevate your crop yield with space-grade analytics.
            </p>
          </div>

          {/* Premium Launch Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <button
              onClick={() => onNavigate(NavigationPage.DASHBOARD)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#020508] font-sans font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-cyan-400/25 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 text-center min-w-[200px]"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-white font-sans font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 hover:border-zinc-700 hover:-translate-y-1 cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 text-center min-w-[200px]"
            >
              Watch Demo
              <span className="text-amber-400 shrink-0 animate-pulse">▶</span>
            </button>
          </div>

          {/* Quick status message */}
          {isLoggedIn ? (
            <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
              ● Connected as coordinator: <span className="font-semibold">{userName}</span>
            </p>
          ) : (
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              ● Server Online • Guest Access Enabled
            </p>
          )}

        </div>
      </div>

      {/* LIVE IMPACT STATISTICS SECTION */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="text-[9.5px] font-mono text-emerald-400 uppercase tracking-widest font-bold">REAL-TIME GLOBAL TELEMETRY</span>
          <h2 className="text-xl md:text-2xl font-bold font-sans text-white uppercase tracking-tight mt-1">Live Technical & Environmental Impact</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Water Saved Container */}
          <div className="bg-zinc-950/40 border border-zinc-900/90 rounded-2xl p-5 hover:border-emerald-500/20 transition-all duration-300 relative group overflow-hidden shadow-lg">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1.5">💧 Water Saved</span>
            <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400 tracking-tight flex items-baseline gap-1">
              {waterSavedCount.toLocaleString()}<span className="text-[10px] font-sans font-semibold text-zinc-500">L</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-2 font-mono uppercase tracking-wide">Automatic Valve Pulse</p>
          </div>

          {/* Solar Energy Generated */}
          <div className="bg-zinc-950/40 border border-zinc-900/90 rounded-2xl p-5 hover:border-amber-500/20 transition-all duration-300 relative group overflow-hidden shadow-lg">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1.5">☀ Solar Harvest</span>
            <div className="text-xl md:text-2xl font-bold font-mono text-amber-400 tracking-tight flex items-baseline gap-1">
              {solarGeneratedCount.toLocaleString()}<span className="text-[10px] font-sans font-semibold text-zinc-500">kWh</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-2 font-mono uppercase tracking-wide">Off-grid Clean Storage</p>
          </div>

          {/* Crops Protected */}
          <div className="bg-zinc-950/40 border border-zinc-900/90 rounded-2xl p-5 hover:border-cyan-500/20 transition-all duration-300 relative group overflow-hidden shadow-lg">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1.5">🌱 Crops Protected</span>
            <div className="text-xl md:text-2xl font-bold font-mono text-[#22D3EE] tracking-tight flex items-baseline gap-1">
              {cropsProtectedCount.toLocaleString()}<span className="text-[10px] font-sans font-semibold text-zinc-500">units</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-2 font-mono uppercase tracking-wide">Fungal spot shielding</p>
          </div>

          {/* Energy Saved */}
          <div className="bg-zinc-950/40 border border-zinc-900/90 rounded-2xl p-5 hover:border-yellow-500/20 transition-all duration-300 relative group overflow-hidden shadow-lg">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1.5">⚡ Energy Conserved</span>
            <div className="text-xl md:text-2xl font-bold font-mono text-[#FBBF24] tracking-tight flex items-baseline gap-1">
              {energySavedCount.toFixed(1)}<span className="text-[10px] font-sans font-semibold text-zinc-500">MW</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-2 font-mono uppercase tracking-wide">Eco Hydrology pump</p>
          </div>

          {/* Carbon Reduction */}
          <div className="bg-zinc-950/40 border border-zinc-900/90 rounded-2xl p-5 hover:border-emerald-500/20 transition-all duration-300 relative group overflow-hidden shadow-lg col-span-2 lg:col-span-1">
            <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1.5">🌍 Carbon Offset</span>
            <div className="text-xl md:text-2xl font-bold font-mono text-emerald-455 tracking-tight flex items-baseline gap-1">
              {carbonReductionCount.toFixed(1)}<span className="text-[10px] font-sans font-semibold text-zinc-500">kg CO₂</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-2 font-mono uppercase tracking-wide">Eco emission decline</p>
          </div>
        </div>
      </div>

      {/* WHY AGROSENSIX SECTION */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="text-[9.5px] font-mono text-[#22D3EE] uppercase tracking-widest font-bold">WHY CHOOSE THE OS CONTROLLER?</span>
          <h2 className="text-xl md:text-2xl font-bold font-sans text-white uppercase tracking-tight mt-1">High-Precision Agricultural Engineering</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Smart Irrigation Card */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 hover:border-emerald-500/30 hover:shadow-emerald-950/15 duration-300 relative group flex flex-col justify-between h-56 shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 self-start">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider">Smart Irrigation</h4>
              <p className="text-xs text-zinc-400 mt-1 font-sans leading-normal font-bold">
                Adjusts water intervals Dynamically based on real-time sub-root soil humidity map calculations.
              </p>
            </div>
          </div>

          {/* Solar Powered Card */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 hover:border-amber-500/30 hover:shadow-amber-950/15 duration-300 relative group flex flex-col justify-between h-56 shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 self-start">
              <Sun className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider">Solar Powered</h4>
              <p className="text-xs text-zinc-400 mt-1 font-sans leading-normal font-bold">
                100% independent off-grid solar Backplane panel tracking with integrated battery voltage stabilizers.
              </p>
            </div>
          </div>

          {/* AI Assistant Card */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 hover:border-cyan-500/30 hover:shadow-cyan-950/15 duration-300 relative group flex flex-col justify-between h-56 shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[#22D3EE] self-start animate-pulse">
              <Bot className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider">AI Assistant</h4>
              <p className="text-xs text-zinc-400 mt-1 font-sans leading-normal font-bold">
                Centerpiece conversational assistant matching your own dialect for precise climate guidelines.
              </p>
            </div>
          </div>

          {/* Multilingual Support Card */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 hover:border-yellow-500/30 hover:shadow-yellow-950/15 duration-300 relative group flex flex-col justify-between h-56 shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[#FBBF24] self-start">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider">Multilingual OS</h4>
              <p className="text-xs text-zinc-400 mt-1 font-sans leading-normal font-bold">
                Instant translation backplane supporting 8 Indian and English languages dynamically.
              </p>
            </div>
          </div>

          {/* Offline Operation */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 hover:border-cyan-500/20 hover:shadow-cyan-950/10 duration-300 relative group flex flex-col justify-between h-56 shadow-md transition-all">
            <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-neutral-400 self-start">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-zinc-200 uppercase tracking-wider">Offline Operation</h4>
              <p className="text-xs text-zinc-550 mt-1 font-sans leading-normal font-bold">
                Operates perfectly offline via cached service workers, local indexes, and ESP32 LAN direct bridges.
              </p>
            </div>
          </div>

          {/* Crop Protection */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 hover:border-emerald-500/20 hover:shadow-emerald-950/10 duration-300 relative group flex flex-col justify-between h-56 shadow-md transition-all">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-neutral-400 self-start">
              <ShieldAlert className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-zinc-200 uppercase tracking-wider">Crop Protection</h4>
              <p className="text-xs text-zinc-550 mt-1 font-sans leading-normal font-bold">
                Automated ventilator and ventilator control, blocking rainfall to avert leaf spot and fungal risk.
              </p>
            </div>
          </div>

          {/* Water Conservation */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 hover:border-teal-500/20 hover:shadow-teal-950/10 duration-300 relative group flex flex-col justify-between h-56 shadow-md transition-all">
            <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl text-neutral-400 self-start">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-zinc-200 uppercase tracking-wider">Water Conservation</h4>
              <p className="text-xs text-zinc-550 mt-1 font-sans leading-normal font-bold">
                Reduces total consumption by up to 35% compared to ancient mechanical calendar intervals.
              </p>
            </div>
          </div>

          {/* Sustainability */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 hover:border-green-500/20 hover:shadow-green-950/10 duration-300 relative group flex flex-col justify-between h-56 shadow-md transition-all">
            <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl text-neutral-400 self-start">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-zinc-200 uppercase tracking-wider">Sustainability</h4>
              <p className="text-xs text-zinc-550 mt-1 font-sans leading-normal font-bold">
                Combines high-efficiency solar battery storage with ecological recycling principles for zero footprint.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* CENTERPIECE PORTAL CO-PILOT ASSISTANT */}
      <div className="bg-neutral-950 rounded-[32px] border border-zinc-900/80 p-6 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-emerald-555/10 to-teal-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 text-left">
          {/* Conversation description */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-md font-mono text-[9.5px] uppercase tracking-wider font-semibold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> AI Agricultural centerpiece
            </div>
            <h3 className="text-2xl md:text-3.5xl font-sans font-bold text-white tracking-tight uppercase leading-tight">
              AGRICULTURE CO-PILOT THAT FEELS ALIVE.
            </h3>
            <p className="text-xs md:text-sm text-zinc-400 font-sans leading-relaxed font-bold">
              Select your regional language or dial in voice telemetry. The system reacts instantly to advise soil moisture thresholds, solar Backplanes, weather forecasts, and crop disease protection.
            </p>

            {/* Language Selection Grid */}
            <div className="space-y-2">
              <span className="text-[9.5px] font-mono text-zinc-550 uppercase tracking-widest font-semibold block">Select Active Interface Language</span>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[9.5px]">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setActiveLang(l.code as any)}
                    className={`p-2 rounded-lg border text-center font-bold tracking-wide transition-all truncate cursor-pointer ${
                      activeLang === l.code
                        ? "bg-emerald-500/10 border-emerald-405 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        : "bg-zinc-900/50 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {l.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Micro Interactivity details */}
            <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500 uppercase font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> English, Hindi, Punjabi, Tamil & More Included
            </div>
          </div>

          {/* Interactive Mockup AI Assistant */}
          <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
            {/* Header layout */}
            <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/20">
                  <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-emerald-400">
                    <Bot className="w-5 h-5 shrink-0" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-sans font-bold text-zinc-100 uppercase tracking-wide">AgriOS Core Assistant</h4>
                  <span className="text-[9px] font-mono text-emerald-400 block tracking-wider uppercase font-semibold">● ACTIVE CLIENT BACKPLANE</span>
                </div>
              </div>

              {/* Fake speech indicator */}
              <button 
                onClick={() => setIsVoiceActive(!isVoiceActive)}
                className={`px-3 py-1.5 rounded-lg border font-mono text-[9px] font-semibold flex items-center gap-1.5 transition-all text-center uppercase tracking-wide cursor-pointer ${
                  isVoiceActive 
                    ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)] animate-pulse" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-cyan-400 hover:border-cyan-550/25"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                {isVoiceActive ? "Listening (Voice Mode)" : "Voice Inactive"}
              </button>
            </div>

            {/* Chat Body Mockup screen */}
            <div className="min-h-[160px] bg-zinc-950/80 border border-zinc-900 p-4.5 rounded-xl space-y-4 font-sans text-xs flex flex-col justify-between">
              
              {/* User Question */}
              <div className="flex items-start gap-2.5 max-w-[85%] self-end flex-row-reverse">
                <div className="w-7 h-7 bg-zinc-800 border border-zinc-700/80 rounded-md flex items-center justify-center text-zinc-300 text-[10px] shrink-0 font-bold">U</div>
                <div className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-2xl text-zinc-300 font-bold leading-normal">
                  {aiResponses[activeLang].question}
                </div>
              </div>

              {/* AI Answer with simulated voice bars if active */}
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center justify-center text-emerald-400 shrink-0 font-bold">AI</div>
                <div className="bg-[#081e28] border border-cyan-900/30 p-2.5 rounded-2xl text-zinc-200">
                  <p className="leading-relaxed font-bold font-sans text-xs">{aiResponseText}</p>
                  
                  {isAiTyping && (
                    <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5" />
                  )}

                  {/* Simulated Voice Waveform */}
                  {isVoiceActive && (
                    <div className="flex items-center gap-1 mt-2.5 border-t border-cyan-950/60 pt-2 text-[#22D3EE] font-mono text-[9px] uppercase tracking-wider font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block shrink-0" />
                      Voice Synthesis Streaming...
                      <div className="flex items-end gap-0.5 h-3.5 ml-2">
                        <div className="w-0.5 bg-cyan-400 h-2.5 animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-0.5 bg-cyan-400 h-3.5 animate-bounce" style={{ animationDelay: "0.3s" }} />
                        <div className="w-0.5 bg-cyan-400 h-1.5 animate-bounce" style={{ animationDelay: "0.5s" }} />
                        <div className="w-0.5 bg-cyan-400 h-3 animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Supportive instructions mock info line */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-550 border-t border-zinc-900/40 pt-3">
              <span>ACTIVE MODEL: GEMINI AI FLASH</span>
              <button 
                onClick={() => onNavigate(NavigationPage.AI_ASSISTANT)}
                className="text-emerald-400 hover:underline uppercase font-bold tracking-wider cursor-pointer"
              >
                OPEN FULL AI CONSOLE →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATUS PORTAL AT-A-GLANCE MAP PREVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Greenhouse status */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900/90 rounded-2xl p-6 hover:border-emerald-500/20 duration-300 relative text-left shadow-lg">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3.5 mb-3.5">
            <span className="text-zinc-200 font-bold uppercase tracking-wider flex items-center gap-2">
              <Sprout className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
              Greenhouse 14 (Mixed Crops)
            </span>
            <span className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)] rounded-full text-emerald-450 font-bold text-[10px] font-mono tracking-widest uppercase">
              Excellent {plantHealthIndexG14}%
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-normal mb-4 font-bold font-sans">
            Home to mixed crops and high-moisture indicators. Underground soil sensors detect highly optimal roots moisture, with direct connection stabilized via LAN transceivers. 
          </p>
          <div className="flex justify-between text-[11px] font-mono text-zinc-550 font-bold">
            <span>Soil moisture status:</span>
            <span className="text-emerald-400 font-bold">52.4% (Nominal)</span>
          </div>
        </div>

        {/* Orchard Hub */}
        <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900/90 rounded-2xl p-6 hover:border-cyan-500/20 duration-300 relative text-left shadow-lg">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3.5 mb-3.5">
            <span className="text-zinc-200 font-bold uppercase tracking-wider flex items-center gap-2">
              <Sprout className="w-4.5 h-4.5 text-emerald-400" />
              Orchard Hub 7 (Dwarf Oranges)
            </span>
            <span className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)] rounded-full text-emerald-455 font-bold text-[10px] font-mono tracking-widest uppercase">
              Healthy {plantHealthIndex7G}%
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-normal mb-4 font-bold font-sans">
            Deep-soil interval system feeding high-exposure Dwarf orange groves. Smart algorithms automatically adjust water valves with minimal energy footprints.
          </p>
          <div className="flex justify-between text-[11px] font-mono text-zinc-550 font-bold">
            <span>Soil moisture status:</span>
            <span className="text-emerald-400 font-bold">41.0% (Stable)</span>
          </div>
        </div>

      </div>

      {/* WATCH DEMO MODAL SCREEN */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1c2d] border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 relative text-center shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <button 
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white font-mono text-sm uppercase font-bold cursor-pointer bg-zinc-900 border border-zinc-805 p-1 px-2.5 rounded-lg"
            >
              Close ✕
            </button>

            <div className="space-y-2">
              <span className="text-[10px] bg-cyan-950/60 border border-cyan-805 text-cyan-300 font-mono p-1 px-3.5 rounded-full uppercase font-bold tracking-widest">Interactive Video Demo Walkthrough</span>
              <h3 className="text-xl md:text-2xl font-bold font-sans text-white uppercase mt-2">AgroSensiX operating system presentation</h3>
            </div>

            {/* Video Mockup Frame */}
            <div className="aspect-video bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=800')` }} />
              
              <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-neutral-950 text-xl font-bold cursor-pointer group-hover:scale-110 duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] select-none relative z-10">
                ▶
              </div>
              
              <div className="space-y-1 relative z-10">
                <p className="text-xs font-mono text-zinc-200 uppercase tracking-widest font-bold">Play Concept Demo Trailer (120s)</p>
                <p className="text-[10px] text-zinc-500 font-mono">Stream stabilized via local Progressive cache workers</p>
              </div>
            </div>

            <p className="text-[11px] font-sans text-zinc-400 max-w-lg mx-auto font-bold">
              Watch how our underwater custom ESP32 IoT sensors communicate real-time water flow, greenhouse solar thresholds, and offline Gemini coordination to save over 34,250 Liters of fresh irrigation water this season.
            </p>

            <button 
              onClick={() => {
                setShowDemoModal(false);
                onNavigate(NavigationPage.DASHBOARD);
              }}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer w-full"
            >
              Enter Farm Command Center
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
