"use client";

import React, { useState } from "react";
import { FieldType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Sparkles, RotateCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { generatePedagogicalNote } from "@/lib/ai-generator";

export interface CustomFieldData {
  id: string;
  label: string;
  name: string;
  fieldType: FieldType;
  placeholder?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  options?: any;
  orderIndex: number;
}

interface DynamicFormRendererProps {
  fields: CustomFieldData[];
  values: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (name: string, value: any) => void;
  disabled?: boolean;
  categoryName?: string;
  submitterName?: string;
}

export function DynamicFormRenderer({
  fields,
  values,
  errors = {},
  onChange,
  disabled = false,
  categoryName,
  submitterName,
}: DynamicFormRendererProps) {
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});

  // Sort fields based on orderIndex
  const sortedFields = [...fields].sort((a, b) => a.orderIndex - b.orderIndex);

  if (sortedFields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-muted-foreground dark:border-slate-800">
        Kategori ini belum memiliki formulir data tambahan. Anda dapat langsung mengunggah berkas.
      </div>
    );
  }

  // Parse options for SELECT
  const parseOptions = (options: any): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return options.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const handleGenerateAI = async (fieldName: string, fieldLabel: string) => {
    setLoadingField(fieldName);
    const nextSeed = (variationCounts[fieldName] || 0) + 1;
    setVariationCounts((prev) => ({ ...prev, [fieldName]: nextSeed }));

    const kelas = values.kelas || values.pilihan_kelas;
    const tema = values.tema_karya || values.momen_apresiasi;

    try {
      const res = await fetch("/api/ai/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName,
          fieldLabel,
          fieldName,
          kelas,
          waliKelas: submitterName,
          tema,
          seedIndex: nextSeed,
        }),
      });

      const data = await res.json();
      if (data.success && data.generatedText) {
        onChange(fieldName, data.generatedText);
        toast.success("Catatan pelaksanaan berhasil dibuat oleh AI! ✨", {
          description: "Anda dapat membaca atau mengedit teks sesuai kebutuhan.",
        });
      } else {
        const localNote = generatePedagogicalNote({
          categoryName: categoryName || "",
          fieldLabel,
          fieldName,
          kelas,
          waliKelas: submitterName,
          tema,
          seedIndex: nextSeed,
        });
        onChange(fieldName, localNote);
        toast.success("Catatan pelaksanaan berhasil dibuat oleh AI! ✨");
      }
    } catch {
      const localNote = generatePedagogicalNote({
        categoryName: categoryName || "",
        fieldLabel,
        fieldName,
        kelas,
        waliKelas: submitterName,
        tema,
        seedIndex: nextSeed,
      });
      onChange(fieldName, localNote);
      toast.success("Catatan pelaksanaan berhasil dibuat oleh AI! ✨");
    } finally {
      setLoadingField(null);
    }
  };

  return (
    <div className="space-y-5">
      {sortedFields.map((field) => {
        const value = values[field.name] ?? (field.fieldType === FieldType.CHECKBOX ? false : "");
        const error = errors[field.name];
        const isFieldRequired = field.isRequired;

        return (
          <div key={field.id} className="space-y-1.5 transition-all">
            {/* CHECKBOX TYPE */}
            {field.fieldType === FieldType.CHECKBOX ? (
              <div className="flex items-start space-x-3 rounded-xl border border-border/80 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-900/60">
                <Checkbox
                  id={`field-${field.id}`}
                  checked={Boolean(value)}
                  disabled={disabled}
                  onCheckedChange={(checked) => onChange(field.name, checked)}
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor={`field-${field.id}`}
                    className="cursor-pointer font-medium text-slate-800 dark:text-slate-200"
                  >
                    {field.label}
                    {isFieldRequired && <span className="ml-1 text-red-500">*</span>}
                  </Label>
                  {field.placeholder && (
                    <p className="text-xs text-muted-foreground">{field.placeholder}</p>
                  )}
                  {field.helpText && (
                    <p className="text-xs text-slate-500">{field.helpText}</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Label
                    htmlFor={`field-${field.id}`}
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    {field.label}
                    {isFieldRequired && <span className="ml-1 text-red-500">*</span>}
                  </Label>

                  <div className="flex items-center gap-2">
                    {field.fieldType === FieldType.TEXTAREA && (
                      <button
                        type="button"
                        onClick={() => handleGenerateAI(field.name, field.label)}
                        disabled={disabled || loadingField === field.name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Klik untuk membuat catatan pelaksanaan otomatis oleh AI"
                      >
                        <Sparkles
                          className={cn(
                            "h-3.5 w-3.5",
                            loadingField === field.name && "animate-spin text-amber-200"
                          )}
                        />
                        <span>
                          {loadingField === field.name ? "Merangkai Catatan..." : "✨ Buat Catatan AI"}
                        </span>
                      </button>
                    )}

                    {field.isRequired ? (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        Wajib
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Opsional</span>
                    )}
                  </div>
                </div>

                {/* TEXT INPUT */}
                {field.fieldType === FieldType.TEXT && (
                  <Input
                    id={`field-${field.id}`}
                    type="text"
                    placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    className={cn(error && "border-red-500 focus-visible:ring-red-500")}
                  />
                )}

                {/* TEXTAREA INPUT */}
                {field.fieldType === FieldType.TEXTAREA && (
                  <div className="space-y-1.5">
                    <Textarea
                      id={`field-${field.id}`}
                      placeholder={field.placeholder || `Tuliskan ${field.label.toLowerCase()} di sini...`}
                      value={value}
                      disabled={disabled}
                      rows={3}
                      onChange={(e) => onChange(field.name, e.target.value)}
                      className={cn(
                        "leading-relaxed font-normal text-sm",
                        error && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5 pt-0.5 flex-wrap gap-2">
                      {value ? (
                        <>
                          <span className="text-slate-500 dark:text-slate-400">
                            {String(value).length} karakter • Siap disimpan (dapat diedit bebas).
                          </span>
                          <button
                            type="button"
                            onClick={() => handleGenerateAI(field.name, field.label)}
                            disabled={disabled || loadingField === field.name}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" /> Ganti Variasi Kalimat Lain
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleGenerateAI(field.name, field.label)}
                          disabled={disabled || loadingField === field.name}
                          className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            💡 Klik untuk mengisi otomatis catatan narasi formal seperti contoh (3 kalimat)
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* NUMBER INPUT */}
                {field.fieldType === FieldType.NUMBER && (
                  <Input
                    id={`field-${field.id}`}
                    type="number"
                    placeholder={field.placeholder || "0"}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    className={cn(error && "border-red-500 focus-visible:ring-red-500")}
                  />
                )}

                {/* DATE INPUT */}
                {field.fieldType === FieldType.DATE && (
                  <Input
                    id={`field-${field.id}`}
                    type="date"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    className={cn(error && "border-red-500 focus-visible:ring-red-500")}
                  />
                )}

                {/* SELECT / DROPDOWN INPUT */}
                {field.fieldType === FieldType.SELECT && (() => {
                  const optionsList = parseOptions(field.options);
                  const isClassOrRombel =
                    field.name.toLowerCase().includes("kelas") ||
                    field.label.toLowerCase().includes("kelas") ||
                    field.name.toLowerCase().includes("rombel") ||
                    (optionsList.length > 0 && optionsList.every((o) => o.toLowerCase().includes("kelas") || /^\d+\s*[a-z]$/i.test(o.trim())));

                  if (isClassOrRombel && optionsList.length > 0) {
                    return (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {optionsList.map((opt) => {
                            const isSelected = value === opt;
                            const displayLabel = opt.replace(/kelas\s*/i, "").trim();
                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={disabled}
                                onClick={() => onChange(field.name, opt)}
                                className={`px-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border-2 cursor-pointer select-none active:scale-95 ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02] ring-2 ring-emerald-500/30"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                                }`}
                              >
                                <span className={`text-[10px] uppercase tracking-wider font-semibold ${isSelected ? "text-emerald-100" : "text-muted-foreground"}`}>
                                  Kelas
                                </span>
                                <span className="text-xs sm:text-sm font-black">
                                  {displayLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {value && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold px-1">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Terpilih: <strong>{value}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => onChange(field.name, "")}
                              className="text-[10px] text-muted-foreground hover:text-red-500 underline cursor-pointer"
                            >
                              Ganti
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Select
                      value={value}
                      disabled={disabled}
                      onValueChange={(val) => onChange(field.name, val)}
                    >
                      <SelectTrigger
                        id={`field-${field.id}`}
                        className={cn("h-11 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900", error && "border-red-500 focus:ring-red-500")}
                      >
                        <SelectValue placeholder={field.placeholder || `-- Pilih ${field.label} --`} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {optionsList.map((opt, idx) => (
                          <SelectItem key={idx} value={opt} className="text-xs sm:text-sm">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}

                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-xs font-medium text-red-500 animate-in fade-in-50">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
