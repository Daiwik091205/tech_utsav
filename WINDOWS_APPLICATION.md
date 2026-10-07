# Enterprise Multi-Agent Document Intelligence — Windows Desktop Application

> **Air-Gapped Desktop Application Enclave for Windows 10 & 11**  
> Complete transition from a standard web browser page to a hardened, isolated, and mutually-authenticated Windows desktop application for sensitive HIPAA, FERPA, and NDA document intelligence and true hardware redaction.

---

## 1. Security Architecture: Why Desktop Enclave > Web Browser

In enterprise, legal, and healthcare environments, processing confidential records (CMS-1500 medical billing, mutual NDAs, and student grading sheets) in a standard web browser introduces severe security vulnerabilities:

| Risk Vector | Standard Web Browser Page (`http://localhost:5173`) | Windows Desktop Application Enclave |
| :--- | :--- | :--- |
| **Browser Extension Snooping** | Vulnerable: Third-party extensions (Grammarly, password managers, scrapers) can read DOM text, scan canvas data, and leak PHI/PII. | **Eliminated**: Runs in an isolated, sandboxed window with extensions completely disabled. |
| **Localhost Cross-Site Port Scanning** | Vulnerable: Any malicious website visited in Chrome/Edge can execute cross-origin requests to `http://127.0.0.1:8000`. | **Protected**: Protected by an ephemeral 256-bit cryptographically random token (`X-Session-Token`). External callers receive `403 Forbidden`. |
| **Process Lifecycle Management** | Orphaned servers: Backend and dev servers linger in the background when the browser tab is closed. | **Automated Containment**: Window close triggers immediate graceful `/api/shutdown` and kills child process trees cleanly. |
| **Data Egress & Navigation** | Users or malicious scripts can redirect the page or paste untrusted external URLs. | **Hardened Sandboxing**: `will-navigate` blocks all external URLs. `setWindowOpenHandler` denies popup windows. |
| **File System Integration** | Downloads go into generic `Downloads/` folder with browser cache copies. | **Native Windows Dialogs**: Uses native Windows Explorer File Dialogs (`dialog.showSaveDialog`), saving directly to user-chosen paths with zero intermediate browser cache retention. |

---

## 2. Windows Application Components

The repository includes a turnkey suite of Windows desktop components:

1. **`run_windows_app.bat`**: 1-Click Windows Batch launcher. Automatically detects Python and Node, initializes virtual environments, and starts the secure desktop window.
2. **`build_windows_exe.bat`**: 1-Click Windows compiler. Builds the standalone Windows installer (`.exe`) and portable zero-install executable.
3. **`desktop_launcher.py`**: Python-native desktop launcher powered by Microsoft Edge WebView2 (`pywebview`). Allows running the full desktop application without requiring Node.js on the target Windows machine.
4. **`build_pyinstaller_win.bat`**: Standalone Python executable compiler using PyInstaller for air-gapped environments.
5. **`launch_app.ps1`**: Enterprise PowerShell automation script for Windows IT administrators.
6. **`frontend/electron/main.cjs`**: Electron main process orchestrating the Python backend subprocess, managing ephemeral session tokens, and handling native Windows file operations.
7. **`frontend/electron/preload.cjs`**: Sandboxed context bridge enforcing `contextIsolation: true`, `nodeIntegration: false`, and exposing type-safe IPC APIs.

---

## 3. How to Run on Windows (Quick Start)

### Method A: 1-Click Batch Launcher (Recommended)
Simply double-click:
```cmd
run_windows_app.bat
```
This script will:
1. Verify Python 3.10+ and Node.js.
2. Create/update the virtual environment in `backend\.venv`.
3. Install dependencies from `backend\requirements.txt` and `frontend\package.json` if missing.
4. Compile the frontend production assets into `frontend\dist`.
5. Generate an ephemeral mutual enclave session token.
6. Launch the native desktop window.

---

### Method B: Native Python Edge WebView2 Launcher (Zero Node.js Required)
For air-gapped Windows environments where Node.js cannot be installed:
```cmd
python desktop_launcher.py
```
This utilizes the Microsoft Edge WebView2 runtime already built into Windows 10 and 11, running the frontend and backend in a single, unified Python desktop process.

---

### Method C: Enterprise PowerShell Launcher
```powershell
powershell -ExecutionPolicy Bypass -File .\launch_app.ps1
```

---

## 4. How to Build Standalone Windows Executables (`.exe`)

To package this application for distribution across Windows machines:

### Option 1: Electron NSIS Installer & Portable EXE
Run:
```cmd
build_windows_exe.bat
```
*(Or in `frontend`: `npm run build:win`)*

This generates:
- **`dist-windows\Enterprise-Document-Intelligence-Setup-1.0.0.exe`**: Complete Windows installer with desktop shortcut, Start Menu entry, and Windows Uninstaller.
- **`dist-windows\Enterprise-Document-Intelligence-1.0.0-Portable-Windows-x64.exe`**: Zero-install standalone executable that runs directly from any folder or USB drive.

### Option 2: Standalone PyInstaller Executable
Run:
```cmd
build_pyinstaller_win.bat
```
Produces `dist\EnterpriseDocumentIntelligence\EnterpriseDocumentIntelligence.exe`.

---

## 5. Native Windows Desktop Features

- **Explorer File Selection (`Ctrl+O`)**: Clicking "Browse via Windows Explorer" opens the native Windows file chooser filtered for `.pdf` files.
- **Direct Save Dialog (`Ctrl+S`)**: Clicking "Download Redacted PDF" invokes the native Windows Save File dialog, allowing custom file naming and folder selection.
- **"Reveal in Windows Explorer"**: After saving a redacted document or audit report, an in-app banner allows revealing the file directly in Windows File Explorer with 1 click.
- **Enclave Process Badge**: Top status bar indicates `Windows Enclave: Process Isolated` with real-time mutual authentication heartbeat.
- **Clean Memory Wipe on Exit**: On window closure (`Alt+F4`), memory document caches are evicted, and backend processes are terminated immediately.

---

## 6. Technical Security Specifications

- **Mutual Authentication**: Ephemeral 256-bit token passed via `DOCUMENT_ENGINE_SECRET_TOKEN` environment variable and verified on every HTTP/SSE request via `X-Session-Token` header.
- **Chromium Sandboxing**: `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`.
- **Egress Prevention**: Remote navigation denied; Content Security Policy restricted to local loopback enclave.
- **Hardware Redaction**: Vector text stream scrubbed and true pixel burn-in applied via PyMuPDF (`fitz.PDF_REDACT_IMAGE_PIXELS`).
