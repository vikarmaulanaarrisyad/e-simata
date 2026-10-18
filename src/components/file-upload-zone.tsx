"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  UploadCloud,
  FileVideo,
  Image as ImageIcon,
  Camera,
  Video,
  X,
  AlertCircle,
  Film,
  CheckCircle2,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { compressImageFile } from "@/lib/image-compression";

export interface SelectedFileItem {
  file: File;
  id: string;
  previewUrl?: string;
  type: "IMAGE" | "VIDEO" | "OTHER";
  isCompressed?: boolean;
  originalSize?: number;
}

interface FileUploadZoneProps {
  files: SelectedFileItem[];
  onFilesChange: (files: SelectedFileItem[]) => void;
  maxFileSizeMb?: number;
  allowedTypes?: string;
  disabled?: boolean;
  targetType?: "IMAGE" | "VIDEO" | "ALL";
  title?: string;
  description?: string;
  badgeLabel?: string;
  accentColor?: "emerald" | "blue" | "teal";
}

export function FileUploadZone({
  files,
  onFilesChange,
  maxFileSizeMb = 100,
  allowedTypes,
  disabled = false,
  targetType = "ALL",
  title,
  description,
  badgeLabel,
  accentColor = targetType === "VIDEO" ? "blue" : "emerald",
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveAllowedTypes =
    allowedTypes ||
    (targetType === "IMAGE"
      ? "image/*"
      : targetType === "VIDEO"
      ? "video/*"
      : "image/*,video/*");

  const effectiveTitle =
    title ||
    (targetType === "IMAGE"
      ? "Pilih atau Tarik Berkas Foto ke Sini"
      : targetType === "VIDEO"
      ? "Pilih atau Tarik Berkas Video ke Sini"
      : "Pilih atau Tarik Berkas Foto / Video ke Sini");

  const effectiveDescription =
    description ||
    (targetType === "IMAGE"
      ? `Format foto: JPG, JPEG, PNG, WEBP (Maks. ${maxFileSizeMb} MB/foto)`
      : targetType === "VIDEO"
      ? `Format video: MP4, MOV, MKV, WebM (Maks. ${maxFileSizeMb} MB/video)`
      : `Format didukung: JPG, PNG, WEBP, MP4, MOV (Maks. ${maxFileSizeMb} MB per berkas)`);

  const processSelectedFiles = useCallback(
    async (newFileList: FileList | File[]) => {
      setErrorMsg(null);
      const incoming = Array.from(newFileList);
      const updatedFiles: SelectedFileItem[] = [...files];

      for (const rawFile of incoming) {
        // Validate type
        const isImage = rawFile.type.startsWith("image/");
        const isVideo = rawFile.type.startsWith("video/");

        if (targetType === "IMAGE" && !isImage) {
          setErrorMsg(
            `Berkas "${rawFile.name}" bukan foto/gambar. Mohon gunakan kolom Upload Video untuk berkas rekaman video.`
          );
          continue;
        }

        if (targetType === "VIDEO" && !isVideo) {
          setErrorMsg(
            `Berkas "${rawFile.name}" bukan video. Mohon gunakan kolom Upload Foto untuk berkas foto/gambar.`
          );
          continue;
        }

        if (targetType === "ALL" && !isImage && !isVideo) {
          setErrorMsg(
            `Berkas "${rawFile.name}" bukan format foto atau video yang didukung.`
          );
          continue;
        }

        let fileToUse = rawFile;
        let isCompressed = false;
        const originalSize = rawFile.size;

        // Otomatis kompresi foto kamera HP berukuran besar (> 500 KB) agar transmisi cepat & hemat kuota
        if (isImage && rawFile.size > 500 * 1024) {
          try {
            const compressed = await compressImageFile(rawFile);
            if (compressed.size < rawFile.size) {
              fileToUse = compressed;
              isCompressed = true;
            }
          } catch {
            fileToUse = rawFile;
          }
        }

        // Validate size after compression
        const fileSizeMb = fileToUse.size / (1024 * 1024);
        if (fileSizeMb > maxFileSizeMb) {
          setErrorMsg(
            `Berkas "${fileToUse.name}" melebihi batas ukuran maksimal (${maxFileSizeMb} MB).`
          );
          continue;
        }

        // Create preview
        const previewUrl = URL.createObjectURL(fileToUse);
        updatedFiles.push({
          file: fileToUse,
          id: `${fileToUse.name}-${fileToUse.size}-${Date.now()}-${Math.random()}`,
          previewUrl,
          type: isImage ? "IMAGE" : "VIDEO",
          isCompressed,
          originalSize,
        });
      }

      onFilesChange(updatedFiles);
    },
    [files, maxFileSizeMb, onFilesChange, targetType]
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

  const isBlue = accentColor === "blue";

  return (
    <div className="space-y-4">
      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed p-4 sm:p-7 text-center transition-all cursor-pointer ${
          isDragOver
            ? isBlue
              ? "border-sky-500 bg-sky-500/10 scale-[1.01]"
              : "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
            : isBlue
            ? "border-sky-200/90 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/20 hover:border-sky-400 hover:bg-sky-50/70 dark:hover:bg-sky-950/40"
            : "border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={effectiveAllowedTypes}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processSelectedFiles(e.target.files);
              e.target.value = ""; // Reset
            }
          }}
        />

        {/* Icon & Animation */}
        <div
          className={`mb-2 sm:mb-3 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-xl sm:rounded-2xl shadow-inner transition-transform group-hover:scale-105 ${
            isBlue
              ? "bg-sky-100 text-sky-600 dark:bg-sky-950/70 dark:text-sky-300"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300"
          }`}
        >
          {targetType === "IMAGE" ? (
            <Camera className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
          ) : targetType === "VIDEO" ? (
            <Film className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
          ) : (
            <UploadCloud className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
          )}
        </div>

        <h4 className="text-xs sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
          {effectiveTitle}
        </h4>
        <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed max-w-sm">
          {effectiveDescription}
        </p>

        {/* Badges footer */}
        <div className="mt-2.5 sm:mt-3.5 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          {badgeLabel ? (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold ${
                isBlue
                  ? "border-sky-300 text-sky-800 dark:border-sky-800 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/50"
                  : "border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50"
              }`}
            >
              {targetType === "IMAGE" ? (
                <ImageIcon className="mr-1 h-3 w-3" />
              ) : targetType === "VIDEO" ? (
                <FileVideo className="mr-1 h-3 w-3" />
              ) : null}
              {badgeLabel}
            </Badge>
          ) : (
            <>
              {targetType === "IMAGE" && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50"
                >
                  <ImageIcon className="mr-1 h-3 w-3 text-emerald-600" /> Khusus Foto (Multi-Upload)
                </Badge>
              )}
              {targetType === "VIDEO" && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-sky-300 text-sky-800 dark:border-sky-800 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/50"
                >
                  <FileVideo className="mr-1 h-3 w-3 text-sky-600" /> Khusus Video (MP4 / MOV)
                </Badge>
              )}
            </>
          )}

          <Badge variant="secondary" className="text-[10px] font-medium">
            Tersimpan Otomatis ke Drive
          </Badge>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected Files List & Preview */}
      {files.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2
                className={`h-3.5 w-3.5 ${
                  isBlue ? "text-sky-600" : "text-emerald-600"
                }`}
              />
              {targetType === "IMAGE"
                ? `Foto Siap Diunggah (${files.length})`
                : targetType === "VIDEO"
                ? `Video Siap Diunggah (${files.length})`
                : `Berkas Siap Unggah (${files.length})`}
            </span>
            <button
              type="button"
              onClick={() => {
                files.forEach((f) => {
                  if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
                });
                onFilesChange([]);
              }}
              className="text-[11px] text-red-500 hover:text-red-600 hover:underline font-semibold cursor-pointer"
            >
              Hapus Semua
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {files.map((item) => (
              <div
                key={item.id}
                className={`relative flex items-center gap-3 overflow-hidden rounded-xl border p-2.5 shadow-xs transition-all hover:shadow-sm ${
                  isBlue
                    ? "border-sky-200/90 bg-sky-50/30 dark:border-sky-900/60 dark:bg-slate-900/60"
                    : "border-emerald-200/90 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-slate-900/60"
                }`}
              >
                {/* Media Preview */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-border/60">
                  {item.type === "IMAGE" && item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : item.type === "VIDEO" && item.previewUrl ? (
                    <div className="relative h-full w-full bg-slate-900 flex items-center justify-center">
                      <video
                        src={item.previewUrl}
                        className="h-full w-full object-cover opacity-80"
                        muted
                        preload="metadata"
                      />
                      <Film className="absolute h-5 w-5 text-white/90 drop-shadow" />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {item.file.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatBytes(item.file.size)} • {item.type}
                    </span>
                    {item.isCompressed && item.originalSize && item.originalSize > item.file.size && (
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-300/60 dark:border-emerald-800">
                        Hemat {Math.round((1 - item.file.size / item.originalSize) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeFile(item.id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-slate-800 cursor-pointer transition-colors"
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
