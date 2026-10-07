import React from 'react';
import { Eye, ShieldAlert, Cpu, CheckCircle2, Loader2, Lock, Terminal } from 'lucide-react';

export interface AgentLogItem {
  event: string;
  agent: string;
  phase?: string;
  message: string;
  progress?: number;
  metrics?: Record<string, any>;
  timestamp?: string;
}

interface LiveStreamLogsProps {
  logs: AgentLogItem[];
  progress: number;
  currentAgent: string;
  isStreaming: boolean;
  tokensCount?: number;
  boxesCount?: number;
  piiCount?: number;
  highRiskCount?: number;
  schemaType?: string;
}

export const LiveStreamLogs: React.FC<LiveStreamLogsProps> = ({
  logs,
  progress,
  currentAgent,
  isStreaming,
  tokensCount = 0,
  boxesCount = 0,
  piiCount = 0,
  highRiskCount = 0,
  schemaType = "Awaiting Ingestion"
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Agent Pipeline Nodes</h3>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-700 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" /> Live DAG Stream
            </span>
          ) : progress === 100 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> DAG Complete
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-mono">Idle</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="my-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
          <span>{currentAgent || "Standby"}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 4 Agent Status Cards (as specified in prompt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 my-2">
        {/* Agent 1: Layout Agent */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" /> Layout Agent
            </span>
            {tokensCount > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : isStreaming && currentAgent.includes("Layout") ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-600" />
            )}
          </div>
          <p className="text-xs font-mono text-slate-300">
            {tokensCount > 0 ? (
              <span>{tokensCount} tokens scanned <br/><span className="text-blue-400">({boxesCount} bounding boxes)</span></span>
            ) : (
              <span className="text-slate-500">PyMuPDF / Docling parser</span>
            )}
          </p>
        </div>

        {/* Agent 4: Privacy Agent */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Privacy Agent
            </span>
            {piiCount > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : isStreaming && currentAgent.includes("Privacy") ? (
              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-600" />
            )}
          </div>
          <p className="text-xs font-mono text-slate-300">
            {piiCount > 0 ? (
              <span>{piiCount} PII/PHI redacted <br/><span className="text-purple-400">Hardware pixel burn-in</span></span>
            ) : (
              <span className="text-slate-500">Presidio NER + Vector strip</span>
            )}
          </p>
        </div>

        {/* Agent 2: Schema Structuring Agent */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Schema Agent
            </span>
            {progress >= 80 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : isStreaming && currentAgent.includes("Schema") ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-600" />
            )}
          </div>
          <p className="text-xs font-mono text-slate-300 truncate">
            {progress >= 80 ? (
              <span>Pydantic JSON Validated <br/><span className="text-cyan-400">{schemaType}</span></span>
            ) : (
              <span className="text-slate-500">Ollama / Llama-3.2:3b</span>
            )}
          </p>
        </div>

        {/* Agent 3: Compliance & Risk Agent */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Risk Agent
            </span>
            {progress >= 90 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : isStreaming && currentAgent.includes("Risk") ? (
              <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-600" />
            )}
          </div>
          <p className="text-xs font-mono text-slate-300">
            {progress >= 90 ? (
              <span>
                {highRiskCount > 0 ? (
                  <span className="text-rose-400 font-bold">{highRiskCount} High-Risk Clause Caught</span>
                ) : (
                  <span className="text-emerald-400">Baseline Compliant</span>
                )}
                <br/><span className="text-slate-400">Policy Benchmark Tested</span>
              </span>
            ) : (
              <span className="text-slate-500">Corporate benchmarks</span>
            )}
          </p>
        </div>
      </div>

      {/* Live Event Stream Ticker Console */}
      <div className="mt-3 flex-1 min-h-[140px] max-h-[180px] overflow-y-auto bg-black/60 rounded-lg p-3 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
        {logs.length === 0 ? (
          <div className="text-slate-500 italic py-4 text-center">
            Awaiting document trigger... Select Sample 1 or Sample 2 to initiate real-time multi-agent DAG.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-indigo-400 shrink-0">[{log.agent || 'SYSTEM'}]</span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
