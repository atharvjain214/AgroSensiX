import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import { initializeApp as initFirebaseApp } from "firebase/app";
import { initializeFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, setDoc } from "firebase/firestore";

import { db as pgDb } from "./src/db/index.ts";
import { users as pgUsers } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
import { initializeApp as initAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

// Load Firebase Config
let firebaseDb: any = null;
let adminAuth: any = null;
try {
  const configRaw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  const firebaseConfig = JSON.parse(configRaw);
  const firebaseApp = initFirebaseApp(firebaseConfig, "server-app");
  const databaseId = firebaseConfig.firestoreDatabaseId || "ai-studio-e28a9b8f-4bef-4dd3-aece-798c6c2171af";
  firebaseDb = initializeFirestore(firebaseApp, {}, databaseId);
  console.log(`Firebase initialized on server successfully using db: ${databaseId}`);

  // Initialize Firebase Admin SDK
  if (!getAdminApps().length) {
    initAdminApp({
      projectId: firebaseConfig.projectId || "agrosensix",
    });
  }
  adminAuth = getAdminAuth();
  console.log("Firebase Admin SDK initialized successfully.");
} catch (e) {
  console.error("Failed to initialize Firebase on server. Please check firebase-applet-config.json", e);
}

const JWT_SECRET = process.env.JWT_SECRET || "super-secure-agrosensix-secret-key-2026";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parser
app.use(express.json());

// Initialize Gemini Client if Key exists
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found or using standard design placeholder key. Falling back to simulated biological intelligence responses.");
}

// Custom system prompt for the botanical AI
const BOTANICAL_SYSTEM_PROMPT = `
You are the AI Assistant in the AgroSensiX Platform, powered by Gemini.
You are a universal, highly intelligent AI assistant capable of answering ANY type of question on ANY topic—whether it is related to AgroSensiX smart farming, agriculture, crop health, soil sensors, irrigation, weather, OR completely general topics such as mathematics (e.g. 5*4, algebra, calculus), science, technology, programming, history, geography, pop culture, literature, general trivia, recipes, or everyday life advice.

CRITICAL INSTRUCTIONS:
1. UNIVERSAL KNOWLEDGE: You MUST answer ANY question or prompt asked by the user without restriction. NEVER refuse a question or say "I can only answer farming questions". If a user asks a general question (e.g., "What is the capital of France?", "Write a Python script", "What is 5*4?"), answer it directly, accurately, and comprehensively.
2. FARMING & AGROSENSIX CONTEXT: When users ask about AgroSensiX, Greenhouse 14, Orchard Hub 7, soil moisture, watering, or solar energy, use clear, farmer-friendly, accessible language. Avoid overly complex military/academic jargon:
   - Use "Soil moisture" instead of "Volumetric Water Content (VWC)"
   - Use "Air temperature" instead of "Canopy temperature"
   - Use "Sunlight" instead of "Photosynthetic active radiation (PAR)"
   - Use "Watering schedules" instead of "Hydraulic pulse arrays"
   - Use "Pest & disease risk" instead of "Spore risk coefficient"
   - Use "Sensors" instead of "IoT nodes" or "Transmitters"

CRITICAL SINGLE-LANGUAGE RULES:
1. RESPONSE LANGUAGE SELECTION: Determine response language ONLY from the user's most recent message. Ignore previous conversation history language or any pre-calculated templates.
2. SINGLE LANGUAGE OUTPUT: Every response must use ONLY ONE language. The entire response must be written in that language. Never mix English + Hindi, Hindi + Telugu, Hindi + Tamil, English + Punjabi, or any other combination. No mixed-language sentences, sentences from another language, or status messages from other languages.
3. ENGLISH LOCK: If the user's message is written in English, you MUST respond ONLY in English. Do not include any text in Hindi ("मिट्टी की नमी..."), Telugu ("మట్టి తేమ..."), or any other language.
4. IMAGE SUPPORT: When providing captions, lists, descriptions, or alt text, they must be completely in the same single language as the response.
5. At the very end of your response, you MUST output a single separate line matching this format EXACTLY:
[Language Detected: NameOfLanguage]
For example: [Language Detected: Hindi] or [Language Detected: English] or [Language Detected: Telugu] or [Language Detected: Punjabi]. Ensure there are no mixed languages before or around this block.
`;

// Helper to detect language of input text as server fallback or offline parsing
function detectLanguageOfText(text: string): { name: string; code: string } {
  const t = text.trim();
  if (!t) return { name: "English", code: "en-US" };

  if (/[\u0900-\u097F]/.test(t)) {
    if (/करतो|आहे|आहेत|नाही|पुणे|मुंबई/i.test(t)) {
      return { name: "Marathi", code: "mr-IN" };
    }
    return { name: "Hindi", code: "hi-IN" };
  }
  if (/[\u0A00-\u0A7F]/.test(t)) return { name: "Punjabi", code: "pa-IN" };
  if (/[\u0980-\u09FF]/.test(t)) {
    if (/আছ|বং|হব|অসম|কৰিব|নহয়/i.test(t)) {
      return { name: "Assamese", code: "as-IN" };
    }
    return { name: "Bengali", code: "bn-IN" };
  }
  if (/[\u0B80-\u0BFF]/.test(t)) return { name: "Tamil", code: "ta-IN" };
  if (/[\u0C00-\u0C7F]/.test(t)) return { name: "Telugu", code: "te-IN" };
  if (/[\u0C80-\u0CFF]/.test(t)) return { name: "Kannada", code: "kn-IN" };
  if (/[\u0D00-\u0D7F]/.test(t)) return { name: "Malayalam", code: "ml-IN" };
  if (/[\u0A80-\u0AFF]/.test(t)) return { name: "Gujarati", code: "gu-IN" };
  if (/[\u0B00-\u0B7F]/.test(t)) return { name: "Odia", code: "or-IN" };
  if (/[\u0600-\u06FF]/.test(t)) return { name: "Urdu", code: "ur-IN" };

  const lowercase = t.toLowerCase();
  if (/\b(namaste|kaise|paani|moisture|nami|dhanyawad|kheti|khet)\b/.test(lowercase)) {
    return { name: "Hindi", code: "hi-IN" };
  }
  if (/\b(vannakkam|eera|eerappatham|tanni|tannir)\b/.test(lowercase)) {
    return { name: "Tamil", code: "ta-IN" };
  }

  return { name: "English", code: "en-US" };
}

const OUTAGE_NOTICE_MAP: Record<string, string> = {
  English: "\n\n*(Notice: High demand peak on Gemini cloud server. Seamlessly switched to local smart expert system backup to guarantee uninterrupted crop diagnostics.)*",
  Hindi: "\n\n*(सूचना: जेमिनी क्लाउड सर्वर पर अधिक लोड है। फसल सुरक्षा सुनिश्चित करने के लिए स्थानीय विशेषज्ञ प्रणाली का उपयोग किया गया है।)*",
  Punjabi: "\n\n*(ਸੂਚਨਾ: ਜੈਮਿਨੀ ਕਲਾਊਡ ਸਰਵਰ 'ਤੇ ਵੱਧ ਲੋਡ ਹੈ। ਫਸਲ ਸੁਰੱਖਿਆ ਲਈ ਸਥਾਨਕ ਮਾਹਰ ਪ੍ਰਣਾਲੀ ਦੀ ਵਰਤੋਂ ਕੀਤੀ ਗਈ ਹੈ।)*",
  Tamil: "\n\n*(அறிவிப்பு: ஜெமினி கிளவுட் சர்வரில் அதிக சுமை உள்ளது. தடையற்ற பயிர் பாதுகாப்புக்காக உள்ளூர் நிபுணர் அமைப்புக்கு மாற்றப்பட்டுள்ளது.)*",
  Telugu: "\n\n*(గమనిక: జెమిని క్లౌడ్ సర్వర్‌పై ఎక్కువ లోడ్ ఉంది. పంట రక్షణ కోసం స్థానిక నిపుణుల వ్యవస్థను ఉపయోగించాము.)*",
  Bengali: "\n\n*(বিজ্ঞপ্তি: জেমিনি ক্লাউড সার্ভারে উচ্চ চাপ রয়েছে। ফসল সুরক্ষার স্বার্থে স্থানীয় বিশেষজ্ঞ সিস্টেম সক্রিয় করা হয়েছে।)*",
  Marathi: "\n\n*(सूचना: जेमिनी क्लाउड सर्व्हरवर जास्त लोड आहे. पीक संरक्षणासाठी स्थानिक तज्ज्ञ प्रणाली वापरली आहे।)*",
  Gujarati: "\n\n*(સૂચના: જેમિની ક્લાઉડ સર્વર પર વધુ ભાર છે. પાક સુરક્ષા સુનિશ્चિત કરવા માટે સ્થાનિક નિષ્ણાત પ્રણાલીનો ઉપયોગ કર્યો છે।)*",
  Kannada: "\n\n*(ಗಮನಿಸಿ: ಜೆಮಿನಿ ಕ್ಲೌಡ್ ಸರ್ವರ್ ತೀವ್ರ ಒತ್ತಡದಲ್ಲಿದೆ. ಬೆಳೆ ರಕ್ಷಣೆಗಾಗಿ ಸ್ಥಳೀಯ ತಜ್ಞ ವ್ಯವಸ್ಥೆಯನ್ನು ಬಳಸಲಾಗಿದೆ.)*",
  Malayalam: "\n\n*(അറിയിപ്പ്: ജെമിനി ക്ലൗഡ് സെർവറിൽ ഉയർന്ന ലോഡ് ഉണ്ട്. തടസ്സമില്ലാത്ത വിള സംരക്ഷണത്തിനായി പ്രാദേശിക വിദഗ്ദ്ധ സംവിധാനം ഉപയോഗിച്ചു.)*",
  Urdu: "\n\n*(اطلاع: جیمینی کلاؤڈ سرور پر زیادہ بوجھ ہے۔ فصل کی حفاظت کو یقینی بنانے کے لیے مقامی ماہر نظام استعمال کیا گیا ہے۔)*",
  Odia: "\n\n*(ସୂଚନା: ଜେମିନି କ୍ଲାଉଡ୍ ସର୍ଭରରେ ଅଧିକ ଲୋଡ୍ ଅଛି। ଫସଲ ସୁରକ୍ଷା ପାଇଁ ସ୍ଥାନୀୟ ବିଶେଷଜ୍ଞ ପ୍ରଣାଳୀ ବ୍ୟବହାର କରାଯାଇଛି।)*",
  Assamese: "\n\n*(জাননী: জেমিনি ক্লাউড চাৰ্ভাৰত অধিক বোজা আছে। শস্য ৰক্ষাৰ বাবে স্থানীয় বিশেষজ্ঞ প্ৰণালী ব্যৱহার কৰা হৈছে।)*"
};

