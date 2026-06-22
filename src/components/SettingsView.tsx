import React, { useState, useEffect } from "react";
import { 
  Sun, 
  Moon, 
  Bot, 
  Bell, 
  Settings, 
  Sliders, 
  ShieldAlert, 
  Check, 
  RotateCcw, 
  Volume2, 
  UserCheck, 
  Power,
  Tv,
  Lock,
  Compass,
  AlertTriangle
} from "lucide-react";

interface SettingsViewProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ theme, onToggleTheme }) => {
  // Active tab setup corresponding to the 6 exact sections requested
  const [activeTab, setActiveTab] = useState<"appearance" | "notifications" | "ai" | "farm" | "dashboard" | "security">("appearance");
  
  // local theme settings
  const [themeMode, setThemeMode] = useState<string>(() => localStorage.getItem("settings_theme_mode") || "system_default");

  // notifications state
  const [emailAlerts, setEmailAlerts] = useState<boolean>(() => localStorage.getItem("settings_notif_email") !== "false");
  const [smsAlerts, setSmsAlerts] = useState<boolean>(() => localStorage.getItem("settings_notif_sms") !== "false");
  const [pushNotif, setPushNotif] = useState<boolean>(() => localStorage.getItem("settings_notif_push") !== "false");

  // AI states
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => localStorage.getItem("agrosensix_voice_settings_enabled") === "true");
  const [aiLanguage, setAiLanguage] = useState<string>(() => localStorage.getItem("settings_voice_language") || "en-US");
  const [autoSuggestions, setAutoSuggestions] = useState<boolean>(() => localStorage.getItem("settings_ai_auto_suggest") !== "false");

  // Farm controls
  const [autoIrrigation, setAutoIrrigation] = useState<boolean>(() => localStorage.getItem("settings_farm_auto_irr") !== "false");
  const [manualCycleTime, setManualCycleTime] = useState<number>(() => parseInt(localStorage.getItem("settings_farm_manual_sec") || "30", 10));
  const [emergencyWatering, setEmergencyWatering] = useState<boolean>(() => localStorage.getItem("settings_farm_emergency") === "true");

  // Dashboard preferences
  const [layoutMode, setLayoutMode] = useState<"compact" | "expanded">(() => (localStorage.getItem("settings_dash_layout") as "compact" | "expanded") || "expanded");
  const [refreshRate, setRefreshRate] = useState<string>(() => localStorage.getItem("settings_refresh_rate") || "15s");

  // Security Simulator
  const [passphraseStatus, setPassphraseStatus] = useState<string>("");
  const [sessionCount, setSessionCount] = useState<number>(2);
  const [trustedDevices, setTrustedDevices] = useState<{id: string, name: string, location: string, status: string}[]>([
    { id: "device-1", name: "ESP32 Orchard Controller Hub", location: "Sector 7G (North Field)", status: "Active Now" },
    { id: "device-2", name: "Starlink Gateway Transceiver", location: "Greenhouse G14 roof", status: "Nominal" },
  ]);

  // Sync state modifications
  useEffect(() => {
    localStorage.setItem("settings_theme_mode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("settings_notif_email", emailAlerts ? "true" : "false");
  }, [emailAlerts]);

  useEffect(() => {
    localStorage.setItem("settings_notif_sms", smsAlerts ? "true" : "false");
  }, [smsAlerts]);

  useEffect(() => {
    localStorage.setItem("settings_notif_push", pushNotif ? "true" : "false");
  }, [pushNotif]);

  useEffect(() => {
    localStorage.setItem("agrosensix_voice_settings_enabled", voiceEnabled ? "true" : "false");
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem("settings_voice_language", aiLanguage);
  }, [aiLanguage]);

  useEffect(() => {
    localStorage.setItem("settings_ai_auto_suggest", autoSuggestions ? "true" : "false");
  }, [autoSuggestions]);

  useEffect(() => {
    localStorage.setItem("settings_farm_auto_irr", autoIrrigation ? "true" : "false");
  }, [autoIrrigation]);

  useEffect(() => {
    localStorage.setItem("settings_farm_manual_sec", manualCycleTime.toString());
  }, [manualCycleTime]);

  useEffect(() => {
    localStorage.setItem("settings_farm_emergency", emergencyWatering ? "true" : "false");
  }, [emergencyWatering]);

  useEffect(() => {
    localStorage.setItem("settings_dash_layout", layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    localStorage.setItem("settings_refresh_rate", refreshRate);
  }, [refreshRate]);

  // Theme helper
  const handleThemeModeSelection = (mode: string) => {
    setThemeMode(mode);
    if (mode === "dark" && theme === "light") {
      onToggleTheme();
    } else if (mode === "light" && theme === "dark") {
      onToggleTheme();
    }
  };

  const handleResetSettings = () => {
    if (confirm("Restore all systems back to standard factory credentials?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleAddDeviceSim = () => {
    const id = `device-${Date.now().toString().slice(-4)}`;
    setTrustedDevices([
      ...trustedDevices,
      { id, name: "Remote Handheld Tablet", location: "Agronomist Mobile Node", status: "Just added" }
    ]);
  };

  const tabs = [
    { id: "appearance", label: "Appearance", icon: Sun, desc: "Light, Dark, and solar system syncing" },
    { id: "notifications", label: "Notifications", icon: Bell, desc: "Email, SMS, high priority push triggers" },
    { id: "ai", label: "AI Assistant", icon: Bot, desc: "Voice output, guidelines & recommendations" },
    { id: "farm", label: "Farm Controls", icon: Power, desc: "Irrigation cycles, manual timers & emergencies" },
    { id: "dashboard", label: "Dashboard Preferences", icon: Sliders, desc: "Interface compact ratios & speed refresh" },
    { id: "security", label: "Security & Devices", icon: Lock, desc: "Passphrases, trusted hardware nodes & logouts" },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2.5">
            <Settings className="w-5.5 h-5.5 text-emerald-400 rotate-45" />
            Consolidated OS System Center
          </h2>
          <p className="text-xs font-mono text-zinc-500 font-bold mt-1">
            Global configuration deck for AgroSensiX agricultural core engines & visual units.
          </p>
        </div>
        
        <button
          onClick={handleResetSettings}
          className="px-4 py-2 border border-zinc-900 hover:border-rose-500/30 bg-zinc-950 hover:bg-rose-950/15 text-[10px] font-mono uppercase text-zinc-400 hover:text-rose-400 rounded-xl flex items-center gap-2 transition-all self-start cursor-pointer shadow-sm hover:shadow-lg"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Factory Reset OS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Nav menu */}
        <div className="lg:col-span-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4.5 space-y-1.5 h-fit shadow-xl">
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 block px-3.5 mb-2.5 font-black">
            System Subsystems
          </span>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-colors border ${
                  isActive 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                  : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-200"
                } cursor-pointer`}
              >
                <div className={`p-1.5 rounded-lg border ${isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-350" : "bg-zinc-900/50 border-zinc-800 text-zinc-500"} transition-all`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-sans font-bold leading-tight">{tab.label}</p>
                  <p className="text-[9.5px] font-sans text-zinc-500 mt-1 truncate leading-none font-medium">{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Panel Body */}
        <div className="lg:col-span-8 bg-zinc-950/20 border border-zinc-900/60 rounded-3xl p-6.5 relative overflow-hidden shadow-xl min-h-[450px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* TAB 1: APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-zinc-900/60 pb-3">
                <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">Interface Appearance</h3>
                <p className="text-xs text-zinc-550 mt-1">Configure layout palettes, color rules & background contrast layers.</p>
              </div>

              <div className="space-y-5">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">Select Active Palette Theme</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Dark Mode */}
                  <button
                    onClick={() => handleThemeModeSelection("dark")}
                    className={`p-4.5 border rounded-2xl text-left transition-all ${
                      themeMode === "dark" 
                        ? "border-emerald-500/40 bg-emerald-950/10 text-emerald-400" 
                        : "border-zinc-900 bg-zinc-950/45 text-zinc-500 hover:border-zinc-850 hover:bg-zinc-950"
                    } cursor-pointer`}
                  >
                    <Moon className="w-5 h-5 mb-3" />
                    <p className="text-xs font-sans font-bold block uppercase leading-none">Dark Mode</p>
                    <span className="text-[10px] text-zinc-500 mt-1.5 block">High contrast neon greens for low-light crops monitoring.</span>
                  </button>

                  {/* Light Mode */}
                  <button
                    onClick={() => handleThemeModeSelection("light")}
                    className={`p-4.5 border rounded-2xl text-left transition-all ${
                      themeMode === "light" 
                        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" 
                        : "border-zinc-900 bg-zinc-950/45 text-zinc-500 hover:border-zinc-850 hover:bg-zinc-950"
                    } cursor-pointer`}
                  >
                    <Sun className="w-5 h-5 mb-3" />
                    <p className="text-xs font-sans font-bold block uppercase leading-none">Light Mode</p>
                    <span className="text-[10px] text-zinc-500 mt-1.5 block">Alpine white format ideal for high glare direct sunlight on fields.</span>
                  </button>

                  {/* System Mode Toggle */}
                  <button
                    onClick={() => handleThemeModeSelection("system_default")}
                    className={`p-4.5 border rounded-2xl text-left transition-all ${
                      themeMode === "system_default" 
                        ? "border-emerald-500/40 bg-zinc-900/50 text-emerald-400" 
                        : "border-zinc-900 bg-zinc-950/45 text-zinc-500 hover:border-zinc-850"
                    } cursor-pointer`}
                  >
                    <Compass className="w-5 h-5 mb-3" />
                    <p className="text-xs font-sans font-bold block uppercase leading-none">System Mode</p>
                    <span className="text-[10px] text-zinc-500 mt-1.5 block">Syncs with local system parameters or sunrise sunset intervals automatically.</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-zinc-900/60 pb-3">
                <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">Notification Channels</h3>
                <p className="text-xs text-zinc-550 mt-1">Route alert signals & farm emergency broadcasts to the right terminals.</p>
              </div>

              <div className="space-y-4">
                {/* Email Alerts */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-sans font-bold text-zinc-200 uppercase leading-none">Activate Email Alerts</h4>
                    <p className="text-[10.5px] text-zinc-500 mt-1.5">Receive daily agricultural summaries & critical event records in your inbox.</p>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`w-11 h-6 rounded-full transition-all relative ${emailAlerts ? "bg-emerald-500" : "bg-zinc-800"} cursor-pointer`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-zinc-950 transition-all ${emailAlerts ? "left-6" : "left-1"}`} />
                  </button>
                </div>

                {/* SMS Alerts */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-sans font-bold text-zinc-200 uppercase leading-none">Activate SMS Alerts</h4>
                    <p className="text-[10.5px] text-zinc-500 mt-1.5">Direct crop moisture emergencies wired straight to cell networks for instant warnings.</p>
                  </div>
                  <button
                    onClick={() => setSmsAlerts(!smsAlerts)}
                    className={`w-11 h-6 rounded-full transition-all relative ${smsAlerts ? "bg-emerald-500" : "bg-zinc-800"} cursor-pointer`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-zinc-950 transition-all ${smsAlerts ? "left-6" : "left-1"}`} />
                  </button>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-sans font-bold text-zinc-200 uppercase leading-none">Activate Push Notifications</h4>
                    <p className="text-[10.5px] text-zinc-500 mt-1.5">Enable persistent browser toasts for realtime water tank pressure readings.</p>
                  </div>
                  <button
                    onClick={() => setPushNotif(!pushNotif)}
                    className={`w-11 h-6 rounded-full transition-all relative ${pushNotif ? "bg-emerald-500" : "bg-zinc-800"} cursor-pointer`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-zinc-950 transition-all ${pushNotif ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI ASSISTANT */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-zinc-900/60 pb-3">
                <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">AI Expert Configuration</h3>
                <p className="text-xs text-zinc-550 mt-1">Control voice parameters & automated agronomist advice frequency.</p>
              </div>

              <div className="space-y-5">
                {/* Voice On-Off */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-sans font-bold text-zinc-200 uppercase leading-none flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      Voice Assistant Output (TTS)
                    </h4>
                    <p className="text-[10.5px] text-zinc-500 mt-1.5">Synthesize recommendations and read crop reports aloud when speaking.</p>
                  </div>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`w-11 h-6 rounded-full transition-all relative ${voiceEnabled ? "bg-emerald-500" : "bg-zinc-800"} cursor-pointer`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-zinc-950 transition-all ${voiceEnabled ? "left-6" : "left-1"}`} />
                  </button>
                </div>

                {/* Accent language selection */}
                <div className="space-y-2 font-mono">
                  <label className="text-[11px] text-zinc-400 uppercase tracking-wider block font-bold">Speech Accent Language</label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    className="bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-emerald-500/40 font-mono w-full"
                  >
                    <option value="en-US">English (Western Standard Accent)</option>
                    <option value="en-IN">English (Indian Subcontinent Accent)</option>
                    <option value="es-ES">Spanish (Castilian Regional Accent)</option>
                    <option value="pa-IN">Punjabi Voice Translation Mode</option>
                    <option value="hi-IN">Hindi Voice Translation Mode</option>
                  </select>
                </div>

                {/* Auto suggestions */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-sans font-bold text-zinc-200 uppercase leading-none">Auto Suggestions Engine</h4>
                    <p className="text-[10.5px] text-zinc-500 mt-1.5">Enable the background model to auto inject warning banners when dehydration occurs.</p>
                  </div>
                  <button
                    onClick={() => setAutoSuggestions(!autoSuggestions)}
                    className={`w-11 h-6 rounded-full transition-all relative ${autoSuggestions ? "bg-emerald-500" : "bg-zinc-800"} cursor-pointer`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-zinc-950 transition-all ${autoSuggestions ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FARM CONTROLS */}
          {activeTab === "farm" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-zinc-900/60 pb-3">
                <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">Farm Valve Controls</h3>
                <p className="text-xs text-zinc-555 mt-1">Govern physical ESP32 solenoid behavior and manual moisture triggers.</p>
              </div>

              <div className="space-y-5">
                {/* Auto Irrigation */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-sans font-bold text-zinc-200 uppercase leading-none">Auto Irrigation loops</h4>
                    <p className="text-[10.5px] text-zinc-500 mt-1.5">Trigger valves automatically when soil moisture sensor drops below threshold limit.</p>
                  </div>
                  <button
                    onClick={() => setAutoIrrigation(!autoIrrigation)}
                    className={`w-11 h-6 rounded-full transition-all relative ${autoIrrigation ? "bg-emerald-500" : "bg-zinc-800"} cursor-pointer`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-zinc-950 transition-all ${autoIrrigation ? "left-6" : "left-1"}`} />
                  </button>
                </div>

                {/* Manual cycle time */}
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between">
                    <label className="text-[11px] text-zinc-400 uppercase tracking-wider block font-bold">Manual Irrigation run-time</label>
                    <span className="text-xs text-emerald-400 font-bold">{manualCycleTime} Seconds</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="10"
                    value={manualCycleTime}
                    onChange={(e) => setManualCycleTime(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-550 block">Controls raw pulse length when clicking "Start Watering" on farm panels.</span>
                </div>

                {/* Emergency watering override */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-red-950/35 rounded-2xl text-left">
                  <div>
                    <h4 className="text-xs font-sans font-bold text-rose-400 uppercase leading-none flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 animate-pulse text-rose-500" />
                      Emergency Irrigation Shut-down
                    </h4>
                    <p className="text-[10.5px] text-zinc-500 mt-1.5">Immediately freeze all ongoing water flow events across greenhouses if leaks are detected.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEmergencyWatering(!emergencyWatering);
                      if (!emergencyWatering) {
                        alert("EMERGENCY PROTOCOL ACTIVATED. All hydraulic valves across Sector G14 and Orchard Groves are locked closed.");
                      }
                    }}
                    className={`w-11 h-6 rounded-full transition-all relative ${emergencyWatering ? "bg-red-500" : "bg-zinc-800"} cursor-pointer`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-zinc-950 transition-all ${emergencyWatering ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DASHBOARD PREFERENCES */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-zinc-900/60 pb-3">
                <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">Dashboard Preferences</h3>
                <p className="text-xs text-zinc-555 mt-1">Optimize display layouts & dynamic web polling rates.</p>
              </div>

              <div className="space-y-5">
                {/* Compact vs Expanded */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-zinc-405 uppercase tracking-wider block font-bold">Layout Density Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setLayoutMode("compact")}
                      className={`p-4 border rounded-2xl text-left transition-all ${
                        layoutMode === "compact" 
                          ? "border-emerald-500/40 bg-emerald-950/10 text-emerald-400 font-bold" 
                          : "border-zinc-900 bg-zinc-950/30 text-zinc-500 hover:border-zinc-800"
                      } cursor-pointer`}
                    >
                      <h5 className="text-xs leading-none uppercase">Compact Mode</h5>
                      <span className="text-[9.5px] text-zinc-555 block mt-2">Denser telemetry lists to inspect 12+ orchards simultaneously on screen.</span>
                    </button>

                    <button
                      onClick={() => setLayoutMode("expanded")}
                      className={`p-4 border rounded-2xl text-left transition-all ${
                        layoutMode === "expanded" 
                          ? "border-emerald-500/40 bg-emerald-950/10 text-emerald-400 font-bold" 
                          : "border-zinc-900 bg-zinc-950/30 text-zinc-500 hover:border-zinc-800"
                      } cursor-pointer`}
                    >
                      <h5 className="text-xs leading-none uppercase">Expanded Mode</h5>
                      <span className="text-[9.5px] text-zinc-555 block mt-2">Large content cards, generous negative space & high contrast visual graphs.</span>
                    </button>
                  </div>
                </div>

                {/* Refresh Speed */}
                <div className="space-y-2 font-mono">
                  <label className="text-[11px] text-zinc-405 uppercase tracking-wider block font-bold">Data Polling Rates (Refresh)</label>
                  <select
                    value={refreshRate}
                    onChange={(e) => setRefreshRate(e.target.value)}
                    className="bg-zinc-900/85 border border-zinc-805 text-xs text-zinc-100 py-2.5 px-3 rounded-lg focus:outline-none focus:border-emerald-500/40 font-mono w-full"
                  >
                    <option value="5s">Intense Poll Speed (Every 5 seconds - nominal peak load)</option>
                    <option value="15s">Standard Poll Speed (Every 15 seconds - optimal ratio)</option>
                    <option value="60s">Battery Eco Poll Speed (Every 1 minute - low power solar grid)</option>
                    <option value="manual">Manual Refresh (Fetch only on trigger commands)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-zinc-900/60 pb-3">
                <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">Security & Devices</h3>
                <p className="text-xs text-zinc-555 mt-1">Simulate secure password changes, monitor active ESP32 device keys & session logouts.</p>
              </div>

              <div className="space-y-5">
                {/* Passphrase form simulator */}
                <div className="p-4 bg-zinc-950/45 border border-zinc-900 rounded-2xl space-y-3 font-mono">
                  <h4 className="text-xs font-sans font-bold text-zinc-200 uppercase leading-none">Security passcode changer</h4>
                  <p className="text-[10px] text-zinc-500">Update the cryptographic passphrase used to verify offline access.</p>
                  
                  <div className="flex gap-2 text-xs">
                    <input
                      type="password"
                      placeholder="Enter new passphrase value"
                      className="flex-1 bg-neutral-950 border border-zinc-900 rounded-lg p-2 focus:outline-none focus:border-emerald-500/30 text-zinc-250 placeholder-zinc-800"
                      onChange={(e) => setPassphraseStatus(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!passphraseStatus.trim()) return;
                        alert("Passphrase updated successfully. Cached security modules refreshed.");
                      }}
                      className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg uppercase text-[9.5px] tracking-wider font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Device management lists */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11.5px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">Authorized Device Registry</label>
                    <button
                      onClick={handleAddDeviceSim}
                      className="text-[9.5px] font-mono text-emerald-400 hover:underline uppercase font-bold"
                    >
                      + Register Node
                    </button>
                  </div>

                  <div className="space-y-2">
                    {trustedDevices.map((device) => (
                      <div key={device.id} className="p-3 bg-zinc-950/50 border border-zinc-900 rounded-xl flex items-center justify-between text-xs">
                        <div className="text-left">
                          <span className="font-sans font-bold text-zinc-300 block">{device.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500 block leading-tight mt-1">{device.location} • ID: {device.id}</span>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 font-bold uppercase">{device.status}</span>
                          {device.id !== "device-2" && (
                            <button
                              onClick={() => {
                                setTrustedDevices(trustedDevices.filter(d => d.id !== device.id));
                              }}
                              className="text-[10px] font-mono text-rose-500 hover:text-rose-400 hover:underline cursor-pointer font-bold px-1"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
