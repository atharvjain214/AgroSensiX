const fs = require('fs');
let code = fs.readFileSync('src/components/VoiceAssistantModal.tsx', 'utf8');

// The file had a reference error. We will move the functions up!
// We'll extract speakText, stopSpeaking, toggleListening, handleProcessCommand 
// and move them before the first useEffect.

const startRegex = /  \/\/ Speak response out loud using Web SpeechSynthesis/;
const endRegex = /  \/\/ Check Web Speech Recognition support/;

const match = code.match(startRegex);
const matchEnd = code.match(endRegex);

if (match && matchEnd) {
  const blockToMove = code.slice(match.index, matchEnd.index);
  
  // Remove it from the original place
  code = code.replace(blockToMove, '');
  
  // Insert it before the first useEffect
  const insertIndex = code.indexOf('  // Check Web Speech Recognition support');
  code = code.slice(0, insertIndex) + blockToMove + code.slice(insertIndex);
  
  fs.writeFileSync('src/components/VoiceAssistantModal.tsx', code);
  console.log("Moved functions successfully");
} else {
  console.log("Could not find blocks to move");
}