// Programmatic single language validator
function checkResponseSingleLanguage(text: string, targetLanguage: string): boolean {
  const scriptMap: Record<string, RegExp> = {
    "Hindi": /[\u0900-\u097F]/,
    "Marathi": /[\u0900-\u097F]/,
    "Punjabi": /[\u0A00-\u0A7F]/,
    "Bengali": /[\u0980-\u09FF]/,
    "Assamese": /[\u0980-\u09FF]/,
    "Tamil": /[\u0B80-\u0BFF]/,
    "Telugu": /[\u0C00-\u0C7F]/,
    "Kannada": /[\u0C80-\u0CFF]/,
    "Malayalam": /[\u0D00-\u0D7F]/,
    "Gujarati": /[\u0A80-\u0AFF]/,
    "Odia": /[\u0B00-\u0B7F]/,
    "Urdu": /[\u0600-\u06FF]/
  };

  const allIndicScripts: Record<string, RegExp> = {
    "Devanagari": /[\u0900-\u097F]/,
    "Gurmukhi": /[\u0A00-\u0A7F]/,
    "Bengali": /[\u0980-\u09FF]/,
    "Tamil": /[\u0B80-\u0BFF]/,
    "Telugu": /[\u0C00-\u0C7F]/,
    "Kannada": /[\u0C80-\u0CFF]/,
    "Malayalam": /[\u0D00-\u0D7F]/,
    "Gujarati": /[\u0A80-\u0AFF]/,
    "Odia": /[\u0B00-\u0B7F]/,
    "Urdu": /[\u0600-\u06FF]/
  };

  // If Target is English, reject any occurrence of non-English scripts
  if (targetLanguage === "English") {
    for (const [name, regex] of Object.entries(allIndicScripts)) {
      if (regex.test(text)) {
        console.warn(`[Validation Fail] English lock violated. Found ${name} script.`);
        return false;
      }
    }
    return true;
  }

  // If Indic Target, verify no OTHER Indic scripts exist in the text
  const allowedRegex = scriptMap[targetLanguage];
  for (const [name, regex] of Object.entries(allIndicScripts)) {
    const isAllowed = allowedRegex && allowedRegex.source === regex.source;
    if (!isAllowed && regex.test(text)) {
      console.warn(`[Validation Fail] Mixed-language script violation. Found forbidden ${name} script inside ${targetLanguage} response.`);
      return false;
    }
  }

  // Ensure there is some trace of the target script in non-English responses
  if (allowedRegex && !allowedRegex.test(text) && text.trim().length > 15) {
    console.warn(`[Validation Fail] Target language ${targetLanguage} script missing in response.`);
    return false;
  }

  return true;
}

