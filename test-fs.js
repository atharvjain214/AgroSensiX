const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, setDoc, query, where } = require("firebase/firestore");
const fs = require("fs");

const configRaw = fs.readFileSync("firebase-applet-config.json", "utf8");
const firebaseConfig = JSON.parse(configRaw);
const firebaseApp = initializeApp(firebaseConfig, "test-app");
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const q = query(collection(db, "users"), where("email", "==", "t@t.com"));
    console.log("Running query...");
    await getDocs(q);
    console.log("Query ok.");
    
    console.log("Running setDoc...");
    await setDoc(doc(db, "users", "test1"), { ok: true });
    console.log("setDoc ok.");
  } catch (err) {
    console.error(err);
  }
}
run();
