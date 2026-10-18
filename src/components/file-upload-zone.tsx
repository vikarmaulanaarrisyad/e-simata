"use client";

import React, { useRef, useState, useCallback } from "react";
import { UploadCloud, FileVideo, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SelectedFileItem {
  file: File;
  id: string;
  previewUrl?: string;
  type: "IMAGE" | "VIDEO" | "OTHER";
}

interface FileUploadZoneProps {
  files: SelectedFileItem[];
  onFilesChange: (files: SelectedFileItem[]) => void;
  maxFileSizeMb?: number;
  allowedTypes?: string;
  disabled?: boolean;
}

export function FileUploadZone({
  files,
  onFilesChange,
  maxFileSizeMb = 100,
  allowedTypes = "image/*,video/*",
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processSelectedFiles = useCallback(
    (newFileList: FileList | File[]) => {
      setErrorMsg(null);
      const incoming = Array.from(newFileList);
      const updatedFiles: SelectedFileItem[] = [...files];

      for (const file of incoming) {
        // Validate size
        const fileSizeMb = file.size / (1024 * 1024);
        if (fileSizeMb > maxFileSizeMb) {
          setErrorMsg(
            `Berkas "${file.name}" melebihi batas ukuran maksimal (${maxFileSizeMb} MB).`
          );
          continue;
        }

        // Validate type
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          setErrorMsg(
            `Berkas "${file.name}" bukan format foto atau video yang didukung.`
          );
          continue;
        }

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        updatedFiles.push({
          file,
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          previewUrl,
          type: isImage ? "IMAGE" : "VIDEO",
        });
      }

      onFilesChange(updatedFiles);
    },
    [files, maxFileSizeMb, onFilesChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const filtered = files.filter((f) => f.id !== id);
    onFilesChange(filtered);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragOver
            ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
            : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-900/50"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processSelectedFiles(e.target.files);
              e.target.value = ""; // Reset
            }
          }}
        />

        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner dark:bg-emerald-950/60 dark:text-emerald-400">
          <UploadCloud className="h-7 w-7 animate-bounce" />
        </div>

        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Pilih atau Tarik Berkas Foto / Video ke Sini
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Format didukung: JPG, PNG, WEBP, MP4, MOV, MKV (Maks. {maxFileSizeMb} MB per berkas)
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="text-xs">
            <ImageIcon className="mr-1 h-3 w-3 text-emerald-600" /> Foto
          </Badge>
          <Badge variant="outline" className="text-xs">
            <FileVideo className="mr-1 h-3 w-3 text-blue-600" /> Video
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Direct Streaming ke Google Drive
          </Badge>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected Files List & Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Berkas Siap Unggah ({files.length})</span>
            <button
              type="button"
              onClick={() => onFilesChange([])}
              className="text-red-500 hover:underline"
            >
              Hapus Semua
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {files.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all hover:shadow"
              >
                {/* Media Preview */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {item.type === "IMAGE" && item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : item.type === "VIDEO" && item.previewUrl ? (
                    <video
                      src={item.previewUrl}
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {item.file.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(item.file.size)} • {item.type}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeFile(item.id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                  title="Hapus berkas"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