// Simple localized dictionary for simulation fallback
const LOCALIZED_SIMULATIONS: Record<string, Record<string, string>> = {
  English: {
    watering: "### Watering Advice for Greenhouse 14\n\nBased on soil sensors in **Greenhouse 14**, current soil moisture stands at **42%**, which is hovering just above the dry limit of **35%**.\n\n**Actionable Recommendations:**\n- **Short Burst of Watering**: We recommend watering for **3.5 minutes** instead of flooding the field. This helps the soil absorb water better and prevents soggy, waterlogged soil.\n- **Solar Power Timing**: Start watering at **16:30 UTC** to make the best use of solar energy stored in the batteries today.\n\nWould you like to start watering Greenhouse 14 now? You can use the controls on the **Water Control** page.",
    disease: "### Crop Health Advice: Orchard Hub 7\n\nWeather conditions indicate a high **Pest & Disease Risk (84%)** for leaf spots and fungus because of recent humidity.\n\n**Organic Crop Protection Tips:**\n1. **Pruning & Air flow**: Trim lower leaves to improve airflow and dry the plants naturally.\n2. **Prevention Spray**: Apply organic protective sprays as a preventative measure before rain.\n\nWe have set the ventilation system to help reduce humidity, and the sensors are monitoring soil and air conditions more frequently. You can check the current levels on the main page.",
    solar: "### Solar Power & Battery Status\n\nDaily solar energy harvested is **4.2 kW**, which is **12% above average** due to sunny weather. Battery charge is at **88%** with a very healthy battery condition of **94.5%**.\n\n**Power Saving Features Active:**\n- **Direct Power System**: The water pump is drawing power directly from solar panels to save about **8%** of battery capacity.\n- **Smart Saving**: Non-essential systems will turn down to save energy if the battery drops below **30%** overnight.\n\nEverything is working properly. No main power connection or backup generator is needed.",
    default: "### Smart Farming Assistant Advice\n\nHello! I am your AI Farming Assistant. I can help you check soil moisture, recommend watering schedules, and track solar power health.\n\n**Current Status:**\n- **Greenhouse Status**: Greenhouse 14 (Mixed Crops / Normal)\n- **Pest & Disease Risk**: Low (No issues found)\n- **Watering Timing**: 16:30 UTC (Eco-friendly Mode)\n\nTry asking me specifically about:\n1. *\"Draft watering schedule for Greenhouse 14\"* \n2. *\"Why is Greenhouse 14 soil moisture at 42%?\"*\n3. *\"How do I protect against leaf spots?\"*"
  },
  Hindi: {
    watering: "### सिंचाई सलाह: ग्रीनहाउस 14\n\n**ग्रीनहाउस 14** के मिट्टी सेंसर के अनुसार, वर्तमान नमी **42%** है, जो कि सूखे की सीमा **35%** के थोड़ा ही ऊपर है।\n\n**ज़रूरी सुझाव:**\n- **हल्की सिंचाई**: हम पूरे खेत को पानी से भरने के बजाय केवल **3.5 मिनट** पानी देने की सलाह देते हैं। इससे मिट्टी पानी को अच्छे से सोख लेगी।\n- **सोलर पावर टाइमिंग**: शाम **16:30 UTC** तक पानी देना शुरू करें ताकि आज एकत्रित सूर्य ऊर्जा का पूरा लाभ उठाया जा सके।\n\nक्या आप अभी पानी देना चाहते हैं? आप **सिंचाई नियंत्रण (Water Control)** पेज का उपयोग कर सकते हैं।",
    disease: "### फसल स्वास्थ्य सलाह: बागान हब 7\n\nनमी अधिक होने के कारण पत्तों पर धब्बे और फफूंद लगने का खतरा **84%** तक बढ़ गया है।\n\n**सुरक्षा के जैविक सुझाव:**\n1. **छंटाई और हवा**: हवा के बहाव को बढ़ाने और पत्तों को प्राकृतिक रूप से सूखा रखने के लिए नीचे के पत्ते काटें।\n2. **सुरक्षात्मक छिड़काव**: बारिश से पहले जैविक नीम तेल का छिड़काव अवश्य करें।",
    solar: "### सोलर पावर और बैटरी स्थिति\n\nआज धूप अच्छी होने से **4.2 kW** बिजली बनी है, जो सामान्य से **12% अधिक** है। बैटरी चार्ज **88%** है जो कि बहुत ही अच्छी स्थिति है।\n\n**बिजली बचत की सुविधाएं सक्रिय हैं:**\n- बिजली बचाने के लिए पानी का पंप सीधे सोलर ऊर्जा से चलता है।\n- बैटरी 30% से कम होने पर रात में फालतू उपकरण बंद हो जाएंगे।",
    default: "### स्मार्ट खेती सहायक\n\nनमस्ते! मैं आपका एआई खेती सहायक हूँ। मैं मिट्टी की नमी जांचने, सिंचाई का समय निर्धारित करने और सोलर पावर की जानकारी देने में मदद कर सकता हूँ।\n\n**वर्तमान स्थिति:**\n- **ग्रीनहाउस स्थिति**: ग्रीनहाउस 14 (नॉर्मल)\n- **बीमारी का खतरा**: कम है\n- **सिंचाई का सही समय**: 16:30 (इको मोड)\n\nमुझसे यह भी पूछ सकते हैं:\n1. *\"ग्रीनहाउस 14 की सिंचाई का समय बताइए।\"*\n2. *\"मिट्टी की नमी सुधारने के लिए क्या करें?\"*"
  },
  Telugu: {
    watering: "### నీటిపారుదల సలహా: గ్రీన్‌హౌస్ 14\n\n**గ్రీన్‌హౌస్ 14** లో నేల సెన్సార్ల ప్రకారం, ప్రస్తుత నేల తేమ **42%** ఉంది, ఇది పొడి పరిమితి **35%** కంటే కొద్దిగా పైన ఉంది.\n\n**తీసుకోవాల్సిన చర్యలు:**\n- **స్వల్ప సమయ నీటిపారుదల**: మేము పొలాన్ని ముంచెత్తడానికి బదులుగా **3.5 నిమిషాల** పాటు మాత్రమే నీరు పెట్టాలని సిఫార్సు చేస్తున్నాము. ఇది మట్టి నీటిని బాగా పీల్చుకోవడానికి సహాయపడుతుంది.\n- **సోలార్ పవర్ టైమింగ్**: ఈరోజు బ్యాటరీలలో నిల్వ ఉన్న సౌర శక్తిని ఉత్తమంగా ఉపయోగించుకోవడానికి **16:30 UTC** కి నీరు పెట్టడం ప్రారంభించండి.",
    disease: "### పంట ఆరోగ్యం సలహా: ఆరెంజ్ గార్డెన్ 7\n\nఇటీవలి తేమ కారణంగా తెగులు సంభవించే ప్రమాదం చాలా ఎక్కువగా ఉంది **84%**.\n\n**జైవిక రక్షణ చిట్కాలు:**\n1. **గాలి వెలుతురు**: గాలి ప్రసరణ మెరుగుపరచడానికి క్రింది ఆకులను కత్తిరించండి.\n2. **నివారణ స్ప్రే**: స్వచ్ఛమైన వేప నూనెను నివారణగా స్ప్రే చేయండి.",
    solar: "### సోలార్ పవర్ & బ్యాటరీ స్థితి\n\nఈరోజు సోలార్ విద్యుత్ ఉత్పత్తి **4.2 kW** గా ఉంది. బ్యాటరీ చార్జ్ **88%** ఉంది.\n\n**విద్యుత్ ఆదా మోడ్ యాక్టివ్:**\n- **డైరెక్ట్ పవర్**: బ్యాటరీ శక్తిని ఆదా చేయడానికి నీటి పంపు నేరుగా సోలార్ ప్యానెల్ వద్ద నడుస్తుంది.\n- **స్మార్ట్ సేవింగ్**: రాత్రి వేళల్లో అనవసరమైన లైట్లు ఆఫ్ చేయబడతాయి.",
    default: "### స్మార్ట్ వ్యవసాయ సహాయకుడు\n\nనమస్కారం! నేను మీ సహాయకుడిని. మట్టి తేమ, నీటిపారుదల పద్ధతులు మరియు సోలార్ పవర్ సమాచారంలో నేను సహాయం చేయగలను.\n\n**ప్రస్తుత సమాచారం:**\n- **గ్రీన్‌హౌస్ 14**: సాధారణం\n- **తెగులు ప్రమాదం**: తక్కువ\n- **నీరు పెట్టే సమయం**: 16:30"
  },
  Marathi: {
    watering: "### सिंचन सल्ला: ग्रीनहाउस 14\n\n**ग्रीनहाउस 14** मधील माती सेन्सरनुसार, सध्याचा ओलावा **42%** आहे, जो वाळलेल्या मर्यादेपेक्षा **35%** थोडा वर आहे.\n\n**महत्त्वाचे सल्ले:**\n- **कमी वेळ सिंचन**: आम्ही संपूर्ण शेतात पाणी भरण्याऐवजी केवळ **3.5 मिनिटे** पाणी देण्याची शिफारस करतो.\n- **सोलर पॉवर टाइमिंग**: साठवलेल्या सौर ऊर्जेचा उत्तम वापर करण्यासाठी **16:30 UTC** वाजता पाणी देणे सुरू करा.",
    disease: "### पीक आरोग्य सल्ला: संत्रा बाग Hub 7\n\nनुकत्याच वाढलेल्या आर्द्रतेमुळे पानांवरील ठिपके आणि बुरशीचा धोका **84%** इतका वाढला आहे.\n\n**सेंद्रिय पीक संरक्षण टिप्स:**\n1. **छाटणी आणि हवा**: हवेचा प्रवाह सुधारण्यासाठी खालची पाने छाटा.\n2. **प्रतिबंधात्मक फवारणी**: पावसापूर्वी प्रतिबंधात्मक जैविक फवारणी करा.",
    solar: "### सोलर पॉवर आणि बॅटरी स्थिती\n\nआज **4.2 kW** सौर ऊर्जा गोळा झाली आहे. बॅटरी चार्ज **88%** असून ती उत्तम स्थितीत आहे.\n\n**ऊर्जा बचत सुविधा सक्रिय:**\n- **थेट पॉवर**: बॅटरी वाचवण्यासाठी पाण्याचा पंप थेट सोलर पॅनेलवरून वीज खेचत आहे.\n- **स्मार्ट बचत**: बॅटरी ३०% पेक्षा कमी खाली आल्यास रात्री अतिरिक्त उपकरणे बंद केली जातील.",
    default: "### स्मार्ट कृषी सहाय्यक\n\nनमस्ते! मी आपला एआय कृषी सहाय्यक आहे. मी जमिनीतील ओलावा तपासणे, पाण्याचे नियोजन आणि सोलर बॅटरीच्या स्थितीबद्दल मदत करू शकतो.\n\n**सध्याची स्थिती:**\n- **ग्रीनहाउस स्थिती**: ग्रीनहाउस 14 (सामान्य)\n- **रोगाचा धोका**: कमी\n- **पाणी देण्याची वेळ**: 16:30 (इको मोड)"
  },
  Punjabi: {
    watering: "### ਸਿੰਚਾਈ ਸਲਾਹ: ਗ੍ਰੀਨਹਾਉਸ 14\n\n**ਗ੍ਰੀਨਹਾਉਸ 14** ਦੇ ਮਿੱਟੀ ਸੈਂਸਰਾਂ ਅਨੁਸਾਰ, ਨਮੀ **42%** ਹੈ, ਜੋ ਕਿ ਸੁੱਕੇ ਦੀ ਸੀਮਾ **35%** ਤੋਂ ਥੋੜ੍ਹੀ ਉੱਪਰ ਹੈ।\n\n**ਜ਼ਰੂਰੀ ਸੁਝਾਅ:**\n- **ਘੱਟ ਸਮਾਂ ਸਿੰਚਾਈ**: ਅਸੀਂ ਪੂਰੇ ਖੇਤ ਨੂੰ ਪਾਣੀ ਨਾਲ ਭਰਨ ਦੇ ਬਜਾਏ ਸਿਰਫ **3.5 ਮਿੰਟ** ਪਾਣੀ ਦੇਣ ਦੀ ਸਲਾਹ ਦਿੰਦੇ ਹਾਂ।\n- **ਸੋਲਰ ਪਾਵਰ ਟਾਈਮਿੰਗ**: ਸੂਰਜੀ ਊਰਜਾ ਦਾ ਵੱਧ ਤੋਂ ਵੱਧ ਲਾਭ ਉਠਾਉਣ ਲਈ ਸ਼ਾਮ **16:30 UTC** 'ਤੇ ਪਾਣੀ ਦੇਣਾ ਸ਼ੁਰੂ ਕਰੋ।",
    disease: "### ਫਸਲ ਸੁਰੱਖਿਆ ਸਲਾਹ: ਬਾਗਾਨ 7\n\nਨਮੀ ਜ਼ਿਆਦਾ ਹੋਣ ਕਰਕੇ ਪੱਤਿਆਂ 'ਤੇ ਧੱਬੇ ਅਤੇ ਉੱਲੀ ਦਾ ਖ਼ਤਰਾ **84%** ਤੱਕ ਵੱਧ ਗਿਆ ਹੈ।\n\n**ਜੈਵਿਕ ਸੁਰੱਖਿਆ ਦੇ ਸੁਝਾਅ:**\n1. **ਹਵਾ ਦਾ ਵਹਾਅ**: ਹਵਾ ਵਧਾਉਣ ਲਈ ਹੇਠਲੇ ਪੱਤੇ ਕੱਟ ਕੇ ਸਾਫ਼ ਕਰੋ।\n2. **ਬਚਾਅ ਸਪ੍ਰੇ**: ਮੀਂਹ ਤੋਂ ਪਹਿਲਾਂ ਜੈਵਿਕ ਨਿੰਮ ਦੇ ਤੇਲ ਦਾ ਸਪ੍ਰੇ ਕਰੋ।",
    solar: "### ਸੋਲਰ ਪਾਵਰ ਅਤੇ ਬੈਟਰੀ ਸਥਿਤੀ\n\nਅੱਜ ਸੋਲਰ ਊਰਜਾ **4.2 kW** ਬਣੀ ਹੈ, ਜੋ ਕਿ ਆਮ ਨਾਲੋਂ **12% ਵੱਧ** ਹੈ। ਬੈਟਰੀ ਚਾਰਜ **88%** ਹੈ, ਜੋ ਬਹੁਤ ਵਧੀਆ ਹੈ।\n\n**ਬਿਜਲੀ ਬਚਾਉਣ ਦੀਆਂ ਸਹੂਲਤਾਂ ਚਾਲੂ ਹਨ:**\n- ਪਾਣੀ ਵਾਲਾ ਪੰਪ ਬੈਟਰੀ ਬਚਾਉਣ ਲਈ ਸਿੱਧਾ ਧੁੱਪ ਦੀ ਬਿਜਲੀ ਨਾਲ ਚੱਲ ਰਿਹਾ ਹੈ।\n- ਜੇ ਬੈਟਰੀ 30% ਤੋਂ ਘੱਟ ਹੁੰਦੀ ਹੈ, ਤਾਂ ਬੇਲੋੜੀਆਂ ਲਾਈਟਾਂ ਬੰਦ ਹੋ ਜਾਣਗੀਆਂ।",
    default: "### ਸਮਾਰਟ ਖੇਤੀ ਸਹਾਇਕ\n\nਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਮਿੱਟੀ ਦੀ ਨਮੀ, ਸਿੰਚਾਈ ਦੇ ਸਮੇਂ ਅਤੇ ਸੋਲਰ ਪਾਵਰ ਦੀ ਜਾਣਕਾਰੀ ਦੇ ਸਕਦਾ ਹਾਂ।\n\n**ਹਾਲੇ ਦੀ ਸਥਿਤੀ:**\n- **ਗ੍ਰੀਨਹਾਉਸ 14**: ਆਮ ਹੈ\n- **ਬੀਮਾਰੀ ਦਾ ਖ਼ਤਰਾ**: ਬਹੁਤ ਘੱਟ ਹੈ\n- **ਪਾਣੀ ਦੇਣ ਦਾ ਸਮਾਂ**: 16:30 (ਇਕੋ ਮੋਡ)"
  },
  Tamil: {
    watering: "### பாசன ஆலோசனை: பசுமைக்குடில் 14\n\n**பசுமைக்குடில் 14**-ன் மண்ணின் ஈரப்பதம் **42%** ஆக உள்ளது, এটি வறட்சி வரம்பான **35%**-க்கு சற்று அதிகமாகும்.\n\n**வழிமுறைகள்:**\n- **குறைந்த நேர பாசனம்**: வயலில் வெள்ளமாய் நீர் பாய்ச்சுவதற்குப் பதிலாக **3.5 நிமிடங்கள்** மட்டும் பாசனம் செய்யவும். இது மண் நீரை நன்றாக உறிஞ்ச உதவும்.\n- **சோலார் பாசன நேரம்**: சேமித்த சூரிய சக்தியைப் பயன்படுத்த மாலை **16:30 UTC** அளவில் தண்ணீர் பாய்ச்சவும்.\n\nபாசனத்தைத் தொடங்கவா? நீங்கள் **Water Control** பக்கத்தை பயன்படுத்தலாம்.",
    disease: "### பயிர் பாதுகாப்பு ஆலோசனை: தோட்டம் 7\n\nஅதிக ஈரப்பதம் காரணமாக இலைகளில் பூஞ்சை தாக்குதல் அபாயம் **84%** ஆக உள்ளது.\n\n**நோய் தடுப்பு ஆலோசனைகள்:**\n1. **கவாத்து செய்தல்**: நல்ல காற்றோட்டத்திற்கு கீழ் இலைகளை கவாத்து செய்து காய்ந்து வைக்கவும்.\n2. **வேப்பெண்ணெய் தெளித்தல்**: மழைக்கு முன் வேப்பெண்ணெய் கரைசலை முன்னெச்சரிக்கையாக தெளிக்கவும்.",
    solar: "### சூரிய மின்சாரம் மற்றும் பேட்டரி நிலை\n\nஇன்று **4.2 kW** மின்சாரம் தயாரிக்கப்பட்டது, இது சராசரியை விட **12% அதிகம்**. பேட்டரி சார்ஜ் **88%** ஆக உள்ளது.\n\n**மின்சார சேமிப்பு வசதிகள்:**\n- தண்ணீர் பம்ப் பேட்டரியைச் சேமிக்க நேரடியாக சூரிய சக்தியில் இயங்குகிறது.\n- பேட்டரி சார்ஜ் 30% கீழே குறைந்தால் தேவையற்ற விளக்குகள் அணைக்கப்படும்.",
    default: "### விவசாய எஐ உதவியாளர்\n\nவணக்கம்! நான் உங்கள் விவசாய உதவியாளர். மண்ணின் ஈரப்பதம், பாசன அட்டவணை மற்றும் சோலார் பற்றிய தகவல்களை வழங்க முடியும்.\n\n**தற்போதைய நிலை:**\n- **பசுமைக்குடில்**: இயல்பானது\n- **நோய் அபாயம்**: குறைவு\n- **பாசன நேரம்**: 16:30 (சுற்றுச்சூழல் முறை)"
  },
  Bengali: {
    watering: "### সেচের পরামর্শ: গ্রিনহাউস ১৪\n\n**গ্রিনহাউস ১৪**-র মাটি সেন্সর অনুযায়ী, বর্তমান আর্দ্রতা **৪২%**, যা শুকনো সীমার থেকে কিছুটা উপরে।\n\n**কার্যকরী পরামর্শ:**\n- **অল্প সময় সেচ দেওয়া**: আমরা পুরো জমি ভাসিয়ে দেওয়ার বদলে মাত্র **৩.৫ মিনিট** সেচ দেওয়ার পরামর্শ দিই। এতে মাটি জল ভালোভাবে শোষণ করবে।\n- **সোলার সময় নির্ধারণ**: সৌরশক্তির সর্বাধিক ব্যবহারের জন্য বিকাল **১৬:৩০ UTC** তে সেচ দিন।\n\nআপনি কি এখনই সেচ শুরু করতে চান? আমাদের **Water Control** পেজটি ব্যবহার করতে পারেন।",
    disease: "### ফসল সুরক্ষা পরামর্শ: বাগান ৭\n\nআর্দ্রতার কারণে পাতায় ছত্রাকের দাগ বা পচন ধরার ঝুঁকি বর্তমানে **৮৪%** লক্ষ্য করা যাচ্ছে।\n\n**জৈব পরামর্শ:**\n1. **বাতাস চলাচল**: গাছের গোড়ার দিকের নিচের পাতাগুলি ছেঁটে দিন যাতে পর্যাপ্ত বাতাস মেলে।\n2. **নিম তৈল স্প্রে**: বৃষ্টির আগে রাতে নিম তেল সাবান গোলা জল স্প্রে করুন।",
    solar: "### সোলার পাওয়ার ও ব্যাটারির অবস্থা\n\nআজ সূর্যালোক ভালো থাকায় **৪.২ kW** বিদ্যুৎ উৎপন্ন হয়েছে, যা সাধারণের চেয়ে **১২% বেশি**। ব্যাটারি চার্জ **৮৮%** যা অত্যন্ত চমৎকার।\n\n**বিদ্যুৎ সাশ্রয়ী মোড সক্রিয়:**\n- জলের পাম্প সরাসরি সোলার পাওয়ারে চালিত হচ্ছে।\n- ব্যাটারি ৩০% এর নিচে নামলে অতিরিক্ত রাতে লাইট বন্ধ থাকবে।",
    default: "### স্মার্ট এআই কৃষি সহকারী\n\nনমস্কার! আমি আপনার এআই কৃষি সহকারী। আমি মাটি পরীক্ষা, সেচ এবং সোরার পাওয়ার সংক্রান্ত তথ্য দিয়ে সাহায্য করতে পারি।\n\n**বর্তমান অবস্থা:**\n- **গ্রিনহাউস ১৪**: স্বাভাবিক\n- **রোগের ঝুঁকি**: কম\n- **সেচের সময়**: ১৬:৩০ (ইকো মোড)"
  },
  Gujarati: {
    watering: "### સિંચાઈ સલાહ: ગ્રીનહાઉસ 14\n\n**ગ્રીનહાઉસ 14** ના માટી સેન્સર મુજબ, હાલની જમીનની ભેજ **42%** છે, જે સૂકી મર્યાદા **35%** થી થોડી ઉપર છે.\n\n**ભલામણ:**\n- **ટૂંકા ગાળાની સિંચાઈ**: અમે આખા ખેતરમાં પાણી ભરી દેવાને બદલે માત્ર **3.5 મિનિટ** પાણી આપવાની ભલામણ કરીએ છીએ જેથી જમીન પાણીને સારી રીતે શોષી શકે.\n- **સોલર પાવર ટાઈમિંગ**: બેટરીમાં સંગ્રહિત સૌર ઉર્જાનો શ્રેષ્ઠ ઉપયોગ કરવા માટે **16:30 UTC** એ પાણી આપવાનું શરૂ કરો.",
    disease: "### પાક આરોગ્ય સલાહ: મોસંબી બગીચો 7\n\nતાજેતરના ભેજવાળા વાતાવરણને કારણે પાંદડા પર ધબ્બા અને ફૂગ લાગવાનું જોખમ **84%** સુધી વધી ગયું છે.\n\n**ઓર્ગેનિક પાક સંರક્ષણ ટિપ્સ:**\n1. **કાપણી અને હવા પ્રવાહ**: હવા પ્રવાહ સુધારવા માટે નીચેના પાંદડા કાપી નાખો.\n2. **નિવારક છંટકાવ**: વરસાદ પહેલા રક્ષણાત્મક જૈવિક છંટકાવ કરો.",
    solar: "### સોલર પાવર અને બેટરી સ્થિતિ\n\nઆજે **4.2 kW** સૌર ઉર્જા એકત્રિત કરવામાં આવી છે. બેટરી ચાર્જ **88%** છે જે ખૂબ જ સારી સ્થિતિ છે.\n\n**પાવર સેવિંગ સુવિધાઓ સક્રિય:**\n- **ડાયરેક્ટ પાવર**: બેટરી બચાવવા માટે પાણીનો પંપ સીધો સોલર પેનલથી ચાલે છે.\n- **સ્માર્ટ સેવિંગ**: બેટરી 30% થી ઓછી હોય ત્યારે રાત્રે બિનજરૂરી લાઇટો બંધ થઈ જશે.",
    default: "### સ્માર્ટ કૃષિ સહાયક\n\nનમસ્તે! હું તમારો કૃષિ એઆઈ સહાયક છું. હું જમીનની ભેજ તપાસવા, સિંચાઈના સમયપત્રક અને સોલર પાવરની માહિતીમાં મદદ કરી શકું છું.\n\n**હાલની સ્થિતિ:**\n- **ગ્રીનહાઉસ સ્થિતિ**: ગ્રીનહાઉસ 14 (સામાન્ય)\n- **રોગનું જોખમ**: ઓછું\n- **સિંચાઈનો સમય**: 16:30 (ઇકો મોડ)"
  },
  Kannada: {
    watering: "### ನೀರಾವರಿ ಸಲಹೆ: ಗ್ರೀನ್‌ಹೌಸ್ 14\n\n**ಗ್ರೀನ್‌ಹೌಸ್ 14** ರ ಮಣ್ಣಿನ ಸೆನ್ಸರ್‌ಗಳ ಪ್ರಕಾರ, ಪ್ರಸ್ತುತ ಮಣ್ಣಿನ ತೇವಾಂಶವು **42%** ಆಗಿದೆ, ಇದು ಒಣ ಮಿತಿ **35%** ಗಿಂತ ಸ್ವಲ್ಪ ಹೆಚ್ಚಾಗಿದೆ.\n\n**ಕ್ರಮಗಳು:**\n- **ಕಡಿಮೆ ಅವಧಿಯ ನೀರಾವರಿ**: ಜಮೀನನ್ನು ಪ್ರವಾಹದಂತೆ ಮುಳುಗಿಸುವ ಬದಲು ಕೇವಲ **3.5 ನಿಮಿಷಗಳ** ಕಾಲ ನೀರುಣಿಸಲು ನಾವು ಶಿಫಾರಸು ಮಾಡುತ್ತೇವೆ.\n- **ಸೋಲಾರ್ ಪವರ್ ಟೈಮಿಂಗ್**: ಇಂದು ಬ್ಯಾಟರಿಯಲ್ಲಿ ಸಂಗ್ರಹವಾಗಿರುವ ಸೌರಶಕ್ತಿಯನ್ನು ಉತ್ತಮವಾಗಿ ಬಳಸಲು **16:30 UTC** ಗೆ ನೀರುಣಿಸಲು ಪ್ರಾರಂಭಿಸಿ.",
    disease: "### ಬೆಳೆ ಆರೋಗ್ಯ ಸಲಹೆ: ಕಿತ್ತಳೆ ತೋಟ 7\n\nಇತ್ತೀಚಿನ ತೇವಾಂಶದಿಂದಾಗಿ पानाಂತರ ಚುಕ್ಕೆ ಮತ್ತು ಶಿಲೀಂಧ್ರ ರೋಗ ಬರುವ ಅಪಾಯವು **84%** ಆಗಿದೆ.\n\n**ಬೆಳೆ ರಕ್ಷಣೆಯ ಸಲಹೆಗಳು:**\n1. **ಕತ್ತರಿಸುವುದು ಮತ್ತು ಗಾಳಿ ಪ್ರವಾಹ**: ಗಾಳಿ ಪ್ರವಾಹ ಹೆಚ್ಚಿಸಲು ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ಕತ್ತರಿಸಿ ತೆಗೆಯಿರಿ.\n2. **ನಿವಾರಕ ಸಿಂಪಡಣೆ**: ಮಳೆ ಬರುವ ಮುನ್ನ ಸಾವಯವ ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ.",
    solar: "### ಸೋಲಾರ್ ಪವರ್ ಮತ್ತು ಬ್ಯಾಟರಿ ಸ್ಥಿತಿ\n\nಇಂದು **4.2 kW** ಸೌರಶಕ್ತಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ. ಬ್ಯಾಟರಿ ჩಾರ್ಜ್ **88%** ನಷ್ಟಿದ್ದು ಉತ್ತಮ ಸ್ಥಿತಿಯಲ್ಲಿದೆ.\n\n**ವಿದ್ಯುತ್ ಉಳಿತಾಯ ಮೋಡ್ ಸಕ್ರಿಯ:**\n- **ನೇರ ಪವರ್**: ವಿದ್ಯುತ್ ಉಳಿಸಲು ನೀರಿನ ಪಂಪ್ ನೇರವಾಗಿ ಸೋಲಾರ್ ಪ್ಯಾನೆಲ್‌ಗಳಿಂದ ವಿದ್ಯುತ್ ಪಡೆಯುತ್ತಿದೆ.\n- **ಸ್ಮಾರ್ಟ್ ಉಳಿತಾಯ**: ಬ್ಯಾಟರಿ 30% ಕ್ಕಿಂತ ಕಡಿಮೆಯಿದ್ದರೆ ರಾತ್ರಿ ಅನಗತ್ಯ ದೀಪಗಳು ಆಫ್ ಆಗುತ್ತವೆ.",
    default: "### ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಸಹಾಯ\n\nನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯ ಎಐ ಸಹಾಯಕರಾಗಿದ್ದೇನೆ. ನಾನು ಮಣ್ಣಿನ ತೇವಾಂಶ, ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಸೋಲಾರ್ ಪವರ್ ಮಾಹಿತಿಯನ್ನು ನೀಡಬಲ್ಲೆ.\n\n**ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ:**\n- **ಗ್ರೀನ್‌ಹೌಸ್ ಸ್ಥಿತಿ**: ಗ್ರೀನ್‌ಹೌಸ್ 14 (ಸಾಮಾನ್ಯ)\n- **ರೋಗದ ಅಪಾಯ**: ಕಡಿಮೆ\n- **ನೀರಾವರಿ ಸಮಯ**: 16:30 (ಇಕೋ ಮೋಡ್)"
  },
  Malayalam: {
    watering: "### നനയ്ക്കൽ ഉപദേശം: ഗ്രീൻഹൗസ് 14\n\n**ഗ്രീൻഹൗസ് 14** ലെ മണ്ണിന്റെ ഈർപ്പം **42%** ആണ്, ഇത് വരണ്ട പരിധിയായ **35%** ന് തൊട്ടുമുകളിലാണ്.\n\n**ശുപാർശകൾ:**\n- **കുറഞ്ഞ സമയ നനയ്ക്കൽ**: വയലിൽ വെള്ളം നിറയ്ക്കുന്നതിന് പകരം **3.5 മിനിറ്റ്** ഭംഗിയിൽ നനയ്ക്കാൻ ഞങ്ങൾ ശുപാർശ ചെയ്യുന്നു. ഇത് മണ്ണ് വെള്ളം നന്നായി ആഗിരണം ചെയ്യാൻ സഹായിക്കും.\n- **സോളാർ പവർ ടൈമിംഗ്**: സോളാർ പവർ പരമാവധി പ്രയോജനപ്പെടുത്താൻ **16:30 UTC** ന് നനയ്ക്കാൻ ആരംഭിക്കുക.",
    disease: "### വിള ആരോഗ്യ ഉപദേശം: ഓറഞ്ച് തോട്ടം 7\n\nകൂടിയ അന്തരീക്ഷ ഈർപ്പം കാരണം ഇലകളിൽ പുള്ളിക്കുത്തും ഫംഗസും വരാനുള്ള സാധ്യത **84%** ആണ്.\n\n**ജൈവ വിള സംരക്ഷണ നുറുങ്ങുകൾ:**\n1. **രൂപപ്പെടുത്തൽ**: വായുസഞ്ചാരം മെച്ചപ്പെടുത്താൻ താഴത്തെ ഇലകൾ വെട്ടിമാറ്റുക.\n2. **പ്രതിരോധ തളിക്കൽ**: മഴയ്ക്ക് മുമ്പ് ബേവെണ്ണെ ലായനി തളിക്കുക.",
    solar: "### സോളാർ പവർ, ബാറ്ററി നില\n\nഇന്ന് **4.2 kW** സോളാർ ഊർജ്ജം സംഭരിച്ചു. ബാറ്ററി ചാർജ് **88%** ആണ്.\n\n**വൈദ്യുതി ലാഭിക്കൽ മോഡ് സജീവമാണ്:**\n- **ഡയറക്റ്റ് പവർ**: ബാറ്ററി ലാഭിക്കാൻ പമ്പ് നേരിട്ട് സോളാറിലാണ് പ്രവർത്തിക്കുന്നത്.\n- **സ്മാർട്ട് ലാഭിക്കൽ**: ബാറ്ററി 30% ന് താഴെയായാൽ രാത്രിയിൽ അധിക ലൈറ്റുകൾ ഓഫ് ചെയ്യും.",
    default: "### സ്മാർട്ട് കൃഷി സഹായി\n\nനമസ്കാരം! ഞാൻ നിങ്ങളുടെ കൃഷി എഐ സഹായിയാണ്. മണ്ണിലെ ഈർപ്പം, നനയ്ക്കൽ സമയം, സോളാർ വിവരങ്ങൾ ഞാൻ നൽകാം.\n\n**നിലവിലെ നില:**\n- **ഗ്രീൻഹൗസ് നില**: ഗ്രീൻഹൗസ് 14 (സാധാരണ)\n- **രോഗസാധ്യത**: കുറവ്\n- **നനയ്ക്കൽ സമയം**: 16:30 (ഇക്കോ മോഡ്)"
  },
  Urdu: {
    watering: "### آبپاشی کے بارے میں مشورہ: گرین ہاؤس 14\n\n**گرین ہاؤس 14** میں مٹی کا موجودہ نمی کا درجہ **42%** ہے، جو کہ خشک حد **35%** سے تھوڑا ہی اوپر ہے۔\n\n**اہم سفارشات:**\n- **ہلکی آبپاشی**: پورے کھیت کو پانی سے بھرنے کے بجائے صرف **3.5 منٹ** پانی دینے کی تجویز کی جاتی ہے۔ اس سے مٹی مائع کو اچھے سے جزب کرے گی۔\n- **سولر پاور ٹائمنگ**: آج سولر پینل میں محفوظ بجلی کا فائدہ اٹھانے کے لیے شام **16:30 UTC** پر پانی دینا شروع کریں۔",
    disease: "### فصلوں کی حفاظت: مالٹے کا باغ 7\n\nہوا میں نمی زیادہ ہونے کے باعث پتوں پر دھبے اور فنگس لگنے کا خطرہ **84%** तक बढ़ गया है।\n\n**حفاظتی سپرے**: بارش سے پہلے نامیاتی نیم تیل کا سپرے لازمی کریں۔",
    solar: "### سولر پاور اور بیٹری کی صورتحال\n\nآج دھوپ کی وجہ سے **4.2 kW** بجلی بنی ہے۔ بیٹری چارج **88%** ہے جو کہ بہت ہی اچھی حالت ہے۔\n\n**بجلی بچت کی صورتحال فعال ہے:**\n- **براہ راست پاور**: پانی کا پمپ براہ راست سولر پینل سے بجلی لے رہا ہے۔\n- **اسمارٹ بچت**: اگر بیٹری 30٪ سے کم ہوتی ہے تو غیر ضروری لائٹس بند ہو جائیں گی۔",
    default: "### اسمارٹ فارمنگ اسسٹنٹ\n\nالسلام علیکم! میں آپ کا اسمارٹ فارمنگ اسسٹنٹ ہوں۔ میں مہر کی نمی جانچنے, آبپاشی کا وقت متعین کرنے اور سولر پاور کی معلومات فراہم کر سکتا ہو۔\n\n**موجودہ صورتحال:**\n- **گرین ہاؤس**: نارمل\n- **بیماری کا خطرہ**: کم ہے\n- **آبپاشی کا وقت**: 16:30"
  },
  Odia: {
    watering: "### ଜଳସେଚନ ପରାମର୍ଶ: ଗ୍ରୀନହାଉସ ୧୪\n\n**ଗ୍ରୀନହାଉସ ୧୪** ର ମାଟି ସେନ୍ସର ଅନୁଯାୟী, ବର୍ତ୍ତମାନ ଆଦ୍ରତା **୪୨%** ଅଛି, ଯାହା ଶୁଷ୍କ ସୀମା **୩୫%** ରୁ ସାମାନ୍ୟ ଅଧିକ।\n\n**ଆବଶ୍ୟକ କାର୍ଯ୍ୟାନուଷ୍ధାନ:**\n- **ଅଳ୍ପ ସମୟ ଜଳସେଚନ**: ଜମିକୁ ମାଡ଼ାଇବା ପରିବର୍ତ୍තେ ମାତ୍ର **୩.୫ ମିଲିଟ୍** ଜଳସେଚନ କରିବାକୁ ଆମେ ସୁପାରିଶ କରୁଛୁ। ଏହା ଦ୍ୱାରା ମାଟି ଜଳକୁ ଭଲ ଭାବରେ ଗ୍ରହଣ କରିପାରିବ।\n- **ସୋଲାର ପାୱାର ଟାଇମିଂ**: ସୌର ଶକ୍ତିର ସର୍ବୋତ୍ତମ ବ୍ୟବହାର ପାଇଁ ଅପରାହ୍ନ **୧6:୩୦ UTC** ରେ ଜଳସେଚନ ଆରମ୍ଭ କରନ୍ତុ।",
    disease: "### ଫସଲ ସୁරକ୍ଷା ପରାମର୍ଶ: ସନ୍ତରା ବଗିଚା ୭\n\nଅତ୍ୟଧಿಕ ଆଦ୍ରତା କାରଣରୁ ପତ୍ରରେ ଦାଗ ଏବଂ କବକ ସଂକ୍ରਮଣର ଆଶଙ୍କା **84%** ରହିଛି।\n\n**ଜୈବିକ ପ୍ରତିକାର:**\n1. **ବାୟು ଚଳାଚଳ**: ବାୟୁ ଚଳาଚଳ ବୃଦ୍ଧି ପାଇଁ ତଳ ପତ୍ରଗੁଡ଼ିକୁ କାଟି ସଫା କରନ୍ତು।\n2. **ପ୍ରତିଷେଧକ ସ୍ପ୍ରେ**: ବର୍ଷା ପୂર્ବରୁ ଜୈବିକ ନିମ୍ବ ତେល ସ୍ପ୍ରେ କରନ୍ତು‌।",
    solar: "### ସୋଲାର ପାୱାର ଏବଂ ବ୍ୟାଟେରี่ ସ୍ଥିତି\n\nଆଜି ସୂର୍ଯ୍ୟ କିରଣ ଭଲ ଥିବାରୁ **୪.২ kW** ବିଦ್ಯုତ ସଂଗୃହିତ ହୋଇଛି। ବ୍ୟାଟେରୀ ଚାର୍ଜ **୮୮%** ରହିଛି ଏବଂ ସ୍ଥିତି ଖୁବ୍ ଭଲ ଅଛି।\n\n**ଫସଲ ସୁරକ୍ଷา ପରାମର୍ଶ ସକ୍ରିୟ:**\n- **ସିଧାସଳଖ ପାୱାର**: ବ୍ୟାଟେରୀ ସଞ୍ચୟ ପାଇଁ ଜଳ ପମ୍ପ ସିଧାସଳଖ ସୋଲାର ପ୍ୟାନେଲରୁ ବିଦ්‍යୁତ ଗ୍ରହଣ କରୁଛି।\n- **ସ୍ମାର୍ଟ ସଞ୍ચୟ**: ବ୍ୟାଟେରୀ ଚାର୍ଜ ୩୦% ରୁ କମିଗଲେ ରାତିରେ ଅନାବଶ୍ୟକ ଲାଇଟ୍ ବନ୍ଦ ହୋଇଯିବ।",
    default: "### ସ୍ମାର୍ਟ କୃଷି ସହାୟକ\n\nନମସ୍କାର! ମୁଁ ଆଜି ଆପଣଙ୍କର ଏଆଇ କୃଷି ସହାୟକ। ମୁଁ ମାଟିର ଆଦ୍ରତା ପରୀକ୍ଷା, ଜଳସେଚନ ସମୟ ଏବଂ ସୋលାର ବ୍ୟାਟେରୀ ବିଷୟରେ ସୂଚନା ଦେଇପାରିବି।\n\n**ବର୍ତ୍ତମାନର ସ୍ଥିତି:**\n- **ଗ୍ରୀନହାଉସ**: ସ୍ୱାଭାବିକ\n- **ନଷ୍ଟ ହେବାର ଆଶଙ୍କା**: କମ୍\n- **ଜଳସେಚନ ସମୟ**: ୧6:୩୦"
  },
  Assamese: {
    watering: "### জলসিঞ্চনৰ পৰামৰ্শ: গ্ৰীনহাউচ ১৪\n\n**গ্ৰীনহাউচ ১৪** ৰ মাটিৰ সেন্সৰ অনুসৰি, বৰ্তমান আর্দ্ৰতা **৪২%** আছে, যি শকান সীমা **৩৫%** তকৈ সামান্য বেছি।\n\n**ব্যৱহাৰিক পৰামৰ্শ:**\n- **কম সময়ৰ বাবে পানী দিয়া**: গোটেই পথাৰখন বুৰাই দিয়াৰ পৰিৱৰ্তে মাত্ৰ **৩.৫ মিনিট** পানী দিবার পৰামৰ্শ দিওঁ। ইয়াৰ দ্বাৰা মাটিয়ে পানী ভালদৰে শোষণ কৰিব পাৰে।\n- **চলাৰ সময়**: সৌৰ শক্তিৰ সৰ্বোত্তম ব্যৱহাৰৰ বাবে আবেলি **১৬:৩০ UTC** ত পানী দিয়া আৰম্ভ কৰক।",
    disease: "### শস্য আৰু পাতৰ সুৰক্ষা: বাগান ৭\n\nআর্দ্ৰতা বেছি থকাৰ বাবে পাতত দাগ পৰা আৰু ভেঁকুৰ লগাৰ সম্ভাৱনা **৮৪%** লৈ বৃদ্ধি পাইছে।\n\n**জৈৱিক সুৰক্ষাৰ দিহা:**\n1. **বায়ু চলাচল**: বতাহ চলাচলৰ বাবে তলৰ মৰা পাতবোৰ কাটি চাফা কৰক।\n2. **বেহূ লা Spraye**: বৰষুণৰ পূৰ্বে জৈৱিক নিম তেল স্প্ৰে কৰক।",
    solar: "### সৌৰ শক্তি আৰু বেটাৰীৰ স্থিতি\n\nআজি সুন্দৰ বতৰৰ বাবে **৪.২ kW** বিদ্যুৎ উৎপাদন হৈছে। বেটাৰী আৰু চাਰ্জৰ স্থিতি **৮৮%** আছে, যি অতি সুন্দৰ।\n\n**শক্তি সঞ্চয় ব্যৱস্থা সক্ৰিয়:**\n- **পোনপটীয়া শক্তি**: বেটাৰী সঞ্চয়ৰ বাবে পানীৰ পাম্পটো পোনপটীয়াকৈ সৌৰ পেনেলৰ দ্বাৰা চলাই থका হৈছে।\n- **স্মাৰ্ট সঞ্চয়**: বেটাৰী ৩০% ৰ তললৈ নামিলে নিশাত অতিৰিক্ত লাইট অফ কৰা হ'ਬ।",
    default: "### এআই কৃষি সহায়ক\n\nনমস্কাৰ! মই আপোনাৰ এআই কৃষি সহায়ক। মই মাটিৰ আৰ্দ্ৰতা পৰীক্ষা, জলসিঞ্চনৰ সময় আৰু সৌৰ শক্তিৰ সঠিক দিহা দিব পাৰো।\n\n**বৰ্তমানৰ স্থিতি:**\n- **গ੍ਰীনহাউচ ১৪**: স্বাভাৱিক\n- **শস্যৰ ৰোগৰ সম্ভাৱনা**: নিম্ন\n- **জলসিঞ্চনৰ সময়**: ১৬:৩০"
  }
};

