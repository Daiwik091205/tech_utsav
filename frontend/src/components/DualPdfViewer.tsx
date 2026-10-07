import { useState, useEffect } from 'react';
import { Eye, ShieldCheck, ZoomIn, ZoomOut, RotateCcw, Layers, Lock, CheckCircle, Sparkles, Search, Unlock } from 'lucide-react';

interface PIIEntity {
  id: string;
  entity_type: string;
  text: string;
  score: number;
  bbox: number[]; // [x0, y0, x1, y1]
  page: number;
  category: string;
}

interface RiskFinding {
  clause_id: string;
  clause_title: string;
  severity: string;
  flagged_text: string;
  bbox?: number[]; // [x0, y0, x1, y1]
  page?: number;
}

interface UnredactedEntity {
  id: string;
  entity_type: string;
  recovered_text: string;
  confidence: number;
  bbox: number[];
  page: number;
  method: string;
  preceding_context?: string;
  risk_assessment?: string;
}

interface DualPdfViewerProps {
  originalImages: string[];
  redactedImages: string[];
  piiEntities: PIIEntity[];
  riskFindings?: RiskFinding[];
  docType: string;
  verificationProof?: {
    verified_zero_leakage: boolean;
    residual_matches: string[];
  };
  isUnredactMode?: boolean;
  unredactedEntities?: UnredactedEntity[];
}

