import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { ChatMessage, SectorData, BatteryTelemetry, WaterPumpTelemetry } from "../types";
import { preloadedSuggestivePrompts, mockSectors, mockBattery, mockPump } from "../mockData";
import { offlineStorage } from "../utils/offlineStorage";
import { 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  Activity, 
  Sparkles,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  Pause,
  Play,
  Square,
  Sliders,
  Settings,
  RotateCcw
} from "lucide-react";

interface LangInfo {
  name: string;
  code: string;
}

// Highly reliable, offline-compatible client-side Indian & English language detector
export const detectLanguage = (text: string): LangInfo => {
  const t = text.trim();
  if (!t) return { name: "English", code: "en-US" };

  // Devanagari script for Hindi/Marathi/Nepali
  if (/[\u0900-\u097F]/.test(t)) {
    if (/करतो|आहे|आहेत|नाही|पुणे|मुंबई|ओलावा|शेतकरी/i.test(t)) {
      return { name: "Marathi", code: "mr-IN" };
    }
    return { name: "Hindi", code: "hi-IN" };
  }
  // Gurmukhi script for Punjabi
  if (/[\u0A00-\u0A7F]/.test(t)) {
    return { name: "Punjabi", code: "pa-IN" };
  }
  // Bengali script for Bengali/Assamese
  if (/[\u0980-\u09FF]/.test(t)) {
    if (/আছ|বং|হব|অসম|কৰিব|নহয়|ৰিজাৰ্ভাৰ|কৃষক/i.test(t)) {
      return { name: "Assamese", code: "as-IN" };
    }
    return { name: "Bengali", code: "bn-IN" };
  }
  // Tamil script
  if (/[\u0B80-\u0BFF]/.test(t)) {
    return { name: "Tamil", code: "ta-IN" };
  }
  // Telugu script
  if (/[\u0C00-\u0C7F]/.test(t)) {
    return { name: "Telugu", code: "te-IN" };
  }
  // Kannada script
  if (/[\u0C80-\u0CFF]/.test(t)) {
    return { name: "Kannada", code: "kn-IN" };
  }
  // Malayalam script
  if (/[\u0D00-\u0D7F]/.test(t)) {
    return { name: "Malayalam", code: "ml-IN" };
  }
  // Gujarati script
  if (/[\u0A80-\u0AFF]/.test(t)) {
    return { name: "Gujarati", code: "gu-IN" };
  }
  // Odia script
  if (/[\u0B00-\u0B7F]/.test(t)) {
    return { name: "Odia", code: "or-IN" };
  }
  // Arabic/Persian/Urdu script
  if (/[\u0600-\u06FF]/.test(t)) {
    return { name: "Urdu", code: "ur-IN" };
  }

  // Common transliterated words typed in English keyboard
  const lowercase = t.toLowerCase();
  if (/\b(namaste|kaise|paani|moisture|nami|dhanyawad|kheti|khet|paani|mitti)\b/.test(lowercase)) {
    return { name: "Hindi", code: "hi-IN" };
  }
  if (/\b(vannakkam|eera|eerappatham|tanni|tannir|vivasayam)\b/.test(lowercase)) {
    return { name: "Tamil", code: "ta-IN" };
  }
  if (/\b(satsriakal|namaskar|panni|mitti|kheti)\b/.test(lowercase)) {
    return { name: "Punjabi", code: "pa-IN" };
  }

  return { name: "English", code: "en-US" };
};