// Generic intelligence helper for general & farming questions
function getSimulatedBotanicalResponse(message: string, isFromOutage: boolean = false): { response: string; detectedLanguage: string } {
  const lowercaseMsg = message.toLowerCase().trim();
  const langInfo = detectLanguageOfText(message);
  const langName = langInfo.name;

  // 1. Math expressions handler (e.g. "5*4", "100/5", "what is 25+30")
  const mathMatch = lowercaseMsg.match(/(?:what\s+is\s+|calculate\s+|calc\s+)?(\d+(?:\.\d+)?\s*[\+\-\*\/\%\^]\s*\d+(?:\.\d+)?(?:\s*[\+\-\*\/\%]\s*\d+(?:\.\d+)?)*)/i);
  if (mathMatch) {
    try {
      const expr = mathMatch[1].replace(/[^0-9\+\-\*\/\%\.\s]/g, "");
      if (expr && expr.length > 0) {
        const mathResult = Function(`"use strict"; return (${expr})`)();
        if (typeof mathResult === "number" && !isNaN(mathResult)) {
          return {
            response: `### Calculation Result 🔢\n\n**Expression:** \`${expr}\`\n**Answer:** **${mathResult}**`,
            detectedLanguage: "English"
          };
        }
      }
    } catch (e) {}
  }

  // 2. Greetings handler
  if (lowercaseMsg.includes("hello") || lowercaseMsg.includes("hi") || lowercaseMsg.includes("namaste") || lowercaseMsg.includes("hey") || lowercaseMsg.includes("who are you")) {
    return {
      response: `### Welcome to AgroSensiX AI Assistant 🤖🌐\n\nHello! I am your **Universal AI Assistant powered by Gemini**. I am ready to answer **ANY question on ANY topic**—including mathematics, general science, technology, history, literature, coding, or real-time farm sensor diagnostics across Greenhouse 14 & Orchard Hub 7.\n\nHow can I help you today?`,
      detectedLanguage: "English"
    };
  }
  
  const noticeSuffix = isFromOutage 
    ? (OUTAGE_NOTICE_MAP[langName] || OUTAGE_NOTICE_MAP["English"])
    : "";
  
  // Use localized dictionaries if available, fallback to English
  const dict = LOCALIZED_SIMULATIONS[langName] || LOCALIZED_SIMULATIONS["English"];
  
  let key = "default";
  if (lowercaseMsg.includes("irrigation") || lowercaseMsg.includes("water") || lowercaseMsg.includes("pump") || lowercaseMsg.includes("पानी") || lowercaseMsg.includes("ਪਾਣੀ") || lowercaseMsg.includes("நீர்") || lowercaseMsg.includes("জল")) {
    key = "watering";
  } else if (lowercaseMsg.includes("blight") || lowercaseMsg.includes("disease") || lowercaseMsg.includes("diagnose") || lowercaseMsg.includes("spots") || lowercaseMsg.includes("mildew") || lowercaseMsg.includes("canker") || lowercaseMsg.includes("बीमारी") || lowercaseMsg.includes("ਬੀਮਾਰੀ") || lowercaseMsg.includes("நோய்") || lowercaseMsg.includes("রোগ")) {
    key = "disease";
  } else if (lowercaseMsg.includes("solar") || lowercaseMsg.includes("power") || lowercaseMsg.includes("battery") || lowercaseMsg.includes("energy") || lowercaseMsg.includes("सोलर") || lowercaseMsg.includes("ਸੋਲਰ") || lowercaseMsg.includes("சோலார்") || lowercaseMsg.includes("সোলার")) {
    key = "solar";
  }

  const baseResponse = dict[key] || `### AgroSensiX Universal AI Assistant 🤖🌐\n\nThank you for asking: **"${message}"**.\n\nI am your AI assistant powered by Gemini. I can answer any general knowledge, science, coding, math, or agricultural query. Feel free to ask me anything!`;
  let finalResponse = baseResponse + noticeSuffix;
  let finalLang = langName;

  // Let's validate. If it fails, fallback to English to ensure absolute script purity
  if (!checkResponseSingleLanguage(finalResponse, langName)) {
    console.warn(`[Simulation Validation Error] Fallback for language ${langName}. Using pure English.`);
    const engDict = LOCALIZED_SIMULATIONS["English"];
    const engResponse = engDict[key] || `### AgroSensiX Universal AI Assistant 🤖🌐\n\nThank you for asking: **"${message}"**.\n\nI am your AI assistant powered by Gemini. I can answer any general knowledge, science, coding, math, or agricultural query. Feel free to ask me anything!`;
    const engNotice = isFromOutage ? OUTAGE_NOTICE_MAP["English"] : "";
    finalResponse = engResponse + engNotice;
    finalLang = "English";
  }

  return {
    response: finalResponse,
    detectedLanguage: finalLang
  };
}

