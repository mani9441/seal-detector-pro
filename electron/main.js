// ===== Imports =====
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { checkLicense } from "./license.js";
import { dialog, app, BrowserWindow } from "electron";
import { spawn } from "child_process";
import { Socket } from "net";

// ===== Path setup (ESM fix) =====
const { join, dirname } = path;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== Globals =====
const PORT = 51234;
let backendProcess;

// ===== Wait for backend =====
function waitForBackend(port, retries = 120, delay = 250) {
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = new Socket();

      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();
        if (retries <= 0) {
          reject(new Error("Backend did not start in time"));
        } else {
          retries--;
          setTimeout(tryConnect, delay);
        }
      });

      socket.connect(port, "127.0.0.1");
    };

    tryConnect();
  });
}

// ===== Create window =====
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1.0
    }
  });

  win.loadURL(`http://127.0.0.1:${PORT}`);

  win.webContents.on("did-finish-load", () => {
    win.webContents.setZoomFactor(1.0);
  });

  win.webContents.on("before-input-event", (event, input) => {
    if (input.control && ["+", "-", "0"].includes(input.key)) {
      event.preventDefault();
    }
  });
}

// ===== MAIN FLOW =====
app.whenReady().then(async () => {
  let config = {};

  // ✅ Load config correctly (DEV + PROD)
  try {
    const configPath = app.isPackaged
      ? join(process.resourcesPath, "config.json") // production
      : join(__dirname, "config.json");            // development

    console.log("Loading config from:", configPath);

    config = JSON.parse(readFileSync(configPath, "utf-8"));

    // Inject into environment
    process.env.FB_API_KEY = config.FB_API_KEY;
    process.env.FB_AUTH_DOMAIN = config.FB_AUTH_DOMAIN;
    process.env.FB_PROJECT_ID = config.FB_PROJECT_ID;

  } catch (err) {
    console.error("Failed to load config.json:", err);
    dialog.showErrorBox(
      "Config Error",
      "config.json not found or invalid.\n\n" + err.message
    );
    app.quit();
    return;
  }

  // ✅ License check (after config is loaded)
  try {
    await checkLicense(config);
  } catch (err) {
    dialog.showErrorBox(
      "License Error",
      err.message + "\n\nPlease contact the vendor."
    );
    app.quit();
    return;
  }

  // ✅ Start backend
  backendProcess = spawn(
    join(__dirname, "backend", "backend_start"),
    [],
    {
      cwd: join(__dirname, "backend"),
      env: process.env,
      stdio: "ignore"
    }
  );

  try {
    await waitForBackend(PORT);
  } catch (err) {
    dialog.showErrorBox(
      "Backend Error",
      "Failed to start backend.\n\n" + err.message
    );
    app.quit();
    return;
  }

  // ✅ Launch UI
  createWindow();
});

// ===== Cleanup =====
app.on("will-quit", () => {
  if (backendProcess) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", backendProcess.pid, "/f", "/t"]);
    } else {
      backendProcess.kill();
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});