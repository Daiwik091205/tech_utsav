# Enterprise Multi-Agent Document Intelligence & Redaction Engine

[![Direct Download macOS](https://img.shields.io/badge/Download-macOS%20DMG%20(Apple%20Silicon)-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-arm64.dmg)
[![Direct Download Windows](https://img.shields.io/badge/Download-Windows%20(64--bit%20ZIP)-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-Windows-x64.zip)
[![Direct Download macOS Intel](https://img.shields.io/badge/Download-macOS%20DMG%20(Intel)-4B5563?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-x64.dmg)
[![Release v1.0.0](https://img.shields.io/badge/Release-v1.0.0-22c55e?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Daiwik091205/tech_utsav/releases/tag/v1.0.0)
[![Enclave](https://img.shields.io/badge/Security-Air--Gapped%20Enclave-blue?style=for-the-badge)](README.md)
[![HIPAA/GDPR Ready](https://img.shields.io/badge/Compliance-HIPAA%20%7C%20GDPR-purple?style=for-the-badge)](README.md)

An air-gapped, privacy-preserving document pipeline designed for high-stakes enterprise compliance (HIPAA, GDPR, Master Service Agreements). It ingests multi-modal files (scanned PDFs, invoices, NDAs, clinical billing records), distributes layout parsing, extraction, and compliance tasks across specialized agent nodes, and guarantees that Personally Identifiable Information (PII) and Protected Health Information (PHI) are **irreversibly redacted with hardware/pixel burn-in before export**.

---

## ⚡ Direct 1-Click Desktop App Downloads

> **No Release Page Hunting Required:** Download the pre-compiled, hardened desktop application enclaves directly using the 1-click links below. These packages are pre-bundled with local isolated backend runtimes, zero external network egress, and mutual cryptographic enclave authentication.

| Operating System | Target Architecture | Distribution Format | ⚡ Direct 1-Click Download | Size | Installation / Quick Start |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🍏 **macOS** | **Apple Silicon** (M1/M2/M3/M4) | **Apple Disk Image (`.dmg`)** | [⬇️ **Download macOS DMG (Apple Silicon)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-arm64.dmg) | ~131 MB | Double-click `.dmg`, drag to `/Applications` |
| 🍏 **macOS** | **Apple Silicon** (M1/M2/M3/M4) | **Portable Archive (`.zip`)** | [⬇️ **Download macOS ZIP (Apple Silicon)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-arm64.zip) | ~131 MB | Unzip and launch `Enterprise Document Intelligence.app` |
| 🍏 **macOS** | **Intel** (x86_64) | **Apple Disk Image (`.dmg`)** | [⬇️ **Download macOS DMG (Intel)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-x64.dmg) | ~134 MB | Double-click `.dmg`, drag to `/Applications` |
| 🍏 **macOS** | **Intel** (x86_64) | **Portable Archive (`.zip`)** | [⬇️ **Download macOS ZIP (Intel)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-x64.zip) | ~134 MB | Unzip and launch `Enterprise Document Intelligence.app` |
| 🪟 **Windows** | **Windows 10 / 11** (64-bit) | **Full Enclave Archive (`.zip`)** | [⬇️ **Download Windows Enclave Package (.zip)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-Windows-x64.zip) | ~154 MB | Extract and double-click `run_windows_app.bat` or `Enterprise Document Intelligence.exe` |
| 🪟 **Windows** | **Windows 10 / 11** (64-bit) | **Portable Single Executable (`.exe`)** | [⬇️ **Download Portable Executable (.exe)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise-Document-Intelligence-1.0.0-Portable-Windows-x64.exe) | Single `.exe` | Standalone executable (zero installation required) |
| 🪟 **Windows** | **Windows 10 / 11** (64-bit) | **NSIS Desktop Setup (`.exe`)** | [⬇️ **Download Desktop Setup Installer (.exe)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise-Document-Intelligence-Setup-1.0.0.exe) | Installer | Desktop shortcut & Start Menu installer |

### 💻 Direct Terminal Downloads (cURL & PowerShell)

Download directly to your machine without opening a browser:

```bash
# macOS (Apple Silicon M-Series):
curl -fLO "https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-arm64.dmg"

# macOS (Intel):
curl -fLO "https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-x64.dmg"
```

```powershell
# Windows PowerShell (64-bit Package):
Invoke-WebRequest -Uri "https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-Windows-x64.zip" -OutFile "Enterprise-Document-Intelligence-Windows.zip"
Expand-Archive -Path "Enterprise-Document-Intelligence-Windows.zip" -DestinationPath "Enterprise-Document-Intelligence"
```

### 🔒 First-Time Launch Notes (Security Verification)

- **macOS Gatekeeper**: As this is an open-source, air-gapped enterprise build without Apple Developer ID signing, macOS Gatekeeper may display a security notice on first launch:
  - **Option 1**: Right-click (or Control-click) `Enterprise Document Intelligence.app` in `/Applications` or Finder and choose **Open**.
  - **Option 2 (Terminal)**:
    ```bash
    xattr -cr "/Applications/Enterprise Document Intelligence.app"
    ```
- **Windows SmartScreen**: If Windows Defender SmartScreen shows *"Windows protected your PC"*, click **More info** and select **Run anyway**.
- **Cryptographic Hash Verification (SHA-256)**:
  ```
  macOS ARM64 DMG:   6db47752f841ee3e838217b9451d162a438092f89ec4ad2e998fd99fb9f8beb6
  macOS Intel DMG:   f23ca7f207f91f0675d6adeb721c73e447a5da7946b084a8e04de54ed8984620
  macOS ARM64 ZIP:   104010c6d8017a2fd07fc268b5ef8bc81196515124024397329118f2e2ec4f2f
  macOS Intel ZIP:   b46c2ee5d5009a90bf98fac79ba377627913914eb292d038826761b47f26a9dd
  Windows x64 ZIP:   5f5f501aef0e480a0f038302d3a9ed02060105f43e0a539b438c873e3c9c6208
  ```

---

## 1. System Architecture & Multi-Agent DAG Topology

Rather than routing an entire document into a single large prompt—which causes token bloat, hallucinations, and privacy leaks—the architecture delegates work across four deterministic and LLM-powered agents orchestrated via an asynchronous directed acyclic graph (FastAPI Background Tasks + Server-Sent Events):

```
                        +----------------------+
                        |  Uploaded PDF/Image  |
                        +----------+-----------+
                                   |
                                   v
             +---------------------------------------------+
             |        Agent 1: Ingestion & Vision          |
             | - Layout Analysis (PyMuPDF Spatial Parser)  |
             | - Token & Bounding Box Spatial Mapping      |
             +---------------------+-----------------------+
                                   |
                  +----------------+----------------+
                  |                                 |
                  v                                 v
+-----------------------------------+ +----------------------------------+
|    Agent 2: Schema Extraction     | |   Agent 4: Privacy & Redaction   |
| - Local LLM (Ollama/Qwen/Llama)   | | - Microsoft Presidio NER Engine  |
| - Pydantic Strict Type Validator  | | - Regex / Clinical Recognizers   |
| - Key-Value & Tabular Structuring | | - PyMuPDF True Pixel Burn-in     |
+-----------------+-----------------+ +-----------------+----------------+
                  |                                     |
                  v                                     |
+-----------------------------------+                   |
|    Agent 3: Compliance & Risk     |                   |
| - Corporate Policy Cross-Reference|                   |
| - High/Med/Low Liability Scoring  |                   |
| - Suggested Revision Redlines     |                   |
+-----------------+-----------------+                   |
                  |                                     |
                  +----------------+--------------------+
                                   |
                                   v
             +---------------------------------------------+
             |       Aggregator & Streaming Gateway        |
             | - Side-by-Side Dual-Pane Viewer             |
             | - Differential Privacy Laplace Noise Injected|
             | - Redacted PDF + Signed Audit Report JSON   |
             +---------------------------------------------+
```

---

## 2. Cybersecurity & Privacy Mechanics

### Preventing "Fake Redaction" Leaks
Standard enterprise tools often draw black SVG boxes over text, leaving the underlying text stream selectable and easily extractable from the PDF vector stream. This engine employs **True Hardware/Pixel Redaction using PyMuPDF (`fitz`)**:

1. **Locate character bounding rects** on the PDF canvas.
2. **Register redaction annotations** with `page.add_redact_annot(rect, fill=(0, 0, 0))`.
3. **Apply true hard redactions** with `page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)`.
4. **Vector Stream Expungement:** Clears underlying font descriptors, vector paths, and clears/re-encodes intersecting raster pixel blocks. Text search verification returns **zero matches** in document memory.

### Differential Privacy on Tabular Aggregates
When extracting tabular financial and clinical metrics, redacting direct identifiers alone still allows re-identification via quasi-identifiers (ZIP code + Age + Billed charge). The privacy engine enforces:

- **$k$-Anonymity / Generalization:** Generalizing ZIP codes to 3-digit prefixes ($94103 \to 941**$) and binning ages into decade intervals ($[30-40]$).
- **Differential Privacy ($\epsilon$-noise):** When reporting statistical aggregations from documents, the engine injects Laplace noise calibrated to global sensitivity $\Delta f$:
  $$M(x) = f(x) + \text{Laplace}\left(\frac{\Delta f}{\epsilon}\right)$$

---

## 3. Directory Structure

```
tech_utsav/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app with SSE stream endpoints
│   │   ├── schemas.py             # Pydantic schemas for extracted data
│   │   └── agents/
│   │       ├── vision_agent.py    # PyMuPDF spatial tokenizer & layout parser
│   │       ├── schema_agent.py    # Ollama / Local deterministic Pydantic extractor
│   │       ├── risk_agent.py      # Contract clause & anomaly detector
│   │       └── privacy_agent.py   # Presidio NER + PyMuPDF true hardware redactor
│   ├── samples/
│   │   ├── sample_medical_billing.pdf # Patient John Doe, SSN, ICD-10, $14,250
│   │   └── sample_tech_vendor_nda.pdf # Apex vs Quantum, Unlimited Indemnity 8.2
│   ├── generate_samples.py        # PDF generator for booth samples
│   ├── test_pipeline.py           # Automated end-to-end SSE pipeline test
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dropzone.tsx        # Drag-and-drop file upload & booth preset buttons
│   │   │   ├── LiveStreamLogs.tsx  # 4-agent status cards & real-time SSE stream ticker
│   │   │   ├── DualPdfViewer.tsx   # Original vs. Redacted split view & security proof
│   │   │   └── AuditReport.tsx     # Risk cards, raw JSON schema & differential privacy
│   │   ├── App.tsx                # Master orchestration UI
│   │   └── index.css              # Tailwind CSS styling
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 4. Blueprint for an Expo Demo (3-Minute Script)

- **[0:00 - 0:45] The Hook & File Drop:**  
  *"Enterprises handle millions of sensitive documents, but standard cloud LLMs leak PII, and Adobe redaction tools fail to strip underlying raw metadata. Watch what happens when I drop this raw medical bill onto our local multi-agent engine."*  
  *(Click "Sample 1: Medical Bill" to initiate live SSE stream)*

- **[0:45 - 1:45] Live Multi-Agent Execution:**  
  *"Look at the agent execution ticker in the sidebar:*  
  - *Agent 1 mapped every bounding box on the page in 200 milliseconds.*  
  - *Agent 4 (Presidio + PyMuPDF) caught the SSN and patient name, burning the pixels away permanently.*  
  - *Agent 2 & 3 simultaneously extracted the tabular line items and tested them against compliance baselines."*

- **[1:45 - 2:30] Proof of Security & Compliance Verification:**  
  *"Notice the right pane: you cannot select or copy the redacted text—it is completely expunged from the vector stream. In the right panel, our compliance engine flagged Clause 8.2: 'Unlimited Liability' marked as HIGH RISK with an immediate suggested revision."*  
  *(Click "Verify Zero-Leakage" in the viewer to demonstrate character expungement)*

- **[2:30 - 3:00] Business Impact & Extensibility:**  
  *"Everything you just saw ran 100% locally on this machine using open-weights models and Python micro-services. Zero data egress, HIPAA/GDPR ready out-of-the-box, with structured audit JSON ready for ERP integration."*  
  *(Click "Download Clean PDF" and "Download Audit Log" to download production artifacts)*

---

## 5. Running as a Fully Working Windows Desktop Application

For maximum enterprise security, this system runs as an **air-gapped Windows Desktop Application Enclave**, isolating sensitive document memory from web browser extensions, localhost port scanners, and external network egress.

> 📦 **Direct 1-Click Windows Downloads (No Release Page Navigation):**  
> - [⬇️ **Download Windows Enclave Package (.zip — 154 MB)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-Windows-x64.zip) — Pre-packaged full enclave  
> - [⬇️ **Download Portable Single Executable (.exe)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise-Document-Intelligence-1.0.0-Portable-Windows-x64.exe) — Zero-install single executable  
> - [⬇️ **Download Windows Desktop Setup Installer (.exe)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise-Document-Intelligence-Setup-1.0.0.exe) — Full NSIS installer  

See detailed specifications in [WINDOWS_APPLICATION.md](file:///Volumes/maha/tech_utsav/WINDOWS_APPLICATION.md).

### 1-Click Launch on Windows (Recommended):
Double-click `run_windows_app.bat` or run in Command Prompt:
```cmd
run_windows_app.bat
```
*Automatically detects Python/Node, creates virtual environment, verifies dependencies, starts the mutually-authenticated backend, and launches the native desktop window.*

### Native Python Edge WebView2 Launcher (Zero Node.js Required):
For restricted enterprise Windows machines without Node.js:
```cmd
python desktop_launcher.py
```
*Utilizes native Microsoft Edge WebView2 built into Windows 10 & 11.*

### 1-Click Standalone Windows Executable Builder (`.exe`):
To package full Windows installers and standalone portable executables:
```cmd
build_windows_exe.bat
```
Generates:
- `dist-windows\Enterprise-Document-Intelligence-Setup-1.0.0.exe` (NSIS Desktop Installer)
- `dist-windows\Enterprise-Document-Intelligence-1.0.0-Portable-Windows-x64.exe` (Zero-install portable `.exe`)

---

## 6. Running as a Native macOS Desktop Application

For macOS (Apple Silicon M1/M2/M3/M4 & Intel), the engine runs as an **air-gapped macOS Desktop Application Enclave** with Apple Vision OCR acceleration and AppKit native panels.

> 🍏 **Direct 1-Click macOS Downloads (No Release Page Navigation):**  
> - [⬇️ **Download Apple Silicon DMG (.dmg — 131 MB)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-arm64.dmg) — Recommended for M1, M2, M3, M4 Macs  
> - [⬇️ **Download Apple Silicon ZIP (.zip — 131 MB)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-arm64.zip) — Portable standalone app  
> - [⬇️ **Download Intel Mac DMG (.dmg — 134 MB)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-x64.dmg) — For Intel-based Macs  
> - [⬇️ **Download Intel Mac ZIP (.zip — 134 MB)**](https://github.com/Daiwik091205/tech_utsav/releases/latest/download/Enterprise%20Document%20Intelligence-1.0.0-macOS-x64.zip) — Portable standalone app  

See detailed specifications in [MACOS_APPLICATION.md](file:///Volumes/maha/tech_utsav/MACOS_APPLICATION.md).

### 1-Click Launch on macOS (Recommended):
```bash
./run_mac_app.sh
```
*Automatically sets up Python/Node, creates virtual environment, verifies dependencies, starts the mutually-authenticated backend, and launches the native macOS desktop window.*

### 1-Click macOS Application & DMG Builder:
```bash
./build_mac_app.sh
```
Generates in `dist-mac/`:
- `dist-mac/Enterprise Document Intelligence.app` (Native macOS Application bundle)
- `dist-mac/Enterprise Document Intelligence-1.0.0-macOS-arm64.dmg` (Apple Disk Image with drag-and-drop installer)
- `dist-mac/Enterprise Document Intelligence-1.0.0-macOS-arm64.zip` (Portable standalone archive)

---

## 7. Running Locally (Web Mode)

If developing or running in standard web mode:

### Backend:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/api/health`

### Frontend:
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Application UI: `http://127.0.0.1:5173`