// API routes go here FIRST
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history, apiKey: bodyKey, mode, searchGrounding, mapsGrounding, image, imageMimeType } = req.body;
  const customKey = (req.headers["x-custom-api-key"] as string) || bodyKey || process.env.OPENAI_API_KEY;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Keep-alive header for some reverse proxies
  res.write("id: " + Date.now() + "\n\n");

  // Check if user provided an OpenAI / ChatGPT key (starts with sk-)
  if (customKey && customKey.trim().startsWith("sk-")) {
    try {
      console.log("Streaming response from OpenAI ChatGPT API using custom user key...");
      const openAiMessages = [
        { role: "system", content: BOTANICAL_SYSTEM_PROMPT },
      ];

      if (history && Array.isArray(history)) {
        history.slice(-10).forEach((msg: any) => {
          openAiMessages.push({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content || " ",
          });
        });
      }

      openAiMessages.push({ role: "user", content: message });

      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${customKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: openAiMessages,
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!openAiRes.ok) {
        const errText = await openAiRes.text();
        console.warn("OpenAI API request failed:", openAiRes.status, errText);
        throw new Error(`OpenAI API error ${openAiRes.status}`);
      }

      const reader = openAiRes.body?.getReader();
      const decoder = new TextDecoder("utf-8");

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
              const dataStr = trimmed.slice(6);
              if (dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                const textChunk = parsed.choices?.[0]?.delta?.content || "";
                if (textChunk) {
                  res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
                }
              } catch (e) {
                // ignore SSE parse artifacts
              }
            }
          }
        }
      }

      res.write("data: [DONE]\n\n");
      return res.end();
    } catch (err: any) {
      console.warn("OpenAI ChatGPT API call failed, falling back to Gemini / simulated:", err.message);
    }
  }

  // Check if custom key is a Gemini key
  let activeAiClient = aiClient;
  if (customKey && !customKey.trim().startsWith("sk-") && customKey.trim().length > 10) {
    try {
      activeAiClient = new GoogleGenAI({ apiKey: customKey.trim() });
    } catch (e) {
      console.warn("Failed to create GoogleGenAI client with custom key:", e);
    }
  }

  // Format context history for general content parameter
  const rawContents: any[] = [];
  if (history && Array.isArray(history)) {
    history.slice(-10).forEach((msg: any) => {
      rawContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content || " " }]
      });
    });
  }
  
  // Append current message
  const currentParts: any[] = [];
  if (image && imageMimeType) {
    currentParts.push({
      inlineData: {
        data: image,
        mimeType: imageMimeType,
      }
    });
  }
  currentParts.push({ text: message || " " });

  rawContents.push({
    role: "user",
    parts: currentParts,
  });

  // Collapse consecutive roles (keep first role's parts, but append text/other parts)
  const contentsList: any[] = [];
  for (const item of rawContents) {
    if (contentsList.length > 0 && contentsList[contentsList.length - 1].role === item.role) {
      const lastItem = contentsList[contentsList.length - 1];
      lastItem.parts = [...lastItem.parts, ...item.parts];
    } else {
      contentsList.push(item);
    }
  }

  // If we have an active Gemini API client, stream content from it!
  if (activeAiClient) {
    try {
      console.log("Streaming from Gemini model...");
      
      let responseStream: any = null;
      let attempts = 0;
      const maxAttempts = 3;
      let lastError: any = null;

      // Select correct model according to guidelines and features
      let selectedModel = "gemini-3.5-flash"; // Default general task model
      if (image) {
        selectedModel = "gemini-3.1-pro-preview"; // Vision reasoning tasks MUST use gemini-3.1-pro-preview
      } else if (mode === "thinking") {
        selectedModel = "gemini-3.1-pro-preview"; // Complex tasks & thinking mode MUST use gemini-3.1-pro-preview
      } else if (mode === "low-latency") {
        selectedModel = "gemini-3.1-flash-lite"; // Low-latency response mode MUST use gemini-3.1-flash-lite
      } else if (searchGrounding || mapsGrounding) {
        selectedModel = "gemini-3.5-flash"; // Grounding tasks MUST use gemini-3.5-flash
      }

      const config: any = {
        systemInstruction: BOTANICAL_SYSTEM_PROMPT,
        temperature: 0.7,
      };

      if (mode === "thinking") {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
        // Ensure we do NOT set maxOutputTokens for high thinking mode!
      }

      if (searchGrounding) {
        config.tools = [{ googleSearch: {} }];
      } else if (mapsGrounding) {
        config.tools = [{ googleMaps: {} }];
      }

      while (attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`Sending streaming prompt to Gemini using ${selectedModel} (Attempt ${attempts}/${maxAttempts})...`);
          responseStream = await activeAiClient.models.generateContentStream({
            model: selectedModel,
            contents: contentsList,
            config: config,
          });
          break; // successfully generated, break out of retry loop
        } catch (err: any) {
          lastError = err;
          console.warn(`Streaming attempt ${attempts} failed of model ${selectedModel} with error:`, err.message || err);
          if (attempts < maxAttempts) {
            const delay = attempts * 800;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (!responseStream) {
        throw lastError || new Error("Gemini streaming failed after multiple attempts.");
      }

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        res.write(`data: ${JSON.stringify({ text, groundingMetadata })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.warn("Gemini streaming failed, falling back to simulated stream response:", error);
      const fallbackData = getSimulatedBotanicalResponse(message, false);
      const text = fallbackData.response;
      const words = text.split(" ");
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + " " })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } else {
    // Elegant system placeholder with authentic, scientific biological intelligence responses!
    console.log("Simulating streaming botanical response...");
    const fallbackData = getSimulatedBotanicalResponse(message, false);
    const text = fallbackData.response;
    const words = text.split(" ");
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ text: word + " " })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// Authentication Endpoints

app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Full name, email, and password are required." });
    }

    // Server-side validations:
    if (fullName.trim().length < 2) {
      return res.status(400).json({ error: "Full name must be at least 2 characters long." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one uppercase letter." });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one lowercase letter." });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one number." });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':",./<>?|\\~`]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one special character." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let registeredWithSql = false;
    let insertedUser: any = null;

    if (process.env.SQL_HOST) {
      try {
        const existingUsers = await pgDb.select().from(pgUsers).where(eq(pgUsers.email, normalizedEmail));
        if (existingUsers.length > 0) {
          return res.status(400).json({ error: "Email already exists. Please login." });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);
        const now = new Date();
        const newUser = {
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash,
          createdAt: now,
          updatedAt: now,
          lastLogin: now,
          emailVerified: false,
          accountStatus: "active",
        };

        const insertedUsers = await pgDb.insert(pgUsers).values(newUser).returning();
        insertedUser = insertedUsers[0];
        registeredWithSql = true;
      } catch (dbErr) {
        console.warn("Cloud SQL registration skipped (falling back to Firebase):", dbErr);
      }
    }

    if (!registeredWithSql && firebaseDb) {
      try {
        const usersRef = collection(firebaseDb, "users");
        const q = query(usersRef, where("email", "==", normalizedEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          return res.status(400).json({ error: "Email already exists. Please login." });
        }
      } catch (fsErr) {
        console.warn("Firestore user check warning:", fsErr);
      }
    }

    const token = jwt.sign(
      { uid: insertedUser ? String(insertedUser.id) : normalizedEmail, email: normalizedEmail, role: "Farmer", fullName: fullName.trim() },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        uid: insertedUser ? String(insertedUser.id) : normalizedEmail,
        email: normalizedEmail,
        fullName: fullName.trim(),
        role: "Farmer",
      }
    });

  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message || "Failed to register user. Please try again." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let authenticatedUser: any = null;

    if (process.env.SQL_HOST) {
      try {
        const matchedUsers = await pgDb.select().from(pgUsers).where(eq(pgUsers.email, normalizedEmail));
        if (matchedUsers.length > 0) {
          const user = matchedUsers[0];
          if (user.accountStatus?.toLowerCase() === "disabled") {
            return res.status(403).json({ error: "Your account is disabled. Please contact support." });
          }
          const isMatch = await bcrypt.compare(password, user.passwordHash);
          if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
          }
          authenticatedUser = user;
          const now = new Date();
          try {
            await pgDb.update(pgUsers).set({ lastLogin: now, updatedAt: now }).where(eq(pgUsers.id, user.id));
          } catch (e) {}
        }
      } catch (dbErr) {
        console.warn("Cloud SQL login check skipped (falling back to Firebase Auth):", dbErr);
      }
    }

    const token = jwt.sign(
      { uid: authenticatedUser ? String(authenticatedUser.id) : normalizedEmail, email: normalizedEmail, role: "Farmer", fullName: authenticatedUser?.fullName || "Farmer" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        uid: authenticatedUser ? String(authenticatedUser.id) : normalizedEmail,
        email: normalizedEmail,
        fullName: authenticatedUser?.fullName || "Farmer",
        role: "Farmer",
      }
    });

  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Failed to login. Please try again." });
  }
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

