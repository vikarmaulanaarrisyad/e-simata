"use client";

import React, { useState } from "react";
import { FieldType } from "@prisma/client";
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings2,
  Type,
  FileText,
  Hash,
  ListFilter,
  CheckSquare,
  Calendar,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicFormRenderer, CustomFieldData } from "@/components/dynamic-form-renderer";
import {
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
} from "@/actions/fields";
import { toast } from "sonner";

interface FormBuilderProps {
  categoryId: string;
  categoryName: string;
  initialFields: CustomFieldData[];
}

export function FormBuilder({
  categoryId,
  categoryName,
  initialFields,
}: FormBuilderProps) {
  const [fields, setFields] = useState<CustomFieldData[]>(initialFields);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form modal state
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>(FieldType.TEXT);
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState("");

  const resetFormModal = () => {
    setEditingFieldId(null);
    setLabel("");
    setName("");
    setFieldType(FieldType.TEXT);
    setPlaceholder("");
    setHelpText("");
    setIsRequired(false);
    setOptionsStr("");
  };

  const handleOpenAdd = () => {
    resetFormModal();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (field: CustomFieldData) => {
    setEditingFieldId(field.id);
    setLabel(field.label);
    setName(field.name);
    setFieldType(field.fieldType);
    setPlaceholder(field.placeholder || "");
    setHelpText(field.helpText || "");
    setIsRequired(field.isRequired);

    // Format options
    let opts = "";
    if (field.options) {
      if (Array.isArray(field.options)) {
        opts = field.options.join("\n");
      } else if (typeof field.options === "string") {
        try {
          const parsed = JSON.parse(field.options);
          opts = Array.isArray(parsed) ? parsed.join("\n") : field.options;
        } catch {
          opts = field.options;
        }
      }
    }
    setOptionsStr(opts);
    setIsDialogOpen(true);
  };

  const handleSaveField = async () => {
    if (!label.trim()) {
      toast.error("Label field wajib diisi.");
      return;
    }

    if (fieldType === FieldType.SELECT && !optionsStr.trim()) {
      toast.error("Field pilihan/dropdown harus memiliki minimal satu opsi pilihan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const optionsArray =
        fieldType === FieldType.SELECT
          ? optionsStr
              .split(/[\n,]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;

      if (editingFieldId) {
        // Update existing field
        const res = await updateCustomField(editingFieldId, {
          label,
          fieldType,
          placeholder: placeholder.trim() || undefined,
          helpText: helpText.trim() || undefined,
          isRequired,
          options: optionsArray,
        });

        if (res.success && res.data) {
          setFields((prev) =>
            prev.map((f) => (f.id === editingFieldId ? (res.data as CustomFieldData) : f))
          );
          toast.success("Field berhasil diperbarui.");
          setIsDialogOpen(false);
        } else {
          toast.error(res.error || "Gagal memperbarui field.");
        }
      } else {
        // Create new field
        const res = await createCustomField(categoryId, {
          label,
          name: name.trim() || undefined,
          fieldType,
          placeholder: placeholder.trim() || undefined,
          helpText: helpText.trim() || undefined,
          isRequired,
          options: optionsArray,
        });

        if (res.success && res.data) {
          setFields((prev) => [...prev, res.data as CustomFieldData]);
          toast.success("Field kustom berhasil ditambahkan.");
          setIsDialogOpen(false);
        } else {
          toast.error(res.error || "Gagal menambahkan field.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus field input ini?")) return;

    try {
      const res = await deleteCustomField(id);
      if (res.success) {
        setFields((prev) => prev.filter((f) => f.id !== id));
        toast.success("Field berhasil dihapus.");
      } else {
        toast.error(res.error || "Gagal menghapus field.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus field.");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const newFields = [...fields];
    const [moved] = newFields.splice(index, 1);
    newFields.splice(targetIndex, 0, moved);

    // Update local orderIndex
    const updated = newFields.map((f, idx) => ({ ...f, orderIndex: idx + 1 }));
    setFields(updated);

    // Persist
    const orderedIds = updated.map((f) => f.id);
    const res = await reorderCustomFields(categoryId, orderedIds);
    if (!res.success) {
      toast.error("Gagal menyimpan urutan field.");
    }
  };

  const getFieldTypeBadge = (type: FieldType) => {
    switch (type) {
      case FieldType.TEXT:
        return (
          <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300">
            <Type className="h-3 w-3" /> Teks Pendek
          </Badge>
        );
      case FieldType.TEXTAREA:
        return (
          <Badge variant="outline" className="gap-1 border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300">
            <FileText className="h-3 w-3" /> Teks Panjang / Area
          </Badge>
        );
      case FieldType.NUMBER:
        return (
          <Badge variant="outline" className="gap-1 border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
            <Hash className="h-3 w-3" /> Angka
          </Badge>
        );
      case FieldType.SELECT:
        return (
          <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ListFilter className="h-3 w-3" /> Pilihan / Dropdown
          </Badge>
        );
      case FieldType.CHECKBOX:
        return (
          <Badge variant="outline" className="gap-1 border-teal-200 text-teal-700 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300">
            <CheckSquare className="h-3 w-3" /> Centang / Checkbox
          </Badge>
        );
      case FieldType.DATE:
        return (
          <Badge variant="outline" className="gap-1 border-rose-200 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300">
            <Calendar className="h-3 w-3" /> Tanggal
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Dynamic Form Builder
          </h2>
          <p className="text-sm text-muted-foreground">
            Konfigurasi field input dinamis untuk kategori:{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {categoryName}
            </span>
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Tambah Field Baru
        </Button>
      </div>

      {/* Tabs: Builder vs Live Preview */}
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="builder" className="gap-2">
            <Settings2 className="h-4 w-4" /> Desain Form ({fields.length})
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" /> Live Preview
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Builder */}
        <TabsContent value="builder" className="space-y-4 pt-2">
          {fields.length === 0 ? (
            <Card className="border-dashed border-2 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">
                Belum ada field formulir kustom
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Tambahkan field baru seperti nama kegiatan, kelas, atau deskripsi agar pengguna publik dapat mengisi informasi sebelum mengunggah berkas.
              </p>
              <Button onClick={handleOpenAdd} className="mt-6 gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" /> Tambah Field Sekarang
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-emerald-300 dark:hover:border-emerald-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: Reorder & Info */}
                  <div className="flex items-center gap-3">
                    {/* Move controls */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(index, "up")}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800"
                        title="Geser ke atas"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === fields.length - 1}
                        onClick={() => handleMoveOrder(index, "down")}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800"
                        title="Geser ke bawah"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {field.label}
                        </span>
                        {getFieldTypeBadge(field.fieldType)}
                        {field.isRequired ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Wajib
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Opsional
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Key: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 dark:bg-slate-800 dark:text-slate-300">{field.name}</code>
                        {field.placeholder && ` • Placeholder: "${field.placeholder}"`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(field)}
                      className="gap-1.5 text-xs"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                      Ubah
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Live Preview */}
        <TabsContent value="preview" className="pt-2">
          <Card className="max-w-xl mx-auto shadow-md border-emerald-100 dark:border-emerald-950">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 dark:from-emerald-950/30 dark:to-teal-950/20 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Pratinjau Formulir Publik
                </span>
              </div>
              <CardTitle className="text-lg">{categoryName}</CardTitle>
              <CardDescription>
                Tampilan persis yang akan dilihat oleh pengunjung saat memilih kategori ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <DynamicFormRenderer
                fields={fields}
                values={previewValues}
                onChange={(fieldName, val) =>
                  setPreviewValues((prev) => ({ ...prev, [fieldName]: val }))
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Add / Edit Field */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFieldId ? "Ubah Field Kustom" : "Tambah Field Baru"}
            </DialogTitle>
            <DialogDescription>
              Tentukan tipe input, label pertanyaan, dan aturan pengisian data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipe Field */}
            <div className="space-y-1.5">
              <Label htmlFor="field-type">Tipe Input</Label>
              <Select
                value={fieldType}
                onValueChange={(val) => setFieldType(val as FieldType)}
              >
                <SelectTrigger id="field-type">
                  <SelectValue placeholder="Pilih tipe input" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FieldType.TEXT}>Teks Pendek (TEXT)</SelectItem>
                  <SelectItem value={FieldType.TEXTAREA}>Teks Panjang / Deskripsi (TEXTAREA)</SelectItem>
                  <SelectItem value={FieldType.NUMBER}>Angka / Nominal (NUMBER)</SelectItem>
                  <SelectItem value={FieldType.SELECT}>Pilihan Dropdown (SELECT)</SelectItem>
                  <SelectItem value={FieldType.CHECKBOX}>Centang / Persetujuan (CHECKBOX)</SelectItem>
                  <SelectItem value={FieldType.DATE}>Tanggal (DATE)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Label Field */}
            <div className="space-y-1.5">
              <Label htmlFor="field-label">Label Pertanyaan / Field <span className="text-red-500">*</span></Label>
              <Input
                id="field-label"
                placeholder="Contoh: Nama Siswa, Mata Pelajaran, Tanggal Acara"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {/* Placeholder */}
            {fieldType !== FieldType.CHECKBOX && (
              <div className="space-y-1.5">
                <Label htmlFor="field-placeholder">Teks Petunjuk (Placeholder)</Label>
                <Input
                  id="field-placeholder"
                  placeholder="Contoh: Masukkan nama lengkap..."
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
              </div>
            )}

            {/* Options khusus SELECT */}
            {fieldType === FieldType.SELECT && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="field-options">Daftar Pilihan (1 opsi per baris)</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!label) setLabel("Pilihan Kelas");
                      setPlaceholder("Pilih kelas siswa");
                      setOptionsStr(
                        "Kelas 1 A\nKelas 1 B\nKelas 2 A\nKelas 2 B\nKelas 3 A\nKelas 3 B\nKelas 4 A\nKelas 4 B\nKelas 5 A\nKelas 5 B\nKelas 6 A\nKelas 6 B"
                      );
                      toast.success("Preset opsi Kelas 1 A - 6 B berhasil dimuat!");
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    + Gunakan Preset Kelas (1 A - 6 B)
                  </button>
                </div>
                <textarea
                  id="field-options"
                  rows={5}
                  className="w-full rounded-lg border border-input p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 font-mono text-xs"
                  placeholder={"Kelas 1 A\nKelas 1 B\nKelas 2 A\n...\nKelas 6 B"}
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                />
              </div>
            )}

            {/* Help Text */}
            <div className="space-y-1.5">
              <Label htmlFor="field-help">Petunjuk Tambahan (Opsional)</Label>
              <Input
                id="field-help"
                placeholder="Penjelasan singkat di bawah input"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
              />
            </div>

            {/* Wajib diisi / isRequired Switch */}
            <div className="flex items-center justify-between rounded-xl border border-border/80 p-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="space-y-0.5">
                <Label htmlFor="is-required" className="cursor-pointer">Wajib Diisi (Required)</Label>
                <p className="text-xs text-muted-foreground">
                  Pengguna tidak dapat mengunggah berkas tanpa mengisi field ini.
                </p>
              </div>
              <Switch
                id="is-required"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveField}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
