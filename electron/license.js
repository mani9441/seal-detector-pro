import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import os from "os";

const CACHE_FILE = path.join(os.homedir(), ".seal_license_cache.json");

const LICENSE_ID = "seal-detector-pro";
const MAX_OFFLINE_DAYS = 30;
  
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

async function checkLicense(config) {
  const firebaseConfig = {
    apiKey: config.FB_API_KEY,
    authDomain: config.FB_AUTH_DOMAIN,
    projectId: config.FB_PROJECT_ID,
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("License check:", {
    project: config.FB_PROJECT_ID,
    today: todayISO(),
  });

  try {
    const ref = doc(db, "licenses", LICENSE_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error("License not found");
    }

    const data = snap.data();
    console.log("License data:", data);

    if (data.enabled !== true) {
      throw new Error("License disabled remotely");
    }

    if (!data.valid_until) {
      throw new Error("valid_until missing in Firestore");
    }

    if (new Date(todayISO()) > new Date(data.valid_until)) {
      throw new Error("License expired");
    }

    console.log("Writing cache to:", CACHE_FILE);

    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({
        valid_until: data.valid_until,
        checked_at: todayISO(),
      }),
    );

    console.log("Cache updated successfully ✅");

    return true;
  } catch (err) {
    if (fs.existsSync(CACHE_FILE)) {
      let cached;
      try {
        cached = JSON.parse(fs.readFileSync(CACHE_FILE));
      } catch {
        throw err;
      }

      const offlineDays = daysBetween(cached.checked_at, todayISO());

      if (todayISO() <= cached.valid_until && offlineDays <= MAX_OFFLINE_DAYS) {
        return true;
      }
    }

    throw err;
  }
}

export { checkLicense };
