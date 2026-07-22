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
  Volume2,
  Play,
  Cpu,
  BarChart3,
  Check,
  ShieldCheck,
  Compass,
  Radio,
  Layers,
  Sparkle
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
  // Counters for the Live Impact section
  const [waterSavedCount, setWaterSavedCount] = useState(0);
  const [solarGeneratedCount, setSolarGeneratedCount] = useState(0);
  const [cropsProtectedCount, setCropsProtectedCount] = useState(0);
  const [energySavedCount, setEnergySavedCount] = useState(0);
  const [carbonReductionCount, setCarbonReductionCount] = useState(0);

  // Active language for AI assistant
  const [activeLang, setActiveLang] = useState<"en" | "hi" | "pa" | "mr" | "bn" | "ta" | "te" | "gu">("en");
  const [aiResponseText, setAiResponseText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Video/Demo Modal
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Counters initialization
  useEffect(() => {
    const duration = 1800; // ms
    const steps = 50;
    const intervalTime = duration / steps;
    
    let currentStep = 0;
    
    const targets = {
      water: 148350,
      solar: 5490,
      crops: 94250,
      energy: 312,
      carbon: 1245
    };

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setWaterSavedCount(targets.water);
        setSolarGeneratedCount(targets.solar);
        setCropsProtectedCount(targets.crops);
        setEnergySavedCount(targets.energy);
        setCarbonReductionCount(targets.carbon);
        clearInterval(timer);
      } else {
        const ratio = currentStep / steps;
        const easeRatio = ratio * (2 - ratio);
        setWaterSavedCount(Math.round(targets.water * easeRatio));
        setSolarGeneratedCount(Math.round(targets.solar * easeRatio));
        setCropsProtectedCount(Math.round(targets.crops * easeRatio));
        setEnergySavedCount(Math.round(targets.energy * easeRatio));
        setCarbonReductionCount(Math.round(targets.carbon * easeRatio));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const aiResponses = {
    en: {
      question: "What is my soil moisture status in Greenhouse 14?",
      answer: "Soil moisture is currently at 52.4% (Nominal). Deep root sensor telemetry indicates optimal hydration. Next drip irrigation pulse scheduled in 4 hours based on solar evapotranspiration forecasts."
    },
    hi: {
      question: "ग्रीनहाउस 14 में मिट्टी की नमी की क्या स्थिति है?",
      answer: "मिट्टी की नमी वर्तमान में 52.4% (सामान्य) पर है। गहरे जड़ सेंसर इष्टतम जलयोजन का संकेत देते हैं। अगला सिंचाई पल्स 4 घंटे में सौर वाष्पोत्सर्जन पूर्वानुमान पर आधारित है।"
    },
    pa: {
      question: "ਗ੍ਰੀਨਹਾਉਸ 14 ਵਿੱਚ ਮਿੱਟੀ ਦੀ ਨਮੀ ਦੀ ਸਥਿਤੀ ਕੀ ਹੈ?",
      answer: "ਮਿੱਟੀ ਦੀ ਨਮੀ ਇਸ ਵੇਲੇ 52.4% ਹੈ। ਡੂੰਘੀ ਜੜ੍ਹ ਦੇ ਸੈਂਸਰ ਵਧੀਆ ਪਾਣੀ ਦਾ ਸੰਕੇਤ ਦਿੰਦੇ ਹਨ। ਅਗਲੀ ਸਿੰਚਾਈ 4 ਘੰਟਿਆਂ ਵਿੱਚ ਪ੍ਰਸਤਾਵਿਤ ਹੈ।"
    },
    mr: {
      question: "ग्रीनहाऊस 14 मध्ये जमिनीतील ओलावा कसा आहे?",
      answer: "जमिनीतील ओलावा ५२.४% वर स्थिर आहे. रूट सेन्सर्स योग्य ओलावा दर्शवतात. पुढील सिंचन सायकल ४ तासांनंतर सुरु होईल."
    },
    bn: {
      question: "গ্রিনহাউস 14-এ মাটির আর্দ্রতা কেমন?",
      answer: "মাটির আর্দ্রতা বর্তমানে ৫২.৪% এ স্বাভাবিক। রুট সেন্সরগুলি সর্বোত্তম আর্দ্রতার সংকেত দিচ্ছে। পরবর্তী সেচ ৪ ঘণ্টা পরে নির্ধারিত।"
    },
    ta: {
      question: "கிரீன்ஹவுஸ் 14 இல் மண்ணின் ஈரப்பதம் என்ன?",
      answer: "மண்ணின் ஈரப்பதம் 52.4% இல் சாதாரணமாக உள்ளது. அடுத்த பாசன சுழற்சி 4 மணிநேரத்தில் திட்டமிடப்பட்டுள்ளது."
    },
    te: {
      question: "గ్రీన్హౌస్ 14 లో నా నేల తేమ ఎలా ఉంది?",
      answer: "నేల తేమ ప్రస్తుతం 52.4% వద్ద స్థిరంగా ఉంది. తదుపరి సాగు నీటి పల్స్ 4 గంటల తర్వాత నడుస్తుంది."
    },
    gu: {
      question: "ગ્રીનહાઉસ 14 માં જમીનનો ભેજ કેવો છે?",
      answer: "જમીનનો ભેજ હાલમાં 52.4% પર સામાન્ય છે. આગામી સિંચાઈ ચક્ર 4 કલાક પછી સુ নির্ধারিত છે."
    }
  };

  useEffect(() => {
    setIsAiTyping(true);
    setAiResponseText("");
    const text = aiResponses[activeLang].answer;
    let index = 0;
    
    const typeTimer = setInterval(() => {
      setAiResponseText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(typeTimer);
        setIsAiTyping(false);
      }
    }, 12);

    return () => clearInterval(typeTimer);
  }, [activeLang]);

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी" },
    { code: "pa", name: "ਪੰਜਾਬੀ" },
    { code: "mr", name: "मराठी" },
    { code: "bn", name: "বাংলা" },
    { code: "ta", name: "தமிழ்" },
    { code: "te", name: "తెలుగు" },
    { code: "gu", name: "ગુજરાતી" }
  ];

  return (
    <div className="space-y-16 animate-fade-in text-left">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[80px] left-[5%] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[350px] right-[5%] w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* HERO SECTION */}
      <div className="relative rounded-[32px] overflow-hidden border border-emerald-500/20 bg-neutral-950 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#061826] via-[#020b14] to-black opacity-95" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 text-center space-y-8">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-mono text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AgroSensiX OS v3.0 • Smart Farming Ecosystem</span>
          </div>

          {/* Hero Main Heading */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-sans uppercase leading-[1.08]">
              PRECISION AGRICULTURE <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                POWERED BY AI.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-300 font-sans font-normal leading-relaxed">
              Space-grade IoT telemetry, intelligent water conservation, and conversational Gemini AI diagnostics for maximum crop yield and zero resource waste.
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate(NavigationPage.DASHBOARD)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-sans font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 text-center min-w-[210px]"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {!isLoggedIn ? (
              <button
                onClick={() => onNavigate(NavigationPage.LOGIN)}
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white font-sans font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 hover:border-emerald-500/40 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 text-center min-w-[210px]"
              >
                <span>Sign In / Register</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => setShowDemoModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white font-sans font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 hover:border-cyan-500/40 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 text-center min-w-[210px]"
              >
                <span>Watch System Demo</span>
                <Play className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-current" />
              </button>
            )}
          </div>

          {/* User connection info */}
          <div className="pt-2">
            {isLoggedIn ? (
              <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">
                ● ACTIVE SESSION: <span className="text-white">{userName}</span>
              </p>
            ) : (
              <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                ● TELEMETRY BRIDGE LIVE • OFFLINE CACHE AUTONOMY READY
              </p>
            )}
          </div>

        </div>
      </div>

      {/* LIVE TELEMETRY IMPACT COUNTERS */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">REAL-TIME FIELD METRICS</span>
          <h2 className="text-2xl font-bold font-sans text-white uppercase tracking-tight mt-1">Live Technical & Environmental Impact</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-emerald-500/40 transition-all duration-300 shadow-xl">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1">💧 Water Saved</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {waterSavedCount.toLocaleString()}<span className="text-xs text-zinc-500 ml-1">L</span>
            </div>
            <p className="text-[9.5px] text-zinc-400 mt-2 font-mono uppercase">Precision Drip Pulse</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition-all duration-300 shadow-xl">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1">☀ Solar Harvest</span>
            <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
              {solarGeneratedCount.toLocaleString()}<span className="text-xs text-zinc-500 ml-1">kWh</span>
            </div>
            <p className="text-[9.5px] text-zinc-400 mt-2 font-mono uppercase">Off-grid Clean Storage</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-cyan-500/40 transition-all duration-300 shadow-xl">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1">🌱 Crops Protected</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 tracking-tight">
              {cropsProtectedCount.toLocaleString()}<span className="text-xs text-zinc-500 ml-1">units</span>
            </div>
            <p className="text-[9.5px] text-zinc-400 mt-2 font-mono uppercase">Blight Rain Shielding</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-teal-500/40 transition-all duration-300 shadow-xl">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1">⚡ Energy Conserved</span>
            <div className="text-2xl font-bold font-mono text-teal-400 tracking-tight">
              {energySavedCount}<span className="text-xs text-zinc-500 ml-1">MW</span>
            </div>
            <p className="text-[9.5px] text-zinc-400 mt-2 font-mono uppercase">Optimized Hydrology</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-emerald-500/40 transition-all duration-300 shadow-xl col-span-2 md:col-span-1">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold tracking-widest mb-1">🌍 Carbon Offset</span>
            <div className="text-2xl font-bold font-mono text-emerald-300 tracking-tight">
              {carbonReductionCount}<span className="text-xs text-zinc-500 ml-1">kg CO₂</span>
            </div>
            <p className="text-[9.5px] text-zinc-400 mt-2 font-mono uppercase">Zero Emission Footprint</p>
          </div>
        </div>
      </div>

      {/* CORE AGROSENSIX CAPABILITIES */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold block">PLATFORM ARCHITECTURE</span>
          <h2 className="text-2xl font-bold font-sans text-white uppercase tracking-tight mt-1">High-Precision Agricultural Engineering</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-neutral-950 border border-zinc-800/90 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300 space-y-4 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Smart Drip Irrigation</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-medium">
                Uses root-depth soil sensor arrays to automatically calculate transpiration curves, releasing micro-drip pulses only when soil moisture dips below optimal thresholds.
              </p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-zinc-800/90 rounded-2xl p-6 hover:border-amber-500/40 transition-all duration-300 space-y-4 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Solar Micro-Grid Power</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-medium">
                Self-sustaining off-grid solar Backplane arrays keep field sensors and irrigation solenoids running 24/7 with zero dependence on traditional grid electricity.
              </p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-zinc-800/90 rounded-2xl p-6 hover:border-cyan-500/40 transition-all duration-300 space-y-4 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Gemini Multilingual AI</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-medium">
                Conversational AI supporting English, Hindi, Punjabi, Marathi, Bengali, Tamil, Telugu, and Gujarati. Provides immediate crop diagnosis and weather guidance.
              </p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-zinc-800/90 rounded-2xl p-6 hover:border-teal-500/40 transition-all duration-300 space-y-4 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Pest & Blight Shield</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-medium">
                Automated rain detection and ventilator shutters block moisture spikes on delicate leaves, preventing fungal spores and leaf spot diseases before outbreak.
              </p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-zinc-800/90 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300 space-y-4 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">100% Offline Autonomy</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-medium">
                Built with full Progressive Web App precaching. Performs local sensor log analysis and controls water valves even when remote field internet is completely cut.
              </p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-zinc-800/90 rounded-2xl p-6 hover:border-cyan-500/40 transition-all duration-300 space-y-4 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Space-Grade Analytics</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2 font-medium">
                Combines micro-climate weather forecasts with satellite soil nitrogen metrics to give farmers hyper-targeted fertilizer and harvest recommendations.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* MULTILINGUAL AI CENTERPIECE SHOWCASE */}
      <div className="bg-neutral-950 rounded-[32px] border border-zinc-800/90 p-6 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> Interactive AI Co-Pilot
            </div>
            
            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase leading-tight font-sans">
              SPEAK YOUR REGIONAL LANGUAGE. GET INSTANT ANSWERS.
            </h3>
            
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium">
              AgroSensiX connects directly to Google Gemini models to assist farmers in 8 languages. Select a dialect below to test the live translation and diagnostic capability.
            </p>

            {/* Language buttons */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">Select Active Interface Dialect</span>
              <div className="grid grid-cols-4 gap-2 font-mono text-[10px]">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setActiveLang(l.code as any)}
                    className={`p-2 rounded-xl border text-center font-bold tracking-wide transition-all cursor-pointer ${
                      activeLang === l.code
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Full Voice Synthesis & Regional Dialects Supported</span>
            </div>
          </div>

          <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">AgriOS Core Assistant</h4>
                  <span className="text-[10px] font-mono text-emerald-400 block uppercase font-semibold">● GEMINI AI ONLINE</span>
                </div>
              </div>

              <button 
                onClick={() => setIsVoiceActive(!isVoiceActive)}
                className={`px-3 py-1.5 rounded-xl border font-mono text-[10px] font-bold flex items-center gap-2 transition-all uppercase tracking-wider cursor-pointer ${
                  isVoiceActive 
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)] animate-pulse" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                {isVoiceActive ? "Voice Stream Active" : "Enable Voice"}
              </button>
            </div>

            <div className="min-h-[170px] bg-neutral-950 border border-zinc-900 p-5 rounded-xl space-y-4 text-xs font-sans flex flex-col justify-between">
              <div className="flex items-start gap-3 max-w-[88%] self-end flex-row-reverse">
                <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-200 text-[10px] shrink-0 font-bold">F</div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-zinc-200 font-medium leading-relaxed">
                  {aiResponses[activeLang].question}
                </div>
              </div>

              <div className="flex items-start gap-3 max-w-[88%]">
                <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 shrink-0 font-bold">AI</div>
                <div className="bg-[#051c27] border border-cyan-900/40 p-3 rounded-2xl text-zinc-100 font-medium">
                  <p className="leading-relaxed">{aiResponseText}</p>
                  {isAiTyping && <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono border-t border-zinc-900 pt-3">
              <span className="text-zinc-500">MODEL: GEMINI 2.5 FLASH</span>
              <button 
                onClick={() => onNavigate(NavigationPage.AI_ASSISTANT)}
                className="text-emerald-400 hover:text-emerald-300 uppercase font-bold tracking-wider cursor-pointer"
              >
                Open Full AI Assistant →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* QUICK FIELD STATUS PREVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-neutral-950 border border-zinc-800/90 rounded-2xl p-6 space-y-4 hover:border-emerald-500/30 transition-all shadow-xl">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
              <Sprout className="w-5 h-5 text-emerald-400" />
              Greenhouse 14 (Mixed Crops)
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 font-bold text-[10px] font-mono uppercase">
              Index {plantHealthIndexG14}%
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            Sensors confirm optimal root moisture and solar power backplane level. Automated drip solenoid valve is currently standby.
          </p>
          <div className="flex justify-between text-xs font-mono text-zinc-400 border-t border-zinc-900 pt-3">
            <span>Soil Moisture:</span>
            <span className="text-emerald-400 font-bold">52.4% (Nominal)</span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-zinc-800/90 rounded-2xl p-6 space-y-4 hover:border-cyan-500/30 transition-all shadow-xl">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
              <Sprout className="w-5 h-5 text-cyan-400" />
              Orchard Hub 7 (Dwarf Oranges)
            </span>
            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 font-bold text-[10px] font-mono uppercase">
              Index {plantHealthIndex7G}%
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            Deep soil moisture transducers reporting stable hydration. Solar battery reserve charged at 98.4%.
          </p>
          <div className="flex justify-between text-xs font-mono text-zinc-400 border-t border-zinc-900 pt-3">
            <span>Soil Moisture:</span>
            <span className="text-cyan-400 font-bold">41.0% (Stable)</span>
          </div>
        </div>

      </div>

      {/* DEMO VIDEO MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#07131e] border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 relative text-center shadow-2xl">
            <button 
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white font-mono text-xs uppercase font-bold cursor-pointer bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl"
            >
              Close ✕
            </button>

            <div className="space-y-2">
              <span className="text-[10px] bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-mono px-3 py-1 rounded-full uppercase font-bold tracking-widest">System Presentation</span>
              <h3 className="text-2xl font-bold font-sans text-white uppercase mt-1">AgroSensiX Operating System Overview</h3>
            </div>

            <div className="aspect-video bg-neutral-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=800')` }} />
              
              <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-neutral-950 text-xl font-bold cursor-pointer group-hover:scale-110 duration-300 shadow-[0_0_25px_rgba(16,185,129,0.4)] relative z-10">
                ▶
              </div>
              
              <div className="space-y-1 relative z-10">
                <p className="text-xs font-mono text-zinc-200 uppercase tracking-widest font-bold">Play AgroSensiX Field Walkthrough (120s)</p>
                <p className="text-[10px] text-zinc-400 font-mono">Streamed securely via local PWA cache worker</p>
              </div>
            </div>

            <p className="text-xs font-sans text-zinc-300 font-medium">
              See how our custom ESP32 IoT sensors communicate real-time moisture data, solar panel power, and offline Gemini AI coordination to save over 148,000 Liters of water this season.
            </p>

            <button 
              onClick={() => {
                setShowDemoModal(false);
                onNavigate(NavigationPage.DASHBOARD);
              }}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer w-full"
            >
              Enter Farm Command Center
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
