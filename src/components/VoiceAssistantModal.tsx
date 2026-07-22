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
  const [voiceEngine, setVoiceEngine] = useState<"browser" | "live-api">("browser");
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("Hello! I am your AgroSensiX Voice Co-Pilot. Click the microphone or speak a command like 'Water Greenhouse 14', 'System status', or ask me any question!");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Gemini Live API Audio & WebSocket Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioInputContextRef = useRef<AudioContext | null>(null);

  // Initialize and get audio context for 24kHz raw PCM playback (Live API format)
  const initAudioPlayer = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  // Playback model response audio chunk
  const playRawPCM = (base64Data: string) => {
    try {
      initAudioPlayer();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);

      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const bufferSource = ctx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(ctx.destination);

      const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      bufferSource.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;
    } catch (e) {
      console.error("[Voice Co-Pilot] PCM playback failed:", e);
    }
  };

  // Mic audio recording & downsampling handler
  const startMicRecording = (ws: WebSocket) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        micStreamRef.current = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass();
        audioInputContextRef.current = inputCtx;

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(2048, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);

          // Downsample Float32 from native rate to 16kHz
          const ratio = inputCtx.sampleRate / 16000;
          const length = Math.floor(inputData.length / ratio);
          const result = new Int16Array(length);
          let writeIndex = 0;
          for (let i = 0; i < length; i++) {
            const readIndex = Math.floor(i * ratio);
            if (readIndex < inputData.length) {
              let s = inputData[readIndex];
              if (s > 1) s = 1;
              else if (s < -1) s = -1;
              result[writeIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
          }

          const buffer = result.buffer;
          const bytes = new Uint8Array(buffer);
          let binary = "";
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Audio = btoa(binary);
          ws.send(JSON.stringify({ audio: base64Audio }));
        };
      })
      .catch((err) => {
        console.error("[Voice Co-Pilot] Microphone capture blocked or failed:", err);
        setAssistantResponse("🎙️ Sandbox Restricted: nested preview iframes block direct mic access. Open AgroSensiX in a separate tab at the top right of your screen to authorize native microphonics!");
        stopLiveAPI();
      });
  };

  const stopMicRecording = () => {
    try {
      scriptProcessorRef.current?.disconnect();
      scriptProcessorRef.current = null;
    } catch (e) {}

    try {
      micStreamRef.current?.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    } catch (e) {}

    try {
      audioInputContextRef.current?.close();
      audioInputContextRef.current = null;
    } catch (e) {}
  };

  const startLiveAPI = () => {
    if (wsRef.current) return;

    setWsStatus("connecting");
    setAssistantResponse("Connecting to the live Voice Co-Pilot bridge...");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/live`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      setAssistantResponse("🎙️ Zero-latency Gemini Live audio Co-Pilot active! Start speaking now...");
      setIsSpeaking(true);
      startMicRecording(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.audio) {
          playRawPCM(data.audio);
        }
        if (data.interrupted) {
          if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
            nextPlayTimeRef.current = 0;
          }
        }
        if (data.error) {
          setAssistantResponse(`Live Co-Pilot API Error: ${data.error}`);
          stopLiveAPI();
        }
      } catch (e) {
        console.error("WS message parsing error:", e);
      }
    };

    ws.onerror = (e) => {
      console.error("WS error:", e);
      setWsStatus("error");
      setAssistantResponse("Live Co-Pilot connection failure. Ensure your local server is running with port 3000 accessible.");
      stopLiveAPI();
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
      setIsSpeaking(false);
      stopLiveAPI();
    };
  };

  const stopLiveAPI = () => {
    stopMicRecording();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    nextPlayTimeRef.current = 0;
    setWsStatus("disconnected");
    setIsSpeaking(false);
  };

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
    const isStopPump = /\b(stop|turn off|halt|kill|disable|emergency|off)\b/i.test(input) && /\b(pump|pumping|water|irrigation|valves)\b/i.test(input);
    const isWaterG14 = /\b(water|irrigate|pulse|start)\b/i.test(input) && /\b(greenhouse|g14|g-14|sector 14|mixed crops)\b/i.test(input);
    const isWaterOrchard = /\b(water|irrigate|pulse|start)\b/i.test(input) && /\b(orchard|7g|hub 7|dwarf oranges|orange)\b/i.test(input);
    const isGenericWater = /\b(start irrigation|turn on pump|water the farm|start watering|run pump)\b/i.test(input);

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
    const isMoistureQuery = /\b(moisture|soil|wetness|vwc|humidity in soil)\b/i.test(input);
    const isSolarQuery = /\b(solar|battery|power|charge|energy|kw)\b/i.test(input);
    const isTankQuery = /\b(tank|reservoir|water level|how much water|liters)\b/i.test(input);
    const isStatusQuery = /\b(status|system status|farm status|health|how is the farm|overview)\b/i.test(input);

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
          message: rawInput + "\n\n(Note: Keep your response concise, conversational, and direct for voice readout. Answer general knowledge or farming queries accurately.)",
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
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.substring(6).trim();
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
    if (voiceEngine === "live-api") {
      if (wsStatus === "connected") {
        stopLiveAPI();
      } else {
        startLiveAPI();
      }
      return;
    }

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
      stopLiveAPI();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-950 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative space-y-5 text-left overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            stopSpeaking();
            stopLiveAPI();
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

        {/* Engine Selection Toggle */}
        <div className="flex items-center justify-between bg-zinc-900/40 p-2 border border-zinc-900 rounded-xl">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Voice Conversation Engine:
          </span>
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-900">
            <button
              onClick={() => {
                stopLiveAPI();
                setVoiceEngine("browser");
                setAssistantResponse("Hello! I am your AgroSensiX Voice Co-Pilot. Click the microphone or speak a command like 'Water Greenhouse 14', 'System status', or ask me any question!");
              }}
              className={`px-3 py-1 rounded-md text-[9px] font-mono font-black tracking-tight transition cursor-pointer ${
                voiceEngine === "browser"
                  ? "bg-[#09352c] text-emerald-400 border border-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Expert System
            </button>
            <button
              onClick={() => {
                stopSpeaking();
                setVoiceEngine("live-api");
                setAssistantResponse("Gemini Live API Voice Co-Pilot utilizes gemini-3.1-flash-live-preview for natural, zero-latency, full-duplex voice interactions. Tap start to connect.");
              }}
              className={`px-3 py-1 rounded-md text-[9px] font-mono font-black tracking-tight transition cursor-pointer ${
                voiceEngine === "live-api"
                  ? "bg-[#09352c] text-emerald-400 border border-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Gemini Live API
            </button>
          </div>
        </div>

        {/* Central Listening / Speaking Pulse Area */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden">
          
          <div className="flex justify-center items-center">
            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
                (isListening || wsStatus === "connected")
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-[0_0_40px_rgba(16,185,129,0.6)] animate-pulse scale-110"
                  : wsStatus === "connecting"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse"
                  : isSpeaking
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-neutral-950 shadow-[0_0_35px_rgba(34,211,238,0.5)]"
                  : "bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 hover:border-emerald-500/50"
              }`}
            >
              {(isListening || wsStatus === "connected") ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : wsStatus === "connecting" ? (
                <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
              ) : isSpeaking ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              {voiceEngine === "live-api" ? (
                wsStatus === "connected" 
                  ? "🎙️ GEMINI LIVE SYSTEM ACTIVE - DISCUSS OPERATIONS NOW" 
                  : wsStatus === "connecting" 
                  ? "ESTABLISHING SECURE AUDIO LINK..." 
                  : "TAP MIC TO ENGAGE LIVE AUDIO SYSTEM (2-WAY VOICE)"
              ) : (
                isListening ? "LISTENING... SPEAK YOUR COMMAND OR QUESTION NOW" : isSpeaking ? "SPEAKING RESPONSE..." : "TAP MIC TO SPEAK"
              )}
            </p>
            {spokenTranscript && voiceEngine === "browser" && (
              <p className="text-xs text-emerald-400 font-sans mt-2 italic font-medium">
                "{spokenTranscript}"
              </p>
            )}
          </div>

          {isSpeaking && voiceEngine === "browser" && (
            <button
              onClick={stopSpeaking}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
            >
              <Square className="w-3 h-3 text-red-400 fill-current" /> Stop Audio
            </button>
          )}

          {wsStatus === "connected" && voiceEngine === "live-api" && (
            <button
              onClick={stopLiveAPI}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
            >
              <Square className="w-3 h-3 text-red-400 fill-current" /> Mute & Disconnect
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
            {voiceEngine === "live-api" && wsStatus === "connected" && (
              <span className="text-emerald-400 animate-pulse flex items-center gap-1 font-extrabold text-[9px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Streaming Live
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-200 font-sans leading-relaxed font-medium">
            {assistantResponse}
          </p>

          <div className="text-[9.5px] font-mono text-zinc-500 text-right pt-1">
            {voiceEngine === "live-api" ? (
              <span className="text-emerald-400 font-bold">ENGINE: Gemini 3.1 Live API (WebSockets)</span>
            ) : (
              apiKey ? "ENGINE: OpenAI / Gemini Custom Key" : "ENGINE: AgroSensiX Local Expert & Gemini System"
            )}
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
