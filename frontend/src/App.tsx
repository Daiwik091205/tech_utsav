import { useState, useEffect } from 'react';
import { Dropzone } from './components/Dropzone';
import { LiveStreamLogs, type AgentLogItem } from './components/LiveStreamLogs';
import { DualPdfViewer } from './components/DualPdfViewer';
import { AuditReport } from './components/AuditReport';
import { Shield, HelpCircle, Terminal } from 'lucide-react';

export function App() {
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

  // Expo Script Guide Modal
  const [showExpoGuide, setShowExpoGuide] = useState<boolean>(false);
  const [isTurboMode, setIsTurboMode] = useState<boolean>(false);

  // Trigger SSE stream for a document ID
  const startPipelineStream = (docId: string, filename: string) => {
    setActiveDocId(docId);
    setActiveFilename(filename);
    setIsProcessing(true);
    setProgress(5);
    setLogs([]);
    setCurrentAgent('Orchestrator Ingestion Gateway');

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

    const eventSource = new EventSource(`/api/pipeline/stream/${docId}?demo_mode=${!isTurboMode}`);

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
        }

        // Pipeline completed
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
      const res = await fetch(`/api/samples/${sampleId}/load`);
      const data = await res.json();
      startPipelineStream(data.doc_id, data.filename);
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
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      startPipelineStream(data.doc_id, data.filename);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  // Download Clean Redacted PDF
  const handleDownloadCleanPdf = () => {
    if (!activeDocId) return;
    window.open(`/api/download/redacted/${activeDocId}`, '_blank');
  };

  // Download Audit Log JSON
  const handleDownloadAuditLog = () => {
    if (!activeDocId) return;
    window.open(`/api/download/audit/${activeDocId}`, '_blank');
  };

  // Load Sample 1 automatically on first launch for instant booth demonstration
  useEffect(() => {
    handleSampleSelect('medical_billing');
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">
                  Enterprise Multi-Agent Document Intelligence
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
                  v1.0 AIR-GAPPED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deterministic DAG Pipeline • Microsoft Presidio NER • PyMuPDF Hardware Burn-In • Differential Privacy
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Zone 1: Dropzone & Timeline (Top / Left) */}
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

        {/* Zone 2 & 3: Dual-Pane Viewer (Center) & Structured Export Panel (Right) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[640px]">
          {/* Dual-Pane Document Viewer (Center - 7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <DualPdfViewer
              originalImages={originalImages}
              redactedImages={redactedImages}
              piiEntities={piiEntities}
              riskFindings={riskFindings}
              docType={docType}
              verificationProof={verificationProof}
            />
          </div>

          {/* Structured Export Panel (Right - 5 cols) */}
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
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0e18] px-6 py-2.5 text-center text-xs text-slate-500">
        Enterprise Document Intelligence Engine • Hardware Redaction • Presidio NER • Ollama Zero-Shot • Local microservices architecture
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
                className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60">
                <span className="font-bold text-indigo-300 uppercase tracking-wide block mb-1">
                  [0:00 - 0:45] The Hook & File Drop
                </span>
                <p>
                  "Enterprises handle millions of sensitive documents, but standard cloud LLMs leak PII, and Adobe redaction tools fail to strip underlying raw metadata. Watch what happens when I drop this raw medical bill onto our local multi-agent engine."
                </p>
                <div className="mt-1 text-[11px] text-indigo-400 italic">
                  ↳ Action: Click "Sample 1: Medical Bill" or "Sample 2: Tech NDA" to trigger the live SSE stream.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60">
                <span className="font-bold text-cyan-300 uppercase tracking-wide block mb-1">
                  [0:45 - 1:45] Live Multi-Agent Execution
                </span>
                <p>
                  "Look at the agent execution ticker in the sidebar:
                  <br/>• Agent 1 mapped every bounding box on the page in 200 milliseconds.
                  <br/>• Agent 4 (Presidio + PyMuPDF) caught the SSN and patient name, burning the pixels away permanently.
                  <br/>• Agent 2 & 3 simultaneously extracted the tabular line items and tested them against compliance baselines."
                </p>
              </div>

              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60">
                <span className="font-bold text-rose-300 uppercase tracking-wide block mb-1">
                  [1:45 - 2:30] Proof of Security & Compliance Verification
                </span>
                <p>
                  "Notice the right pane: you cannot select or copy the redacted text—it is completely expunged from the vector stream. In the right panel, our compliance engine flagged Clause 8.2: 'Unlimited Liability' marked as HIGH RISK with an immediate suggested revision."
                </p>
                <div className="mt-1 text-[11px] text-rose-400 italic">
                  ↳ Action: Click "Verify Zero-Leakage" in the viewer to demonstrate character expungement.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                <span className="font-bold text-emerald-300 uppercase tracking-wide block mb-1">
                  [2:30 - 3:00] Business Impact & Extensibility
                </span>
                <p>
                  "Everything you just saw ran 100% locally on this machine using open-weights models and Python micro-services. Zero data egress, HIPAA/GDPR ready out-of-the-box, with structured audit JSON ready for ERP integration."
                </p>
                <div className="mt-1 text-[11px] text-emerald-400 italic">
                  ↳ Action: Click "Download Clean PDF" and "Download Audit Log" to show ERP-ready exports.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
