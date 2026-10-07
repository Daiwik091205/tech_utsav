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
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {isUnredactMode ? 'De-Redaction Forensic Dossier' : 'Structured Export & Audit'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isUnredactMode
              ? 'Optical & Vector Stream Reconstruction Intelligence'
              : 'Pydantic typing & differential privacy verification'}
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {isUnredactMode ? (
            <>
              <button
                onClick={() => setActiveTab('recovered')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'recovered'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recovered Data ({unredactedEntities.length})
              </button>
              <button
                onClick={() => setActiveTab('intelligence')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'intelligence'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Extracted Info
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
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
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Risk Cards ({riskFindings.length})
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON Schema
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
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
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/80 text-xs text-cyan-200 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold">{forensicSummary}</span>
                </div>
                {recoveryMethodsUsed.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-cyan-400 pt-1 border-t border-cyan-900/60">
                    <span className="text-slate-400">Recovery Pipeline:</span>
                    {recoveryMethodsUsed.map((m, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {unredactedEntities.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No redaction bars discovered in this document.
              </div>
            ) : (
              unredactedEntities.map((ent) => (
                <div
                  key={ent.id}
                  className="bg-slate-950/80 border border-cyan-900/60 rounded-xl p-4 shadow-sm hover:border-cyan-600 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      {ent.entity_type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {(ent.confidence * 100).toFixed(1)}% Confidence
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ent.method}
                      </span>
                    </div>
                  </div>

                  {/* Recovered Value Display */}
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recovered String:</span>
                      <span className="text-sm font-bold text-white font-mono">{ent.recovered_text}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800">
                      Un-redacted
                    </span>
                  </div>

                  {ent.preceding_context && (
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500 font-semibold">Preceding Label: </span>
                      <span className="text-slate-300">"{ent.preceding_context}"</span>
                    </div>
                  )}

                  {ent.risk_assessment && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800/80">
                      <span className="text-amber-400 font-semibold">Forensic Analysis: </span>
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
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Complete structured intelligence compiled from visible fields and recovered data.</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 divide-y divide-slate-800/80">
              {Object.entries(extractedSchema).map(([key, value]) => {
                const isRecovered = typeof value === 'string' && value.includes('(RECOVERED)');
                return (
                  <div key={key} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-slate-400 font-mono font-medium capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className={`font-semibold ${isRecovered ? 'text-cyan-300 font-mono' : 'text-slate-200'}`}>
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
              <div className="text-center py-10 text-slate-500 text-xs">
                No policy deviations flagged.
              </div>
            ) : (
              riskFindings.map((risk) => (
                <div
                  key={risk.clause_id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white tracking-wide truncate">
                      {risk.clause_title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                        risk.severity === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {risk.severity} Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{risk.risk_explanation}</p>

                  {/* Benchmark & Suggestion */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 block font-semibold">
                      Suggested Redline Replacement:
                    </span>
                    <p className="text-xs text-slate-200 font-mono leading-relaxed">{risk.suggested_revision}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleCopyRevision(risk.clause_id, risk.suggested_revision)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {copiedRevision === risk.clause_id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
              className="absolute top-2 right-2 px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 flex items-center gap-1 cursor-pointer z-10"
            >
              {copiedSchema ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedSchema ? 'Copied' : 'Copy JSON'}
            </button>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-[360px]">
              {JSON.stringify(extractedSchema, null, 2)}
            </pre>
          </div>
        )}

        {/* REDACT MODE: Tab - Differential Privacy */}
        {!isUnredactMode && activeTab === 'privacy' && differentialPrivacy && (
          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400">Differential Privacy Guarantee:</span>
                <span className="text-xs font-mono text-purple-400 font-bold">&epsilon; = {differentialPrivacy.epsilon}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">Original Aggregate:</span>
                  <span className="text-slate-200 font-mono font-bold">${differentialPrivacy.original_aggregate.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Laplace Noise (&plusmn;):</span>
                  <span className="text-purple-300 font-mono font-bold">${differentialPrivacy.laplace_noise}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Privatized Export Value:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    ${differentialPrivacy.privatized_aggregate.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Execution Time: <strong className="text-indigo-400">{processingTimeMs || 0} ms</strong></span>
          <span className="truncate max-w-[200px]" title={auditHash}>
            Case ID: <strong className="text-cyan-400">{docId || 'idle'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          {isUnredactMode ? (
            <>
              <button
                type="button"
                onClick={onDownloadRestoredDocument || onDownloadCleanPdf}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Restored File</span>
              </button>
              <button
                type="button"
                onClick={onDownloadForensicDossier || onDownloadAuditLog}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Forensic Dossier</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onDownloadCleanPdf}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Clean PDF</span>
              </button>
              <button
                type="button"
                onClick={onDownloadAuditLog}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audit JSON</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
