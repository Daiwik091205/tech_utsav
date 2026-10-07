import React, { useState } from 'react';
import { Upload, Shield, FileCheck, Sparkles, AlertTriangle, Zap, Search, Camera, FileText } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: (sampleId: string) => void;
  isProcessing: boolean;
  activeDocName?: string;
  activeSampleId?: string;
  isTurboMode: boolean;
  onToggleTurboMode: () => void;
  pipelineMode: 'redact' | 'unredact';
  onToggleMode: (mode: 'redact' | 'unredact') => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  onSampleSelect,
  isProcessing,
  activeDocName,
  activeSampleId,
  isTurboMode,
  onToggleTurboMode,
  pipelineMode,
  onToggleMode
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const isDesktop = typeof window !== 'undefined' && !!(window as any).electronAPI?.isDesktop;

  const handleNativeOpen = async () => {
    if ((window as any).electronAPI?.openFileDialog) {
      try {
        const fileData = await (window as any).electronAPI.openFileDialog({
          filters: [
            { name: 'Supported Documents & Images', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        if (fileData && fileData.base64 && fileData.filename) {
          const byteCharacters = atob(fileData.base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const mime = fileData.filename.endsWith('.pdf') ? 'application/pdf' : 'image/png';
          const file = new File([byteArray], fileData.filename, { type: mime });
          onFileSelect(file);
        }
      } catch (err) {
        console.error('Failed to open file via dialog:', err);
      }
    }
  };

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
          <span className={`flex h-2.5 w-2.5 rounded-full ${pipelineMode === 'unredact' ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse shrink-0`} />
          <h2 className="text-base font-bold text-white tracking-wide truncate">
            {pipelineMode === 'unredact' ? 'Forensic De-Redaction Gateway' : 'Multi-Agent Ingestion Gateway'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTurboMode}
            className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              isTurboMode
                ? 'bg-amber-950/90 text-amber-300 border-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
            }`}
            title="Toggle between Paced Presentation Demo and Ultra-Fast Turbo Execution"
          >
            <Zap className={`w-3 h-3 ${isTurboMode ? 'text-amber-400 animate-pulse' : 'text-indigo-400'}`} />
            <span>{isTurboMode ? '⚡ Turbo (<200ms)' : '🎭 Paced (3s)'}</span>
          </button>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 shrink-0">
            Air-Gapped
          </span>
        </div>
      </div>

      {/* Operational Mode Toggle Segment */}
      <div className="mb-3 p-1 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleMode('redact')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            pipelineMode === 'redact'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Burn-In Redaction (Privacy)</span>
        </button>
        <button
          type="button"
          onClick={() => onToggleMode('unredact')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            pipelineMode === 'unredact'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Forensic Un-Redact (Optical & AI)</span>
        </button>
      </div>

      {/* Dedicated Demo Presets Row */}
      <div className="mb-3.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>{pipelineMode === 'unredact' ? 'Un-Redact Test Samples' : 'Redaction Booth Presets'}</span>
          <span className="text-[10px] text-indigo-400">Click to run DAG stream</span>
        </div>

        {pipelineMode === 'unredact' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSampleSelect('redacted_photo')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activeSampleId === 'redacted_photo'
                  ? 'bg-cyan-900/60 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                  : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/80 hover:bg-cyan-900/60 hover:border-cyan-600'
              } disabled:opacity-50`}
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold">Sample 4: Redacted Photo (PNG)</span>
                <span className="text-[10px] text-cyan-300/80">Camera scan with black marker bars</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSampleSelect('fake_redacted_medical')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activeSampleId === 'fake_redacted_medical'
                  ? 'bg-indigo-900/60 text-indigo-200 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400'
                  : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/80 hover:bg-indigo-900/60 hover:border-indigo-600'
              } disabled:opacity-50`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold">Sample 5: Redacted Medical (PDF)</span>
                <span className="text-[10px] text-indigo-300/80">Vector-stream black boxes</span>
              </div>
            </button>
          </div>
        ) : (
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
        )}
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all text-center flex-1 flex flex-col justify-center ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/30'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
        } ${isProcessing ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
            {isProcessing ? (
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-200">
              {activeDocName ? (
                <span className="text-cyan-300 font-semibold flex items-center gap-1 justify-center">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Active: {activeDocName}
                </span>
              ) : isDesktop ? (
                <span>
                  Drop PDF or Photo (PNG, JPG) or{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNativeOpen();
                    }}
                    className="text-cyan-400 underline font-semibold hover:text-cyan-300 cursor-pointer"
                  >
                    browse files
                  </button>
                </span>
              ) : (
                <span>Drop PDF or Photo / Image (PNG, JPG) or <span className="text-cyan-400 underline font-semibold">browse</span></span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {pipelineMode === 'unredact'
                ? 'Camera photos of documents, phone scans, or PDFs with black redaction bars'
                : 'Invoices, Clinical Records, CMS-1500, Mutual NDAs, Academic Sheets'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