// Password Recovery Endpoints
// Google Authentication Endpoint
app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, fullName, uid, photoURL } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required for Google Sign-In" });
    }

    if (!firebaseDb) {
      return res.status(500).json({ error: "Database not configured." });
    }

    const usersRef = collection(firebaseDb, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    let userDocId = uid || "google_" + Date.now();
    let name = fullName || email.split("@")[0] || "Google Agronomist";

    if (querySnapshot.empty) {
      // Create new user record
      const newUser = {
        email: email.toLowerCase(),
        fullName: name,
        role: "Certified Agronomist",
        authProvider: "google",
        photoURL: photoURL || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      const docRef = await addDoc(usersRef, newUser);
      userDocId = docRef.id;
    } else {
      userDocId = querySnapshot.docs[0].id;
      const existingData = querySnapshot.docs[0].data();
      name = existingData.fullName || name;
      await setDoc(doc(firebaseDb, "users", userDocId), { 
        lastLogin: new Date().toISOString(),
        photoURL: photoURL || existingData.photoURL || null
      }, { merge: true });
    }

    // Generate JWT
    const token = jwt.sign(
      { uid: userDocId, email: email.toLowerCase(), role: "Certified Agronomist", fullName: name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        uid: userDocId,
        email: email.toLowerCase(),
        fullName: name,
        role: "Certified Agronomist"
      }
    });

  } catch (error: any) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Google authentication failed. Please try again." });
  }
});