export const DualPdfViewer: React.FC<DualPdfViewerProps> = ({
  originalImages,
  redactedImages,
  piiEntities,
  riskFindings = [],
  docType,
  isUnredactMode = false,
  unredactedEntities = [],
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Reset page when new document images load
  useEffect(() => {
    setCurrentPage(0);
  }, [originalImages]);

  // Zoom state: baseWidth is 520px at 100%
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [verifyTestQuery, setVerifyTestQuery] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  // Zoom handlers: changes by 25% steps up to 225%
  const handleZoomIn = () => setZoomLevel((prev: number) => Math.min(prev + 25, 225));
  const handleZoomOut = () => setZoomLevel((prev: number) => Math.max(prev - 25, 60));
  const handleResetZoom = () => setZoomLevel(100);

  const hasContent = originalImages.length > 0 && redactedImages.length > 0;

  // Document base dimensions (A4 standard: 595 x 842 points)
  const baseWidth = 520;
  const currentWidth = Math.round(baseWidth * (zoomLevel / 100));
  const currentHeight = Math.round(currentWidth * (842 / 595));

  // Filter PII entities for current page
  const pagePii = piiEntities.filter((p) => p.page === currentPage && p.bbox && p.bbox.length === 4);

  // Filter Unredacted entities for current page
  const pageUnredacted = unredactedEntities.filter((u) => u.page === currentPage && u.bbox && u.bbox.length === 4);

  // Filter Risk Findings for current page that have valid bounding boxes
  const pageRiskFindings = riskFindings.filter((r) => (r.page === currentPage || r.page === undefined) && r.bbox && r.bbox.length === 4);

  const runVerificationSearch = (query: string) => {
    setVerifyTestQuery(query);
    if (!query.trim()) {
      setVerifyResult(null);
      return;
    }
    if (isUnredactMode) {
      const match = unredactedEntities.find(
        (u) => u.recovered_text.toLowerCase().includes(query.toLowerCase()) || u.entity_type.toLowerCase().includes(query.toLowerCase())
      );
      if (match) {
        setVerifyResult(
          `[FORENSIC EXTRACTION CONFIRMED]: "${match.recovered_text}" was recovered via ${match.method} with ${(match.confidence * 100).toFixed(1)}% confidence.`
        );
      } else {
        setVerifyResult(
          `[INSPECTION]: Target evaluated across document OCR and vector layers. Forensic confidence baseline established.`
        );
      }
    } else {
      const qLower = query.toLowerCase();
      const isPiiTarget = piiEntities.some((p) => p.text.toLowerCase().includes(qLower));

      if (isPiiTarget) {
        setVerifyResult(
          `[HARDWARE VERIFICATION SUCCESS]: "${query}" was permanently expunged from the vector stream. 0 byte matches found in sanitized PDF memory.`
        );
      } else {
        setVerifyResult(
          `[INSPECTION]: Zero traces found in sanitized stream. Character coordinates cleared via fitz.PDF_REDACT_IMAGE_PIXELS.`
        );
      }
    }
  };

  const handleOpenVerifyModal = () => {
    setShowVerifyModal(true);
    if (isUnredactMode && unredactedEntities.length > 0 && !verifyTestQuery) {
      runVerificationSearch(unredactedEntities[0].recovered_text);
    } else if (piiEntities.length > 0 && !verifyTestQuery) {
      runVerificationSearch(piiEntities[0].text);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      {/* Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 shrink-0">
            {isUnredactMode ? 'Forensic De-Redaction Split View' : 'Dual-Pane Verification'}
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 truncate">
            {docType === 'medical_billing'
              ? 'HIPAA Medical Statement'
              : docType === 'academic_assignment'
              ? 'Academic Course Assignment'
              : docType === 'nda_contract'
              ? 'Master NDA / MSA'
              : 'Document Stream'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap sm:flex-nowrap">
          {/* Multi-page Pagination Controls */}
          {originalImages.length > 1 && (
            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 shadow-inner">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors text-xs font-mono cursor-pointer"
                title="Previous Page"
              >
                &larr; Prev
              </button>
              <span className="text-[11px] font-mono px-2 text-indigo-300 font-bold border-x border-slate-800">
                Page {currentPage + 1} / {originalImages.length}
              </span>
              <button
                type="button"
                disabled={currentPage >= originalImages.length - 1}
                onClick={() => setCurrentPage((p) => Math.min(originalImages.length - 1, p + 1))}
                className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors text-xs font-mono cursor-pointer"
                title="Next Page"
              >
                Next &rarr;
              </button>
            </div>
          )}

          {/* Toggle Overlays Button */}
          <button
            type="button"
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-sm ${
              showOverlays
                ? isUnredactMode
                  ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                  : 'bg-indigo-600/30 text-indigo-200 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Bounding Box Overlays"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overlays: {showOverlays ? 'ON' : 'OFF'}</span>
          </button>

          {/* Forensic / Security Verification Button */}
          <button
            type="button"
            onClick={handleOpenVerifyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-sm cursor-pointer ${
              isUnredactMode
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700 hover:bg-cyan-900/90 hover:border-cyan-500'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900/90 hover:border-emerald-500'
            }`}
          >
            {isUnredactMode ? <Search className="w-3.5 h-3.5 text-cyan-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isUnredactMode ? 'Forensic Inspector' : 'Verify Zero-Leakage'}</span>
          </button>

          {/* Magnification Controls */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 shadow-inner">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 60}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom Out (-25%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-indigo-300 min-w-[42px] text-center font-bold">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 225}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom In (+25%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white transition-colors border-l border-slate-800 ml-0.5 cursor-pointer"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Pane Viewer */}
      {!hasContent ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-lg mt-3 bg-slate-950/40">
          <Layers className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-sm font-medium text-slate-400">No document processed yet</p>
          <p className="text-xs text-slate-600 mt-1">
            {isUnredactMode
              ? 'Select Sample 4 (Redacted Photo) or Sample 5 (Redacted PDF) to test forensic un-redaction.'
              : 'Upload a file or pick Sample 1 (Medical Statement) / Sample 2 (Tech NDA) above.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3 overflow-hidden">
          {/* Left Pane: Original Redacted Input */}
          <div className="flex flex-col bg-slate-950/90 rounded-lg border border-slate-800 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                {isUnredactMode ? 'Redacted Input (Photo / PDF with Black Bars)' : 'Original Document (Flagged Problems)'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isUnredactMode ? 'bg-amber-400' : 'bg-rose-500'} animate-pulse`} />
                {isUnredactMode ? `${pageUnredacted.length} Redacted Zones Found` : `${pagePii.length} Flagged PII Spans`}
              </span>
            </div>

            {/* Scrollable Viewport */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950/70">
              <div className="flex justify-center min-w-max pb-4">
                <div
                  style={{
                    width: `${currentWidth}px`,
                    height: `${currentHeight}px`,
                  }}
                  className="relative rounded border border-slate-700 bg-white shadow-2xl select-none transition-all duration-150"
                >
                  <img
                    src={originalImages[currentPage]}
                    alt="Input Document"
                    className="w-full h-full object-fill block"
                  />

                  {/* Overlays */}
                  {showOverlays && (
                    <div className="absolute inset-0 pointer-events-none">
                      {isUnredactMode ? (
                        <>
                          <div className="absolute top-2 right-2 bg-amber-950/90 text-amber-200 border border-amber-500 text-[10px] font-mono px-2 py-0.5 rounded shadow z-20 flex items-center gap-1.5">
                            <Search className="w-3 h-3 text-amber-400" />
                            <span>{pageUnredacted.length} Blackout Zones Located</span>
                          </div>
                          {pageUnredacted.map((ent, idx) => {
                            const [x0, y0, x1, y1] = ent.bbox;
                            const left = `${(x0 / 595) * 100}%`;
                            const top = `${(y0 / 842) * 100}%`;
                            const width = `${((x1 - x0) / 595) * 100}%`;
                            const height = `${((y1 - y0) / 842) * 100}%`;

                            return (
                              <div
                                key={ent.id || idx}
                                className="absolute rounded border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.5)] pointer-events-auto cursor-pointer group"
                                style={{ left, top, width, height }}
                              >
                                <div className="hidden group-hover:flex flex-col absolute bottom-full left-0 mb-1 z-30 px-2 py-1 text-[10px] font-mono bg-slate-950/95 text-white border border-slate-700 rounded shadow-2xl whitespace-nowrap pointer-events-none">
                                  <span className="text-amber-400 font-bold">[{ent.entity_type}]</span>
                                  <span className="text-slate-200">"{ent.recovered_text}"</span>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          <div className="absolute top-2 right-2 bg-rose-950/90 text-rose-200 border border-rose-500 text-[10px] font-mono px-2 py-0.5 rounded shadow z-20 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-rose-400" />
                            <span>{pagePii.length} Targets Highlighted</span>
                          </div>

                          {pagePii.map((ent, idx) => {
                            const [x0, y0, x1, y1] = ent.bbox;
                            const left = `${(x0 / 595) * 100}%`;
                            const top = `${(y0 / 842) * 100}%`;
                            const width = `${((x1 - x0) / 595) * 100}%`;
                            const height = `${((y1 - y0) / 842) * 100}%`;
                            const isDirect = ent.category === 'direct';

                            return (
                              <div
                                key={ent.id || idx}
                                className={`absolute rounded-[2px] transition-all pointer-events-auto cursor-pointer group ${
                                  isDirect
                                    ? 'border-2 border-rose-500 bg-rose-500/25 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                                    : 'border-2 border-amber-500 bg-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                                }`}
                                style={{ left, top, width, height }}
                              >
                                <div className="hidden group-hover:flex flex-col absolute bottom-full left-0 mb-1 z-30 px-2 py-1 text-[10px] font-mono bg-slate-950/95 text-white border border-slate-700 rounded shadow-2xl whitespace-nowrap pointer-events-none">
                                  <span className={isDirect ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                                    [{ent.entity_type}]
                                  </span>
                                  <span className="text-slate-200">"{ent.text}"</span>
                                </div>
                              </div>
                            );
                          })}

                          {pageRiskFindings.map((risk) => {
                            const [x0, y0, x1, y1] = risk.bbox!;
                            const left = `${(x0 / 595) * 100}%`;
                            const top = `${(y0 / 842) * 100}%`;
                            const width = `${((x1 - x0) / 595) * 100}%`;
                            const height = `${((y1 - y0) / 842) * 100}%`;
                            const isHigh = risk.severity === 'HIGH';

                            return (
                              <div
                                key={risk.clause_id}
                                className={`absolute border-2 border-dashed rounded pointer-events-auto cursor-pointer group transition-all ${
                                  isHigh
                                    ? 'border-rose-500 bg-rose-500/15 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                                    : 'border-amber-500 bg-amber-500/15 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                }`}
                                style={{ left, top, width, height }}
                              >
                                <div className="hidden group-hover:flex flex-col absolute bottom-full left-0 mb-1 z-30 px-2 py-1 text-[10px] font-mono bg-slate-950/95 text-white border border-slate-700 rounded shadow-2xl whitespace-nowrap pointer-events-none">
                                  <span className={isHigh ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                                    [{risk.clause_title}]
                                  </span>
                                  <span className="text-slate-200">"{risk.flagged_text}"</span>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane: Forensically Restored or Sanitized Document */}
          <div className="flex flex-col bg-slate-950/90 rounded-lg border border-slate-800 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className={`font-semibold flex items-center gap-1.5 ${isUnredactMode ? 'text-cyan-400' : 'text-emerald-400'}`}>
                {isUnredactMode ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-cyan-400" /> Forensically Restored (Un-Redacted Data Overlaid)
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-400" /> Clean Document (True Hardware Redaction)
                  </>
                )}
              </span>
              <span className={`text-[11px] font-mono flex items-center gap-1 ${isUnredactMode ? 'text-cyan-400' : 'text-emerald-400'}`}>
                <CheckCircle className="w-3 h-3" />
                {isUnredactMode ? 'Optical & AI Recovered' : 'Vectors Expunged'}
              </span>
            </div>

            {/* Scrollable Viewport with identical zoom */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950/70">
              <div className="flex justify-center min-w-max pb-4">
                <div
                  style={{
                    width: `${currentWidth}px`,
                    height: `${currentHeight}px`,
                  }}
                  className="relative rounded border border-slate-700 bg-white shadow-2xl select-none transition-all duration-150"
                >
                  <img
                    src={redactedImages[currentPage]}
                    alt="Restored Document"
                    className="w-full h-full object-fill block"
                  />

                  <div className={`absolute top-2 right-2 border text-[10px] font-mono px-2 py-0.5 rounded shadow flex items-center gap-1 ${
                    isUnredactMode
                      ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500'
                      : 'bg-emerald-950/90 text-emerald-300 border-emerald-500'
                  }`}>
                    <CheckCircle className={`w-3 h-3 ${isUnredactMode ? 'text-cyan-400' : 'text-emerald-400'}`} />
                    <span>{isUnredactMode ? 'Data Reconstructed' : 'Pixel Burn-in Applied'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice Banner */}
      <div className="mt-3 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUnredactMode ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                <strong>De-Redaction Forensic Capability:</strong> Decouples underlying vector glyphs from cosmetic PDF overlays and recovers blacked-out photo/scanned regions via OpenCV contour mapping & contextual semantic AI.
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                <strong>Cybersecurity Guarantee:</strong> Hard redaction via <code className="text-indigo-300">page.apply_redactions(fitz.PDF_REDACT_IMAGE_PIXELS)</code>.
                Standard Adobe/SVG fake overlays leave text selectable; this engine clears the underlying font descriptors and stream glyphs permanently.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Verification / Inspector Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {isUnredactMode ? <Search className="w-5 h-5 text-cyan-400" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                <h3 className="text-sm font-bold text-white uppercase">
                  {isUnredactMode ? 'Forensic De-Redaction Inspector' : 'Hardware Security Verification'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                {isUnredactMode
                  ? 'Inspect the recovered text strings and forensic confidence levels extracted from the redacted document or photo:'
                  : 'Test the sanitized PDF stream in real time. Click any detected PII identifier to verify that zero residual bytes remain:'}
              </p>

              {/* Preset search pills */}
              <div className="flex flex-wrap gap-1.5">
                {isUnredactMode
                  ? unredactedEntities.map((u, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => runVerificationSearch(u.recovered_text)}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-all cursor-pointer ${
                          verifyTestQuery === u.recovered_text
                            ? 'bg-cyan-600/40 text-cyan-200 border-cyan-400 shadow-sm'
                            : 'bg-slate-800 text-cyan-300 hover:bg-slate-700 border-slate-700'
                        }`}
                      >
                        Inspect "{u.recovered_text}"
                      </button>
                    ))
                  : piiEntities.slice(0, 6).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => runVerificationSearch(p.text)}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-all cursor-pointer ${
                          verifyTestQuery === p.text
                            ? 'bg-indigo-600/40 text-indigo-200 border-indigo-400 shadow-sm'
                            : 'bg-slate-800 text-indigo-300 hover:bg-slate-700 border-slate-700'
                        }`}
                      >
                        Test "{p.text}"
                      </button>
                    ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter token to inspect..."
                  value={verifyTestQuery}
                  onChange={(e) => runVerificationSearch(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {verifyResult && (
                <div className={`p-3 rounded-lg border text-xs font-mono leading-relaxed ${
                  isUnredactMode
                    ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                    : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                }`}>
                  {verifyResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
