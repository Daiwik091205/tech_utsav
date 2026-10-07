import React, { useState } from 'react';
import { Upload, Shield, FileCheck, Sparkles, AlertTriangle } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: (sampleId: string) => void;
  isProcessing: boolean;
  activeDocName?: string;
  activeSampleId?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  onSampleSelect,
  isProcessing,
  activeDocName,
  activeSampleId
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <h2 className="text-base font-bold text-white tracking-wide truncate">Multi-Agent Ingestion Gateway</h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 shrink-0">
          Air-Gapped
        </span>
      </div>

      {/* Dedicated Demo Presets Row - Perfectly aligned within the container */}
      <div className="mb-3.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Booth Demo Presets</span>
          <span className="text-[10px] text-indigo-400">Click to run DAG stream</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSampleSelect('medical_billing')}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              activeSampleId === 'medical_billing'
                ? 'bg-indigo-900/50 text-indigo-200 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400'
                : 'bg-indigo-950/50 text-indigo-300 border-indigo-800/80 hover:bg-indigo-900/70 hover:border-indigo-600'
            } disabled:opacity-50`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Sample 1: Medical</span>
          </button>

          <button
            type="button"
            onClick={() => onSampleSelect('tech_nda')}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              activeSampleId === 'tech_nda'
                ? 'bg-rose-900/50 text-rose-200 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.35)] ring-1 ring-rose-400'
                : 'bg-rose-950/50 text-rose-300 border-rose-800/80 hover:bg-rose-900/70 hover:border-rose-600'
            } disabled:opacity-50`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">Sample 2: Tech NDA</span>
          </button>

          <button
            type="button"
            onClick={() => onSampleSelect('academic_assignment')}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              activeSampleId === 'academic_assignment'
                ? 'bg-cyan-900/50 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                : 'bg-cyan-950/50 text-cyan-300 border-cyan-800/80 hover:bg-cyan-900/70 hover:border-cyan-600'
            } disabled:opacity-50`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Sample 3: Academic</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all text-center flex-1 flex flex-col justify-center ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-950/30'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
        } ${isProcessing ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
            {isProcessing ? (
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-200">
              {activeDocName ? (
                <span className="text-indigo-300 font-semibold flex items-center gap-1 justify-center">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Active: {activeDocName}
                </span>
              ) : (
                <span>Drop custom PDF or <span className="text-indigo-400 underline">browse</span></span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Invoices, Clinical Records, CMS-1500, Mutual NDAs, MSAs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
