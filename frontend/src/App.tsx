import { useState, useEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { LiveStreamLogs, type AgentLogItem } from './components/LiveStreamLogs';
import { DualPdfViewer } from './components/DualPdfViewer';
import { AuditReport } from './components/AuditReport';
import { Shield, HelpCircle, Terminal, Search } from 'lucide-react';

export default function App() {
  const [pipelineMode, setPipelineMode] = useState<'redact' | 'unredact'>('redact');
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [activeFilename, setActiveFilename] = useState<string>('');
  const [activeSampleId, setActiveSampleId] = useState<string>('medical_billing');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const [logs, setLogs] = useState<AgentLogItem[]>([]);
  const [docType, setDocType] = useState<string>('medical_billing');

  // Multi-agent metrics
  const [tokensCount, setTokensCount] = useState<number>(0);
  const [boxesCount, setBoxesCount] = useState<number>(0);
  const [piiCount, setPiiCount] = useState<number>(0);
  const [highRiskCount, setHighRiskCount] = useState<number>(0);
  const [schemaType, setSchemaType] = useState<string>('');

  // Result state
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [redactedImages, setRedactedImages] = useState<string[]>([]);
  const [piiEntities, setPiiEntities] = useState<any[]>([]);
  const [riskFindings, setRiskFindings] = useState<any[]>([]);
  const [extractedSchema, setExtractedSchema] = useState<Record<string, any>>({});
  const [differentialPrivacy, setDifferentialPrivacy] = useState<any>(undefined);
  const [auditHash, setAuditHash] = useState<string>('');
  const [processingTimeMs, setProcessingTimeMs] = useState<number>(0);
  const [verificationProof, setVerificationProof] = useState<any>(undefined);

  // Forensic Un-redact state
  const [unredactedEntities, setUnredactedEntities] = useState<any[]>([]);
  const [forensicSummary, setForensicSummary] = useState<string>('');
  const [recoveryMethodsUsed, setRecoveryMethodsUsed] = useState<string[]>([]);

  // Expo Script Guide Modal
  const [showExpoGuide, setShowExpoGuide] = useState<boolean>(false);
  const [isTurboMode, setIsTurboMode] = useState<boolean>(false);

  // Desktop Enclave & Security States
  const [enclaveToken, setEnclaveToken] = useState<string>('');
  const [isDesktopApp, setIsDesktopApp] = useState<boolean>(false);
  const [savedNotification, setSavedNotification] = useState<{ filePath: string; filename: string } | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    typeof window !== 'undefined' && window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : ''
  );

  // Initialize desktop enclave token and backend base URL
  useEffect(() => {
    if ((window as any).electronAPI) {
      setIsDesktopApp(true);
      (window as any).electronAPI.getBackendUrl?.().then((url: string) => {
        if (url) setApiBaseUrl(url);
      });
      (window as any).electronAPI.getEnclaveToken?.().then((token: string) => {
        if (token) setEnclaveToken(token);
      });
      const unsub = (window as any).electronAPI.onFileOpened?.((fileData: any) => {
        if (fileData && fileData.base64 && fileData.filename) {
          const byteCharacters = atob(fileData.base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const mime = fileData.filename.endsWith('.pdf') ? 'application/pdf' : 'image/png';
          const file = new File([byteArray], fileData.filename, { type: mime });
          handleFileSelect(file);
        }
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, []);

  // Secure API fetch helper with Enclave Token injection
  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${apiBaseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});
    if (enclaveToken) {
      headers.set('x-session-token', enclaveToken);
    }
    return fetch(url, { ...options, headers });
  };

  // Trigger SSE stream for a document ID
  const startPipelineStream = (docId: string, filename: string, modeOverride?: 'redact' | 'unredact') => {
    const mode = modeOverride || pipelineMode;
    setActiveDocId(docId);
    setActiveFilename(filename);
    setIsProcessing(true);
    setProgress(5);
    setLogs([]);
    setCurrentAgent(mode === 'unredact' ? 'Forensic De-Redaction Gateway' : 'Orchestrator Ingestion Gateway');

    // Reset old metrics
    setTokensCount(0);
    setBoxesCount(0);
    setPiiCount(0);
    setHighRiskCount(0);
    setSchemaType('');
    setOriginalImages([]);
    setRedactedImages([]);
    setPiiEntities([]);
    setRiskFindings([]);
    setExtractedSchema({});
    setUnredactedEntities([]);
    setForensicSummary('');
    setRecoveryMethodsUsed([]);

    const tokenParam = enclaveToken ? `&session_token=${encodeURIComponent(enclaveToken)}` : '';
    const endpoint = mode === 'unredact' ? '/api/unredact/stream' : '/api/pipeline/stream';
    const sseUrl = `${apiBaseUrl}${endpoint}/${docId}?demo_mode=${!isTurboMode}${tokenParam}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Append to log console
        setLogs((prev) => [...prev, data]);

        if (data.progress) {
          setProgress(data.progress);
        }
        if (data.agent) {
          setCurrentAgent(data.agent);
        }

        // Capture live metrics from events
        if (data.metrics) {
          if (data.metrics.tokens_scanned) setTokensCount(data.metrics.tokens_scanned);
          if (data.metrics.bounding_boxes) setBoxesCount(data.metrics.bounding_boxes);
          if (data.metrics.pii_count !== undefined) setPiiCount(data.metrics.pii_count);
          if (data.metrics.high_risk !== undefined) setHighRiskCount(data.metrics.high_risk);
          if (data.metrics.schema) setSchemaType(data.metrics.schema);
          if (data.metrics.doc_type) setDocType(data.metrics.doc_type);
          if (data.metrics.redactions_detected !== undefined) setBoxesCount(data.metrics.redactions_detected);
          if (data.metrics.recovered_entities !== undefined) setPiiCount(data.metrics.recovered_entities);
        }

        // UNREDACT Pipeline completed
        if (data.event === 'pipeline_finished' && data.unredact_result) {
          const unred = data.unredact_result;
          setOriginalImages(unred.original_page_images || []);
          setRedactedImages(unred.unredacted_page_images || []);
          setUnredactedEntities(unred.unredacted_entities || []);
          setExtractedSchema(unred.extracted_info || {});
          setForensicSummary(unred.forensic_summary || '');
          setRecoveryMethodsUsed(unred.recovery_methods_used || []);
          setProcessingTimeMs(unred.processing_time_ms);
          setDocType(unred.doc_type);
          setIsProcessing(false);
          eventSource.close();
        }

        // REDACT Pipeline completed
        if (data.event === 'pipeline_finished' && data.result) {
          const res = data.result;
          setOriginalImages(res.original_page_images || []);
          setRedactedImages(res.redacted_page_images || []);
          setPiiEntities(res.pii_entities || []);
          setRiskFindings(res.risk_findings || []);
          setExtractedSchema(res.extracted_schema || {});
          setDifferentialPrivacy(res.differential_privacy);
          setAuditHash(res.audit_hash);
          setProcessingTimeMs(res.processing_time_ms);
          setVerificationProof(res.text_erased_proof);
          setDocType(res.doc_type);
          setIsProcessing(false);
          eventSource.close();
        }
      } catch (err) {
        console.error('SSE JSON parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setIsProcessing(false);
      eventSource.close();
    };
  };

  // Handle preset sample selection
  const handleSampleSelect = async (sampleId: string) => {
    try {
      setActiveSampleId(sampleId);
      // Auto-detect mode based on sample
      let mode = pipelineMode;
      if (sampleId === 'redacted_photo' || sampleId === 'fake_redacted_medical') {
        mode = 'unredact';
        setPipelineMode('unredact');
      } else if (sampleId === 'medical_billing' || sampleId === 'tech_nda' || sampleId === 'academic_assignment') {
        mode = 'redact';
        setPipelineMode('redact');
      }

      const res = await apiFetch(`/api/samples/${sampleId}/load`);
      const data = await res.json();
      startPipelineStream(data.doc_id, data.filename, mode);
    } catch (err) {
      console.error('Failed to load sample:', err);
    }
  };

  // Handle uploaded file
  const handleFileSelect = async (file: File) => {
    try {
      setActiveSampleId('');
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      startPipelineStream(data.doc_id, data.filename);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  // Mode Toggle Handler
  const handleToggleMode = (newMode: 'redact' | 'unredact') => {
    setPipelineMode(newMode);
    if (newMode === 'unredact') {
      handleSampleSelect('redacted_photo');
    } else {
      handleSampleSelect('medical_billing');
    }
  };

  // Helper for native desktop save dialog or browser download
  const downloadDesktopOrWeb = async (
    endpoint: string,
    defaultFilename: string,
    isBase64: boolean,
    filters?: { name: string; extensions: string[] }[]
  ) => {
    if (!activeDocId) return;
    const tokenParam = enclaveToken ? `?session_token=${encodeURIComponent(enclaveToken)}` : '';
    const fullUrl = `${apiBaseUrl}${endpoint}/${activeDocId}${tokenParam}`;

    if ((window as any).electronAPI?.saveFileDialog) {
      try {
        const res = await apiFetch(`${endpoint}/${activeDocId}${tokenParam}`);
        if (!res.ok) throw new Error('Download failed');
        if (isBase64) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const result = await (window as any).electronAPI.saveFileDialog({
              defaultFilename,
              data: base64,
              isBase64: true,
              filters,
            });
            if (result?.success && result?.filePath) {
              setSavedNotification({ filePath: result.filePath, filename: defaultFilename });
            }
          };
          reader.readAsDataURL(blob);
          return;
        } else {
          const text = await res.text();
          const result = await (window as any).electronAPI.saveFileDialog({
            defaultFilename,
            data: text,
            isBase64: false,
            filters,
          });
          if (result?.success && result?.filePath) {
            setSavedNotification({ filePath: result.filePath, filename: defaultFilename });
          }
          return;
        }
      } catch (err) {
        console.warn('Native save dialog error, fallback to browser open:', err);
      }
    }
    window.open(fullUrl, '_blank');
  };

  // Download Handlers
  const handleDownloadCleanPdf = () => {
    downloadDesktopOrWeb(
      '/api/download/redacted',
      `clean_redacted_${activeFilename || 'document.pdf'}`,
      true,
      [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }]
    );
  };

  const handleDownloadAuditLog = () => {
    downloadDesktopOrWeb(
      '/api/download/audit',
      `audit_log_${activeDocId || 'report'}.json`,
      false,
      [{ name: 'JSON Audit Report (*.json)', extensions: ['json'] }]
    );
  };

  const handleDownloadRestoredDocument = () => {
    const isPng = activeFilename?.toLowerCase().endsWith('.png') || activeFilename?.toLowerCase().endsWith('.jpg');
    const ext = isPng ? 'png' : 'pdf';
    downloadDesktopOrWeb(
      '/api/download/unredacted',
      `restored_unredacted_${activeFilename || `document.${ext}`}`,
      true,
      [
        { name: ext === 'png' ? 'PNG Images (*.png)' : 'PDF Documents (*.pdf)', extensions: [ext] },
        { name: 'All Files (*.*)', extensions: ['*'] }
      ]
    );
  };

  const handleDownloadForensicDossier = () => {
    downloadDesktopOrWeb(
      '/api/download/unredacted_dossier',
      `forensic_dossier_${activeDocId || 'report'}.json`,
      false,
      [{ name: 'JSON Forensic Dossier (*.json)', extensions: ['json'] }]
    );
  };

  // Load Initial Sample on launch
  useEffect(() => {
    handleSampleSelect('medical_billing');
  }, [enclaveToken]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all ${
              pipelineMode === 'unredact'
                ? 'bg-gradient-to-tr from-cyan-600 to-emerald-500 shadow-cyan-600/30'
                : 'bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-indigo-600/30'
            }`}>
              {pipelineMode === 'unredact' ? <Search className="w-5 h-5 text-white" /> : <Shield className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">
                  Enterprise Multi-Agent Document Intelligence & Redaction Engine
                </h1>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  pipelineMode === 'unredact'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                    : 'bg-indigo-950 text-indigo-300 border-indigo-700'
                }`}>
                  {pipelineMode === 'unredact' ? 'DE-REDACTION FORENSICS' : 'HARDWARE BURN-IN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {pipelineMode === 'unredact'
                  ? 'Optical Contour Localization • Vector Decoupling • Native Vision OCR • Contextual AI Semantic Infilling'
                  : 'Deterministic DAG Pipeline • Microsoft Presidio NER • True PyMuPDF Pixel Burn-In • Differential Privacy'}
              </p>
            </div>
          </div>

          {/* System Status Badges */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs font-mono text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zero Data Egress: Air-Gapped</span>
            </div>

            {processingTimeMs > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700 text-xs font-mono text-indigo-300">
                <span className="text-amber-400 font-bold">⚡ {processingTimeMs}ms</span>
              </div>
            )}

            {isDesktopApp && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-700 text-xs font-mono text-sky-300">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>Windows Enclave: Process Isolated</span>
              </div>
            )}

            <button
              onClick={() => setShowExpoGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>3-Min Expo Script</span>
            </button>
          </div>
        </div>
      </header>

      {/* Native Desktop Save Notification Banner */}
      {savedNotification && (
        <div className="bg-emerald-950/90 border-b border-emerald-700 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">✓ File Saved to Windows System:</span>
            <span className="font-mono text-emerald-300 truncate max-w-xl">{savedNotification.filePath}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (window as any).electronAPI?.showItemInFolder?.(savedNotification.filePath)}
              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition cursor-pointer"
            >
              Reveal in File Explorer
            </button>
            <button
              onClick={() => setSavedNotification(null)}
              className="p-1 hover:text-white text-emerald-400 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Zone 1: Dropzone & Timeline */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 flex flex-col">
            <Dropzone
              onFileSelect={handleFileSelect}
              onSampleSelect={handleSampleSelect}
              isProcessing={isProcessing}
              activeDocName={activeFilename}
              activeSampleId={activeSampleId}
              isTurboMode={isTurboMode}
              onToggleTurboMode={() => setIsTurboMode((prev) => !prev)}
              pipelineMode={pipelineMode}
              onToggleMode={handleToggleMode}
            />
          </div>
          <div className="lg:col-span-7 flex flex-col">
            <LiveStreamLogs
              logs={logs}
              progress={progress}
              currentAgent={currentAgent}
              isStreaming={isProcessing}
              tokensCount={tokensCount}
              boxesCount={boxesCount}
              piiCount={piiCount}
              highRiskCount={highRiskCount}
              schemaType={schemaType}
            />
          </div>
        </section>

        {/* Zone 2 & 3: Dual-Pane Viewer & Structured Export Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[640px]">
          {/* Dual-Pane Document Viewer */}
          <div className="lg:col-span-7 flex flex-col">
            <DualPdfViewer
              originalImages={originalImages}
              redactedImages={redactedImages}
              piiEntities={piiEntities}
              riskFindings={riskFindings}
              docType={docType}
              verificationProof={verificationProof}
              isUnredactMode={pipelineMode === 'unredact'}
              unredactedEntities={unredactedEntities}
            />
          </div>

          {/* Structured Export Panel */}
          <div className="lg:col-span-5 flex flex-col">
            <AuditReport
              docId={activeDocId}
              riskFindings={riskFindings}
              extractedSchema={extractedSchema}
              differentialPrivacy={differentialPrivacy}
              auditHash={auditHash}
              processingTimeMs={processingTimeMs}
              onDownloadCleanPdf={handleDownloadCleanPdf}
              onDownloadAuditLog={handleDownloadAuditLog}
              isUnredactMode={pipelineMode === 'unredact'}
              unredactedEntities={unredactedEntities}
              forensicSummary={forensicSummary}
              recoveryMethodsUsed={recoveryMethodsUsed}
              onDownloadRestoredDocument={handleDownloadRestoredDocument}
              onDownloadForensicDossier={handleDownloadForensicDossier}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0e18] px-6 py-2.5 text-center text-xs text-slate-500">
        Enterprise Document Intelligence Engine • Hardware Redaction • Forensic Un-Redaction • Presidio NER • OpenCV Optical Infilling • Air-gapped
      </footer>

      {/* 3-Minute Expo Demo Script Modal */}
      {showExpoGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Expo Booth Demo Blueprint (3-Minute Script)</h3>
              </div>
              <button
                onClick={() => setShowExpoGuide(false)}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60">
                <span className="font-bold text-indigo-300 uppercase tracking-wide block mb-1">
                  1. Privacy & Hard Redaction Mode
                </span>
                <p>
                  "Demonstrates irreversible compliance redaction: Microsoft Presidio detects PII, and PyMuPDF burns out pixels and scrubs the vector stream so data can never be leaked."
                </p>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60">
                <span className="font-bold text-cyan-300 uppercase tracking-wide block mb-1">
                  2. Forensic De-Redaction & Recovery Mode (NEW!)
                </span>
                <p>
                  "Switch to Forensic Un-Redact and select Sample 4 (Redacted Photo) or Sample 5 (Redacted PDF).
                  <br/>• For photos/scans: OpenCV detects physical black marker bars, Apple Vision OCR extracts surrounding layout, and contextual AI infills the hidden names, USN, and signatures!
                  <br/>• For PDFs: Decouples vector streams to catch cosmetic 'fake' black rectangle redactions, extracting hidden text underneath with 100% precision."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
