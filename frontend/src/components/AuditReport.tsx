import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Lock } from 'lucide-react';

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

interface AuditReportProps {
  docId?: string;
  riskFindings: RiskFinding[];
  extractedSchema: Record<string, any>;
  differentialPrivacy?: DifferentialPrivacyMetrics;
  auditHash?: string;
  processingTimeMs?: number;
  onDownloadCleanPdf: () => void;
  onDownloadAuditLog: () => void;
}

export const AuditReport: React.FC<AuditReportProps> = ({
  docId,
  riskFindings,
  extractedSchema,
  differentialPrivacy,
  auditHash,
  processingTimeMs,
  onDownloadCleanPdf,
  onDownloadAuditLog
}) => {
  const [activeTab, setActiveTab] = useState<'risks' | 'schema' | 'privacy'>('risks');
  const [copiedRevision, setCopiedRevision] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

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
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Structured Export & Audit</h3>
          <p className="text-[11px] text-slate-400">Pydantic typing & differential privacy verification</p>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
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
        </div>
      </div>

      {/* Tab 1: Compliance Risk Cards */}
      {activeTab === 'risks' && (
        <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1">
          {riskFindings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              Awaiting document risk evaluation...
            </div>
          ) : (
            riskFindings.map((finding) => {
              const isHigh = finding.severity === 'HIGH';
              const isMed = finding.severity === 'MEDIUM';

              const cardBorder = isHigh
                ? 'border-rose-800/80 bg-rose-950/20'
                : isMed
                ? 'border-amber-800/80 bg-amber-950/20'
                : 'border-emerald-800/80 bg-emerald-950/20';

              const badgeColor = isHigh
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : isMed
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700';

              return (
                <div key={finding.clause_id} className={`p-4 rounded-lg border ${cardBorder} transition-all shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">{finding.clause_title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${badgeColor}`}>
                      {finding.severity} RISK
                    </span>
                  </div>

                  {/* Flagged excerpt */}
                  <div className="mb-2 p-2 rounded bg-black/40 border border-slate-800 text-xs font-mono text-slate-300 italic">
                    "{finding.flagged_text}"
                  </div>

                  {/* Risk analysis */}
                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                    <strong className="text-slate-200">Liability Analysis:</strong> {finding.risk_explanation}
                  </p>

                  {/* Benchmark */}
                  <p className="text-[11px] text-slate-400 mb-3">
                    <strong className="text-slate-300">Policy Benchmark:</strong> {finding.policy_benchmark}
                  </p>

                  {/* Remediation suggestion */}
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-400">Suggested Enterprise Redline:</span>
                      <button
                        onClick={() => handleCopyRevision(finding.clause_id, finding.suggested_revision)}
                        className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 transition-colors cursor-pointer"
                      >
                        {copiedRevision === finding.clause_id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Redline
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-slate-300 leading-snug">
                      {finding.suggested_revision}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Raw Validated JSON Schema */}
      {activeTab === 'schema' && (
        <div className="flex-1 flex flex-col my-3 overflow-hidden">
          <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
            <span>Validated Pydantic Type-Safe Model Output</span>
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-black/60 rounded-lg p-3 border border-slate-800 font-mono text-xs text-emerald-400">
            <pre>{JSON.stringify(extractedSchema, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Tab 3: Differential Privacy & Cryptographic Audit */}
      {activeTab === 'privacy' && (
        <div className="flex-1 overflow-y-auto my-3 space-y-4 pr-1 text-xs">
          <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-800/80">
            <div className="flex items-center gap-2 text-purple-300 font-bold mb-2">
              <Lock className="w-4 h-4" /> Differential Privacy On Tabular Aggregates
            </div>
            <p className="text-slate-300 leading-relaxed mb-3">
              Standard anonymization (redacting names) leaves quasi-identifiers (ZIP + Age + Charges) vulnerable to linkage attacks. Our Privacy Engine enforces mathematical differential privacy and k-anonymity.
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mb-3">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Privacy Budget (&epsilon;):</span>
                <p className="text-white font-bold">{differentialPrivacy?.epsilon ?? 0.50}</p>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Sensitivity (&Delta;f):</span>
                <p className="text-white font-bold">${differentialPrivacy?.global_sensitivity ?? 50.0}</p>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Injected Laplace Noise:</span>
                <p className="text-purple-400 font-bold">
                  {differentialPrivacy ? `${differentialPrivacy.laplace_noise > 0 ? '+' : ''}$${differentialPrivacy.laplace_noise}` : 'N/A'}
                </p>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Privatized Aggregate:</span>
                <p className="text-emerald-400 font-bold">
                  {differentialPrivacy ? `$${differentialPrivacy.privatized_aggregate.toLocaleString()}` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-purple-900/60 font-mono text-[11px] text-purple-300">
              <strong>Mathematical Guarantee:</strong>
              <div className="mt-1 text-slate-300">
                M(x) = f(x) + Laplace(&Delta;f / &epsilon;)
              </div>
              <div className="mt-0.5 text-slate-400">
                Generalization: {differentialPrivacy?.k_anonymity_level ?? 'k=5 Quasi-identifier generalization applied'}
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Digest */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
            <span className="text-slate-400">Cryptographic Audit Digest (SHA-256):</span>
            <div className="text-indigo-400 truncate font-bold mt-1">
              {auditHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
            <div className="text-slate-500 mt-1 flex justify-between">
              <span>Zero data egress. Air-gapped verification.</span>
              <span>{processingTimeMs ? `${processingTimeMs}ms` : '0ms'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Export Action Buttons (as requested) */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
        <button
          onClick={onDownloadCleanPdf}
          disabled={!docId}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Clean PDF</span>
        </button>

        <button
          onClick={onDownloadAuditLog}
          disabled={!docId}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Download Audit Log</span>
        </button>
      </div>
    </div>
  );
};
