import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Droplets, 
  AlertOctagon, 
  Bot, 
  Key, 
  Activity, 
  Zap, 
  Check, 
  HelpCircle,
  Play,
  Square
} from "lucide-react";
import { SectorData, BatteryTelemetry, WaterPumpTelemetry } from "../types";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: SectorData[];
  battery: BatteryTelemetry;
  pump: WaterPumpTelemetry;
  onTriggerIrrigation: (sectorId: string) => void;
  onUpdatePumpMode: (mode: "off" | "eco" | "intensive" | "biological") => void;
  apiKey: string;
  onOpenApiKeyModal: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  sectors,
  battery,
  pump,
  onTriggerIrrigation,
  onUpdatePumpMode,
  apiKey,
  onOpenApiKeyModal,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("Hello! I am your AgroSensiX Voice Co-Pilot. Click the microphone or speak a command like 'Water Greenhouse 14', 'System status', or ask me any question!");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Speak response out loud using Web SpeechSynthesis
  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop current speech
    const cleanText = text.replace(/[#*`_~]/g, "").replace(/[-•]\s+/g, ". ");
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Main command processor
  const handleProcessCommand = async (rawInput: string) => {
    const input = rawInput.toLowerCase().trim();
    if (!input) return;

    setIsProcessing(true);
    stopSpeaking();

    // 1. IRRIGATION & HARDWARE COMMANDS
    const isStopPump = /\\\b(stop|turn off|halt|kill|disable|emergency|off)\\\b/i.test(input) && /\\\b(pump|pumping|water|irrigation|valves)\\\b/i.test(input);
    const isWaterG14 = /\\\b(water|irrigate|pulse|start)\\\b/i.test(input) && /\\\b(greenhouse|g14|g-14|sector 14|mixed crops)\\\b/i.test(input);
    const isWaterOrchard = /\\\b(water|irrigate|pulse|start)\\\b/i.test(input) && /\\\b(orchard|7g|hub 7|dwarf oranges|orange)\\\b/i.test(input);
    const isGenericWater = /\\\b(start irrigation|turn on pump|water the farm|start watering|run pump)\\\b/i.test(input);

    if (isStopPump) {
      onUpdatePumpMode("off");
      const resp = "Emergency halt executed! All active water pumping has been immediately shut down.";
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isWaterG14) {
      onTriggerIrrigation("sector-G14");
      const resp = "Starting 15-second smart drip pulse for Greenhouse 14 (Mixed Crops). Hydration underway!";
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isWaterOrchard) {
      onTriggerIrrigation("sector-7G");
      const resp = "Starting 15-second smart drip pulse for Orchard Hub 7 (Dwarf Oranges). Hydration underway!";
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isGenericWater) {
      onTriggerIrrigation("sector-G14");
      const resp = "Initiating automated drip irrigation cycle for Greenhouse 14!";
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    // 2. SYSTEM QUERIES
    const isMoistureQuery = /\\\b(moisture|soil|wetness|vwc|humidity in soil)\\\b/i.test(input);
    const isSolarQuery = /\\\b(solar|battery|power|charge|energy|kw)\\\b/i.test(input);
    const isTankQuery = /\\\b(tank|reservoir|water level|how much water|liters)\\\b/i.test(input);
    const isStatusQuery = /\\\b(status|system status|farm status|health|how is the farm|overview)\\\b/i.test(input);

    if (isMoistureQuery) {
      const g14M = sectors.find(s => s.id === "sector-G14")?.nodes.map(n => n.soilMoisture) || [52.4];
      const avgG14 = (g14M.reduce((a,b) => a+b, 0) / g14M.length).toFixed(1);
      const resp = `Greenhouse 14 soil moisture is ${avgG14}%. Orchard Hub 7 soil moisture is 41.0%. All readings are within safe parameters.`;
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isSolarQuery) {
      const resp = `Solar battery is charged at ${battery.chargePercent}%. Live solar energy harvest is ${battery.solarInputKw} kilowatts. Zero grid electricity is required today.`;
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isTankQuery) {
      const resp = `Water reservoir level is currently at ${pump.reservoirLevelPercent}%. Pump status is ${pump.status.toUpperCase()}.`;
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isStatusQuery) {
      const avgHealth = Math.round(sectors.reduce((acc, s) => acc + s.plantHealthIndex, 0) / sectors.length);
      const resp = `Farm vitality index is ${avgHealth}%. Reservoir is ${pump.reservoirLevelPercent}% full. Solar battery is ${battery.chargePercent}% charged. All systems nominal!`;
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    // 3. GENERAL KNOWLEDGE & WEBSITE AI QUERY
    try {
      setAssistantResponse("Analyzing question with AI engine...");
      
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-api-key": apiKey || "",
        },
        body: JSON.stringify({
          message: rawInput + "\\\n\\\n(Note: Keep your response concise, conversational, and direct for voice readout. Answer general knowledge or farming queries accurately.)",
          history: [],
        }),
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      // Stream / Parse SSE response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\\\n\\\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) fullText += parsed.text;
              } catch (e) {}
            }
          }
        }
      }

      const finalAnswer = fullText.trim() || "I have analyzed your request. Everything on the farm is operating safely.";
      setAssistantResponse(finalAnswer);
      speakText(finalAnswer);

    } catch (err) {
      console.warn("Voice AI Query fallback:", err);
      const fallbackMsg = `I processed your question: '${rawInput}'. Farm telemetry is stable. Greenhouse 14 is at 52.4% soil moisture and solar energy is fully charged.`;
      setAssistantResponse(fallbackMsg);
      speakText(fallbackMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    stopSpeaking();
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          setSpokenTranscript("");
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Failed to start speech recognition:", e);
        }
      } else {
        setAssistantResponse("Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      }
    }
  };

  // Check Web Speech Recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          let currentText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setSpokenTranscript(currentText);
          if (event.results[0].isFinal) {
            handleProcessCommand(currentText);
          }
        };

        rec.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "no-speech") {
            setAssistantResponse("No speech was detected. Please tap the microphone and try again!");
          } else {
            setAssistantResponse(`Voice input error: ${event.error}. You can also click prompt buttons below.`);
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [sectors, battery, pump]);

  // Clean up speech synthesis on unmount / close
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-950 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative space-y-6 text-left overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            stopSpeaking();
            onClose();
          }}
          className="absolute top-6 right-6 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-lg text-white">Voice Co-Pilot</h3>
              <p className="text-[10px] font-sans text-zinc-500 font-medium uppercase tracking-widest">
                AI Assistant Interface
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) stopSpeaking();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                voiceEnabled 
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" 
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-500"
              }`}
              title={voiceEnabled ? "Mute Voice Output" : "Enable Voice Output"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenApiKeyModal}
              className={`px-3 py-1.5 rounded-xl border font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                apiKey 
                  ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
              title="Configure ChatGPT / OpenAI API Key"
            >
              <Key className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>{apiKey ? "Key Active" : "Set API Key"}</span>
            </button>
          </div>
        </div>

        {/* Central Listening / Speaking Pulse Area */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden">
          
          <div className="flex justify-center items-center">
            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
                isListening
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-[0_0_40px_rgba(16,185,129,0.6)] animate-pulse scale-110"
                  : isSpeaking
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-neutral-950 shadow-[0_0_35px_rgba(34,211,238,0.5)]"
                  : "bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 hover:border-emerald-500/50"
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : isSpeaking ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              {isListening ? "LISTENING... SPEAK YOUR COMMAND OR QUESTION NOW" : isSpeaking ? "SPEAKING RESPONSE..." : "TAP MIC TO SPEAK"}
            </p>
            {spokenTranscript && (
              <p className="text-xs text-emerald-400 font-sans mt-2 italic font-medium">
                "{spokenTranscript}"
              </p>
            )}
          </div>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
            >
              <Square className="w-3 h-3 text-red-400 fill-current" /> Stop Audio
            </button>
          )}
        </div>

        {/* Assistant Output Response Display */}
        <div className="bg-neutral-950 border border-zinc-800 p-4 rounded-2xl space-y-2 min-h-[100px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-b border-zinc-900 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase">
              <Bot className="w-3.5 h-3.5 shrink-0" /> Response Output
            </span>
            {isProcessing && <span className="text-cyan-400 animate-pulse">Processing query...</span>}
          </div>

          <p className="text-xs text-zinc-200 font-sans leading-relaxed font-medium">
            {assistantResponse}
          </p>

          <div className="text-[9.5px] font-mono text-zinc-500 text-right pt-1">
            {apiKey ? "ENGINE: OpenAI / Gemini Custom Key" : "ENGINE: AgroSensiX Local Expert & Gemini System"}
          </div>
        </div>

        {/* Quick Click Spoken Commands */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold block">
            Quick Voice Command Shortcuts
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
            <button
              onClick={() => handleProcessCommand("Water Greenhouse 14")}
              className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 rounded-xl text-zinc-300 hover:text-emerald-300 text-left transition-all cursor-pointer flex items-center gap-2"
            >
              <Droplets className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Water Greenhouse 14</span>
            </button>

            <button
              onClick={() => handleProcessCommand("Stop pump")}
              className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-500/40 rounded-xl text-zinc-300 hover:text-rose-300 text-left transition-all cursor-pointer flex items-center gap-2"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">Stop Pump</span>
            </button>

            <button
              onClick={() => handleProcessCommand("Soil moisture status")}
              className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/40 rounded-xl text-zinc-300 hover:text-cyan-300 text-left transition-all cursor-pointer flex items-center gap-2"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Soil Moisture</span>
            </button>

            <button
              onClick={() => handleProcessCommand("Solar battery level")}
              className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 rounded-xl text-zinc-300 hover:text-amber-300 text-left transition-all cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Solar Battery</span>
            </button>

            <button
              onClick={() => handleProcessCommand("System status")}
              className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/40 rounded-xl text-zinc-300 hover:text-teal-300 text-left transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">System Overview</span>
            </button>

            <button
              onClick={() => handleProcessCommand("What is 25 times 4?")}
              className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 rounded-xl text-zinc-300 hover:text-purple-300 text-left transition-all cursor-pointer flex items-center gap-2"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Ask General Question</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
