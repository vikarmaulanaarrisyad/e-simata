"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Search,
  ExternalLink,
  Trash2,
  Calendar,
  Eye,
  Filter,
  Image as ImageIcon,
  FileVideo,
  User,
  Phone,
  HardDrive,
  Clock,
  FolderArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate, formatBytes } from "@/lib/utils";
import { deleteSubmission } from "@/actions/submissions";
import { toast } from "sonner";

interface SubmissionItem {
  id: string;
  categoryId: string;
  submitterName: string | null;
  submitterContact: string | null;
  notes: string | null;
  answersJson: any;
  createdAt: string | Date;
  category: {
    id: string;
    name: string;
    color: string | null;
  };
  fieldValues: Array<{
    id: string;
    fieldId: string;
    fieldName: string | null;
    fieldLabel: string | null;
    value: string;
    field?: {
      label: string;
      fieldType: string;
    };
  }>;
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    mimeType: string | null;
    driveFileId: string;
    driveUrl: string;
    driveThumbnailUrl: string | null;
    driveFolderId?: string | null;
    createdAt: string | Date;
  }>;
}

export function SubmissionsExplorer({
  initialSubmissions,
  categories,
}: {
  initialSubmissions: SubmissionItem[];
  categories: Array<{ id: string; name: string }>;
}) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);

  // Filter logic
  const filteredSubmissions = submissions.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.submitterName?.toLowerCase().includes(q) ||
      item.submitterContact?.toLowerCase().includes(q) ||
      item.category.name.toLowerCase().includes(q) ||
      item.files.some((f) => f.fileName.toLowerCase().includes(q)) ||
      item.fieldValues.some((fv) => fv.value.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data submisi ini? Metadata dan riwayat file akan dihapus dari sistem.")) return;

    try {
      const res = await deleteSubmission(id);
      if (res.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        if (activeSubmission?.id === id) setActiveSubmission(null);
        toast.success("Submisi berhasil dihapus.");
      } else {
        toast.error(res.error || "Gagal menghapus submisi.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Submisi & Berkas Masuk
        </h1>
        <p className="text-sm text-muted-foreground">
          Telusuri pengiriman formulir publik dan akses berkas yang tersimpan di Google Drive.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Category filter */}
        <div className="w-full sm:w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori ({submissions.length})</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama pengirim, nomor kontak, isi formulir, atau nama file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-muted-foreground">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
            Tidak ada submisi ditemukan
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Coba ubah kata kunci pencarian atau pilih kategori lain.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => (
            <Card
              key={sub.id}
              className="rounded-2xl border-border/80 shadow-sm hover:shadow transition-all overflow-hidden"
            >
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Submitter & Category */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      {sub.category.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(sub.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-emerald-600" />
                      <span className="font-normal text-muted-foreground text-xs">Wali Kelas:</span> {sub.submitterName || "Belum Mengisi"}
                    </span>
                    {sub.submitterContact && (
                      <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {sub.submitterContact}
                      </span>
                    )}
                  </div>

                  {/* Summary of answers */}
                  {sub.fieldValues.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sub.fieldValues.slice(0, 3).map((fv) => (
                        <span
                          key={fv.id}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <span className="font-medium text-slate-500">
                            {fv.fieldLabel || fv.field?.label || fv.fieldName}:
                          </span>{" "}
                          <span className="font-semibold truncate max-w-[150px]">
                            {fv.value}
                          </span>
                        </span>
                      ))}
                      {sub.fieldValues.length > 3 && (
                        <span className="text-[11px] text-muted-foreground self-center">
                          +{sub.fieldValues.length - 3} data lainnya
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Files & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* File Badges */}
                  <div className="flex items-center gap-1.5">
                    {sub.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
                        title={file.fileName}
                      >
                        {file.fileType === "IMAGE" ? (
                          <ImageIcon className="h-3.5 w-3.5" />
                        ) : (
                          <FileVideo className="h-3.5 w-3.5" />
                        )}
                        <span className="truncate max-w-[120px]">{file.fileName}</span>
                        <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveSubmission(sub)}
                      className="gap-1.5 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-600" /> Detail
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sub.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Hapus submisi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Submission Detail Dialog */}
      <Dialog open={!!activeSubmission} onOpenChange={(open) => !open && setActiveSubmission(null)}>
        {activeSubmission && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default">{activeSubmission.category.name}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(activeSubmission.createdAt)}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold mt-1">
                Detail Submisi Berkas
              </DialogTitle>
              <DialogDescription>
                ID Submisi: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 dark:bg-slate-800 dark:text-slate-300">{activeSubmission.id}</code>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Submitter info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nama Wali Kelas / Guru:</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {activeSubmission.submitterName || "Belum Mengisi"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">No. WhatsApp Wali Kelas:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {activeSubmission.submitterContact || "-"}
                  </span>
                </div>
                {activeSubmission.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-border/60">
                    <span className="text-muted-foreground block">Catatan Tambahan:</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                      {activeSubmission.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Custom Fields Answers */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Data Isian Formulir Dinamis
                </h4>

                {activeSubmission.fieldValues.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Tidak ada isian custom field pada submisi ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeSubmission.fieldValues.map((fv) => (
                      <div
                        key={fv.id}
                        className="p-3 rounded-xl border border-border/70 bg-card space-y-1"
                      >
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          {fv.fieldLabel || fv.field?.label || fv.fieldName}
                        </span>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                          {fv.value === "true"
                            ? "✓ Ya / Disetujui"
                            : fv.value === "false"
                            ? "✗ Tidak"
                            : fv.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Uploaded Files Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Berkas Terunggah ke Google Drive ({activeSubmission.files.length})
                  </h4>

                  {activeSubmission.files[0]?.driveFolderId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${activeSubmission.files[0].driveFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start sm:self-auto"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 rounded-xl h-8"
                      >
                        <FolderArchive className="h-3.5 w-3.5 text-emerald-600" />
                        Buka Folder Submisi di Drive
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Button>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeSubmission.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl border border-border/80 bg-card flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                          {file.fileType === "IMAGE" ? (
                            <ImageIcon className="h-5 w-5" />
                          ) : (
                            <FileVideo className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                            {file.fileName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatBytes(file.fileSize)} • {file.fileType}
                          </p>
                        </div>
                      </div>

                      <a
                        href={file.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <HardDrive className="h-3.5 w-3.5 text-emerald-600" /> Buka di Google Drive
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
