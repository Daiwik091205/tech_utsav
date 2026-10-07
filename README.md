# Enterprise Multi-Agent Document Intelligence & Redaction Engine

An air-gapped, privacy-preserving document pipeline designed for high-stakes enterprise compliance (HIPAA, GDPR, Master Service Agreements). It ingests multi-modal files (scanned PDFs, invoices, NDAs, clinical billing records), distributes layout parsing, extraction, and compliance tasks across specialized agent nodes, and guarantees that Personally Identifiable Information (PII) and Protected Health Information (PHI) are **irreversibly redacted with hardware/pixel burn-in before export**.

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

## 6. Running Locally (Web Mode)

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

