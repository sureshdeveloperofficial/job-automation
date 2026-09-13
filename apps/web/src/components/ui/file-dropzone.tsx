'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from './button';

interface FileDropzoneProps {
  accept?: string;
  maxSizeMb?: number;
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  selectedFile?: File | null;
  onClear?: () => void;
  helperText?: string;
}

export function FileDropzone({
  accept = '.pdf,.docx,.txt',
  maxSizeMb = 10,
  onFileSelect,
  isLoading = false,
  selectedFile = null,
  onClear,
  helperText = 'Upload PDF, DOCX, or TXT (Max 10MB)',
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndSelect = (file: File) => {
    setError(null);

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds maximum allowed ${maxSizeMb}MB.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) validateAndSelect(file);
    }
  };

  return (
    <div className="w-full space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        disabled={isLoading}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-border/60 hover:border-blue-500/50 hover:bg-muted/20 bg-muted/10'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Upload className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="font-medium text-sm text-foreground">
                Click to browse or drag and drop file here
              </div>
              <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
            </div>

            <div className="flex gap-2">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                PDF
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                DOCX
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                TXT
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground truncate max-w-xs sm:max-w-md">
                {selectedFile.name}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready for Cloudinary upload
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              onClear && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
