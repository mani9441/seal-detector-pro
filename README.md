# Seal Detector Pro

Seal Detector Pro is a **professional Linux desktop application** for real-time detection and inspection of **container door security seals** used in ports, logistics hubs, and cargo terminals.

The application uses **AI-powered computer vision** to analyze live video streams from cameras and automatically detect the presence and condition of container seals, helping improve inspection speed, consistency, and operational security.

Seal Detector Pro runs as a **native desktop application** (no browser required), supports **GPU acceleration**, and includes a **remote license control system** suitable for commercial deployment.

---

## Features

- 🔐 **Automatic detection of container door security seals**
- 📦 Designed for **ports, terminals, and logistics operations**
- 🎥 Supports multiple video sources:
  - USB webcams
  - RTSP IP cameras
  - HTTP/MJPEG streams
  - Video files
- ⚡ **GPU acceleration (CUDA supported)**
- 🖥️ Native Linux desktop application (Electron)
- 🌐 No external browser required
- 📦 Portable **AppImage** and installable **.deb**
- 📴 Offline usage
- 🚀 Production-ready architecture

---

## Architecture Overview

```
Electron (Desktop UI)
↓
FastAPI (Local backend)
↓
AI Detection Model (MMDetection / MMYOLO)
↓
OpenCV + PyTorch (CUDA)

```

- **Electron** provides the desktop window and user interface
- **FastAPI** runs a local backend for video streaming and inference
- **AI model** detects container door seals in real time
- **Firebase Firestore** controls license validation and activation

---

## 📂 Project Structure

```

seal-detector-pro/
├── backend_app.py        # FastAPI application
├── backend_start.py      # Backend launcher (PyInstaller entry)
├── frontend/             # HTML/CSS UI
├── configs/              # AI model configuration files (not in git)
├── models/               # Model weights (not tracked in git)
├── electron/
│   ├── main.js           # Electron main process
│   ├── license.js        # License validation logic
│   ├── package.json      # Electron builder configuration
│   └── icon.png          # Application icon
├── requirements.txt
└── README.md

```

> ⚠️ Large AI model weight files are intentionally **excluded** from the repository.

---

## Supported Platforms

- ✅ Linux (Ubuntu / Debian-based)
- ✅ NVIDIA GPU with CUDA support
- ⚠️ Windows / macOS not currently supported

---

## 🔐 Licensing System

Seal Detector Pro includes a **remote license validation system** designed for commercial use:

- License is validated on application startup
- Offline usage is allowed within a defined grace period
- Licenses can be remotely disabled or extended
- No application rebuild required to revoke access

This allows centralized control over deployed installations.

---

## 🚀 Build & Packaging (Internal)

The application is packaged using:

- **PyInstaller (onedir)** for the Python backend
- **Electron Builder** for:
  - AppImage
  - `.deb` installer

End users **do not need Python or Node.js** installed.

---

## 🧾 Distribution

Final build artifacts:

- `Seal Detector Pro.AppImage`
- `seal-detector-pro_amd64.deb`

Users can:

- Run the AppImage directly
- Install via the `.deb` package

---

## 🔧 Technology Stack

- Python
- FastAPI
- OpenCV
- PyTorch (CUDA)
- MMDetection / MMYOLO
- Electron
- Node.js
- Firebase Firestore

---

## 📌 Notes

- This repository contains **application source code only**
- AI model weights are excluded
- Direct installation packages will be availble soon

---

## 📄 License

This project is proprietary software.  
All rights reserved.

Unauthorized redistribution or modification is prohibited without explicit permission.