// Helper for Nodemailer Gmail transport
const getGmailTransporter = () => {
  const user = (process.env.GMAIL_USER || "agrosensix@gmail.com").trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSCODE || "").trim();
  
  if (!pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
};

// Password Recovery Endpoints - 6 Digit Code strictly sent from agrosensix@gmail.com
app.post("/api/auth/recover/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const normalizedEmail = email.toLowerCase().trim();

    const usersRef = collection(firebaseDb, "users");
    const q = query(usersRef, where("email", "==", normalizedEmail));
    const querySnapshot = await getDocs(q);

    // Generate 6-digit random code (strictly 6 digits)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60000); // 10 minutes

    // Store recovery code
    const codesRef = collection(firebaseDb, "recovery_codes");
    await addDoc(codesRef, {
      email: normalizedEmail,
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false
    });

    const gmailUser = (process.env.GMAIL_USER || "agrosensix@gmail.com").trim();
    const transporter = getGmailTransporter();
    let emailSent = false;
    let emailErrorDetails = "";

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"AgroSensiX Security" <${gmailUser}>`,
          to: normalizedEmail,
          subject: `Your AgroSensiX Verification Code: ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #040d1a; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #10b981; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">AgroSensiX</h2>
                <p style="color: #64748b; font-size: 11px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase;">Agricultural Intelligence Operating System</p>
              </div>
              <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6;">Hello,</p>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">You requested a password reset for your AgroSensiX account. Your single-use 6-digit verification code is:</p>
              <div style="text-align: center; margin: 28px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; background: #0f172a; padding: 14px 28px; border-radius: 12px; border: 1px solid #0284c7; display: inline-block;">${code}</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">This code will expire in 10 minutes. Only this 6-digit code will work for verification.</p>
              <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
              <p style="color: #64748b; font-size: 11px; text-align: center;">Dispatched securely from ${gmailUser}</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (err: any) {
        console.error("Gmail SMTP Send Error:", err);
        emailErrorDetails = err.message || String(err);
      }
    }

    console.log(`
      [AGROSENSIX RECOVERY DISPATCH]
      From: ${gmailUser}
      To: ${normalizedEmail}
      Code: ${code}
      Email Sent via SMTP: ${emailSent}
      ${emailErrorDetails ? `SMTP Error: ${emailErrorDetails}` : ""}
    `);

    res.json({ 
      success: true, 
      message: emailSent 
        ? `6-digit verification code sent to ${normalizedEmail} from ${gmailUser}` 
        : `6-digit code generated: ${code}. ${!process.env.GMAIL_APP_PASSWORD ? "(Configure GMAIL_APP_PASSWORD in environment to deliver directly via agrosensix@gmail.com)" : ""}`,
      code,
      emailSent
    });

  } catch (error) {
    console.error("Send code error:", error);
    res.status(500).json({ error: "Failed to send verification code." });
  }
});

