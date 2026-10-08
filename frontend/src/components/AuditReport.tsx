import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Lock, Search, CheckCircle2 } from 'lucide-react';

interface RiskFinding {
  clause_id: string;
  clause_title: string;
  severity: string;
  flagged_text: string;
  risk_explanation: string;
  policy_benchmark: string;
  suggested_revision: string;
}

interface DifferentialPrivacyMetrics {
  k_anonymity_level: string;
  epsilon: number;
  global_sensitivity: number;
  laplace_noise: number;
  original_aggregate: number;
  privatized_aggregate: number;
  guarantee: string;
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

interface AuditReportProps {
  docId?: string;
  riskFindings: RiskFinding[];
  extractedSchema: Record<string, any>;
  differentialPrivacy?: DifferentialPrivacyMetrics;
  auditHash?: string;
  processingTimeMs?: number;
  onDownloadCleanPdf: () => void;
  onDownloadAuditLog: () => void;
  isUnredactMode?: boolean;
  unredactedEntities?: UnredactedEntity[];
  forensicSummary?: string;
  recoveryMethodsUsed?: string[];
  onDownloadRestoredDocument?: () => void;
  onDownloadForensicDossier?: () => void;
}

export const AuditReport: React.FC<AuditReportProps> = ({
  docId,
  riskFindings,
  extractedSchema,
  differentialPrivacy,
  auditHash,
  processingTimeMs,
  onDownloadCleanPdf,
  onDownloadAuditLog,
  isUnredactMode = false,
  unredactedEntities = [],
  forensicSummary = '',
  recoveryMethodsUsed = [],
  onDownloadRestoredDocument,
  onDownloadForensicDossier
}) => {
  const [activeTab, setActiveTab] = useState<'risks' | 'schema' | 'privacy' | 'recovered' | 'intelligence'>('risks');
  const [copiedRevision, setCopiedRevision] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Synchronize default tab on mode change
  React.useEffect(() => {
    if (isUnredactMode) {
      setActiveTab('recovered');
    } else {
      setActiveTab('risks');
    }
  }, [isUnredactMode]);

  const handleCopyRevision = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRevision(id);
    setTimeout(() => setCopiedRevision(null), 2000);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(extractedSchema, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-sm flex flex-col h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {isUnredactMode ? 'De-Redaction Forensic Dossier' : 'Structured Export & Audit'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {isUnredactMode
              ? 'Optical & Vector Stream Reconstruction Intelligence'
              : 'Pydantic typing & differential privacy verification'}
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center bg-muted p-1 rounded-md border border-border text-xs">
          {isUnredactMode ? (
            <>
              <button
                onClick={() => setActiveTab('recovered')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'recovered'
                    ? 'bg-card text-foreground border border-border/60 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Recovered Data ({unredactedEntities.length})
              </button>
              <button
                onClick={() => setActiveTab('intelligence')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'intelligence'
                    ? 'bg-card text-foreground border border-border/60 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Extracted Info
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-card text-foreground border border-border/60 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Raw JSON
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('risks')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'risks'
                    ? 'bg-card text-foreground border border-border/60 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Risk Cards ({riskFindings.length})
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-card text-foreground border border-border/60 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                JSON Schema
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-card text-foreground border border-border/60 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Diff. Privacy
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {/* UNREDACT MODE: Tab 1 - Recovered Entities */}
        {isUnredactMode && activeTab === 'recovered' && (
          <div className="space-y-3">
            {forensicSummary && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-foreground shrink-0" />
                  <span className="font-semibold">{forensicSummary}</span>
                </div>
                {recoveryMethodsUsed.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted-foreground pt-1 border-t border-border">
                    <span>Recovery Pipeline:</span>
                    {recoveryMethodsUsed.map((m, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {unredactedEntities.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No redaction bars discovered in this document.
              </div>
            ) : (
              unredactedEntities.map((ent) => (
                <div
                  key={ent.id}
                  className="bg-muted/20 border border-border rounded-lg p-4 shadow-sm hover:border-foreground/20 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border font-semibold">
                      {ent.entity_type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                        {(ent.confidence * 100).toFixed(1)}% Confidence
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                        {ent.method}
                      </span>
                    </div>
                  </div>

                  {/* Recovered Value Display */}
                  <div className="p-2.5 rounded-md bg-muted/60 border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Recovered String:</span>
                      <span className="text-sm font-bold text-foreground font-mono">{ent.recovered_text}</span>
                    </div>
                    <span className="text-[10px] text-primary-foreground font-mono px-2 py-0.5 rounded-md bg-primary">
                      Un-redacted
                    </span>
                  </div>

                  {ent.preceding_context && (
                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Preceding Label: </span>
                      <span>"{ent.preceding_context}"</span>
                    </div>
                  )}

                  {ent.risk_assessment && (
                    <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md border border-border">
                      <span className="font-semibold text-foreground">Forensic Analysis: </span>
                      <span>{ent.risk_assessment}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* UNREDACT MODE: Tab 2 - Extracted Intelligence */}
        {isUnredactMode && activeTab === 'intelligence' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Complete structured intelligence compiled from visible fields and recovered data.</span>
            </div>

            <div className="bg-muted/20 border border-border rounded-lg p-4 divide-y divide-border">
              {Object.entries(extractedSchema).map(([key, value]) => {
                const isRecovered = typeof value === 'string' && value.includes('(RECOVERED)');
                return (
                  <div key={key} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-muted-foreground font-mono font-medium capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className={`font-semibold ${isRecovered ? 'text-foreground font-mono underline decoration-dotted' : 'text-foreground'}`}>
                      {String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REDACT MODE: Tab 1 - Risk Findings */}
        {!isUnredactMode && activeTab === 'risks' && (
          <div className="space-y-3">
            {riskFindings.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No policy deviations flagged.
              </div>
            ) : (
              riskFindings.map((risk) => (
                <div
                  key={risk.clause_id}
                  className="bg-muted/20 border border-border rounded-lg p-3.5 shadow-sm space-y-2 hover:border-foreground/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground tracking-tight truncate">
                      {risk.clause_title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                        risk.severity === 'HIGH'
                          ? 'bg-destructive/15 text-destructive border border-destructive/30'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {risk.severity} Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{risk.risk_explanation}</p>

                  {/* Benchmark & Suggestion */}
                  <div className="p-2.5 rounded-md bg-muted/60 border border-border space-y-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground block font-semibold">
                      Suggested Redline Replacement:
                    </span>
                    <p className="text-xs text-foreground font-mono leading-relaxed">{risk.suggested_revision}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleCopyRevision(risk.clause_id, risk.suggested_revision)}
                        className="text-[11px] text-foreground hover:opacity-80 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {copiedRevision === risk.clause_id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedRevision === risk.clause_id ? 'Copied' : 'Copy Revision'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab - JSON Schema */}
        {activeTab === 'schema' && (
          <div className="relative">
            <button
              onClick={handleCopySchema}
              className="absolute top-2 right-2 px-2.5 py-1 text-[11px] bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border flex items-center gap-1 cursor-pointer z-10"
            >
              {copiedSchema ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copiedSchema ? 'Copied' : 'Copy JSON'}
            </button>
            <pre className="bg-muted/40 p-4 rounded-lg border border-border text-xs font-mono text-foreground overflow-x-auto leading-relaxed max-h-[360px]">
              {JSON.stringify(extractedSchema, null, 2)}
            </pre>
          </div>
        )}

        {/* REDACT MODE: Tab - Differential Privacy */}
        {!isUnredactMode && activeTab === 'privacy' && differentialPrivacy && (
          <div className="space-y-3">
            <div className="bg-muted/20 p-4 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs text-muted-foreground">Differential Privacy Guarantee:</span>
                <span className="text-xs font-mono text-foreground font-bold">&epsilon; = {differentialPrivacy.epsilon}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Original Aggregate:</span>
                  <span className="text-foreground font-mono font-bold">${differentialPrivacy.original_aggregate.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Laplace Noise (&plusmn;):</span>
                  <span className="text-foreground font-mono font-bold">${differentialPrivacy.laplace_noise}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground block text-[10px]">Privatized Export Value:</span>
                  <span className="text-emerald-500 font-mono font-bold text-sm">
                    ${differentialPrivacy.privatized_aggregate.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-3 border-t border-border flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Execution Time: <strong className="text-foreground">{processingTimeMs || 0} ms</strong></span>
          <span className="truncate max-w-[200px]" title={auditHash}>
            Case ID: <strong className="text-foreground">{docId || 'idle'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          {isUnredactMode ? (
            <>
              <button
                type="button"
                onClick={onDownloadRestoredDocument || onDownloadCleanPdf}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Restored File</span>
              </button>
              <button
                type="button"
                onClick={onDownloadForensicDossier || onDownloadAuditLog}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent border border-border transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Forensic Dossier</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onDownloadCleanPdf}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Clean PDF</span>
              </button>
              <button
                type="button"
                onClick={onDownloadAuditLog}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent border border-border transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Audit JSON</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
