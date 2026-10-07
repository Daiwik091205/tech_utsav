# Enterprise Multi-Agent Document Intelligence — macOS Desktop Application

> **Air-Gapped Desktop Application Enclave for macOS (Apple Silicon & Intel)**  
> Complete transition from a standard web browser page to a hardened, isolated, and mutually-authenticated macOS native desktop application for sensitive HIPAA, FERPA, and corporate document intelligence and true hardware redaction.

---

## 1. Security Architecture: Why Desktop Enclave > Web Browser

In enterprise, legal, and healthcare environments, processing confidential records in a standard web browser introduces critical risks:

| Risk Vector | Standard Web Browser (`http://localhost:5173`) | macOS Desktop Application Enclave |
| :--- | :--- | :--- |
| **Browser Extension Snooping** | Vulnerable: Third-party extensions (Grammarly, password managers, scrapers) can read DOM text, inspect canvas, and leak PHI/PII. | **Eliminated**: Isolated Electron sandboxed window with extensions completely disabled. |
| **Localhost Cross-Site Port Scanning** | Vulnerable: Any malicious website visited in Safari/Chrome can execute cross-origin requests to `http://127.0.0.1:8000`. | **Protected**: Protected by an ephemeral 256-bit cryptographically random token (`X-Session-Token`). External callers receive `403 Forbidden`. |
| **Process Lifecycle Management** | Orphaned servers: Backend and dev servers linger in the background when the browser tab is closed. | **Automated Containment**: Window close triggers immediate graceful `/api/shutdown` and terminates child process trees cleanly. |
| **Data Egress & Navigation** | Users or scripts can navigate to external web pages or open phishing popups. | **Hardened Sandboxing**: `will-navigate` blocks all remote URLs; `setWindowOpenHandler` denies popup windows. |
| **File System Integration** | Downloads go into generic `Downloads/` with browser cache copies. | **Native macOS Save Dialog**: Uses native Apple AppKit Save Panels, saving directly to user-chosen paths with zero intermediate browser cache retention. |

---

## 2. macOS Application Components

The repository includes a turnkey suite of macOS desktop components:

1. **`run_mac_app.sh`**: 1-Click macOS Bash launcher. Automatically detects Python 3.10+ and Node.js, initializes virtual environments, and starts the secure desktop window.
2. **`build_mac_app.sh`**: 1-Click macOS compiler. Packages the native `.app` bundle, Apple Disk Image (`.dmg`), and compressed `.zip` distribution.
3. **`desktop_launcher.py`**: Python-native desktop launcher powered by Microsoft Edge WebView2 / WebKit (`pywebview`). Allows running the full desktop application without Node.js.
4. **`frontend/electron/main.cjs`**: Electron main process orchestrating the Python backend subprocess, managing ephemeral session tokens, and handling native macOS AppKit dialogs and menus.
5. **`frontend/electron/preload.cjs`**: Sandboxed context bridge enforcing `contextIsolation: true`, `nodeIntegration: false`, and exposing type-safe IPC APIs.

---

## 3. How to Run on macOS (Quick Start)

### Method A: 1-Click Shell Launcher (Recommended)
Open Terminal and run:
```bash
./run_mac_app.sh
```
This script will:
1. Verify Python 3.10+ and Node.js.
2. Create/update the virtual environment in `backend/.venv`.
3. Install dependencies from `backend/requirements.txt` and `frontend/package.json` if missing.
4. Compile the frontend production assets into `frontend/dist`.
5. Generate an ephemeral mutual enclave session token.
6. Launch the native desktop window.

---

### Method B: Double-Click the Native `.app` or `.dmg`
After building, open the generated artifacts in `dist-mac/`:
* **`dist-mac/Enterprise Document Intelligence.app`**: Double-click to launch directly.
* **`dist-mac/Enterprise Document Intelligence-1.0.0-macOS-arm64.dmg`**: Open the disk image and drag the application to `/Applications`.

---

### Method C: Zero-Node Python Launcher
For air-gapped environments without Node.js installed:
```bash
python3 desktop_launcher.py
```

---

## 4. How to Build Standalone macOS Applications

To package this application for distribution across macOS machines:

```bash
./build_mac_app.sh
```
*(Or in `frontend`: `npm run build:mac`)*

This generates:
- **`dist-mac/Enterprise Document Intelligence.app`**: Complete macOS application bundle.
- **`dist-mac/Enterprise Document Intelligence-1.0.0-macOS-arm64.dmg`**: Apple Disk Image installer with drag-and-drop `/Applications` symlink.
- **`dist-mac/Enterprise Document Intelligence-1.0.0-macOS-arm64.zip`**: Zero-install standalone archive for USB or air-gapped deployment.

---

## 5. Native macOS Desktop Features

- **Apple Finder File Selection (`Cmd+O`)**: Clicking "Browse via System Dialog" opens the native macOS file chooser supporting both `.pdf` documents and scanned image files (`.png`, `.jpg`, `.jpeg`, `.webp`).
- **Direct Save Panel (`Cmd+S`)**: Invokes native macOS Save File panel, allowing custom folder and filename selection.
- **"Reveal in Finder"**: After saving a redacted document, restored photo, or forensic dossier, an in-app banner allows revealing the file directly in Apple Finder with 1 click.
- **macOS Native Application Menu**: Integrated with standard macOS menu bar (`About`, `Services`, `Hide`, `Quit Cmd+Q`, `Close Window Cmd+W`).
- **Apple Vision Framework OCR Acceleration**: Native on Apple Silicon (M1/M2/M3/M4) for hardware-accelerated text and redaction contour recognition.
- **Enclave Process Badge**: Top status bar displays `macOS Enclave: Process Isolated` with real-time mutual authentication heartbeat.
- **Clean Memory Wipe on Exit**: On window closure (`Cmd+Q` / `Cmd+W`), memory document caches are evicted, and backend processes are terminated immediately.