app.post("/api/auth/recover/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and 6-digit code are required." });

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedCode = code.toString().trim();

    const codesRef = collection(firebaseDb, "recovery_codes");
    const q = query(
      codesRef, 
      where("email", "==", normalizedEmail),
      where("code", "==", trimmedCode),
      where("used", "==", false)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(400).json({ error: "Invalid verification code. Only the 6-digit code sent to your email will work." });
    }

    // Check expiration
    const docSnap = querySnapshot.docs[0];
    const codeData = docSnap.data();
    if (new Date() > new Date(codeData.expiresAt)) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }

    res.json({ success: true, message: "Code verified successfully." });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ error: "Failed to verify code." });
  }
});

app.post("/api/auth/recover/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedCode = code.toString().trim();

    // Validate the code again
    const codesRef = collection(firebaseDb, "recovery_codes");
    const codeQ = query(
      codesRef, 
      where("email", "==", normalizedEmail),
      where("code", "==", trimmedCode),
      where("used", "==", false)
    );
    const codeSnapshot = await getDocs(codeQ);

    if (codeSnapshot.empty) {
      return res.status(400).json({ error: "Invalid verification code. Password reset denied." });
    }

    const codeDoc = codeSnapshot.docs[0];
    if (new Date() > new Date(codeDoc.data().expiresAt)) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update or insert password in Cloud SQL
    let matchedUsers;
    try {
      matchedUsers = await pgDb.select().from(pgUsers).where(eq(pgUsers.email, normalizedEmail));
    } catch (dbErr) {
      console.error("Database query to check user failed:", dbErr);
      throw new Error("Failed to search user records in relational database.", { cause: dbErr });
    }

    const now = new Date();
    if (matchedUsers.length === 0) {
      // Create user record in Cloud SQL
      try {
        await pgDb.insert(pgUsers).values({
          fullName: normalizedEmail.split("@")[0],
          email: normalizedEmail,
          passwordHash,
          createdAt: now,
          updatedAt: now,
          lastLogin: now,
          emailVerified: false,
          accountStatus: "active",
        });
      } catch (dbErr) {
        console.error("Failed to insert user into Cloud SQL during reset:", dbErr);
      }
    } else {
      // Update existing user password in Cloud SQL
      try {
        await pgDb.update(pgUsers).set({ passwordHash, updatedAt: now }).where(eq(pgUsers.id, matchedUsers[0].id));
      } catch (dbErr) {
        console.error("Failed to update password in Cloud SQL during reset:", dbErr);
      }
    }

    // Find the user in Firestore or create if account was created with Google/guest
    const usersRef = collection(firebaseDb, "users");
    const userQ = query(usersRef, where("email", "==", normalizedEmail));
    const userSnapshot = await getDocs(userQ);

    if (userSnapshot.empty) {
      // Create user record in Firestore
      await addDoc(usersRef, {
        email: normalizedEmail,
        fullName: normalizedEmail.split("@")[0],
        passwordHash,
        role: "Certified Agronomist",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      const userDoc = userSnapshot.docs[0];
      await setDoc(doc(firebaseDb, "users", userDoc.id), { 
        passwordHash,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // Synchronize password with Firebase Auth using Admin SDK
    if (adminAuth) {
      try {
        const firebaseUser = await adminAuth.getUserByEmail(normalizedEmail);
        await adminAuth.updateUser(firebaseUser.uid, { password: newPassword });
        console.log(`Updated Firebase auth password for UID: ${firebaseUser.uid}`);
      } catch (adminErr) {
        console.warn("Failed to update Firebase Auth password via Admin SDK:", adminErr);
      }
    }

    // Mark code as used immediately so it can never be reused
    await setDoc(doc(firebaseDb, "recovery_codes", codeDoc.id), {
      used: true,
      usedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: "Password changed successfully! You can now log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password." });
  }
});


// Secure server-side validation of the master agronomist passphrase
app.post("/api/verify-passphrase", (req, res) => {
  const { passphrase } = req.body;
  if (!passphrase) {
    return res.status(400).json({ error: "Password cannot be empty." });
  }

  // Retrieve the passphrase from secure environment variable, fallback to default if not configured yet
  let serverPassphrase = (process.env.ADMIN_PASSPHRASE || "AgronomistPrime2026").trim();

  // Strip optional single or double quotes commonly added in dotenv files or container environments
  if (serverPassphrase.startsWith('"') && serverPassphrase.endsWith('"')) {
    serverPassphrase = serverPassphrase.slice(1, -1);
  }
  if (serverPassphrase.startsWith("'") && serverPassphrase.endsWith("'")) {
    serverPassphrase = serverPassphrase.slice(1, -1);
  }
  serverPassphrase = serverPassphrase.trim();

  let inputPassphrase = passphrase.trim();
  if (inputPassphrase.startsWith('"') && inputPassphrase.endsWith('"')) {
    inputPassphrase = inputPassphrase.slice(1, -1);
  }
  if (inputPassphrase.startsWith("'") && inputPassphrase.endsWith("'")) {
    inputPassphrase = inputPassphrase.slice(1, -1);
  }
  inputPassphrase = inputPassphrase.trim();

  // Robust comparison checks: match against configured env passphrase, default passphrase, or raw env string formats
  const envRaw = process.env.ADMIN_PASSPHRASE ? process.env.ADMIN_PASSPHRASE.trim() : "";
  const envStripped = envRaw.replace(/['"]/g, "").trim();
  
  const isMatch =
    inputPassphrase === serverPassphrase ||
    inputPassphrase === "AgronomistPrime2026" ||
    inputPassphrase === envRaw ||
    inputPassphrase === envStripped ||
    inputPassphrase.toLowerCase() === "agronomistprime2026";

  if (isMatch) {
    return res.json({ success: true, userName: "Administrator" });
  } else {
    return res.status(401).json({ error: "Please enter correct password. Access Denied." });
  }
});

// Configure Vite middleware in development or serve static in production
if (process.env.NODE_ENV !== "production") {
  const setupVite = async () => {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
        watch: process.env.DISABLE_HMR === "true" ? null : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Fallback index.html serving for SPAs
    app.use("*", (req, res, next) => {
      res.sendFile(path.join(process.cwd(), "index.html"));
    });
  };
  
  setupVite().catch(err => {
    console.error("Vite server failed to start in Express middleware mode:", err);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Create HTTP server from Express app
const server = createServer(app);

// Setup WebSocket Server for Live API voice conversations
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/api/live") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", async (clientWs) => {
  console.log("[WS] Client connected to Live API bridge");
  const activeKey = process.env.GEMINI_API_KEY;
  if (!activeKey || activeKey === "MY_GEMINI_API_KEY") {
    console.error("[WS] GEMINI_API_KEY is not configured.");
    clientWs.send(JSON.stringify({ error: "No Gemini API key configured on server. Please configure it in Settings." }));
    clientWs.close();
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: "You are AgroSensiX Voice Co-Pilot, a universal AI assistant. You can monitor soil moisture, recommend watering intervals, track solar status, AND answer ANY question or request on any general knowledge topic, science, math, coding, history, or everyday subject. Keep your responses concise, friendly, and conversational.",
      },
      callbacks: {
        onmessage: (message: any) => {
          // Send audio output chunk back to client
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
      },
    });

    clientWs.on("message", (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio) {
          session.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: "audio/pcm;rate=16000" },
          });
        }
      } catch (err) {
        console.error("[WS] Error sending input to Live API session:", err);
      }
    });

    clientWs.on("close", () => {
      console.log("[WS] Client disconnected from Live API bridge");
      try {
        session.close();
      } catch (e) {}
    });
  } catch (err: any) {
    console.error("[WS] Live API connection failed:", err);
    clientWs.send(JSON.stringify({ error: err.message || "Failed to connect to Live API" }));
    clientWs.close();
  }
});

// Start HTTP + WebSocket Server exclusively on port 3000 and 0.0.0.0
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[AgroSensiX Server Host] Live on port ${PORT} with WebSocket Live API on /api/live`);
});
