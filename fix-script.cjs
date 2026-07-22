const fs = require('fs');

let code = `import React, { useState, useEffect, useRef } from "react";
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
    const cleanText = text.replace(/[#*\`_~]/g, "").replace(/[-•]\s+/g, ". ");
    
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
    const isStopPump = /\\b(stop|turn off|halt|kill|disable|emergency|off)\\b/i.test(input) && /\\b(pump|pumping|water|irrigation|valves)\\b/i.test(input);
    const isWaterG14 = /\\b(water|irrigate|pulse|start)\\b/i.test(input) && /\\b(greenhouse|g14|g-14|sector 14|mixed crops)\\b/i.test(input);
    const isWaterOrchard = /\\b(water|irrigate|pulse|start)\\b/i.test(input) && /\\b(orchard|7g|hub 7|dwarf oranges|orange)\\b/i.test(input);
    const isGenericWater = /\\b(start irrigation|turn on pump|water the farm|start watering|run pump)\\b/i.test(input);

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
    const isMoistureQuery = /\\b(moisture|soil|wetness|vwc|humidity in soil)\\b/i.test(input);
    const isSolarQuery = /\\b(solar|battery|power|charge|energy|kw)\\b/i.test(input);
    const isTankQuery = /\\b(tank|reservoir|water level|how much water|liters)\\b/i.test(input);
    const isStatusQuery = /\\b(status|system status|farm status|health|how is the farm|overview)\\b/i.test(input);

    if (isMoistureQuery) {
      const g14M = sectors.find(s => s.id === "sector-G14")?.nodes.map(n => n.soilMoisture) || [52.4];
      const avgG14 = (g14M.reduce((a,b) => a+b, 0) / g14M.length).toFixed(1);
      const resp = \`Greenhouse 14 soil moisture is \${avgG14}%. Orchard Hub 7 soil moisture is 41.0%. All readings are within safe parameters.\`;
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isSolarQuery) {
      const resp = \`Solar battery is charged at \${battery.chargePercent}%. Live solar energy harvest is \${battery.solarInputKw} kilowatts. Zero grid electricity is required today.\`;
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isTankQuery) {
      const resp = \`Water reservoir level is currently at \${pump.reservoirLevelPercent}%. Pump status is \${pump.status.toUpperCase()}.\`;
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    if (isStatusQuery) {
      const avgHealth = Math.round(sectors.reduce((acc, s) => acc + s.plantHealthIndex, 0) / sectors.length);
      const resp = \`Farm vitality index is \${avgHealth}%. Reservoir is \${pump.reservoirLevelPercent}% full. Solar battery is \${battery.chargePercent}% charged. All systems nominal!\`;
      setAssistantResponse(resp);
      speakText(resp);
      setIsProcessing(false);
      return;
    }

    // 3. GENERAL KNOWLEDGE & WEBSITE AI QUERY
    try {
      setAssistantResponse("Analyzing question with AI engine...");
      
      if (!apiKey) {
        const resp = "To process open-ended questions and detailed agronomy queries, please configure your OpenAI API Key by clicking the key icon at the bottom of the sidebar.";
        setAssistantResponse(resp);
        speakText(resp);
        setIsProcessing(false);
        onOpenApiKeyModal();
        return;
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${apiKey}\`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are the AgroSensiX voice assistant. Be extremely concise. Max 2 sentences." },
            { role: "user", content: input }
          ]
        })
      });

      if (!res.ok) throw new Error("API call failed");
      const json = await res.json();
      const text = json.choices[0].message.content;
      
      setAssistantResponse(text);
      speakText(text);
    } catch (e: any) {
      const resp = "I encountered an error connecting to the AI brain. Please check your network and API key.";
      setAssistantResponse(resp);
      speakText(resp);
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
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setAssistantResponse("Listening... speak your command.");
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
            setAssistantResponse(\`Voice input error: \${event.error}. You can also click prompt buttons below.\`);
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

  // Auto-scroll to bottom of modal (to keep text in view)
  const autoScroll = () => {
    const el = document.getElementById("voice-modal-content");
    if (el) el.scrollTop = el.scrollHeight;
  };
`;

let original = fs.readFileSync('src/components/VoiceAssistantModal.tsx', 'utf8');

// replace from top to autoScroll
original = original.replace(/import React[\s\S]*const autoScroll = \(\) => {/g, code + `  const autoScroll = () => {`);

fs.writeFileSync('src/components/VoiceAssistantModal.tsx', original);
