


const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");
const fs = require("fs");
const path = require("path");


// 🔒 Firebase config (SAFE to embed – no secrets)
const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  projectId: process.env.FB_PROJECT_ID
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CACHE_FILE = path.join(__dirname, "license_cache.json");
const LICENSE_ID = "seal-detector-pro";
const MAX_OFFLINE_DAYS = 30;

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(a, b) {
  return Math.floor(
    (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)
  );
}

async function checkLicense() {
  try {
    const ref = doc(db, "licenses", LICENSE_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error("License not found");
    }

    const data = snap.data();

    if (data.enabled !== true) {
      throw new Error("License disabled remotely");
    }

    if (todayISO() > data.valid_until) {
      throw new Error("License expired");
    }

    // Cache locally for offline use
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({
        valid_until: data.valid_until,
        checked_at: todayISO()
      })
    );

    return true;

  } catch (err) {
    // Offline fallback
    if (fs.existsSync(CACHE_FILE)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE));

      const offlineDays = daysBetween(cached.checked_at, todayISO());

      if (
        todayISO() <= cached.valid_until &&
        offlineDays <= MAX_OFFLINE_DAYS
      ) {
        return true;
      }
    }

    throw err;
  }
}

module.exports = { checkLicense };
