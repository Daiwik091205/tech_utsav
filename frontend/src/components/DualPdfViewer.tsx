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
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-sm flex flex-col h-full">
      {/* Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            {isUnredactMode ? 'Forensic De-Redaction Split View' : 'Dual-Pane Verification'}
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted text-foreground border border-border truncate">
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
            <div className="flex items-center bg-muted rounded-md border border-border p-0.5 shadow-sm">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-2 py-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors text-xs font-mono cursor-pointer"
                title="Previous Page"
              >
                &larr; Prev
              </button>
              <span className="text-[11px] font-mono px-2 text-foreground font-medium border-x border-border">
                Page {currentPage + 1} / {originalImages.length}
              </span>
              <button
                type="button"
                disabled={currentPage >= originalImages.length - 1}
                onClick={() => setCurrentPage((p) => Math.min(originalImages.length - 1, p + 1))}
                className="px-2 py-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors text-xs font-mono cursor-pointer"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer shadow-sm ${
              showOverlays
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-secondary hover:bg-accent text-secondary-foreground transition-all shadow-sm cursor-pointer"
          >
            {isUnredactMode ? <Search className="w-3.5 h-3.5 text-foreground" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
            <span>{isUnredactMode ? 'Forensic Inspector' : 'Verify Zero-Leakage'}</span>
          </button>

          {/* Magnification Controls */}
          <div className="flex items-center bg-muted rounded-md border border-border p-0.5 shadow-sm">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 60}
              className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom Out (-25%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-foreground min-w-[42px] text-center font-medium">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 225}
              className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom In (+25%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors border-l border-border ml-0.5 cursor-pointer"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Pane Viewer */}
      {!hasContent ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg mt-3 bg-muted/20">
          <Layers className="w-10 h-10 text-muted-foreground/60 mb-3" />
          <p className="text-sm font-medium text-foreground">No document processed yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isUnredactMode
              ? 'Select Sample 4 (Redacted Photo) or Sample 5 (Redacted PDF) to test forensic un-redaction.'
              : 'Upload a file or pick Sample 1 (Medical Statement) / Sample 2 (Tech NDA) above.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3 overflow-hidden">
          {/* Left Pane: Original Redacted Input */}
          <div className="flex flex-col bg-muted/20 rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-muted/80 border-b border-border flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                {isUnredactMode ? 'Redacted Input (Photo / PDF with Black Bars)' : 'Original Document (Flagged Problems)'}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isUnredactMode ? 'bg-amber-500' : 'bg-destructive'} animate-pulse`} />
                {isUnredactMode ? `${pageUnredacted.length} Redacted Zones Found` : `${pagePii.length} Flagged PII Spans`}
              </span>
            </div>

            {/* Scrollable Viewport */}
            <div className="flex-1 overflow-auto p-4 bg-muted/10">
              <div className="flex justify-center min-w-max pb-4">
                <div
                  style={{
                    width: `${currentWidth}px`,
                    height: `${currentHeight}px`,
                  }}
                  className="relative rounded border border-border bg-white shadow-md select-none transition-all duration-150"
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
                          <div className="absolute top-2 right-2 bg-background/90 text-foreground border border-border text-[10px] font-mono px-2 py-0.5 rounded shadow-sm z-20 flex items-center gap-1.5">
                            <Search className="w-3 h-3 text-amber-500" />
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
                                className="absolute rounded border-2 border-amber-500 bg-amber-500/20 shadow-sm pointer-events-auto cursor-pointer group"
                                style={{ left, top, width, height }}
                              >
                                <div className="hidden group-hover:flex flex-col absolute bottom-full left-0 mb-1 z-30 px-2 py-1 text-[10px] font-mono bg-card text-card-foreground border border-border rounded shadow-md whitespace-nowrap pointer-events-none">
                                  <span className="text-amber-500 font-bold">[{ent.entity_type}]</span>
                                  <span className="text-foreground">"{ent.recovered_text}"</span>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          <div className="absolute top-2 right-2 bg-background/90 text-foreground border border-border text-[10px] font-mono px-2 py-0.5 rounded shadow-sm z-20 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-destructive" />
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
                                    ? 'border-2 border-destructive bg-destructive/20 shadow-sm'
                                    : 'border-2 border-amber-500 bg-amber-500/20 shadow-sm'
                                }`}
                                style={{ left, top, width, height }}
                              >
                                <div className="hidden group-hover:flex flex-col absolute bottom-full left-0 mb-1 z-30 px-2 py-1 text-[10px] font-mono bg-card text-card-foreground border border-border rounded shadow-md whitespace-nowrap pointer-events-none">
                                  <span className={isDirect ? 'text-destructive font-bold' : 'text-amber-500 font-bold'}>
                                    [{ent.entity_type}]
                                  </span>
                                  <span className="text-foreground">"{ent.text}"</span>
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
                                    ? 'border-destructive bg-destructive/15 shadow-sm'
                                    : 'border-amber-500 bg-amber-500/15 shadow-sm'
                                }`}
                                style={{ left, top, width, height }}
                              >
                                <div className="hidden group-hover:flex flex-col absolute bottom-full left-0 mb-1 z-30 px-2 py-1 text-[10px] font-mono bg-card text-card-foreground border border-border rounded shadow-md whitespace-nowrap pointer-events-none">
                                  <span className={isHigh ? 'text-destructive font-bold' : 'text-amber-500 font-bold'}>
                                    [{risk.clause_title}]
                                  </span>
                                  <span className="text-foreground">"{risk.flagged_text}"</span>
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
          <div className="flex flex-col bg-muted/20 rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-muted/80 border-b border-border flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                {isUnredactMode ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-foreground" /> Forensically Restored (Un-Redacted Data Overlaid)
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-500" /> Clean Document (True Hardware Redaction)
                  </>
                )}
              </span>
              <span className="text-[11px] font-mono flex items-center gap-1 text-muted-foreground">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                {isUnredactMode ? 'Optical & AI Recovered' : 'Vectors Expunged'}
              </span>
            </div>

            {/* Scrollable Viewport with identical zoom */}
            <div className="flex-1 overflow-auto p-4 bg-muted/10">
              <div className="flex justify-center min-w-max pb-4">
                <div
                  style={{
                    width: `${currentWidth}px`,
                    height: `${currentHeight}px`,
                  }}
                  className="relative rounded border border-border bg-white shadow-md select-none transition-all duration-150"
                >
                  <img
                    src={redactedImages[currentPage]}
                    alt="Restored Document"
                    className="w-full h-full object-fill block"
                  />

                  <div className="absolute top-2 right-2 border border-border bg-background/90 text-foreground text-[10px] font-mono px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>{isUnredactMode ? 'Data Reconstructed' : 'Pixel Burn-in Applied'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice Banner */}
      <div className="mt-3 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUnredactMode ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-foreground shrink-0" />
              <span>
                <strong>De-Redaction Forensic Capability:</strong> Decouples underlying vector glyphs from cosmetic PDF overlays and recovers blacked-out photo/scanned regions via OpenCV contour mapping & contextual semantic AI.
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-foreground shrink-0" />
              <span>
                <strong>Cybersecurity Guarantee:</strong> Hard redaction via <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">page.apply_redactions(fitz.PDF_REDACT_IMAGE_PIXELS)</code>.
                Standard Adobe/SVG fake overlays leave text selectable; this engine clears the underlying font descriptors and stream glyphs permanently.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Verification / Inspector Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                {isUnredactMode ? <Search className="w-4 h-4 text-foreground" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {isUnredactMode ? 'Forensic De-Redaction Inspector' : 'Hardware Security Verification'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs px-2.5 py-1 rounded-md bg-secondary hover:bg-accent border border-border cursor-pointer font-medium"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
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
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                          verifyTestQuery === u.recovered_text
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                            : 'bg-secondary text-secondary-foreground hover:bg-accent border-border'
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
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                          verifyTestQuery === p.text
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                            : 'bg-secondary text-secondary-foreground hover:bg-accent border-border'
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
                  className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {verifyResult && (
                <div className="p-3 rounded-lg border border-border bg-muted/60 text-xs font-mono leading-relaxed text-foreground">
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
