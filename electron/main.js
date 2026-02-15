// ===== Firebase runtime config (SAFE) =====
process.env.FB_API_KEY = "<set at build time>";
process.env.FB_AUTH_DOMAIN = "<set at build time>";
process.env.FB_PROJECT_ID = "<set at build time>";
// =========================================


const { checkLicense } = require("./license");
const { dialog } = require("electron");

const { app, BrowserWindow, globalShortcut } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

const PORT = 51234;
let backendProcess;

const net = require("net");

function waitForBackend(port, retries = 120, delay = 250) {
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = new net.Socket();

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



function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1.0
    }
  });

  win.loadURL(`http://127.0.0.1:${PORT}`);

  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomFactor(1.0);
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && ['+', '-', '0'].includes(input.key)) {
      event.preventDefault();
    }
  });
}


app.whenReady().then(async () => {
  try {
    await checkLicense();
  } catch (err) {
    dialog.showErrorBox(
      "License Error",
      err.message + "\n\nPlease contact the vendor."
    );
    app.quit();
    return;
  }

  // ✅ License OK → start backend
  backendProcess = spawn(
    path.join(__dirname, "backend", "backend_start"),
    [],
    {
      cwd: path.join(__dirname, "backend"),
      env: process.env,
      stdio: "ignore"
    }
  );

  await waitForBackend(PORT);
  createWindow();
});


// Force-kill backend on exit to prevent "port already in use" errors next time
app.on("will-quit", () => {
  if (backendProcess) {
    if (process.platform === "win32") {
      // Aggressive kill for Windows to ensure backend_start and its children die
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