// Strips markdown symbols for cleaner and natural text reading
const stripMarkdownForSpeech = (text: string): string => {
  return text
    .replace(/[#*`_~]/g, "") // remove stars, hashes, ticks, tildes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace md links with text
    .replace(/[-•]\s+/g, ". ") // replace list bullets with periods for pausing
    .replace(/\s+/g, " ")
    .trim();
};

// Complete localized farming assistant database for all 13 supported languages!
const LOCALIZED_OFFLINE_DB: Record<string, Record<string, string>> = {
  English: {
    watering: `### 💧 Smart Irrigation & Drip Hydrology [Offline Advice]
Current soil moisture is **52%** in Greenhouse 14, which is in the healthy zone.
- **Watering Time**: The optimal watering window today is at **16:30 UTC** to utilize direct solar power energy.
- **Tip**: Water in short bursts of **3.5 minutes** rather than flooding to maximize root absorption.`,
    moisture: `### 📊 Soil Moisture Status [Offline Report]
- Greenhouse 14: Soil moisture is stable at **52.4%** across major sensor nodes.
- Orchard Hub 7: Fruit tree soil moisture stands at **41%**. No watering is needed right now.`,
    disease: `### 🛡️ Crop Disease & Leaf Protection [Offline Guideline]
Recent humidity poses a minor leaf spot and mildew risk.
- **Tip 1**: Trim lower weeds and leaves to improve natural breeze airflow.
- **Tip 2**: Spray organic neem water during the cool evening hours to repel pests safely.`,
    solar: `### ☀️ Solar Storage & Battery [Offline Status]
Solar absorption is extremely active today with **4.8 kW** harvested.
- **Battery**: Charged at **82%** with healthy performance.
- **Direct Mode**: The water pump runs directly from panels during peak sun to conserve battery power.`,
    harvest: `### 🍊 Crop Yield & Fruit Quality [Offline Advice]
Dwarf oranges are maturing perfectly and will be ready for harvest in **14 to 18 days**.
- **Tip**: Reduce watering slightly 5 days before harvest to concentrate the natural orange sugars.`,
    trouble: `### 🛠️ ESP32 Troubleshooting & Calibration [Offline Manual]
If live telemetries freeze:
1. Turn off first, clean the metal pins, and reinsert deep into soil.
2. Check that the ESP32 Wi-Fi is connected on your local network (usually 192.168.4.1).`,
    hello: `### Hello, I am your AgroSensiX AI Assistant! 🌿 [Offline Companion]
I can help monitor soil moisture, recommend watering intervals, and track solar status.
How can I assist you on the farm today? Ask me about moisture or water!`,
    faq: `### ❓ Farming FAQs [Offline Mode]
- **Optimized Range**: Greenhouse crops thrive best between **45% and 70%** soil moisture.
- **Offline Sync**: All telemetry and status records will synchronize automatically once internet is restored!`
  },
  Tamil: {
    watering: `### 💧 நீர் மேலாண்மை [ஆஃப்லைன்]
பசுமைக்குடில் 14-ல் மண்ணின் ஈரப்பதம் **52%** உள்ளது.
- **பரிந்துரை**: மாலை 16:30 மணிக்கு நீர்ப்பாசனம் செய்யவும்.`,
    moisture: `### 📊 மண்ணின் ஈரப்பதம் [ஆஃப்லைன்]
- பசுமைக்குடில் 14: ஈரப்பதம் **52.4%** ஆக உள்ளது.
- ஆரஞ்சு தோட்டம்: ஈரப்பதம் **41%** ஆக உள்ளது. இப்போது நீர் தேவையில்லை.`,
    disease: `### 🛡️ நோய் தடுப்பு முறை [ஆஃப்லைன் பாதுகாப்பு]
காற்றோட்டம் குறைவாக இருப்பதால் இலைகளில் பூஞ்சை நோய் ஏற்படலாம்.
- **வழிமுறை 1**: காற்றோட்டத்திற்கு கீழ் இலைகளை வெட்டி கழிக்கவும்.
- **வழிமுறை 2**: மாலையில் இயற்கை வேப்பெண்ணெய் கரைசல் தெளிக்கவும்.`,
    solar: `### ☀️ சூரிய மின்சார பேட்டரி நிலை [ஆஃப்லைன்]
இன்று சோலார் பேனல் மூலம் **4.8 kW** மின்சாரம் தயாரிக்கப்பட்டுள்ளது.
- **பேட்டரி**: சார்ஜ் **82%** உள்ளது.`,
    harvest: `### 🍊 அறுவடை வழிகாட்டி [ஆஃப்லைன்]
ஆரஞ்சு பழங்கள் இன்னும் **14 முதல் 18 நாட்களில்** அறுவடைக்கு தயாராகிவிடும்.
- **குறிப்பு**: அறுவடைக்கு 5 நாட்களுக்கு முன்பு நீர் பாசனத்தை குறைக்கவும்.`,

    trouble: `### 🛠️ சென்சார் பழுது நீக்குதல் [ஆஃப்லைன்]
சென்சார் வேலை செய்யாவிட்டால்:
1. முனையை சுத்தம் செய்து மீண்டும் மண்ணில் நன்றாக சொருகவும்.
2. உங்கள் வைஃபை இணைப்பை (192.168.4.1) சரிபார்க்கவும்.`,
    hello: `### வணக்கம்! நான் உங்கள் விவசாய எஐ உதவியாளர் 🌿 [ஆஃப்லைன்]
மண்ணின் ஈரப்பதம், பாசன முறை மற்றும் சோலார் பேட்டரி பற்றி நான் உங்களுக்கு உதவ முடியும்.
நீங்கள் என்ன கேட்க விரும்புகிறீர்கள்?`,
    faq: `### ❓ அடிக்கடி கேட்கப்படும் கேள்விகள் [ஆஃப்லைன்]
- **ஈரப்பதம் அளவு**: சாதாரண பயிர்களுக்கு **45% முதல் 70%** ஈரப்பதம் மிகவும் நல்லது.
- **ஆஃப்லைன் சிங்க்**: இணையம் வந்தவுடன் உங்கள் தரவுகள் தானாகவே புதுப்பிக்கப்படும்.`
  },
  Bengali: {
    watering: `### 💧 スマート সেচ ও জল নিকাশি [অফলাইন পরামর্শ]
গ্রিনহাউস ১৪-এ মাটির আর্দ্রতা বর্তমানে **৫২%**, যা স্বাভাবিক সীমার মধ্যে রয়েছে।
- **সেচ দেওয়ার সময়**: সৌর শক্তি ব্যবহারের জন্য আজকে দুপুর **১৬:৩০ মিনিটে** জল দেওয়ার উপযুক্ত সময়।`,
    moisture: `### 📊 মাটির আর্দ্রতার অবস্থা [অফলাইন প্রতিবেদন]
- গ্রিনহাউস ১৪: মাটির আর্দ্রতা **৫২.৪%** এ স্থিতিশীল রয়েছে।
- কমলা বাগান: মাটির আর্দ্রতা **৪১%**। এখন জল দেওয়ার প্রয়োজন নেই।`,
    disease: `### 🛡️ রোগ প্রতিরোধ ও ফসল রক্ষা [অফলাইন নির্দেশিকা]
আর্দ্রতা বৃদ্ধির কারণে পাতায় দাগ এবং ছত্রাকের হালকা ঝুঁকি রয়েছে।
- **পরামর্শ ১**: ভালো বাতাস চলাচলের জন্য নিচের দিকের পাতা কেটে পরিষ্কার করুন।
- **পরামর্শ ২**: পোকা তাড়াতে বিকেলে প্রাকৃতিক নিম জল স্প্রে করুন।`,
    solar: `### ☀️ সৌর সঞ্চয় ও ব্যাটারি [অফলাইন অবস্থা]
আজকে সৌরশক্তি সংগ্রহ অত্যন্ত সক্রিয় এবং **৪.৮ kW** উৎপাদিত হয়েছে।
- **ব্যাটারি**: **৮২%** চার্জযুক্ত এবং সম্পূর্ণ সচল।`,
    harvest: `### 🍊 ফলন ও ফসল কাটার নির্দেশিকা [অফলাইন পরামর্শ]
কমলালেবুগুলি সুন্দরভাবে পরিপক্ক হচ্ছে এবং **১৪ থেকে ১৮ দিনের** মধ্যে তোলার জন্য প্রস্তুত হবে।
- **টিপ**: ফসল তোলার ৫ দিন আগে জল দেওয়া কিছুটা কমিয়ে দিন।`,
    trouble: `### 🛠️ সেন্সর রক্ষণাবেক্ষণ ও ক্যালিব্রেশন [অফলাইন ম্যানুয়াল]
যদি লাইভ টেলিমেট্রি আটকে যায়:
১. ডিভাইস বন্ধ করুন, মেটাল পিনগুলি পরিষ্কার করুন এবং মাটিতে ভালভাবে বসিয়ে দিন।
২. আপনার ওয়াইফাই সংযোগ (192.168.4.1) চেক করুন।`,
    hello: `### হ্যালো, আমি আপনার এআই কৃষি সহকারী! 🌿 [অফলাইন সহচর]
আমি মাটির আর্দ্রতা, সেচের সময় এবং সৌরবিদ্যুতের অবস্থা নিরীক্ষণ করতে পারি।
আজকে আপনার খামারে কীভাবে সাহায্য করতে পারি? আর্দ্রতা বা সেচ নিয়ে জিজ্ঞেস করুন!`,
    faq: `### ❓ সাধারণ প্রশ্নোত্তর [অফলাইন মোড]
- **অনুকূল আর্দ্রতা**: গ্রিনহাউসের ফসলের জন্য **৪৫% থেকে ৭০%** মাটির আর্দ্রতা সবচেয়ে ভালো।
- **অফলাইন সিঙ্ক**: ইন্টারনেট পুনরায় চালু হলে সমস্ত তথ্য স্বয়ংক্রিয়ভাবে সিঙ্ক হবে!`
  },
  Telugu: {
    hello: `### నమస్కారం! నేను మీ స్మార్ట్ వ్యవసాయ సహాయకుడిని 🌿 [ఆఫ్‌లైన్]
నేను నేల తేమ, నీటి పెంపు మరియు సోలార్ సమాచారాన్ని అందించగలను.
తెలుగులో మీ ప్రశ్నలను అడగండి!`,
    moisture: `### 📊 నేల తేమ నివేదిక [ఆఫ్‌లైన్ నివేదిక]
- గ్రీన్‌హౌస్ 14: తేమ సెన్సార్లలో **52.4%** గా స్థిరంగా ఉంది.
- ఆరెంజ్ గార్డెన్: ఆర్ద్రత **41%** ఉంది. నీరు అవసరం లేదు.`
  },
  Marathi: {
    hello: `### नमस्ते! मी आपला कृषी सहाय्यक आहे 🌿 [ऑफलाइन]
मी जमिनीतील ओलावा, पाणी पंप वेळ आणि सोलर बॅटरीबद्दल माहिती देऊ शकतो.
कृपया आपले प्रश्न मराठीत विचारा!`,
    moisture: `### 📊 जमिनीतील ओलावा अहवाल [ऑफलाइन]
- ग्रीनहाउस 14: ओलावा सर्व सेन्सरवर **52.4%** वर स्थिर आहे.
- संत्रा बाग: ओलावा **41%** आहे. आता पाण्याची गरज नाही.`
  },
  Gujarati: {
    hello: `### નમસ્તે! હું તમારો કૃષિ એઆઈ સહાયક છું 🌿 [ઓફલાઇન]
હું જમીનની ભેજ, પાણી આપવાની માહિતી અને સોલર વિશે જણાવી શકું છું.
ગુજરાતીમાં તમારા પ્રશ્નો પૂછો!`,
    moisture: `### 📊 જમીનની ભેજ રિપોર્ટ [ઓફલાઇન]
- ગ્રીનહાઉસ 14: ભેજ સેન્સર પર **52.4%** છે.
- મોસંબી બગીચો: ભેજ **41%** છે. અત્યારે પાણીની જરૂર નથી.`
  },
  Kannada: {
    hello: `### ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯ ಕೃಷಿಕ 🌿 [ಆಫ್‌ಲೈನ್]
ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಹನಿ ನೀರಾವರಿ ಮಾಹಿತಿಯನ್ನು ನಾನು ಕನ್ನಡದಲ್ಲಿ ನೀಡಬಲ್ಲೆ.
ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಿ!`,
    moisture: `### 📊 ಮಣ್ಣಿನ ತೇವಾಂಶ ವರದಿ [ಆಫ್‌ಲೈನ್]
- ಗ್ರೀನ್‌ಹೌಸ್ 14: ತೇವಾಂಶ **52.4%** ಆಗಿದೆ.
- ಕಿತ್ತಳೆ ತೋಟ ಜಮೀನು: ತೇವಾಂಶ **41%** ಆಗಿದೆ. ನೀರುಣಿಸುವ ಅಗತ್ಯವಿಲ್ಲ.`
  },
  Malayalam: {
    hello: `### നമസ്കാരം! ഞാൻ നിങ്ങളുടെ കൃഷി എഐ സഹായിയാണ് 🌿 [ഓഫ്‌ലൈൻ]
മണ്ണിലെ ഈർപ്പം, നനയ്ക്കൽ സമയം, സോളാർ വിവരങ്ങൾ ഞാൻ നൽകാം.
മലയാളത്തിൽ ചോദ്യങ്ങൾ ചോദിക്കുക!`,
    moisture: `### 📊 മണ്ണിലെ ഈർപ്പത്തിന്റെ നില [ഓഫ്‌ലൈൻ]
- ഗ്രീൻഹൗസ് 14: ഈർപ്പം **52.4%** ആണ്.
- ഓറഞ്ച് തോട്ടം: ഈർപ്പം **41%** ആണ്. ഇപ്പോൾ നനയ്ക്കേണ്ടതില്ല.`
  },
  Urdu: {
    hello: `### اسلام علیکم! میں آپ کا اسمارٹ فارمنگ اسسٹنٹ ہوں 🌿 [آف لائن]
میں مٹی کی نمی، آبپاشی کے اوقات اور سولر بیٹر کی معلومات دے سکتا ہوں۔
اردو میں اپنا سوال پوچھیں!`,
    moisture: `### 📊 مٹی کی نمی کی رپورٹ [آف لائن]
- گرین ہاؤس 14: نمی **52.4%** پر مستحکم ہے۔
- مالٹے کا باغ: نمی **41%** ہے۔ ابھی پانی کی ضرورت نہیں ہے۔`
  },
  Odia: {
    hello: `### ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର କୃଷି ସହାୟକ 🌿 [ଅଫଲାଇନ]
ମୁଁ ମାଟିର ଆଦ୍ରତା ଏବଂ ଜଳ ସେଚନ ସମୟ ସୂଚନା ଦେଇ ପାରିବି।
ଓଡ଼ିଆରେ ନିଜ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ!`,
    moisture: `### 📊 ମାଟିର ଆଦ୍ରତା ସୂଚନା [ଅଫଲାଇନ]
- ଗ୍ରୀନହାଉସ ୧୪: ଆଦ୍ରତା ସ୍ଥିର **୫୨.୪%** ଅଛି।
- ସନ୍ତରା ବଗିଚା: ଆଦ୍ରତା **୪୧%** ଅଛି। ଏବେ ପାଣି ଆବଶ୍ୟକ ନାହିଁ।`
  },
  Assamese: {
    hello: `### নমস্কাৰ! মই আপোনাৰ এআই কৃষি সহায়ক 🌿 [স্থানীয় অফলাইন]
ধন্যবাদ, মই মাটিত থকা পানীৰ পৰিমাণ আৰু খেতিৰ দিহা অসমীয়াত দিব পাৰো।
আপোনাৰ প্ৰশ্ন সোধক!`,
    moisture: `### 📊 মাটিৰ আৰ্দ্ৰতা স্থিতি [স্থানীয় অফলাইন]
- গ্ৰীনহাউচ ১৪: আৰ্দ্ৰতা **৫২.৪%** ত স্থিৰ আছে।
- কমলা বাগান: পানীৰ পৰিমাণ **৪১%** আছে। এতিয়া পানীৰ প্ৰয়োজন নাই।`
  }
};

// Elegant formatter that uses proper Markdown rendering with correct custom Tailwind styles
const renderFormattedAdvisory = (text: string) => {
  return (
    <div className="markdown-body space-y-1">
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-zinc-100 font-sans font-bold text-xs tracking-wider uppercase mt-4 mb-2.5 first:mt-0 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-zinc-100 font-sans font-bold text-xs tracking-wider uppercase mt-4 mb-2.5 first:mt-0 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-zinc-100 font-sans font-bold text-xs tracking-wider uppercase mt-4 mb-2.5 first:mt-0 flex items-center gap-1.5 border-b border-zinc-900 pb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {children}
            </h3>
          ),
          h4: ({ children }) => <h4 className="text-zinc-200 font-sans font-bold text-xs uppercase mt-3.5 mb-2">{children}</h4>,
          h5: ({ children }) => <h5 className="text-zinc-200 font-sans font-bold text-xs uppercase mt-3 mb-1.5">{children}</h5>,
          h6: ({ children }) => <h6 className="text-zinc-200 font-sans font-bold text-xs uppercase mt-2.5 mb-1">{children}</h6>,
          p: ({ children }) => <p className="text-zinc-300 leading-relaxed my-2 text-xs">{children}</p>,
          strong: ({ children }) => <strong className="text-emerald-400 font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-emerald-200 italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc marker:text-emerald-400 pl-5 space-y-1.5 my-2.5 text-zinc-300 text-xs">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal marker:text-emerald-400 pl-5 space-y-1.5 my-2.5 text-zinc-300 text-xs">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed text-zinc-300 text-xs">{children}</li>,
          code: ({ children }) => <code className="bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono text-[10px] px-1.5 py-0.5 rounded">{children}</code>,
          pre: ({ children }) => <pre className="bg-zinc-950 border border-zinc-900/80 p-3 rounded-lg overflow-x-auto font-mono text-[10px] text-zinc-300 my-3">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-emerald-500/40 pl-3.5 italic text-zinc-400 text-xs my-2.5">{children}</blockquote>,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
};

// Generates high-quality offline advice based on language and keywords
const getLocalizedOfflineResponse = (prompt: string, langName: string): string => {
  const p = prompt.toLowerCase().trim();
  const lang = LOCALIZED_OFFLINE_DB[langName] ? langName : "English";
  const db = LOCALIZED_OFFLINE_DB[lang];

  let topic = "hello";
  if (p.includes("water") || p.includes("irrigate") || p.includes("pump") || p.includes("watering") || p.includes("පාਣੀ") || p.includes("पानी") || p.includes("ਪਾਣੀ") || p.includes("நீர்") || p.includes("जल") || p.includes("సేచ")) {
    topic = "watering";
  } else if (p.includes("soil") || p.includes("moisture") || p.includes("sensor") || p.includes("humidity") || p.includes("નમી") || p.includes("נਮੀ") || p.includes("നമി") || p.includes("नमी")) {
    topic = "moisture";
  } else if (p.includes("disease") || p.includes("pest") || p.includes("health") || p.includes("spots") || p.includes("mildew") || p.includes("বিমারি") || p.includes("நோய்") || p.includes("बीमारी")) {
    topic = "disease";
  } else if (p.includes("battery") || p.includes("solar") || p.includes("power") || p.includes("charge")) {
    topic = "solar";
  } else if (p.includes("harvest") || p.includes("yield") || p.includes("orange") || p.includes("crop") || p.includes("തോട്ടം") || p.includes("तोड")) {
    topic = "harvest";
  } else if (p.includes("trouble") || p.includes("fail") || p.includes("calibrate") || p.includes("fix") || p.includes("센서") || p.includes("சுத்தம்")) {
    topic = "trouble";
  } else if (p.includes("faq") || p.includes("question") || p.includes("offline")) {
    topic = "faq";
  }

  // Retrieve matching topic content, fallback to default 'hello' or moisture if needed
  let content = db[topic];
  if (!content) {
    content = db["hello"] || LOCALIZED_OFFLINE_DB["English"][topic] || LOCALIZED_OFFLINE_DB["English"]["hello"];
  }

  // Append a helpful offline translation assurance notice matching the response language exactly
  const offlineNoticeMap: Record<string, string> = {
    English: "\n\n*(Offline Mode: Disconnected from cloud server. Displaying local smart-grid diagnostics matching your request.)*",
    Hindi: "\n\n*(ऑफ़लाइन मोड: क्लाउड सर्वर से संपर्क टूटा हुआ है। आपकी मांग के अनुसार स्थानीय डेटाबेस से जानकारी दिखाई जा रही है।)*",
    Punjabi: "\n\n*(ਔਫਲਾਈਨ ਮੋਡ: ਕਲਾਊਡ ਸਰਵਰ ਤੋਂ ਸੰਪਰਕ ਟੁੱਟਾ ਹੈ। ਤੁਹਾਡੀ ਮੰਗ ਅਨੁਸਾਰ ਸਥਾਨਕ ਡਾਟਾਬੇਸ ਤੋਂ ਜਾਣਕਾਰੀ ਦਿਖਾਈ ਜਾ ਰਹੀ ਹੈ।)*",
    Tamil: "\n\n*(ஆஃப்லைன் பயன்முறை: கிளவுட் சேவையக தொடர்பு துண்டிக்கப்பட்டுள்ளது. உங்கள் கோரிக்கைக்கு ஏற்ப உள்நாட்டு தரவுத்தளம் காட்டப்படுகிறது.)*",
    Telugu: "\n\n*(ఆఫ్‌లైన్ మోడ్: క్లౌడ్ సర్వర్‌తో సంబంధం కోల్పోయాము. మీ అభ్యర్థనకు సరిపోయే స్థానిక డేటాబేస్ సమాచారాన్ని చూపిస్తున్నాము.)*",
    Bengali: "\n\n*(অফলাইন মোড: ক্লাউড সার্ভারের সাথে সংযোগ বিচ্ছিন্ন। আপনার অনুরোধ অনুসারে স্থানীয় ডাটাবেস থেকে তথ্য দেখানো হচ্ছে।)*",
    Marathi: "\n\n*(ऑफलाईन मोड: क्लाउड सर्व्हरशी संपर्क तुटला आहे. आपल्या विनंतीनुसार स्थानिक डेटाबेस मधून माहिती दिली जात आहे।)*",
    Gujarati: "\n\n*(ઑફલાઇન મોડ: ક્લાউડ સર્વર સાથે કનેક્શન તૂટી ગયું છે. તમારી વિનંતી મુજબ સ્થાનિક ડેટાબેઝમાંથી માહિતી દર્શાવાઈ રહી છે।)*",
    Kannada: "\n\n*(ಆಫ್‌ಲೈನ್ ಮೋಡ್: ಕ್ಲೌಡ್ ಸರ್ವರ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ. ನಿಮ್ಮ ವಿನಂತಿಗೆ ಸರಿಹೊಂದುವ ಸ್ಥಳೀಯ ಡೇಟಾಬೇಸ್‌ನಿಂದ ಮಾಹಿತಿ ತೋರಿಸಲಾಗುತ್ತಿದೆ.)*",
    Malayalam: "\n\n*(ഓഫ്‌ലൈൻ മോഡ്: ക്ലൗഡ് ഫയലുകളുമായുള്ള ബന്ധം വിച്ഛേദിക്കപ്പെട്ടു. നിങ്ങളുടെ ആവശ്യപ്രകാരമുള്ള പ്രാദേശിക ഡാറ്റാബേസിൽ നിന്നുള്ള വിവരങ്ങളാണ് കാണിക്കുന്നത്.)*",
    Urdu: "\n\n*(آف لائن وضع: کلاؤڈ سرور سے رابطہ منقطع ہے۔ آپ کی درخواست کے مطابق مقامی ڈیٹا بیس سے معلومات دکھائی جا رہی ہیں۔)*",
    Odia: "\n\n*(ଅଫଲାଇନ୍ ମୋଡ୍: କ୍ଲାଉଡ୍ ସର୍ଭର ସହ ସଂଯୋଗ ବିଚ୍ଛିନ୍ନ ହୋଇଛି। ଆପଣଙ୍କ ଅନୁରୋଧ ଅନੁଯାୟୀ ସ୍ଥାନୀୟ ଡାଟାବେସରୁ ସୂଚନା ଦେଖାଯାଉଛି।)*",
    Assamese: "\n\n*(অফলাইন মোড: ক্লাউড চাৰ্ভাৰৰ সৈতে সংযোগ বিচ্ছিন্ন। আপোনাৰ অনুৰোধ অনুসৰি স্থানীয় ডাটাবেচৰ পৰা তথ্য দেখুওৱা হৈছে।)*"
  };

  const localNotice = offlineNoticeMap[langName] || offlineNoticeMap["English"];

  return content + localNotice;
};

interface AiAssistantViewProps {
  sectors?: SectorData[];
  battery?: BatteryTelemetry;
  pump?: WaterPumpTelemetry;
  isOnline?: boolean;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  sectors = mockSectors,
  battery = mockBattery,
  pump = mockPump,
  isOnline = true,
}) => {
  // Compute Real-Time Sensor Memory / Fast Farm Cache Values
  const currentTankLevel = pump.reservoirLevelPercent;
  
  const g14NodeMoistures = sectors.find(s => s.id === "sector-G14")?.nodes.map(n => n.soilMoisture) || [];
  const hub7NodeMoistures = sectors.find(s => s.id === "sector-7G")?.nodes.map(n => n.soilMoisture) || [];
  const avgG14Moisture = g14NodeMoistures.length > 0 ? parseFloat((g14NodeMoistures.reduce((a,b) => a+b, 0) / g14NodeMoistures.length).toFixed(1)) : 43.5;
  const avgHub7Moisture = hub7NodeMoistures.length > 0 ? parseFloat((hub7NodeMoistures.reduce((a,b) => a+b, 0) / hub7NodeMoistures.length).toFixed(1)) : 41.0;
  
  const currentSoilMoisture = avgG14Moisture;
  
  const g14Temps = sectors.find(s => s.id === "sector-G14")?.nodes.map(n => n.temperature) || [];
  const hub7Temps = sectors.find(s => s.id === "sector-7G")?.nodes.map(n => n.temperature) || [];
  const currentTemperature = g14Temps.length > 0 ? parseFloat((g14Temps.reduce((a,b) => a+b, 0) / g14Temps.length).toFixed(1)) : 24.1;
  const avgHub7Temp = hub7Temps.length > 0 ? parseFloat((hub7Temps.reduce((a,b) => a+b, 0) / hub7Temps.length).toFixed(1)) : 23.5;

  const g14Hums = sectors.find(s => s.id === "sector-G14")?.nodes.map(n => n.humidity) || [];
  const hub7Hums = sectors.find(s => s.id === "sector-7G")?.nodes.map(n => n.humidity) || [];
  const currentHumidity = g14Hums.length > 0 ? parseFloat((g14Hums.reduce((a,b) => a+b, 0) / g14Hums.length).toFixed(1)) : 57.8;
  const avgHub7Hum = hub7Hums.length > 0 ? parseFloat((hub7Hums.reduce((a,b) => a+b, 0) / hub7Hums.length).toFixed(1)) : 59.7;

  const currentRainStatus = "No active precipitation detected. Solar panels collection rate is optimized.";
  const currentPumpStatus = pump.status;
  const currentRoofStatus = "Open";
  const currentSolarStatus = `${battery.chargePercent}% charge | ${battery.solarInputKw} kW harvest`;
  const currentIrrigationStatus = pump.status === "active" ? "Active (watering lines flow status nominal)" : "Standby";

  const avgHealthScore = Math.round(sectors.reduce((acc, s) => acc + s.plantHealthIndex, 0) / sectors.length);
  const currentFarmHealth = `${avgHealthScore}% (Healthy / Stable)`;

  // Classification & Routing Engine
  const classifyQuestion = (text: string): "sensor_level1" | "status_level2" | "ai_level3" => {
    const p = text.toLowerCase().trim();
    
    // LEVEL 1: INSTANT SENSOR RESPONSES
    const isTankQuery = /\b(tank|reservoir|water level|tank level|how much water|reservoir volume|water percent|tank %|water %)\b/.test(p);
    const isMoistureQuery = /\b(soil moisture|moisture|moist|wetness|soil water|soil %|moisture level|vwc)\b/.test(p);
    const isTempQuery = /\b(temperature|temp|how hot|how cold|degrees|celsius|heat)\b/.test(p);
    const isHumidQuery = /\b(humidity|humidity level|humid|% rh|relative humidity|moisture in the air|air humidity)\b/.test(p);
    const isRainQuery = /\b(rain|raining|rain status|precipitation|shower)\b/.test(p);
    const isRoofQuery = /\b(roof|roof status|roof position|greenhouse roof|ventilat|ventilation)\b/.test(p);
    const isSolarQuery = /\b(solar|battery|panel|solar input|solar status|kw|charge|power|energy|generator)\b/.test(p);
    const isPumpQuery = /\b(pump|irrigation pump|compressor|water pressure_bar|flow rate|lpm|dispensed|pump status)\b/.test(p);
    const isIrrigQuery = /\b(irrigation|irrigate|watering|watering status|is irrigation running|irrigation system)\b/.test(p);
    const isHealthQuery = /\b(health|farm health|health score|plant health|crop health|vitality|index)\b/.test(p);

    if (isTankQuery || isMoistureQuery || isTempQuery || isHumidQuery || isRainQuery || isRoofQuery || isSolarQuery || isPumpQuery || isIrrigQuery || isHealthQuery) {
      return "sensor_level1";
    }

    // LEVEL 2: FARM STATUS QUESTIONS
    const isFarmDoingQuery = /\b(how is my farm doing|farm doing|farm doing\?|status of farm|farm status|overall status|how's my farm)\b/.test(p);
    const isIrrigNeededQuery = /\b(is irrigation needed|irrigation needed|soil too dry|is soil too dry|dry soil|needs watering|need water)\b/.test(p);
    const isRainExpectedQuery = /\b(rain expected|is rain expected|forecast|will it rain|any rain)\b/.test(p);
    const isAlertQuery = /\b(alert|alerts|warning|warnings|any alert|any alerts|critical|errors)\b/.test(p);

    if (isFarmDoingQuery || isIrrigNeededQuery || isRainExpectedQuery || isAlertQuery) {
      return "status_level2";
    }

    // LEVEL 3: ADVANCED AI QUESTIONS
    return "ai_level3";
  };

  const getInstantResponse = (question: string): string => {
    const p = question.toLowerCase().trim();
    
    const isTankQuery = /\b(tank|reservoir|water level|tank level|how much water|reservoir volume|water percent|tank %|water %)\b/.test(p);
    const isMoistureQuery = /\b(soil moisture|moisture|moist|wetness|soil water|soil %|moisture level|vwc)\b/.test(p);
    const isTempQuery = /\b(temperature|temp|how hot|how cold|degrees|celsius|heat)\b/.test(p);
    const isHumidQuery = /\b(humidity|humidity level|humid|% rh|relative humidity|moisture in the air|air humidity)\b/.test(p);
    const isRainQuery = /\b(rain|raining|rain status|precipitation|shower)\b/.test(p);
    const isRoofQuery = /\b(roof|roof status|roof position|greenhouse roof|ventilat|ventilation)\b/.test(p);
    const isSolarQuery = /\b(solar|battery|panel|solar input|solar status|kw|charge|power|energy|generator)\b/.test(p);
    const isPumpQuery = /\b(pump|irrigation pump|compressor|water pressure_bar|flow rate|lpm|dispensed|pump status)\b/.test(p);
    const isIrrigQuery = /\b(irrigation|irrigate|watering|watering status|is irrigation running|irrigation system)\b/.test(p);
    const isHealthQuery = /\b(health|farm health|health score|plant health|crop health|vitality|index)\b/.test(p);

    if (isTankQuery) {
      return `### 📊 Real-Time Diagnostic Level [Instant Memory Response]

- **Water Reservoir Level**: **${currentTankLevel}%**
- **System Status**: **NOMINAL**
- **Remaining Capacity**: **${Math.round(100 - currentTankLevel)}%** available for incoming collection.

*(Target Response Time: < 100 ms)*`;
    }

    if (isMoistureQuery) {
      return `### 📊 Real-Time Soil Moisture [Instant Memory Response]

- **Greenhouse 14 average**: **${avgG14Moisture}% VWC** (Optimal target range: 35.0% - 60.0% VWC).
- **Orchard Hub 7 average**: **${avgHub7Moisture}% VWC** (Optimal target range: 40.0% - 65.0% VWC).
  - ⚠️ *Note: Orchard Hub 7 Top Soil Sensor Gamma has dropped to **29.8% VWC** (below 40% threshold).*

*(Target Response Time: < 100 ms)*`;
    }

    if (isTempQuery) {
      return `### 🌡️ Real-Time Temperature [Instant Memory Response]

- **Greenhouse 14 average**: **${currentTemperature}°C** (Stable within metabolic levels).
- **Orchard Hub 7 average**: **${avgHub7Temp}°C** (Ambient target optimum).

*(Target Response Time: < 100 ms)*`;
    }

    if (isHumidQuery) {
      return `### 💧 Real-Time Relative Humidity [Instant Memory Response]

- **Greenhouse 14 average**: **${currentHumidity}% RH** (Optimal ventilation).
- **Orchard Hub 7 average**: **${avgHub7Hum}% RH** (Stable flow).

*(Target Response Time: < 100 ms)*`;
    }

    if (isRainQuery) {
      return `### 🌧️ Real-Time Rain Status [Instant Memory Response]

- **Rain Sensor state**: **Dry (0.0mm)**
- **Weather Status**: No active rain or precipitation detected. Solar arrays are collecting at peak capacity.

*(Target Response Time: < 100 ms)*`;
    }

    if (isRoofQuery) {
      return `### 🏠 Real-Time Roof Status [Instant Memory Response]

- **Greenhouse Roof position**: **Open** (Auto Mode)
- **Actuator health**: **100%** (Nominal operating conditions)
- **Status details**: Roof venting is active to optimize natural airflow and cool Greenhouse 14.

*(Target Response Time: < 100 ms)*`;
    }

    if (isSolarQuery) {
      return `### ☀️ Real-Time Solar & Battery Status [Instant Memory Response]

- **Solar Battery charge**: **${battery.chargePercent}%**
- **Live Solar harvest rate**: **${battery.solarInputKw} kW**
- **Power grid usage**: **0.00 kW** (100% off-grid solar-powered harvesting active!)

*(Target Response Time: < 100 ms)*`;
    }

    if (isPumpQuery) {
      return `### 💧 Real-Time Water Pump Status [Instant Memory Response]

- **Pump state**: **${pump.status.toUpperCase()}**
- **Flow rate**: **${pump.flowRateLpm} LPM**
- **Line pressure**: **${pump.pressureBar} BAR**
- **Operating Mode**: **${pump.currentMode.toUpperCase()}** (Eco-intelligent water conservation)

*(Target Response Time: < 100 ms)*`;
    }

    if (isIrrigQuery) {
      return `### 🌾 Real-Time Irrigation Status [Instant Memory Response]

- **Irrigation lines**: **NOMINAL** (No leaks or pressure drops detected)
- **Total dispensed today**: **${pump.totalLitresDispensed.toLocaleString()} Liters**
- **Next scheduled irrigation**: 16:30 UTC (Eco-mode)

*(Target Response Time: < 100 ms)*`;
    }

    if (isHealthQuery) {
      return `### 🌿 Real-Time Farm Health Score [Instant Memory Response]

- **Overall Farm Vitality Score**: **${avgHealthScore}%** (Status: **${avgHealthScore >= 80 ? 'Healthy' : 'Needs attention'}**)
- **Greenhouse 14 crops**: **${sectors[0]?.plantHealthIndex}%** (Excellent canopy growth)
- **Orchard Hub 7 trees**: **${sectors[1]?.plantHealthIndex}%** (Healthy fruit development)

*(Target Response Time: < 100 ms)*`;
    }

    const isFarmDoingQuery = /\b(how is my farm doing|farm doing|farm doing\?|status of farm|farm status|overall status|how's my farm)\b/.test(p);
    const isIrrigNeededQuery = /\b(is irrigation needed|irrigation needed|soil too dry|is soil too dry|dry soil|needs watering|need water)\b/.test(p);
    const isRainExpectedQuery = /\b(rain expected|is rain expected|forecast|will it rain|any rain)\b/.test(p);
    const isAlertQuery = /\b(alert|alerts|warning|warnings|any alert|any alerts|critical|errors)\b/.test(p);

    if (isFarmDoingQuery) {
      return `### 📊 Real-Time Farm Status Summary [Lightweight Rule Response]

- **Overall Farm Health**: **${avgHealthScore}%** (Stable metabolic flow).
- **Water Level**: **${pump.reservoirLevelPercent}%** capacity (Nominal reserves).
- **Solar Storage**: **${battery.chargePercent}%** charge with **${battery.solarInputKw} kW** live harvest.
- **Active Warnings**: ⚠️ **Orchard Hub 7 Node Gamma (Top Soil)** is dry at **29.8% VWC** (optimal range is 40%-65%). Automated pulsing is scheduled.

No major emergency alerts are active across other sectors.

*(Target Response Time: 1 to 2 seconds | Served in < 20 ms)*`;
    }

    if (isIrrigNeededQuery) {
      return `### 💧 Irrigation Necessity Checklist [Lightweight Rule Response]

- **Greenhouse 14**: **No watering needed**. Soil moisture is fine at **${avgG14Moisture}% VWC** (target >35%).
- **Orchard Hub 7**: ⚠️ **Irrigation Recommended**. Top soil sensor Gamma is critically dry at **29.8% VWC** (optimal threshold is >40%). 

We suggest initiating an automatic water pulse cycle of **3.5 minutes** for Orchard Hub 7.

*(Target Response Time: 1 to 2 seconds | Served in < 20 ms)*`;
    }

    if (isRainExpectedQuery) {
      return `### 🌧️ Real-Time Rain & Forecast Check [Lightweight Rule Response]

- **Current conditions**: **Sunny & Dry (0.0mm of rain detected)**.
- **Atmospheric reading**: Stable high-pressure cell. No rain predicted for the next 12 hours.
- **Harvest recommendation**: Solar absorption is maximum (current harvest is **${battery.solarInputKw} kW**). Keep roof venting Open to regulate Greenhouse temperature.

*(Target Response Time: 1 to 2 seconds | Served in < 20 ms)*`;
    }

    if (isAlertQuery) {
      const totalAlerts = sectors.reduce((acc, s) => acc + s.activeAlertsCount, 0);
      return `### ⚠️ Active Diagnostic Warnings [Lightweight Rule Response]

- **Total Alerts Detected**: **${totalAlerts} active warning(s)**.
  - ⚠️ **Critical Low Moisture**: **Orchard Hub 7 - Top Soil Sensor Gamma** reports critically low soil moisture at **29.8% VWC** (optimal range 40.0% - 65.0%).
  
All other telemetry sectors (including solar grids, pumps, and temperature sensors) are running with non-disruptive nominal signatures (Green status).

*(Target Response Time: 1 to 2 seconds | Served in < 20 ms)*`;
    }

    return "I have examined the live sensor state. All sectors are nominal.";
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = offlineStorage.getChatHistory();
    if (cached && cached.length > 0) {
      return cached.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [
      {
        id: "init-msg",
        role: "assistant",
        content: "### Welcome to the AgroSensiX Farm Assistant\n\nI am your **AI Farming Assistant with Gemini**. I have real-time information for **Greenhouse 14 (Mixed Crops)** and **Orchard Hub 7 (Dwarf Oranges)** ready to assist you.\n\nAsk me about watering schedules, crop disease warnings, or how to get the best results from your harvest!",
        timestamp: new Date(),
        detectedLanguage: "English"
      }
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Voice recognition (SpeechToText) variables
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speech synthesis (TextToSpeech) controls state
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [ttsState, setTtsState] = useState<"speaking" | "paused" | "stopped">("stopped");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Local state tracking live dynamic typing language
  const [liveLanguage, setLiveLanguage] = useState<LangInfo>({ name: "English", code: "en-US" });

  // Enhanced non-intrusive container-level scrolling logic
  const messageListRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [showScrollDownNotifier, setShowScrollDownNotifier] = useState(false);

  // Monitor scroll behavior of the chat container
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    // We are at bottom if we are within 60px of the absolute bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsUserAtBottom(atBottom);
    if (atBottom) {
      setShowScrollDownNotifier(false);
    }
  };

  // UPGRADE: Multilingual Voice Reader settings & preferences states
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedSettingLang, setSelectedSettingLang] = useState<string>("English");
  const [voicePrefsSaved, setVoicePrefsSaved] = useState(false);

  const [preferredVoices, setPreferredVoices] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("agrosensix_voice_settings_voices");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load local voice preferences:", e);
      }
    }
    return {};
  });

  const [speechSpeed, setSpeechSpeed] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("agrosensix_voice_settings_speed");
        if (saved) return parseFloat(saved || "1.0");
      } catch (e) {}
    }
    return 1.0;
  });

  const [speechVolume, setSpeechVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("agrosensix_voice_settings_volume");
        if (saved) return parseFloat(saved || "1.0");
      } catch (e) {}
    }
    return 1.0;
  });

  // Track and load available voices from standard Web Speech API natively
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Update/Save single language preferred voice representation
  const updatePreferredVoice = (langName: string, voiceName: string) => {
    const updated = { ...preferredVoices, [langName]: voiceName };
    setPreferredVoices(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("agrosensix_voice_settings_voices", JSON.stringify(updated));
    }
    triggerSavedToast();
  };

  // Speed adjust & save callback
  const handleSpeedChange = (val: number) => {
    setSpeechSpeed(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("agrosensix_voice_settings_speed", val.toString());
    }
    triggerSavedToast();
  };

  // Volume adjust & save callback
  const handleVolumeChange = (val: number) => {
    setSpeechVolume(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("agrosensix_voice_settings_volume", val.toString());
    }
    triggerSavedToast();
  };

  // Reset to default settings
  const handleResetSettings = () => {
    setPreferredVoices({});
    setSpeechSpeed(1.0);
    setSpeechVolume(1.0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("agrosensix_voice_settings_voices");
      localStorage.removeItem("agrosensix_voice_settings_speed");
      localStorage.removeItem("agrosensix_voice_settings_volume");
    }
    triggerSavedToast();
  };

  const triggerSavedToast = () => {
    setVoicePrefsSaved(true);
    setTimeout(() => setVoicePrefsSaved(false), 2000);
  };

  // Load chat messages to offlineStorage
  useEffect(() => {
    offlineStorage.saveChatHistory(messages);
  }, [messages]);

  // Update live detected language whenever user input updates
  useEffect(() => {
    const currentLang = detectLanguage(inputValue);
    setLiveLanguage(currentLang);
  }, [inputValue]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false; // single speak tap
      rec.interimResults = true;

      rec.onstart = () => {
        setIsRecording(true);
        setRecordingStatus("Listening...");
        setErrorStatus(null);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const recognizedText = finalTranscript || interimTranscript;
        if (recognizedText) {
          setInputValue(recognizedText);
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        
        let customErrorMsg = "";
        if (event.error === "not-allowed") {
          customErrorMsg = "🎤 IFRAME MIC RESTRICTION: Sandboxed preview frames block the mic. Please click \"Open in separate tab\" at the top right to enable native microphone permissions!";
        } else if (event.error === "no-speech") {
          customErrorMsg = "🎤 No speech detected. Please speak clearly into your mic.";
        } else if (event.error === "network") {
          customErrorMsg = "🌐 Network issue. Check microphone connection or internet.";
        } else {
          customErrorMsg = `Speech capture error: ${event.error}`;
        }

        setRecordingStatus(`Error: ${event.error}`);
        setErrorStatus(customErrorMsg);
        
        setTimeout(() => {
          setIsRecording(false);
          setRecordingStatus("");
        }, 1200);

        setTimeout(() => {
          setErrorStatus(null);
        }, 6000);
      };

      rec.onend = () => {
        setIsRecording(false);
        setRecordingStatus("");
      };

      recognitionRef.current = rec;
    } else {
      // Check again if we can mock or detect
      setSpeechRecognitionSupported(false);
    }
  }, []);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Run scroll adjustments when messages change or loading state toggles
  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    if (isUserAtBottom) {
      // Direct property manipulation inside a decoupled microtask avoids iframe viewport jumping
      const timer = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      setShowScrollDownNotifier(false);
      return () => clearTimeout(timer);
    } else {
      // If user scrolled up, show a polite visual notifier button instead of forcing scroll
      setShowScrollDownNotifier(true);
    }
  }, [messages, isLoading]);

  // Handle Speech-to-Text dynamic start/stop
  const handleToggleRecording = () => {
    if (!speechRecognitionSupported) {
      setErrorStatus("🎤 VOICE INPUT NOTICE: Crop voice dictation is restricted inside sandboxed preview iframes. Please select \"Open in separate tab\" at the top right of your screen to grant native browser microphone access!");
      setTimeout(() => {
        setErrorStatus(null);
      }, 8500);
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.warn("Failed to stop speech capture gracefully:", err);
      }
    } else {
      try {
        // Map target read options language back to compatible input capture locale BCP-47 code
        const speechLangMapping: Record<string, string> = {
          English: "en-US",
          Hindi: "hi-IN",
          Punjabi: "pa-IN",
          Tamil: "ta-IN",
          Telugu: "te-IN",
          Bengali: "bn-IN",
          Marathi: "mr-IN",
          Gujarati: "gu-IN",
          Kannada: "kn-IN",
          Malayalam: "ml-IN",
          Urdu: "ur-IN"
        };
        const langCode = speechLangMapping[selectedSettingLang] || "en-US";
        
        recognitionRef.current.lang = langCode;
        recognitionRef.current.start();
      } catch (e: any) {
        console.warn("Speech recognition failed to boot:", e);
        setErrorStatus("Failed to activate microphone capture. It might already be listening.");
        setTimeout(() => setErrorStatus(null), 4000);
      }
    }
  };

  // Speaks response aloud matching detected language and custom speaker voice selection
  const handleStartSpeech = (messageId: string, text: string, langName: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setErrorStatus("🔊 SPEECH WARNING: Text-to-speech engine failed to initialize. Please use Google Chrome or Safari.");
      setTimeout(() => {
        setErrorStatus(null);
      }, 5000);
      return;
    }

    // Stop and cancel any existing speech first
    window.speechSynthesis.cancel();

    const cleanSpeechText = stripMarkdownForSpeech(text);
    // Detect matching language details, prioritizing explicit metadata from the response payload
    let langInfo = detectLanguage(text);
    if (langName && langName !== "English" && langName !== langInfo.name) {
      const mapping: Record<string, string> = {
        Hindi: "hi-IN",
        Punjabi: "pa-IN",
        Tamil: "ta-IN",
        Telugu: "te-IN",
        Bengali: "bn-IN",
        Marathi: "mr-IN",
        Gujarati: "gu-IN",
        Kannada: "kn-IN",
        Malayalam: "ml-IN",
        Urdu: "ur-IN",
        Odia: "or-IN",
        Assamese: "as-IN"
      };
      if (mapping[langName]) {
        langInfo = { name: langName, code: mapping[langName] };
      }
    }
    const langCodeRule = langInfo.code;
    const detectedLangName = langInfo.name; // English, Hindi, Punjabi, Tamil...

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = speechSpeed;
    utterance.volume = speechVolume;
    
    // Custom voice selection: Use preferred choice if defined
    const preferredVoiceName = preferredVoices[detectedLangName];
    let chosenVoiceObj = availableVoices.find(voice => voice.name === preferredVoiceName);

    if (!chosenVoiceObj) {
      // Fallback: Automated Language Matching matching BCP47 prefix (e.g. en, hi, pa, ta)
      const sub = langCodeRule.substring(0, 2).toLowerCase();
      chosenVoiceObj = availableVoices.find(voice => voice.lang.toLowerCase().startsWith(sub));
    }

    if (chosenVoiceObj) {
      utterance.voice = chosenVoiceObj;
      utterance.lang = chosenVoiceObj.lang;
    } else {
      utterance.lang = langCodeRule;
    }

    utterance.onend = () => {
      setCurrentlyPlayingId(null);
      setTtsState("stopped");
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis got interrupted:", e);
      setCurrentlyPlayingId(null);
      setTtsState("stopped");
    };

    utteranceRef.current = utterance;
    setCurrentlyPlayingId(messageId);
    setTtsState("speaking");

    window.speechSynthesis.speak(utterance);
  };

  // Preview designated voice option (Speaks the requested preview phrase: "Hello, I am your AgroSensiX AI Farming Assistant.")
  const handlePlayPreview = (voiceObjOnForm: SpeechSynthesisVoice | undefined, langCodePreviewValue: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Cancel other playings
    window.speechSynthesis.cancel();

    const previewMessage = "Hello, I am your AgroSensiX AI Farming Assistant.";
    const utterance = new SpeechSynthesisUtterance(previewMessage);
    utterance.rate = speechSpeed;
    utterance.volume = speechVolume;

    if (voiceObjOnForm) {
      utterance.voice = voiceObjOnForm;
      utterance.lang = voiceObjOnForm.lang;
    } else {
      utterance.lang = langCodePreviewValue;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setTtsState("paused");
    }
  };

  const handleResumeSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setTtsState("speaking");
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setCurrentlyPlayingId(null);
      setTtsState("stopped");
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Detect user input language for storage
    const currentLang = detectLanguage(textToSend);

    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
      detectedLanguage: currentLang.name
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    setErrorStatus(null);

    // Stop speaking immediately to prevent text-narrative overlay bleeding
    handleStopSpeech();

    // 1. SMART ROUTING FLOW
    const queryCategory = classifyQuestion(textToSend);

    if (!isOnline && (queryCategory === "sensor_level1" || queryCategory === "status_level2")) {
      // Offline but direct telemetry request: prioritize local state instantly!
      const instantReply = getInstantResponse(textToSend);
      const assistantMsg: ChatMessage = {
        id: `m-bot-offline-instant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        detectedLanguage: currentLang.name
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);

      let currentWordIndex = 0;
      const responseWords = instantReply.split(" ");
      const interval = setInterval(() => {
        if (currentWordIndex >= responseWords.length) {
          clearInterval(interval);
          return;
        }
        const partialResult = responseWords.slice(0, currentWordIndex + 1).join(" ");
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsg.id ? { ...msg, content: partialResult } : msg))
        );
        currentWordIndex += 3;
      }, 15);
      return;
    }

    if (!isOnline) {
      setTimeout(() => {
        const replyText = getLocalizedOfflineResponse(textToSend, currentLang.name);
        const assistantMsg: ChatMessage = {
          id: `m-bot-offline-${Date.now()}`,
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
          detectedLanguage: currentLang.name
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
      }, 750);
      return;
    }

    // Capture conversation history for LLM
    const conversationHistoryForApi = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    }));

    // If query is high-speed LEVEL 1 or LEVEL 2, bypass API completely for sub-50ms latency!
    if (queryCategory === "sensor_level1" || queryCategory === "status_level2") {
      const instantReply = getInstantResponse(textToSend);
      const assistantMsg: ChatMessage = {
        id: `m-bot-instant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        detectedLanguage: currentLang.name
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);

      let currentWordIndex = 0;
      const responseWords = instantReply.split(" ");
      const interval = setInterval(() => {
        if (currentWordIndex >= responseWords.length) {
          clearInterval(interval);
          return;
        }
        const partialResult = responseWords.slice(0, currentWordIndex + 1).join(" ");
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsg.id ? { ...msg, content: partialResult } : msg))
        );
        currentWordIndex += 4; // ultra-fast streaming animation
      }, 12);
      return;
    }

    // LEVEL 3: ADVANCED AI QUERY
    const assistantMsgId = `m-bot-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      detectedLanguage: currentLang.name
    };

    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: textToSend, 
          history: conversationHistoryForApi 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to transmit prompt. HTTP status: ${response.status}`);
      }

      setIsLoading(false); // Disable core spinning indicator as we're streaming active content

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("Unable to obtain standard readable stream reader.");
      }

      let accumulatedContent = "";
      let partialLine = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunkStr).split("\n");
        partialLine = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.substring(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedContent += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg
                  )
                );
              }
            } catch (err) {
              console.debug("Parsed line raw fallback: ", dataStr);
            }
          }
        }
      }

      // Read final characters
      const finalChunkStr = decoder.decode();
      if (finalChunkStr) {
        const trimmedLine = finalChunkStr.trim();
        if (trimmedLine.startsWith("data: ")) {
          const dataStr = trimmedLine.substring(6).trim();
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulatedContent += parsed.text;
            }
          } catch (e) {}
        }
      }

      // Strip of training tags for native voice output reader
      let cleanSpeechText = accumulatedContent;
      const markerMatch = cleanSpeechText.match(/\[Language Detected:\s*([^\]]+)\]/i);
      let foundLanguage = currentLang.name;
      if (markerMatch) {
         foundLanguage = markerMatch[1].trim();
         cleanSpeechText = cleanSpeechText.replace(/\[Language Detected:\s*[^\]]+\]/i, "").trim();
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: cleanSpeechText, detectedLanguage: foundLanguage } : msg
        )
      );

    } catch (err: any) {
      console.warn("AI gateway transmission failed, adopting preloaded offline database fallbacks:", err);
      setTimeout(() => {
        const replyText = getLocalizedOfflineResponse(textToSend, currentLang.name);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  id: `m-bot-fallback-${Date.now()}`,
                  content: replyText,
                  detectedLanguage: currentLang.name
                }
              : msg
          )
        );
        setIsLoading(false);
      }, 400);
    } finally {
      setIsLoading(false);
    }
  };

  const getVoicesForSelectedLang = (langName: string) => {
    const prefixes: Record<string, string[]> = {
      English: ["en"],
      Hindi: ["hi"],
      Punjabi: ["pa"],
      Tamil: ["ta"],
      Telugu: ["te"],
      Bengali: ["bn"],
      Marathi: ["mr"],
      Gujarati: ["gu"],
      Kannada: ["kn"],
      Malayalam: ["ml"],
      Urdu: ["ur"]
    };
    const currentPrefixes = prefixes[langName] || [];
    const langLower = langName.toLowerCase();
    
    return availableVoices.filter(v => {
      const vLang = v.lang.toLowerCase();
      const vName = v.name.toLowerCase();
      const matchesPrefix = currentPrefixes.some(p => vLang.startsWith(p));
      const matchesName = vName.includes(langLower);
      return matchesPrefix || matchesName;
    });
  };

  const handlesSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Guard duplicate submissions safely
    handleSendMessage(inputValue);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4.5">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400 animate-pulse" />
            AgroSensiX Agricultural Expert
          </h2>
          <p className="text-xs font-mono text-zinc-500 font-bold">
            Live Agronomist Advisory & Machine Intelligence optimized with soil moisture telemetry and local battery harvest data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-amber-500 animate-pulse"}`} />
          <span className={`text-[10px] font-mono uppercase tracking-widest bg-zinc-950 px-3 py-1 rounded-xl border ${
            isOnline ? "text-emerald-400 border-emerald-500/10" : "text-amber-400 border-amber-500/20"
          }`}>
            {isOnline ? "EXPERT: ONLINE" : "OFFLINE COGNITIVE MODE ACTIVATE"}
          </span>
        </div>
      </div>

      {/* Main Grid: Chat vs Preloaded advice topics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Chat Stream Window */}
        <div className="lg:col-span-3 flex flex-col bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl h-[530px] overflow-hidden shadow-2xl relative">
          
          {/* Diagnostic Sub-header */}
          <div className="bg-zinc-950 border-b border-zinc-900/60 p-3.5 px-5 flex justify-between items-center z-10">
            <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              🌐 MULTILINGUAL CHAT & VOCAL PORTAL
            </span>
            <button
              id="clear-chat-history"
              onClick={() => {
                handleStopSpeech();
                setMessages([
                  {
                    id: "init-msg-reset",
                    role: "assistant",
                    content: "### Chat History Cleared\n\nI have cleared the chat history. Ask me a new question in English, Hindi, Punjabi, Tamil, or any language you speak!",
                    timestamp: new Date(),
                    detectedLanguage: "English"
                  }
                ]);
              }}
              className="text-[10px] font-mono text-zinc-500 hover:text-red-400 transition-colors uppercase cursor-pointer"
            >
              Clear History
            </button>
          </div>

          {/* Message List */}
          <div 
            ref={messageListRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-5 space-y-4"
          >
            {messages.map((msg) => {
              const detectedLanguageOfMsg = msg.detectedLanguage || detectLanguage(msg.content).name;
              const isAssistant = msg.role === "assistant";
              const isThisPlaying = currentlyPlayingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${
                    msg.role === "user"
                      ? "bg-zinc-950 border-zinc-800 text-zinc-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble Content */}
                  <div className={`p-4.5 rounded-2xl text-xs space-y-1 text-left relative group ${
                    msg.role === "user"
                      ? "bg-[#09352c]/40 backdrop-blur-sm border border-emerald-500/15 text-zinc-100 rounded-tr-none"
                      : "bg-[#050809] border border-zinc-900/80 text-zinc-300 rounded-tl-none pr-7 shadow-sm"
                  }`}>
                    
                    {/* Read Speaker Control Overlay shown on bot replies */}
                    {isAssistant && (
                      <div className="absolute top-2.5 right-2 opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => handleStartSpeech(msg.id, msg.content, detectedLanguageOfMsg)}
                          className={`p-1 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/35 rounded-md text-zinc-400 hover:text-emerald-400 transition cursor-pointer ${
                            isThisPlaying ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/20" : ""
                          }`}
                          title="🔊 Listen to Answer"
                        >
                          <Volume2 className="w-3.5 h-3.5 font-bold" />
                        </button>
                      </div>
                    )}

                    {isAssistant ? (
                      renderFormattedAdvisory(msg.content)
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {/* Speech Player Micro Control Bar for currently spoken answers */}
                    {isThisPlaying && (
                      <div className="mt-3.5 py-1.5 px-3 bg-[#0a1e1b] border border-emerald-500/15 rounded-lg flex items-center justify-between gap-3 animate-pulse">
                        
                        {/* Audio Wave animation */}
                        <div className="flex items-end gap-0.5 h-2.5 shrink-0">
                          <div className={`w-0.5 bg-emerald-400 rounded-full ${ttsState === 'speaking' ? 'animate-bounce' : 'h-1'}`} style={{ animationDuration: '0.6s', animationDelay: '0.1s' }} />
                          <div className={`w-0.5 bg-emerald-400 rounded-full ${ttsState === 'speaking' ? 'animate-bounce' : 'h-1'}`} style={{ animationDuration: '0.8s', animationDelay: '0.3s' }} />
                          <div className={`w-0.5 bg-emerald-400 rounded-full ${ttsState === 'speaking' ? 'animate-bounce' : 'h-1'}`} style={{ animationDuration: '0.5s', animationDelay: '0.2s' }} />
                          <div className={`w-0.5 bg-emerald-400 rounded-full ${ttsState === 'speaking' ? 'animate-bounce' : 'h-1'}`} style={{ animationDuration: '0.7s', animationDelay: '0.4s' }} />
                        </div>

                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                          {ttsState === "speaking" ? "🔊 Speaking..." : "⏸️ Speech Paused"}
                        </span>

                        <div className="flex items-center gap-1">
                          {ttsState === "speaking" ? (
                            <button
                              onClick={handlePauseSpeech}
                              className="p-1 hover:bg-zinc-900 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                              title="Pause"
                            >
                              <Pause className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={handleResumeSpeech}
                              className="p-1 hover:bg-zinc-900 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                              title="Resume"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={handleStopSpeech}
                            className="p-1 hover:bg-zinc-900 rounded text-zinc-500 hover:text-red-400 transition-colors"
                            title="Stop"
                          >
                            <Square className="w-3 h-3 fill-zinc-500" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1 border-t border-zinc-900/40">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8px] font-mono text-[#0a8069] font-bold bg-[#042821]/35 px-1.5 py-0.5 rounded border border-emerald-500/5 select-none uppercase">
                          🌐 {detectedLanguageOfMsg}
                        </span>

                        {isAssistant && (
                          <button
                            onClick={() => {
                              if (isThisPlaying && ttsState === "speaking") {
                                handlePauseSpeech();
                              } else if (isThisPlaying && ttsState === "paused") {
                                handleResumeSpeech();
                              } else {
                                handleStartSpeech(msg.id, msg.content, detectedLanguageOfMsg);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-[5px] text-[8.5px] font-mono font-black tracking-wider flex items-center gap-1 transition-all cursor-pointer border ${
                              isThisPlaying 
                                ? "bg-[#042b1f] text-emerald-400 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.15)] animate-pulse" 
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30"
                            }`}
                            title="Speak response text out loud"
                          >
                            <Volume2 className="w-2.5 h-2.5 shrink-0" />
                            {isThisPlaying && ttsState === "speaking" ? "SPEAKING / TAP TO PAUSE" : isThisPlaying && ttsState === "paused" ? "PAUSED / TAP TO RESUME" : "LISTEN ALOUD"}
                          </button>
                        )}
                      </div>

                      <span className="text-[8px] font-mono text-zinc-650 block font-bold select-none text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Simulated/Genuine Loading State */}
            {isLoading && (
              <div className="flex gap-3 mr-auto max-w-[80%] animate-pulse">
                <div className="w-8.5 h-8.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="p-4 rounded-2xl bg-[#050809] border border-zinc-900 text-zinc-500 text-xs rounded-tl-none flex items-center gap-2 font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                  ANALYZING BOTANICAL DATA & GENERATING IN {liveLanguage.name.toUpperCase()}...
                </div>
              </div>
            )}

            {errorStatus && (
              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-500 text-[10px] font-mono flex items-center gap-2 max-w-md mx-auto justify-center">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>ASSISTANT ERROR: {errorStatus}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {showScrollDownNotifier && (
            <button
              type="button"
              onClick={() => {
                const container = messageListRef.current;
                if (container) {
                  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                  setIsUserAtBottom(true);
                  setShowScrollDownNotifier(false);
                }
              }}
              className="absolute bottom-18 left-1/2 -translate-x-1/2 bg-emerald-500 hover:bg-emerald-450 border border-emerald-400/20 text-[#020405] font-sans text-[10px] font-bold py-1.5 px-4 rounded-full shadow-xl flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 uppercase tracking-wider z-25 animate-bounce"
            >
              <span>New Response ↓</span>
            </button>
          )}

          {/* Form Action Input with Voice / Microphone Trigger */}
          <div className="border-t border-zinc-900 bg-zinc-950/80 p-3.5 space-y-2.5">
            
            {/* Realtime voice input banner & detection display */}
            <div className="flex items-center justify-between text-[10px] font-mono px-1">
              <div className="flex items-center gap-1.5 font-bold text-zinc-400 flex-wrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                🌐 Language Detected: <span className="text-emerald-400 underline decoration-dotted bg-emerald-500/5 px-1.5 py-0.5 rounded">{liveLanguage.name}</span>
                <span className="text-zinc-500">| Mic Input Capture:</span>
                <span className="text-emerald-400 font-extrabold bg-zinc-900/45 px-1.5 py-0.5 rounded border border-zinc-800">{selectedSettingLang}</span>
              </div>

              {isRecording && (
                <div className="flex items-center gap-1 text-red-400 animate-pulse font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 scale-95 animate-ping" />
                  <span>{recordingStatus || "Recording..."}</span>
                </div>
              )}
            </div>

            {!speechRecognitionSupported && (
              <div className="text-[10px] bg-amber-955/15 border border-amber-900/25 rounded-xl p-2.5 text-zinc-400 flex items-start gap-2 font-mono leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500 animate-pulse" />
                <div>
                  <span className="font-extrabold text-amber-400 uppercase">🎤 SANDBOX PRIVACY NOTICE:</span> Browser sandbox attributes restrict microphone access inside nested dev iframes. Please select <strong className="text-emerald-400 font-bold underline">"Open in a separate tab"</strong> at the top right to start recording your voice!
                </div>
              </div>
            )}

            <form 
              onSubmit={handlesSubmitForm} 
              className="flex gap-2 items-center"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    isRecording 
                      ? "Listening... Speak your crop query clearly now" 
                      : !speechRecognitionSupported 
                        ? `Iframe Mic locked. Please type your query in ${selectedSettingLang}...` 
                        : `Ask in your native language (English, Hindi, Punjabi, Tamil...)`
                  }
                  className={`w-full bg-zinc-900 border border-zinc-900/80 rounded-xl py-2.5 px-4 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 placeholder-zinc-650 transition-all font-bold ${
                    isRecording ? "border-red-500/40 ring-1 ring-red-500/10 text-red-200" : ""
                  }`}
                />
              </div>

              {/* Explicit Microphone Sibling Button */}
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isRecording 
                    ? "bg-red-500 text-white border-red-500 animate-bounce shadow-lg shadow-red-500/20" 
                    : !speechRecognitionSupported
                      ? "bg-zinc-900/40 border-zinc-900 text-zinc-600 hover:text-amber-500 hover:border-amber-500/20 active:scale-95"
                      : "bg-zinc-900 text-zinc-400 hover:text-emerald-400 border-zinc-900 hover:border-emerald-500/30 active:scale-95"
                }`}
                title={
                  !speechRecognitionSupported 
                    ? "Voice Input Restricted (Microphone blocked in iframe)" 
                    : isRecording 
                      ? "Stop Recording (Save Text)" 
                      : `🎤 Speak Query in ${selectedSettingLang}`
                }
              >
                {!speechRecognitionSupported ? (
                  <MicOff className="w-4 h-4 text-zinc-500" />
                ) : (
                  <Mic className={`w-4 h-4 font-bold ${isRecording ? "animate-pulse" : ""}`} />
                )}
              </button>

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-450 disabled:bg-zinc-900 border border-emerald-455/10 disabled:border-transparent text-[#020405] disabled:text-zinc-650 rounded-xl font-sans text-xs uppercase tracking-wider font-bold flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0 shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Suggestive preloaded prompts panel with multilang detection hints */}
        <div className="space-y-4 text-left">

          {/* UPGRADE: Dedicated Multilingual Voice Reader Settings Block */}
          <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-4.5 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400 animate-pulse" />
                Voice Reader Settings
              </h3>
              {voicePrefsSaved && (
                <span className="text-[8px] font-mono font-black text-[#10b981] bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded animate-pulse">
                  AUTO-SAVED
                </span>
              )}
            </div>

            {/* General parameters: Speed & Volume */}
            <div className="space-y-3.5 text-xs">
              
              {/* Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 font-bold">
                  <span>⚡ PLAY SPEED</span>
                  <span className="text-emerald-400 font-black">{speechSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speechSpeed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 font-bold">
                  <span>🔊 READER VOLUME</span>
                  <span className="text-emerald-400 font-black">{Math.round(speechVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={speechVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

            </div>

            {/* Language voice configuration segment */}
            <div className="space-y-3 border-t border-zinc-900 pt-3.5">
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase block text-left">
                  🌐 Target Language Voice:
                </label>
                <select
                  value={selectedSettingLang}
                  onChange={(e) => setSelectedSettingLang(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-emerald-500/40 font-bold"
                >
                  {[
                    "English",
                    "Hindi",
                    "Punjabi",
                    "Tamil",
                    "Telugu",
                    "Bengali",
                    "Marathi",
                    "Gujarati",
                    "Kannada",
                    "Malayalam",
                    "Urdu"
                  ].map((lang) => (
                    <option key={lang} value={lang}>
                      {lang} Reader Options
                    </option>
                  ))}
                </select>
              </div>

              {/* Match and display voices available for selected target language */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase block text-left">
                  🎤 SELECT PREFERRED VOICE:
                </label>
                
                {(() => {
                  const matchingVoices = getVoicesForSelectedLang(selectedSettingLang);
                  const activePreferredVoice = preferredVoices[selectedSettingLang] || "";

                  return (
                    <div className="space-y-2">
                       <div className="flex gap-1.5">
                        <select
                          value={activePreferredVoice}
                          onChange={(e) => updatePreferredVoice(selectedSettingLang, e.target.value)}
                          className="flex-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 py-1.5 px-2 rounded-lg focus:outline-none focus:border-emerald-500/40 font-bold font-mono"
                        >
                          <option value="">-- Use Default {selectedSettingLang} Voice --</option>
                          {matchingVoices.length > 0 ? (
                            matchingVoices.map((voice) => (
                              <option key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                              </option>
                            ))
                          ) : (
                            // List all available device voices if no native ones are found
                            availableVoices.map((voice) => (
                              <option key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                              </option>
                            ))
                          )}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const chosenVoiceName = preferredVoices[selectedSettingLang];
                            const voiceObj = availableVoices.find(v => v.name === chosenVoiceName);
                            const fallbackCode = {
                              English: "en-US",
                              Hindi: "hi-IN",
                              Punjabi: "pa-IN",
                              Tamil: "ta-IN",
                              Telugu: "te-IN",
                              Bengali: "bn-IN",
                              Marathi: "mr-IN",
                              Gujarati: "gu-IN",
                              Kannada: "kn-IN",
                              Malayalam: "ml-IN",
                              Urdu: "ur-IN"
                            }[selectedSettingLang] || "en-US";
                            
                            handlePlayPreview(voiceObj, fallbackCode);
                          }}
                          className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/45 text-emerald-400 hover:text-emerald-300 rounded-lg text-[9px] font-mono font-black flex items-center justify-center shrink-0 cursor-pointer transition active:scale-95"
                          title="Preview chosen voice settings"
                        >
                          ▶ PREVIEW
                        </button>
                      </div>

                      <div className="p-2 bg-emerald-950/15 border border-emerald-500/10 rounded-lg text-[9px] font-mono text-zinc-400 font-bold leading-normal text-left">
                        <span className="text-emerald-400 font-extrabold uppercase block mb-0.5">ℹ️ System Voices Status</span>
                        {matchingVoices.length > 0 ? (
                          `Found ${matchingVoices.length} native ${selectedSettingLang} vocal engines localized for you.`
                        ) : (
                          `Default browser engine falls back to available device options for ${selectedSettingLang}.`
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>

              <div className="flex gap-2 justify-between items-center pt-1.5 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="text-[9px] font-mono font-bold text-zinc-500 hover:text-zinc-350 flex items-center gap-1 cursor-pointer"
                  title="Restore standard presets"
                >
                  <RotateCcw className="w-3 h-3 text-zinc-500" />
                  Reset Defaults
                </button>
                <span className="text-[8px] font-mono text-zinc-600 block text-right font-black select-none">
                  OFFLINE COMPATIBLE
                </span>
              </div>

            </div>

            {/* Accessibility features reminder */}
            <div className="p-3 bg-[#031d16]/30 border border-emerald-500/10 rounded-xl text-[9px] font-mono text-zinc-400 leading-normal font-bold text-left">
              <span className="text-emerald-400 font-extrabold block uppercase mb-1">
                ♿ ACCESSIBILITY ASSISTIVE SUITE
              </span>
              Designed to support elderly farmers, visually impaired workers, and hands-free crop field monitoring.
            </div>

          </div>
          
          <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-4.5 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Multilingual Examples
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 mb-3 leading-normal font-bold">
              Tap any pre-translated query block below or speak one directly to test the smart translator:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleSendMessage("What is the soil moisture level?")}
                disabled={isLoading}
                className="w-full text-left text-[11px] font-mono text-zinc-400 hover:text-emerald-400 bg-zinc-950/60 border border-zinc-900/80 hover:border-emerald-500/25 p-2.5 rounded-xl transition cursor-pointer font-bold block"
              >
                🌾 <span className="text-zinc-500">EN</span>: &quot;What is soil moisture?&quot;
              </button>

              <button
                onClick={() => handleSendMessage("मिट्टी में नमी कितनी है?")}
                disabled={isLoading}
                className="w-full text-left text-[11px] font-mono text-zinc-400 hover:text-emerald-400 bg-zinc-950/60 border border-zinc-900/80 hover:border-emerald-500/25 p-2.5 rounded-xl transition cursor-pointer font-bold block"
              >
                🌾 <span className="text-zinc-500">HI</span>: &quot;मिट्टी में नमी कितनी है?&quot;
              </button>

              <button
                onClick={() => handleSendMessage("ਮਿੱਟੀ ਦੀ ਨਮੀ ਕਿੰਨੀ ਹੈ?")}
                disabled={isLoading}
                className="w-full text-left text-[11px] font-mono text-zinc-400 hover:text-emerald-400 bg-zinc-950/60 border border-zinc-900/80 hover:border-emerald-500/25 p-2.5 rounded-xl transition cursor-pointer font-bold block"
              >
                🌾 <span className="text-zinc-500">PA</span>: &quot;ਮਿੱਟੀ ਦੀ ਨਮੀ ਕਿੰਨੀ ਹੈ?&quot;
              </button>

              <button
                onClick={() => handleSendMessage("மண்ணின் ஈரப்பதம் எவ்வளவு?")}
                disabled={isLoading}
                className="w-full text-left text-[11px] font-mono text-zinc-400 hover:text-emerald-400 bg-zinc-950/60 border border-zinc-900/80 hover:border-emerald-500/25 p-2.5 rounded-xl transition cursor-pointer font-bold block"
              >
                🌾 <span className="text-zinc-500">TA</span>: &quot;மண்ணின் ஈரப்பதம் என்ன?&quot;
              </button>

              <button
                onClick={() => handleSendMessage("মাটির আর্দ্রতা কত?")}
                disabled={isLoading}
                className="w-full text-left text-[11px] font-mono text-zinc-400 hover:text-emerald-400 bg-zinc-950/60 border border-zinc-900/80 hover:border-emerald-500/25 p-2.5 rounded-xl transition cursor-pointer font-bold block"
              >
                🌾 <span className="text-zinc-500">BN</span>: &quot;মাটির আর্দ্রতা কত?&quot;
              </button>
            </div>
          </div>

          <div className="bg-zinc-950/45 backdrop-blur-md border border-zinc-900 rounded-2xl p-4 text-[10px] font-mono text-zinc-500 leading-normal font-bold">
            <span className="text-emerald-400 font-bold block uppercase mb-1.5 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 🔊 Voice & Speech UX Guide
            </span>
            <ul className="space-y-1.5 list-disc pl-3 text-zinc-400 font-bold text-[10px]">
              <li>Use the 🎤 microphone button next to the input box to dictate answers.</li>
              <li>Toggle the 🔊 speaker button on any reply to read it aloud beautifully in its native script.</li>
              <li>Fully supported offline in standard browser engines.</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
