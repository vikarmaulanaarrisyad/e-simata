"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
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
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Sparkles,
  School,
  CheckCircle2,
  Layers,
  FileText,
  Pencil,
  Upload,
  RefreshCw,
  Plus,
  Loader2,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  getSubmissionsServerSide,
  deleteSubmission,
  deleteSubmissionFile,
  updateSubmission,
} from "@/actions/submissions";
import {
  showSwalConfirm,
  showSwalSuccess,
  showSwalSuccessAlert,
  showSwalError,
  showSwalLoading,
  closeSwal,
} from "@/lib/swal";
import { toast } from "sonner";

interface SubmissionItem {
  id: string;
  categoryId: string;
  madrasah?: string | null;
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
  const [totalCount, setTotalCount] = useState<number>(initialSubmissions.length);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  // Server-Side Query Params
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMadrasah, setSelectedMadrasah] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Active detail modal
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);

  // Edit submission state
  const [editingSubmission, setEditingSubmission] = useState<SubmissionItem | null>(null);
  const [editSubmitterName, setEditSubmitterName] = useState("");
  const [editSubmitterContact, setEditSubmitterContact] = useState("");
  const [editMadrasah, setEditMadrasah] = useState("");
  const [editKelas, setEditKelas] = useState("");
  const [editActivityDate, setEditActivityDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFiles, setEditFiles] = useState<SubmissionItem["files"]>([]);
  const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data server-side
  const loadData = useCallback(async () => {
    startTransition(async () => {
      const res = await getSubmissionsServerSide({
        page,
        pageSize,
        search: debouncedSearch,
        categoryId: selectedCategory,
        madrasah: selectedMadrasah,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setSubmissions(res.data as any);
        setTotalCount(res.pagination?.total ?? 0);
        setTotalPages(res.pagination?.totalPages ?? 1);
      }
    });
  }, [page, pageSize, debouncedSearch, selectedCategory, selectedMadrasah, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedMadrasah("all");
    setStartDate("");
    setEndDate("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
    toast.info("Filter berhasil direset ke tampilan default.");
  };

  // Delete submission handler with SweetAlert loading, success, & confirmation
  const handleDelete = async (id: string) => {
    const confirmed = await showSwalConfirm(
      "Hapus Submisi & Berkas Drive?",
      `Apakah Anda yakin ingin menghapus submisi ini?<br><br><span class="text-xs text-rose-600 dark:text-rose-400 font-bold">⚠️ Semua file berkas lampiran yang tersimpan di Google Drive juga akan dihapus secara permanen.</span>`,
      "Ya, Hapus Permanen",
      true
    );

    if (!confirmed) return;

    showSwalLoading({
      title: "Menghapus Data & Berkas...",
      stepText: "Sedang menghapus berkas dari Google Drive dan membersihkan data...",
      progressPercent: 50,
    });

    try {
      const res = await deleteSubmission(id);
      closeSwal();

      if (res.success) {
        showSwalSuccessAlert(
          "Alhamdulillah! Berhasil Dihapus",
          "Data submisi beserta seluruh berkas terkait di Google Drive telah berhasil dihapus secara bersih."
        );
        if (activeSubmission?.id === id) setActiveSubmission(null);
        if (editingSubmission?.id === id) setEditingSubmission(null);
        loadData();
      } else {
        showSwalError("Gagal Menghapus Submisi", res.error || "Terjadi kesalahan saat menghapus submisi.");
      }
    } catch (err: any) {
      closeSwal();
      showSwalError("Terjadi Kesalahan", err.message || "Gagal menghapus submisi.");
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: SubmissionItem) => {
    setEditingSubmission(item);
    setEditSubmitterName(item.submitterName || "");
    setEditSubmitterContact(item.submitterContact || "");
    setEditMadrasah(item.madrasah || "MI Bustanul Huda 01 Dawuhan");
    const kelasVal =
      item.answersJson?.kelas ||
      item.answersJson?.rombel ||
      item.fieldValues.find(
        (fv) =>
          fv.fieldLabel?.toLowerCase().includes("kelas") ||
          fv.fieldName?.toLowerCase().includes("kelas")
      )?.value ||
      "";
    setEditKelas(kelasVal);
    setEditActivityDate(item.answersJson?.activityDate || "");
    setEditNotes(item.notes || "");
    setEditFiles(item.files || []);
  };

  // Save Edit Metadata
  const handleSaveEditMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;

    setIsUpdatingMetadata(true);
    showSwalLoading({
      title: "Menyimpan Perubahan...",
      stepText: "Sedang memperbarui informasi data submisi...",
      progressPercent: 60,
    });

    try {
      const res = await updateSubmission(editingSubmission.id, {
        submitterName: editSubmitterName.trim(),
        submitterContact: editSubmitterContact.trim(),
        madrasah: editMadrasah.trim(),
        kelas: editKelas.trim(),
        activityDate: editActivityDate.trim(),
        notes: editNotes.trim(),
      });

      closeSwal();
      setIsUpdatingMetadata(false);

      if (res.success && res.data) {
        showSwalSuccessAlert(
          "Alhamdulillah! Berhasil Diperbarui",
          "Perubahan informasi submisi berhasil disimpan."
        );
        setEditingSubmission(null);
        loadData();
      } else {
        showSwalError("Gagal Menyimpan", res.error || "Terjadi kesalahan saat memperbarui submisi.");
      }
    } catch (err: any) {
      closeSwal();
      setIsUpdatingMetadata(false);
      showSwalError("Terjadi Kesalahan", err.message || "Gagal memperbarui submisi.");
    }
  };

  // Replace Single File in Google Drive
  const handleReplaceFile = async (fileId: string, newFile: File) => {
    if (!editingSubmission) return;

    const confirmed = await showSwalConfirm(
      "Ganti Berkas di Google Drive?",
      `Anda akan mengganti berkas dengan <b>${newFile.name}</b> (${formatBytes(newFile.size)}).<br><br><span class="text-xs text-amber-600 dark:text-amber-400 font-bold">⚠️ Berkas lama di Google Drive akan otomatis dihapus dan diganti berkas baru.</span>`,
      "Ya, Ganti Berkas"
    );

    if (!confirmed) return;

    showSwalLoading({
      title: "Mengganti Berkas...",
      stepText: "Menghapus berkas lama dari Google Drive & mengunggah berkas baru...",
      progressPercent: 50,
    });

    try {
      const formData = new FormData();
      formData.append("fileId", fileId);
      formData.append("file", newFile);

      const res = await fetch("/api/submissions/replace-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      closeSwal();

      if (res.ok && data.success && data.file) {
        showSwalSuccessAlert(
          "Berkas Berhasil Diganti!",
          "Berkas lama di Google Drive telah dihapus dan digantikan dengan berkas baru."
        );
        setEditFiles((prev) => prev.map((f) => (f.id === fileId ? data.file : f)));
        loadData();
      } else {
        showSwalError("Gagal Mengganti Berkas", data.error || "Terjadi kesalahan saat mengganti berkas.");
      }
    } catch (err: any) {
      closeSwal();
      showSwalError("Terjadi Kesalahan", err.message || "Gagal menghubungi server.");
    }
  };

  // Delete Single File from Google Drive & database
  const handleDeleteSingleFile = async (fileId: string, fileName: string) => {
    if (!editingSubmission) return;

    const confirmed = await showSwalConfirm(
      "Hapus Berkas dari Google Drive?",
      `Apakah Anda yakin ingin menghapus berkas <b>${fileName}</b>?<br><br><span class="text-xs text-rose-600 dark:text-rose-400 font-bold">⚠️ Berkas akan langsung dihapus permanen dari Google Drive madrasah.</span>`,
      "Ya, Hapus Berkas",
      true
    );

    if (!confirmed) return;

    showSwalLoading({
      title: "Menghapus Berkas...",
      stepText: "Sedang menghapus berkas dari Google Drive...",
      progressPercent: 60,
    });

    try {
      const res = await deleteSubmissionFile(fileId);
      closeSwal();

      if (res.success) {
        showSwalSuccessAlert(
          "Berkas Dihapus!",
          `Berkas "${fileName}" berhasil dihapus dari Google Drive dan arsip database.`
        );
        setEditFiles((prev) => prev.filter((f) => f.id !== fileId));
        loadData();
      } else {
        showSwalError("Gagal Menghapus Berkas", res.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      closeSwal();
      showSwalError("Terjadi Kesalahan", err.message || "Gagal menghapus berkas.");
    }
  };

  // Add new file to existing submission
  const handleAddNewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingSubmission) return;

    const file = files[0];
    showSwalLoading({
      title: "Mengunggah Berkas Baru...",
      stepText: `Mengunggah "${file.name}" ke Google Drive...`,
      progressPercent: 50,
    });

    try {
      const formData = new FormData();
      formData.append("submissionId", editingSubmission.id);
      formData.append("file", file);

      const res = await fetch("/api/submissions/add-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      closeSwal();

      if (res.ok && data.success && data.file) {
        showSwalSuccessAlert(
          "Berkas Berhasil Ditambahkan!",
          "Berkas baru telah tersimpan rapi di Google Drive madrasah."
        );
        setEditFiles((prev) => [...prev, data.file]);
        loadData();
      } else {
        showSwalError("Gagal Mengunggah Berkas", data.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      closeSwal();
      showSwalError("Terjadi Kesalahan", err.message || "Gagal mengunggah berkas.");
    } finally {
      e.target.value = "";
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "No",
      "ID Submisi",
      "Tanggal Submisi",
      "Tanggal Kegiatan",
      "Kategori",
      "Satuan Pendidikan / Madrasah",
      "Rombel / Kelas",
      "Nama Wali Kelas",
      "No WhatsApp",
      "Jumlah Berkas",
      "Catatan",
    ];

    const rows = submissions.map((item, idx) => {
      const d = new Date(item.createdAt);
      const dateFormatted = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeFormatted = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Extract class
      const kelasVal =
        item.answersJson?.kelas ||
        item.answersJson?.rombel ||
        item.fieldValues.find((fv) =>
          fv.fieldLabel?.toLowerCase().includes("kelas") || fv.fieldName?.toLowerCase().includes("kelas")
        )?.value ||
        "-";

      const activityDate = item.answersJson?.activityDate || dateFormatted;

      return [
        (page - 1) * pageSize + idx + 1,
        `"${item.id}"`,
        `"${dateFormatted} ${timeFormatted}"`,
        `"${activityDate}"`,
        `"${item.category.name}"`,
        `"${item.madrasah || "MI Bustanul Huda"}"`,
        `"${kelasVal}"`,
        `"${item.submitterName || "-"}"`,
        `"${item.submitterContact || "-"}"`,
        item.files.length,
        `"${(item.notes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SIMATA_Submisi_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Data submisi berhasil diekspor ke file CSV!");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white shadow-xl shadow-emerald-950/10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold">
            <Layers className="h-3.5 w-3.5 text-emerald-300" />
            <span>Server-Side Submissions Explorer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Daftar Submisi & Berkas Masuk
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            Semua data terkoneksi langsung ke database PostgreSQL Supabase dan Google Drive madrasah dengan pencarian & paginasi server-side berkinerja tinggi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/admin/reports">
            <Button
              variant="outline"
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold backdrop-blur-md cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Cetak Laporan F4
            </Button>
          </Link>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold backdrop-blur-md cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={() => loadData()}
            className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama guru, kelas, no WA, madrasah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-xs bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl font-medium focus-visible:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category filter */}
            <div>
              <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setPage(1); }}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 font-medium">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Madrasah filter */}
            <div>
              <Select value={selectedMadrasah} onValueChange={(val) => { setSelectedMadrasah(val); setPage(1); }}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 font-medium">
                  <SelectValue placeholder="Semua Madrasah" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Semua Madrasah</SelectItem>
                  <SelectItem value="MI Bustanul Huda 01 Dawuhan">MI Bustanul Huda 01</SelectItem>
                  <SelectItem value="MI Bustanul Huda 02 Dawuhan">MI Bustanul Huda 02</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filter Button */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full h-10 gap-1.5 text-xs font-bold rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
              </Button>
            </div>
          </div>

          {/* Quick Filter Info & Counter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Total Ditemukan:</span>
              <strong className="text-slate-900 dark:text-white font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {totalCount} Submisi
              </strong>
              {isPending && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold animate-pulse text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Memuat data dari server...
                </span>
              )}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span>Tampilkan per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Server-Side DataTable Card */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-extrabold select-none">
                <th className="py-4 px-4 w-12 text-center">No</th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="py-4 px-4 cursor-pointer hover:text-emerald-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Waktu & Tanggal</span>
                    {sortBy === "createdAt" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-emerald-600" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="py-4 px-4 cursor-pointer hover:text-emerald-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Kategori Berkas</span>
                    {sortBy === "category" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-emerald-600" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("madrasah")}
                  className="py-4 px-4 cursor-pointer hover:text-emerald-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Madrasah & Rombel</span>
                    {sortBy === "madrasah" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-emerald-600" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("submitterName")}
                  className="py-4 px-4 cursor-pointer hover:text-emerald-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Wali Kelas</span>
                    {sortBy === "submitterName" ? (
                      sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-emerald-600" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="py-4 px-4 text-center">Berkas</th>
                <th className="py-4 px-4">Catatan Guru</th>
                <th className="py-4 px-4 text-center w-32">Aksi</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderArchive className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                        Tidak ada data submisi yang sesuai.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coba ubah kata kunci pencarian atau sesuaikan filter kategori di atas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((item, index) => {
                  const d = new Date(item.createdAt);
                  const dateStr = d.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = d.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  // Extract class and activity date
                  const kelas =
                    item.answersJson?.kelas ||
                    item.answersJson?.rombel ||
                    item.fieldValues.find((fv) =>
                      fv.fieldLabel?.toLowerCase().includes("kelas") || fv.fieldName?.toLowerCase().includes("kelas")
                    )?.value ||
                    "-";

                  const activityDate = item.answersJson?.activityDate;

                  // Drive folder link
                  const driveFolderUrl = item.files[0]?.driveFolderId
                    ? `https://drive.google.com/drive/folders/${item.files[0].driveFolderId}`
                    : null;

                  const isMI01 = item.madrasah?.includes("01");

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* 1. Row Index */}
                      <td className="py-3.5 px-4 text-center font-mono text-muted-foreground font-semibold">
                        {(page - 1) * pageSize + index + 1}
                      </td>

                      {/* 2. Tanggal & Waktu */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{timeStr} WIB</span>
                          {activityDate && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                              (Kegiatan: {activityDate})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Kategori */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="font-extrabold text-xs border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40"
                        >
                          {item.category.name}
                        </Badge>
                      </td>

                      {/* 4. Madrasah & Rombel */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isMI01
                                ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200"
                                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200"
                            }`}
                          >
                            {isMI01 ? "MI 01" : "MI 02"}
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                            {kelas}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                          {item.madrasah || "MI Bustanul Huda"}
                        </p>
                      </td>

                      {/* 5. Wali Kelas */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-extrabold text-xs shrink-0">
                            {item.submitterName?.charAt(0).toUpperCase() || "G"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                              {item.submitterName || "Wali Kelas"}
                            </p>
                            {item.submitterContact && (
                              <p className="text-[10px] text-muted-foreground truncate font-mono">
                                {item.submitterContact}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 6. Berkas */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs">
                          <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{item.files.length} File</span>
                        </span>
                      </td>

                      {/* 7. Catatan Guru */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate" title={item.notes || "-"}>
                          {item.notes || "-"}
                        </p>
                      </td>

                      {/* 8. Aksi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActiveSubmission(item)}
                            title="Lihat Detail Lengkap"
                            className="h-8 w-8 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {driveFolderUrl && (
                            <a
                              href={driveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Buka Folder di Google Drive"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg cursor-pointer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit & Kelola Berkas Google Drive"
                            className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Submisi"
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/50 select-none">
          <div className="text-muted-foreground font-medium">
            Menampilkan{" "}
            <strong>
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(page * pageSize, totalCount)}
            </strong>{" "}
            dari <strong>{totalCount}</strong> submisi
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(1)}
              disabled={page <= 1 || isPending}
              className="h-8 w-8 rounded-lg"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Prev Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isPending}
              className="h-8 px-2.5 rounded-lg gap-1 text-xs font-bold"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>

            {/* Page indicator pill */}
            <span className="px-3 py-1 font-bold rounded-lg bg-emerald-600 text-white text-xs">
              {page} / {totalPages || 1}
            </span>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isPending}
              className="h-8 px-2.5 rounded-lg gap-1 text-xs font-bold"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || isPending}
              className="h-8 w-8 rounded-lg"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Detail Submisi Lengkap */}
      {activeSubmission && (
        <Dialog open={Boolean(activeSubmission)} onOpenChange={() => setActiveSubmission(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
            <DialogHeader className="border-b border-border/80 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-emerald-600 text-white text-xs font-extrabold uppercase">
                  {activeSubmission.category.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {activeSubmission.madrasah || "MI Bustanul Huda"}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-black">
                Detail Submisi Berkas & Isian
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Terkirim pada {formatDate(activeSubmission.createdAt)} oleh{" "}
                <strong>{activeSubmission.submitterName || "Wali Kelas"}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-xs">
              {/* Wali Kelas & Info Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 space-y-2">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600" /> Informasi Pengirim
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nama Wali Kelas:</span>
                    <strong className="font-bold text-slate-900 dark:text-white">
                      {activeSubmission.submitterName || "-"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">WhatsApp:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {activeSubmission.submitterContact || "-"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Isian Dynamic Custom Fields */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" /> Data Formulir & Catatan AI
                </h4>

                {activeSubmission.fieldValues && activeSubmission.fieldValues.length > 0 ? (
                  <div className="space-y-2">
                    {activeSubmission.fieldValues.map((fv) => (
                      <div
                        key={fv.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60"
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                          {fv.fieldLabel || fv.fieldName}
                        </span>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                          {fv.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Tidak ada custom field tambahan.</p>
                )}

                {activeSubmission.notes && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-[11px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300 block">
                      Catatan Tambahan untuk Arsip Madrasah:
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                      {activeSubmission.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Berkas Terunggah */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-600" /> Berkas di Google Drive ({activeSubmission.files.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeSubmission.files.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl border border-border/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">
                          {f.fileName}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {formatBytes(f.fileSize)} • {f.fileType}
                        </p>
                      </div>

                      <a
                        href={f.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          Buka <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer action */}
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const toEdit = activeSubmission;
                    setActiveSubmission(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="rounded-xl text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 gap-1.5 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit & Kelola Berkas
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setActiveSubmission(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Edit Submisi & Kelola Berkas Google Drive */}
      {editingSubmission && (
        <Dialog open={Boolean(editingSubmission)} onOpenChange={() => setEditingSubmission(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
            <DialogHeader className="border-b border-border/80 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-blue-600 text-white text-xs font-extrabold uppercase">
                  Edit Submisi
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {editingSubmission.category.name}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-black">
                Perbarui Data & Kelola Berkas Drive
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Perubahan pada berkas akan langsung tersinkronisasi dengan Google Drive madrasah.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEditMetadata} className="space-y-6 pt-4 text-xs">
              {/* Form Metadata */}
              <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" /> Informasi Submisi & Wali Kelas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Satuan Pendidikan (Madrasah)</Label>
                    <Select value={editMadrasah} onValueChange={setEditMadrasah}>
                      <SelectTrigger className="rounded-xl text-xs bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Pilih Madrasah" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MI Bustanul Huda 01 Dawuhan">MI Bustanul Huda 01 Dawuhan</SelectItem>
                        <SelectItem value="MI Bustanul Huda 02 Dawuhan">MI Bustanul Huda 02 Dawuhan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Rombel / Kelas</Label>
                    <Input
                      value={editKelas}
                      onChange={(e) => setEditKelas(e.target.value)}
                      placeholder="Contoh: Kelas 1 A"
                      className="rounded-xl text-xs bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nama Wali Kelas</Label>
                    <Input
                      value={editSubmitterName}
                      onChange={(e) => setEditSubmitterName(e.target.value)}
                      placeholder="Nama Wali Kelas"
                      className="rounded-xl text-xs bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">No. WhatsApp</Label>
                    <Input
                      value={editSubmitterContact}
                      onChange={(e) => setEditSubmitterContact(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="rounded-xl text-xs bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Tanggal Kegiatan</Label>
                    <Input
                      type="date"
                      value={editActivityDate}
                      onChange={(e) => setEditActivityDate(e.target.value)}
                      className="rounded-xl text-xs bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold">Catatan Submisi</Label>
                    <Textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Tuliskan catatan tambahan..."
                      className="rounded-xl text-xs bg-white dark:bg-slate-900 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={isUpdatingMetadata}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-4 py-2 cursor-pointer"
                  >
                    {isUpdatingMetadata ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      "Simpan Informasi Submisi"
                    )}
                  </Button>
                </div>
              </div>

              {/* Kelola Berkas Google Drive */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-emerald-600" /> Berkas Google Drive ({editFiles.length})
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Mengganti berkas akan otomatis menghapus file lama di Drive dan menggantinya dengan yang baru.
                    </p>
                  </div>

                  {/* Tambah Berkas Baru Button */}
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleAddNewFile}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95">
                      <Plus className="h-3.5 w-3.5" /> Tambah Berkas
                    </span>
                  </label>
                </div>

                {editFiles.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-muted-foreground">Belum ada berkas lampiran.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {editFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                            {file.fileType === "VIDEO" ? (
                              <FileVideo className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-emerald-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[280px]" title={file.fileName}>
                              {file.fileName}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {formatBytes(file.fileSize)} • {file.fileType}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {/* Buka di Drive */}
                          <a
                            href={file.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-bold border-slate-200 dark:border-slate-800 hover:text-emerald-600 cursor-pointer"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Drive
                            </Button>
                          </a>

                          {/* Ganti Berkas File Picker */}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const selected = e.target.files?.[0];
                                if (selected) {
                                  handleReplaceFile(file.id, selected);
                                }
                                e.target.value = "";
                              }}
                            />
                            <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer">
                              <RefreshCw className="h-3.5 w-3.5" /> Ganti Berkas
                            </span>
                          </label>

                          {/* Hapus Berkas Single */}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSingleFile(file.id, file.fileName)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-0 cursor-pointer"
                            title="Hapus berkas dari Google Drive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer action */}
              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSubmission(null)}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Selesai / Tutup
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

