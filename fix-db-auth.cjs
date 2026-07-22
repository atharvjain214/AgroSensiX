const fs = require('fs');

let code = fs.readFileSync('src/dbUtils.ts', 'utf8');

// Add auth import if not present
if (!code.includes('import { auth } from "./firebase";') && !code.includes('import { auth, db')) {
  code = code.replace('import { db, handleFirestoreError', 'import { auth, db, handleFirestoreError');
}

// Replace each update function to check auth
const functionsToPatch = [
  'updateFirestoreSector',
  'updateFirestoreNode',
  'updateFirestoreBattery',
  'updateFirestorePump',
  'seedDatabaseIfEmpty'
];

for (const fn of functionsToPatch) {
  const regex = new RegExp(`(export async function ${fn}\\([^)]*\\) {\\s*try {)`);
  code = code.replace(regex, `$1\n    if (!auth.currentUser) {\n      console.warn("Attempted to call ${fn} while not authenticated with Firebase. Aborting to prevent permission errors.");\n      return;\n    }`);
}

fs.writeFileSync('src/dbUtils.ts', code);
