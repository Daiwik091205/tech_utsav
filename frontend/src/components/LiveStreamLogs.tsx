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
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-foreground" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Multi-Agent Pipeline Nodes</h3>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono bg-muted text-foreground border border-border animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" /> Live DAG Stream
            </span>
          ) : progress === 100 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono bg-muted text-foreground border border-border">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> DAG Complete
            </span>
          ) : (
            <span className="text-xs text-muted-foreground font-mono">Idle</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="my-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-mono">
          <span>{currentAgent || "Standby"}</span>
          <span className="font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-foreground h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 4 Agent Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 my-2">
        {/* Agent 1: Layout Agent */}
        <div className="p-3 rounded-lg bg-secondary/40 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" /> Layout Agent
            </span>
            {tokensCount > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : isStreaming && currentAgent.includes("Layout") ? (
              <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            {tokensCount > 0 ? (
              <span>
                <strong className="text-foreground">{tokensCount}</strong> tokens scanned <br />
                <span className="text-foreground/80">({boxesCount} bounding boxes)</span>
              </span>
            ) : (
              <span>PyMuPDF / Docling parser</span>
            )}
          </p>
        </div>

        {/* Agent 2: Privacy Agent */}
        <div className="p-3 rounded-lg bg-secondary/40 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Privacy Agent
            </span>
            {piiCount > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : isStreaming && currentAgent.includes("Privacy") ? (
              <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            {piiCount > 0 ? (
              <span>
                <strong className="text-foreground">{piiCount}</strong> PII/PHI redacted <br />
                <span className="text-foreground/80">Hardware pixel burn-in</span>
              </span>
            ) : (
              <span>Presidio NER + Vector strip</span>
            )}
          </p>
        </div>

        {/* Agent 3: Schema Structuring Agent */}
        <div className="p-3 rounded-lg bg-secondary/40 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" /> Schema Agent
            </span>
            {progress >= 80 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : isStreaming && currentAgent.includes("Schema") ? (
              <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground truncate">
            {progress >= 80 ? (
              <span>
                Pydantic JSON Validated <br />
                <span className="text-foreground font-semibold">{schemaType}</span>
              </span>
            ) : (
              <span>Ollama / Llama-3.2:3b</span>
            )}
          </p>
        </div>

        {/* Agent 4: Compliance & Risk Agent */}
        <div className="p-3 rounded-lg bg-secondary/40 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" /> Risk Agent
            </span>
            {progress >= 90 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : isStreaming && currentAgent.includes("Risk") ? (
              <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            {progress >= 90 ? (
              <span>
                {highRiskCount > 0 ? (
                  <span className="text-destructive font-bold">{highRiskCount} High-Risk Clause Caught</span>
                ) : (
                  <span className="text-emerald-500 font-semibold">Baseline Compliant</span>
                )}
                <br />
                <span className="text-muted-foreground">Policy Benchmark Tested</span>
              </span>
            ) : (
              <span>Corporate benchmarks</span>
            )}
          </p>
        </div>
      </div>

      {/* Live Event Stream Ticker Console */}
      <div className="mt-3 flex-1 min-h-[140px] max-h-[180px] overflow-y-auto bg-muted/40 rounded-lg p-3 border border-border font-mono text-xs text-foreground space-y-1.5">
        {logs.length === 0 ? (
          <div className="text-muted-foreground italic py-4 text-center">
            Awaiting document trigger... Select Sample 1 or Sample 2 to initiate real-time multi-agent DAG.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-foreground font-semibold shrink-0">[{log.agent || 'SYSTEM'}]</span>
              <span className="text-muted-foreground">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
