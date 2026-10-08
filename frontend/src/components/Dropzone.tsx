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
    <div className="bg-card text-card-foreground border border-border rounded-lg p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight truncate">
            {pipelineMode === 'unredact' ? 'Forensic De-Redaction Gateway' : 'Multi-Agent Ingestion Gateway'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTurboMode}
            className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
              isTurboMode
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
            }`}
            title="Toggle between Paced Presentation Demo and Ultra-Fast Turbo Execution"
          >
            <Zap className="w-3 h-3" />
            <span>{isTurboMode ? '⚡ Turbo (<200ms)' : '🎭 Paced (3s)'}</span>
          </button>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border shrink-0">
            Air-Gapped
          </span>
        </div>
      </div>

      {/* Operational Mode Toggle Segment */}
      <div className="mb-3 p-1 rounded-lg bg-muted border border-border flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleMode('redact')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
            pipelineMode === 'redact'
              ? 'bg-card text-foreground shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Burn-In Redaction (Privacy)</span>
        </button>
        <button
          type="button"
          onClick={() => onToggleMode('unredact')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
            pipelineMode === 'unredact'
              ? 'bg-card text-foreground shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Forensic Un-Redact (Optical & AI)</span>
        </button>
      </div>

      {/* Dedicated Demo Presets Row */}
      <div className="mb-3.5">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>{pipelineMode === 'unredact' ? 'Un-Redact Test Samples' : 'Redaction Booth Presets'}</span>
          <span className="text-[10px] font-mono text-muted-foreground">Click to run DAG stream</span>
        </div>

        {pipelineMode === 'unredact' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSampleSelect('redacted_photo')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs rounded-md border transition-all cursor-pointer ${
                activeSampleId === 'redacted_photo'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                  : 'bg-secondary text-secondary-foreground border-border hover:bg-accent hover:border-foreground/20'
              } disabled:opacity-50`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-medium">Sample 4: Redacted Photo (PNG)</span>
                <span className={`text-[10px] ${activeSampleId === 'redacted_photo' ? 'opacity-80' : 'text-muted-foreground'}`}>
                  Camera scan with black marker bars
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSampleSelect('fake_redacted_medical')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs rounded-md border transition-all cursor-pointer ${
                activeSampleId === 'fake_redacted_medical'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                  : 'bg-secondary text-secondary-foreground border-border hover:bg-accent hover:border-foreground/20'
              } disabled:opacity-50`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-medium">Sample 5: Redacted Medical (PDF)</span>
                <span className={`text-[10px] ${activeSampleId === 'fake_redacted_medical' ? 'opacity-80' : 'text-muted-foreground'}`}>
                  Vector-stream black boxes
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSampleSelect('medical_billing')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs rounded-md border transition-all cursor-pointer ${
                activeSampleId === 'medical_billing'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                  : 'bg-secondary text-secondary-foreground border-border hover:bg-accent hover:border-foreground/20'
              } disabled:opacity-50`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Sample 1: Medical</span>
            </button>

            <button
              type="button"
              onClick={() => onSampleSelect('tech_nda')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs rounded-md border transition-all cursor-pointer ${
                activeSampleId === 'tech_nda'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                  : 'bg-secondary text-secondary-foreground border-border hover:bg-accent hover:border-foreground/20'
              } disabled:opacity-50`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Sample 2: Tech NDA</span>
            </button>

            <button
              type="button"
              onClick={() => onSampleSelect('academic_assignment')}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs rounded-md border transition-all cursor-pointer ${
                activeSampleId === 'academic_assignment'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                  : 'bg-secondary text-secondary-foreground border-border hover:bg-accent hover:border-foreground/20'
              } disabled:opacity-50`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
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
            ? 'border-foreground bg-muted/60'
            : 'border-border hover:border-foreground/30 bg-muted/30 hover:bg-muted/50'
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
          <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground">
            {isProcessing ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">
              {activeDocName ? (
                <span className="font-semibold flex items-center gap-1 justify-center text-foreground">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Active: {activeDocName}
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
                    className="underline font-semibold hover:opacity-80 cursor-pointer"
                  >
                    browse files
                  </button>
                </span>
              ) : (
                <span>Drop PDF or Photo / Image (PNG, JPG) or <span className="underline font-semibold">browse</span></span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
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
