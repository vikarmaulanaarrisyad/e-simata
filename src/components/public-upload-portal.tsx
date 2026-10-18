"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle2,
  FolderArchive,
  Camera,
  GraduationCap,
  Award,
  ShieldCheck,
  Send,
  User,
  Phone,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  HardDrive,
  Layers,
  Calendar,
  School,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DynamicFormRenderer, CustomFieldData } from "@/components/dynamic-form-renderer";
import { FileUploadZone, SelectedFileItem } from "@/components/file-upload-zone";
import { formatBytes } from "@/lib/utils";
import { toast } from "sonner";
import { generatePedagogicalNote } from "@/lib/ai-generator";
import { checkDuplicateSubmission } from "@/actions/submissions";
import { HeaderInstallButton } from "@/components/pwa-installer";
import {
  showSwalSuccess,
  showSwalWarning,
  showSwalError,
  showSwalLoading,
  updateSwalLoading,
  closeSwal,
  showSwalConfirm,
} from "@/lib/swal";

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export interface MadrasahItem {
  id: string;
  name: string;
  code: string | null;
  description?: string | null;
  isActive: boolean;
  orderIndex?: number;
}

interface CategoryWithFields {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  maxFileSizeMb: number;
  allowedFileTypes: string | null;
  orderIndex?: number;
  fields: CustomFieldData[];
}

function getCategoryDayInfo(cat: CategoryWithFields) {
  const name = cat.name.toLowerCase();
  if (name.includes("senin") || name.includes("jurnal")) {
    return {
      dayName: "Senin",
      dayIndex: 1,
      badgeLabel: "📅 Setiap Senin",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300",
    };
  }
  if (name.includes("selasa") || name.includes("pojok")) {
    return {
      dayName: "Selasa",
      dayIndex: 2,
      badgeLabel: "📅 Setiap Selasa",
      badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300",
    };
  }
  if (name.includes("toples") || name.includes("rabu")) {
    return {
      dayName: "Rabu",
      dayIndex: 3,
      badgeLabel: "📅 Setiap Rabu",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300",
    };
  }
  if (name.includes("terima kasih") || name.includes("kamis") || name.includes("teman")) {
    return {
      dayName: "Kamis",
      dayIndex: 4,
      badgeLabel: "📅 Setiap Kamis",
      badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300",
    };
  }
  return {
    dayName: "Setiap Hari",
    dayIndex: -1,
    badgeLabel: "📅 Program Bebas",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
  };
}

export function PublicUploadPortal({
  categories,
  madrasahs = [],
}: {
  categories: CategoryWithFields[];
  madrasahs?: MadrasahItem[];
}) {
  const defaultMadrasahs: MadrasahItem[] = [
    { id: "mi01", name: "MI Bustanul Huda 01", code: "MI 01", isActive: true },
    { id: "mi02", name: "MI Bustanul Huda 02", code: "MI 02", isActive: true },
  ];

  const availableMadrasahs = madrasahs && madrasahs.length > 0 ? madrasahs : defaultMadrasahs;
  const [selectedMadrasah, setSelectedMadrasah] = useState<string>(
    availableMadrasahs[0]?.name || "MI Bustanul Huda 01"
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ""
  );

  // Auto-day detection state
  const [todayDayIndex, setTodayDayIndex] = useState<number | null>(null);
  const [todayDateFormatted, setTodayDateFormatted] = useState<string>("");
  const [todaySimpleDate, setTodaySimpleDate] = useState<string>("");
  const [showAllDays, setShowAllDays] = useState(false);

  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    setTodayDayIndex(day);
    setTodayDateFormatted(
      now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
    setTodaySimpleDate(
      now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  // Category matching today's schedule (1=Senin, 2=Selasa, 3=Rabu, 4=Kamis)
  const todayCategory = categories.find((c) => {
    if (todayDayIndex === null) return false;
    const info = getCategoryDayInfo(c);
    return info.dayIndex === todayDayIndex;
  });

  // Automatically select today's category on load or when locking back to today
  useEffect(() => {
    if (todayCategory && !showAllDays) {
      setSelectedCategoryId(todayCategory.id);
    }
  }, [todayCategory, showAllDays]);

  // Categories displayed in the UI:
  // If showAllDays is false AND today's category exists: show ONLY today's category!
  // Otherwise show all categories (e.g. for late submissions or weekends).
  const displayedCategories =
    !showAllDays && todayCategory ? [todayCategory] : categories;

  // Common submitter fields
  const [submitterName, setSubmitterName] = useState("");
  const [submitterContact, setSubmitterContact] = useState("");
  const [activityDate, setActivityDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [notes, setNotes] = useState("");
  const [notesSeed, setNotesSeed] = useState(0);

  // Dynamic field responses
  const [fieldAnswers, setFieldAnswers] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Files separated into Photos and Videos
  const [photoFiles, setPhotoFiles] = useState<SelectedFileItem[]>([]);
  const [videoFiles, setVideoFiles] = useState<SelectedFileItem[]>([]);
  const selectedFiles = [...photoFiles, ...videoFiles];

  // Submission state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId: string;
    categoryName: string;
    submissionFolderName?: string;
    submissionFolderUrl?: string;
    files: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      fileType: string;
      driveUrl: string;
      driveThumbnailUrl?: string | null;
      isMock?: boolean;
    }>;
  } | null>(null);

  // Duplicate submission state
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    existingSubmission?: {
      id: string;
      submitterName: string;
      submitterContact?: string | null;
      madrasah: string;
      categoryName: string;
      kelas: string;
      filesCount: number;
      timeFormatted: string;
      dateFormatted: string;
    };
  } | null>(null);
  const [allowSupplementary, setAllowSupplementary] = useState(false);
  const [replacePrevious, setReplacePrevious] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Cek duplikasi data pengisian otomatis setiap kali rombel kelas atau madrasah berubah
  useEffect(() => {
    const currentClass =
      fieldAnswers.kelas ||
      Object.entries(fieldAnswers).find(([k]) =>
        k.toLowerCase().includes("kelas")
      )?.[1];

    if (
      !selectedCategory ||
      !currentClass ||
      typeof currentClass !== "string" ||
      !currentClass.trim()
    ) {
      setDuplicateInfo(null);
      setAllowSupplementary(false);
      return;
    }

    let active = true;
    setIsCheckingDuplicate(true);

    checkDuplicateSubmission({
      categoryId: selectedCategory.id,
      madrasah: selectedMadrasah,
      kelas: currentClass.trim(),
    })
      .then((res) => {
        if (!active) return;
        setIsCheckingDuplicate(false);
        if (res.success && res.isDuplicate && res.existingSubmission) {
          setDuplicateInfo({
            isDuplicate: true,
            existingSubmission: res.existingSubmission as any,
          });
        } else {
          setDuplicateInfo({ isDuplicate: false });
          setAllowSupplementary(false);
        }
      })
      .catch(() => {
        if (active) setIsCheckingDuplicate(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCategory, selectedMadrasah, fieldAnswers]);

  const getCategoryIcon = (iconName: string | null) => {
    switch (iconName) {
      case "Camera":
        return <Camera className="h-5 w-5" />;
      case "GraduationCap":
        return <GraduationCap className="h-5 w-5" />;
      case "Award":
        return <Award className="h-5 w-5" />;
      case "Sparkles":
        return <Sparkles className="h-5 w-5" />;
      default:
        return <FolderArchive className="h-5 w-5" />;
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFieldAnswers((prev) => {
      const next = { ...prev, [name]: value };

      // Jika Wali Kelas memilih kelas dan kolom catatan pelaksanaan masih kosong, otomatis dibuatkan oleh AI
      if (name === "kelas" && value && selectedCategory) {
        const noteField = selectedCategory.fields.find(
          (f) =>
            f.fieldType === "TEXTAREA" &&
            (f.name.includes("catatan") || f.label.toLowerCase().includes("catatan"))
        );

        if (noteField && (!prev[noteField.name] || prev[noteField.name].trim() === "")) {
          const autoNote = generatePedagogicalNote({
            categoryName: selectedCategory.name,
            fieldLabel: noteField.label,
            fieldName: noteField.name,
            kelas: value,
            waliKelas: submitterName,
          });
          next[noteField.name] = autoNote;
          toast.success("Catatan pelaksanaan dibuat otomatis oleh AI! ✨", {
            description: `Disesuaikan untuk ${value}. Anda dapat membaca atau mengeditnya di formulir bawah.`,
          });
        }
      }

      return next;
    });

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      showSwalWarning(
        "Kategori Belum Dipilih",
        "Silakan tentukan salah satu Kategori Berkas terlebih dahulu."
      );
      return;
    }

    // 0. Validasi identitas Wali Kelas dengan SweetAlert Warning
    if (!submitterName.trim()) {
      showSwalWarning(
        "Identitas Belum Lengkap",
        "Mohon cantumkan Nama Lengkap Bapak/Ibu Wali Kelas agar arsip Google Drive dinamai dengan tertib."
      );
      return;
    }

    // 1. Validasi field dinamis yang berstatus required
    const errors: Record<string, string> = {};
    const missingLabels: string[] = [];

    for (const field of selectedCategory.fields) {
      if (field.isRequired) {
        const val = fieldAnswers[field.name];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          errors[field.name] = `"${field.label}" wajib diisi.`;
          missingLabels.push(field.label);
        }
      }
    }

    if (missingLabels.length > 0) {
      setFieldErrors(errors);
      showSwalWarning(
        "Formulir Belum Lengkap",
        `Mohon lengkapi isian berikut sebelum mengirim:<br><br><b>• ${missingLabels.join("<br>• ")}</b>`
      );
      return;
    }

    // 1b. Pengecekan Data Ganda (Cegah pengiriman berulang pada hari/tanggal yang sama)
    if (duplicateInfo?.isDuplicate && !allowSupplementary && !replacePrevious && duplicateInfo.existingSubmission) {
      const ex = duplicateInfo.existingSubmission;
      showSwalWarning(
        "Pengisian Sudah Selesai Hari Ini",
        `Rombel <b>${ex.kelas}</b> di <b>${ex.madrasah}</b> sudah terekam mengisi <b>${ex.categoryName}</b> hari ini pukul <b>${ex.timeFormatted}</b> oleh <b>${ex.submitterName}</b>.<br><br>Untuk menjaga kerapian Google Drive dan mencegah data ganda, pengiriman ditahan.<br><br><i>Silakan pilih opsi <b>"Perbarui & Ganti berkas sebelumnya"</b> (file lama di Google Drive akan dihapus dan diganti yang baru) atau <b>"Kirim sebagai berkas susulan"</b> pada kotak kuning di formulir.</i>`
      );
      return;
    }

    // 2. Validasi file dengan SweetAlert Warning
    if (selectedFiles.length === 0) {
      showSwalWarning(
        "Berkas Belum Dipilih",
        "Harap pilih atau tarik minimal 1 berkas foto/video dokumentasi kegiatan sebelum mengunggah."
      );
      return;
    }

    // 3. Prepare FormData
    const formData = new FormData();
    formData.append("categoryId", selectedCategory.id);
    formData.append("madrasah", selectedMadrasah);
    formData.append("activityDate", activityDate);
    if (submitterName.trim()) formData.append("submitterName", submitterName.trim());
    if (submitterContact.trim()) formData.append("submitterContact", submitterContact.trim());
    if (notes.trim()) formData.append("notes", notes.trim());
    formData.append("fieldsData", JSON.stringify(fieldAnswers));
    if (allowSupplementary) formData.append("allowSupplementary", "true");
    if (replacePrevious && duplicateInfo?.existingSubmission) {
      formData.append("replaceSubmissionId", duplicateInfo.existingSubmission.id);
    }

    for (const item of selectedFiles) {
      formData.append("files", item.file);
    }

    // 4. Start SweetAlert Loading & State
    setIsUploading(true);
    setUploadProgress(15);

    showSwalLoading({
      title: "Mengunggah Berkas ke Google Drive...",
      stepText: "1/3 Menyiapkan berkas dan mengamankan koneksi cloud...",
      progressPercent: 25,
    });

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) return prev;
        const next = prev + 15;
        if (next >= 45 && next < 75) {
          updateSwalLoading("2/3 Membuat struktur subfolder per rombel kelas...", next);
        } else if (next >= 75) {
          updateSwalLoading("3/3 Menyimpan dan mengamankan arsip madrasah...", next);
        }
        return next;
      });
    }, 400);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      clearInterval(progressTimer);

      if (response.ok && result.success) {
        setUploadProgress(100);
        updateSwalLoading("Unggahan selesai! Menyiapkan tanda terima...", 100);

        setTimeout(() => {
          setIsUploading(false);
          setSubmissionResult(result);
          closeSwal();

          const breakdown = [];
          if (photoFiles.length > 0) breakdown.push(`${photoFiles.length} foto`);
          if (videoFiles.length > 0) breakdown.push(`${videoFiles.length} video`);
          const countDetail = breakdown.length > 0 ? ` (${breakdown.join(" & ")})` : "";

          // Tampilkan SweetAlert Success yang mewah
          showSwalSuccess({
            title: "Alhamdulillah! Berkas Berhasil Terkirim",
            message: `Dokumentasi ${selectedMadrasah} telah tersusun rapi di Google Drive untuk ${
              fieldAnswers.kelas || "rombel kelas"
            }.${countDetail}`,
            folderName: result.submissionFolderName,
            folderUrl: result.submissionFolderUrl,
            filesCount: selectedFiles.length,
            onUploadAgain: handleResetForm,
          });

          toast.success("Berkas berhasil diarsipkan ke Google Drive!");
        }, 600);
      } else {
        setIsUploading(false);
        setUploadProgress(0);
        closeSwal();
        showSwalError(
          "Gagal Mengunggah Berkas",
          result.error || "Terjadi kesalahan saat memproses berkas ke Google Drive. Silakan coba kembali."
        );
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsUploading(false);
      setUploadProgress(0);
      closeSwal();
      showSwalError(
        "Koneksi Terputus",
        "Terjadi kegagalan jaringan saat mengirim berkas. Mohon periksa koneksi internet Anda."
      );
    }
  };

  const handleResetForm = () => {
    setSubmissionResult(null);
    setFieldAnswers({});
    setFieldErrors({});
    setPhotoFiles([]);
    setVideoFiles([]);
    setSubmitterName("");
    setSubmitterContact("");
    setNotes("");
    setUploadProgress(0);
    setSelectedMadrasah(availableMadrasahs[0]?.name || "MI Bustanul Huda 01");
    setDuplicateInfo(null);
    setAllowSupplementary(false);
  };

  const totalSelectedFileSize = selectedFiles.reduce(
    (acc, curr) => acc + curr.file.size,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-200/40 via-teal-100/20 to-transparent dark:from-emerald-950/30 dark:via-teal-950/10 blur-3xl opacity-70" />
        <div className="absolute top-[600px] -right-40 w-96 h-96 bg-teal-200/20 dark:bg-teal-900/10 rounded-full blur-3xl" />
        <div className="absolute top-[800px] -left-40 w-96 h-96 bg-amber-200/20 dark:bg-amber-950/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-emerald-100/80 bg-white/85 backdrop-blur-md dark:border-emerald-950/60 dark:bg-slate-900/85 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3.5 py-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-400/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight block leading-none bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-300 dark:to-teal-200 bg-clip-text text-transparent">
                  SIMATA
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Cloud v2.0
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 block">
                MI Bustanul Huda Dawuhan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Google Drive API Aktif</span>
            </div>

            <HeaderInstallButton />

            {/* <Link href="/admin/login">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-bold rounded-xl border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 hover:border-emerald-400 transition-all shadow-xs cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Admin</span>
              </Button>
            </Link> */}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-xs border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>Portal Unggah Berkas & Pembiasaan Karakter Siswa</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Pengumpulan Jurnal & Dokumentasi{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Wali Kelas
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Sistem pengarsipan terpadu madrasah. Berkas otomatis terorganisir per rombel kelas di Google Drive dengan narasi laporan formal yang di-generate langsung oleh AI.
          </p>

          {/* Quick Feature Badges */}
          {/* <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
              ✨ <b>AI Catatan Otomatis</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
              🏫 <b>12 Rombel (Kelas 1 A - 6 B)</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
              📁 <b>Multi-level Google Drive</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
              ⚡ <b>SweetAlert Popups</b>
            </span>
          </div> */}
        </div>

        {/* Success Screen / Submission Receipt */}
        {submissionResult ? (
          <Card className="rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 bg-white dark:bg-slate-900">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 sm:p-10 text-center text-white space-y-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

              <div className="mx-auto h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 animate-bounce duration-1000">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Alhamdulillah! Berkas Berhasil Terkirim
              </h2>
              <p className="text-sm text-emerald-100 max-w-lg mx-auto leading-relaxed">
                Berkas telah tersimpan rapi di Google Drive madrasah di bawah kategori{" "}
                <span className="font-extrabold underline decoration-white/40">
                  {submissionResult.categoryName}
                </span>.
              </p>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Receipt Code Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">
                    ID Bukti Submisi Cloud:
                  </span>
                  <code className="text-xs sm:text-sm font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
                    {submissionResult.submissionId}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs py-1 px-3 font-bold gap-1 shadow-xs">
                    <CheckCircle2 className="h-3 w-3" /> Terverifikasi Google Cloud
                  </Badge>
                </div>
              </div>

              {/* Submission Folder Card */}
              {submissionResult.submissionFolderUrl && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <FolderArchive className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 bg-emerald-200/70 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md">
                          Folder Google Drive
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
                        {submissionResult.submissionFolderName || "Folder Submisi"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Semua berkas dan catatan tersusun rapi di subfolder ini.
                      </p>
                    </div>
                  </div>

                  <a
                    href={submissionResult.submissionFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button
                      size="sm"
                      className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" /> Buka Folder di Drive
                    </Button>
                  </a>
                </div>
              )}

              {/* Uploaded Files Link */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  Daftar Berkas Terunggah ({submissionResult.files.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {submissionResult.files.map((f) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-2xl border border-border/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                          {f.fileName}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
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
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                        >
                          Lihat <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={handleResetForm}
                  className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-2xl font-bold text-sm shadow-md cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" /> Unggah Berkas Baru
                </Button>
                {submissionResult.submissionFolderUrl && (
                  <a
                    href={submissionResult.submissionFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto gap-2 border-slate-300 hover:bg-slate-100 px-6 py-3 rounded-2xl font-bold text-sm"
                    >
                      <ExternalLink className="h-4 w-4" /> Buka Seluruh Arsip di Drive
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Form Upload Wizard */
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Step 1: Category Selection */}
            <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900 transition-all">
              <CardHeader className="bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-900/80 dark:via-emerald-950/20 dark:to-slate-900/80 border-b border-border/80 pb-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-xs font-black shadow-sm">
                      1
                    </span>
                    <div>
                      <CardTitle className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                        Pilih Kategori Berkas
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        {todayCategory && !showAllDays
                          ? `Otomatis menampilkan program hari ini (${todayDateFormatted || "Hari Ini"}).`
                          : "Pilih kategori program yang ingin Anda kirimkan dokumentasinya."}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-bold border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                    Langkah 1 dari 3
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Banner Jadwal Hari Ini & Toggle Unggah Susulan */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                          Jadwal Hari Ini: {todayDayIndex !== null ? DAYS_ID[todayDayIndex] : "..."}
                        </span>
                        {todayCategory && !showAllDays ? (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                            Otomatis Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Semua Hari Terbuka
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {todayCategory && !showAllDays
                          ? `Sistem otomatis mengunci program "${todayCategory.name}" agar tidak salah kamar arsip.`
                          : todayCategory && showAllDays
                          ? `Seluruh program dibuka. Anda dapat mengunggah berkas susulan untuk hari lain.`
                          : `Hari ini (${todayDayIndex !== null ? DAYS_ID[todayDayIndex] : ""}) seluruh program pembiasaan dibuka untuk unggah susulan.`}
                      </p>
                    </div>
                  </div>

                  {todayCategory && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllDays((prev) => !prev)}
                      className="text-xs font-bold rounded-xl border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shrink-0 self-start sm:self-auto cursor-pointer shadow-xs gap-1.5"
                    >
                      {showAllDays ? (
                        <>🔒 Kunci Hanya Hari Ini ({DAYS_ID[todayDayIndex!]})</>
                      ) : (
                        <>📅 Tampilkan Semua Hari (Unggah Susulan)</>
                      )}
                    </Button>
                  )}
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <FolderArchive className="h-10 w-10 mx-auto text-emerald-600" />
                    <h4 className="font-bold text-base">Belum Ada Kategori Berkas Aktif</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Silakan masuk ke Dashboard Admin untuk membuat kategori berkas baru dan mengatur Form Builder.
                    </p>
                    <Link href="/admin/categories">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                        Buka Manajemen Kategori
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div
                    className={
                      displayedCategories.length === 1
                        ? "max-w-xl mx-auto w-full"
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    }
                  >
                    {displayedCategories.map((cat, idx) => {
                      const isSelected = cat.id === selectedCategoryId;
                      const orderNum = `0${cat.orderIndex || idx + 1}`;
                      const dayInfo = getCategoryDayInfo(cat);
                      const isTodaySchedule = todayCategory?.id === cat.id;

                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`relative p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group select-none ${
                            isSelected
                              ? "border-emerald-600 bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-teal-950/40 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40 scale-[1.01]"
                              : "border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 bg-white dark:bg-slate-900 hover:shadow-md"
                          }`}
                        >
                          {/* Order Chip & Icon Header */}
                          <div className="flex items-start justify-between">
                            <div
                              className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30 scale-105"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                              }`}
                            >
                              {getCategoryIcon(cat.icon)}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${dayInfo.badgeColor}`}
                              >
                                {dayInfo.badgeLabel}
                              </span>

                              {isTodaySchedule && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-xs">
                                  Hari Ini
                                </span>
                              )}

                              <span
                                className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                #{orderNum}
                              </span>

                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-in zoom-in-50" />
                              )}
                            </div>
                          </div>

                          {/* Titles */}
                          <div>
                            <h4
                              className={`text-sm font-extrabold tracking-tight leading-snug ${
                                isSelected
                                  ? "text-emerald-900 dark:text-emerald-200"
                                  : "text-slate-800 dark:text-slate-100 group-hover:text-emerald-700"
                              }`}
                            >
                              {cat.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {cat.description || "Dokumentasi dan pengumpulan berkas madrasah."}
                            </p>
                          </div>

                          {/* Footer indicator */}
                          <div className="pt-1 flex items-center justify-between text-[10px] font-bold border-t border-slate-100 dark:border-slate-800/80">
                            <span
                              className={
                                isSelected
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : "text-slate-400"
                              }
                            >
                              {isSelected ? "● Terpilih Otomatis" : "Pilih Kategori"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Maks. {cat.maxFileSizeMb} MB
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Form & Identitas Wali Kelas */}
            {selectedCategory && (
              <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900 transition-all">
                <CardHeader className="bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-900/80 dark:via-emerald-950/20 dark:to-slate-900/80 border-b border-border/80 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-xs font-black shadow-sm">
                        2
                      </span>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                          Isi Data Formulir: {selectedCategory.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Lengkapi rombel kelas, nama wali kelas, dan catatan pelaksanaan dengan bantuan AI.
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-bold border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                      Langkah 2 dari 3
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Pilihan Satuan Pendidikan / Madrasah */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-teal-50/70 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-teal-950/30 border border-teal-200/90 dark:border-teal-800/80 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-xs">
                          <School className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-teal-950 dark:text-teal-200 uppercase tracking-wider block">
                            Pilih Satuan Pendidikan / Madrasah
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Tentukan madrasah asal agar berkas terorganisir ke subfolder Google Drive yang tepat
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold border-teal-300 text-teal-800 dark:border-teal-700 dark:text-teal-300 bg-white/70 dark:bg-slate-900/60">
                        Wajib Dipilih
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {availableMadrasahs.map((m) => {
                        const isSelected = selectedMadrasah === m.name;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMadrasah(m.name)}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                              isSelected
                                ? "border-teal-600 bg-white dark:bg-slate-900 shadow-md shadow-teal-500/10 ring-2 ring-teal-500/30 scale-[1.01]"
                                : "border-teal-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-teal-400 hover:bg-white dark:hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-all ${
                                  isSelected
                                    ? "bg-teal-700 text-white shadow-sm"
                                    : "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200"
                                }`}
                              >
                                {m.code || "MI"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                                  {m.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {m.description || "Dawuhan, Grujugan, Bondowoso"}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Identitas Wali Kelas Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/80 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                          Identitas Wali Kelas / Guru Pengampu
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        Otomatis tersinkronisasi ke Google Drive
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="submitter-name" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Nama Lengkap Wali Kelas <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="submitter-name"
                          placeholder="Contoh: Ustadzah Siti Aminah, S.Pd."
                          value={submitterName}
                          onChange={(e) => setSubmitterName(e.target.value)}
                          disabled={isUploading}
                          className="bg-white dark:bg-slate-900 border-emerald-200/80 focus-visible:ring-emerald-500 h-10 text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="submitter-contact" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          No. WhatsApp Wali Kelas <span className="text-muted-foreground font-normal">(Opsional)</span>
                        </Label>
                        <Input
                          id="submitter-contact"
                          placeholder="Contoh: 081234567890"
                          value={submitterContact}
                          onChange={(e) => setSubmitterContact(e.target.value)}
                          disabled={isUploading}
                          className="bg-white dark:bg-slate-900 border-emerald-200/80 focus-visible:ring-emerald-500 h-10 text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="activity-date" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Tanggal Kegiatan</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="activity-date"
                          type="date"
                          value={activityDate}
                          onChange={(e) => setActivityDate(e.target.value)}
                          disabled={isUploading}
                          className="bg-white dark:bg-slate-900 border-emerald-200/80 focus-visible:ring-emerald-500 h-10 text-sm font-semibold cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Live Preview Folder Tanggal Google Drive */}
                    <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-emerald-900 dark:text-emerald-200 shadow-xs">
                      <span className="font-semibold flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        📁 Penamaan Subfolder Tanggal di Google Drive:
                      </span>
                      <strong className="font-extrabold text-emerald-800 dark:text-emerald-300 text-xs font-mono">
                        {(() => {
                          const parts = activityDate.split("-");
                          if (parts.length === 3) {
                            const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                            const d = parseInt(parts[2], 10);
                            const m = parseInt(parts[1], 10) - 1;
                            const y = parts[0];
                            return `${d} ${months[m]} ${y}`;
                          }
                          return activityDate;
                        })()}
                      </strong>
                    </div>
                  </div>

                  {/* Render Dynamic Custom Fields from Admin Form Builder */}
                  <div className="pt-2">
                    <DynamicFormRenderer
                      fields={selectedCategory.fields}
                      values={fieldAnswers}
                      errors={fieldErrors}
                      onChange={handleFieldChange}
                      disabled={isUploading}
                      categoryName={selectedCategory.name}
                      submitterName={submitterName}
                    />
                  </div>

                  {/* Pengecekan Data Ganda Real-Time */}
                  {duplicateInfo?.isDuplicate && duplicateInfo.existingSubmission && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 space-y-3.5 shadow-sm animate-in fade-in-50 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                              Data Pengisian Sudah Ada Hari Ini!
                            </span>
                            <Badge variant="outline" className="text-[10px] font-bold border-amber-400 text-amber-900 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-200">
                              {duplicateInfo.existingSubmission.timeFormatted}
                            </Badge>
                          </div>
                          <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                            Rombel <strong>{duplicateInfo.existingSubmission.kelas}</strong> di{" "}
                            <strong>{duplicateInfo.existingSubmission.madrasah}</strong> sudah terekam mengirimkan{" "}
                            <strong>{duplicateInfo.existingSubmission.categoryName}</strong> pada hari ini ({duplicateInfo.existingSubmission.dateFormatted}) oleh{" "}
                            <strong>{duplicateInfo.existingSubmission.submitterName}</strong> ({duplicateInfo.existingSubmission.filesCount} berkas sudah tersimpan di Google Drive).
                          </p>
                        </div>
                      </div>

                      {/* Opsi Tindakan Data Ganda: Ganti Berkas Lama vs Berkas Susulan */}
                      <div className="pt-3 border-t border-amber-200/90 dark:border-amber-800/60 space-y-2.5 text-xs">
                        <p className="font-extrabold text-amber-900 dark:text-amber-200">
                          Pilih tindakan untuk berkas Anda:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Opsi 1: Perbarui & Ganti Berkas Lama */}
                          <label
                            onClick={() => {
                              setReplacePrevious(true);
                              setAllowSupplementary(false);
                            }}
                            className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                              replacePrevious
                                ? "bg-amber-100/90 dark:bg-amber-900/60 border-amber-500 shadow-xs"
                                : "bg-white/70 dark:bg-slate-900/50 border-amber-200 dark:border-amber-900/50 hover:bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name="duplicateAction"
                              checked={replacePrevious}
                              onChange={() => {
                                setReplacePrevious(true);
                                setAllowSupplementary(false);
                              }}
                              className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                🔄 Perbarui & Ganti Berkas Lama
                              </span>
                              <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">
                                Berkas lama di Google Drive akan langsung dihapus dan digantikan dengan berkas baru ini.
                              </span>
                            </div>
                          </label>

                          {/* Opsi 2: Kirim Sebagai Berkas Susulan */}
                          <label
                            onClick={() => {
                              setAllowSupplementary(true);
                              setReplacePrevious(false);
                            }}
                            className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                              allowSupplementary
                                ? "bg-amber-100/90 dark:bg-amber-900/60 border-amber-500 shadow-xs"
                                : "bg-white/70 dark:bg-slate-900/50 border-amber-200 dark:border-amber-900/50 hover:bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name="duplicateAction"
                              checked={allowSupplementary}
                              onChange={() => {
                                setAllowSupplementary(true);
                                setReplacePrevious(false);
                              }}
                              className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                ➕ Berkas Susulan / Tambahan
                              </span>
                              <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">
                                Berkas lama tetap disimpan rapi, dan berkas baru ditambahkan sebagai susulan.
                              </span>
                            </div>
                          </label>
                        </div>

                        <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                          {replacePrevious ? (
                            "✓ Mode ganti berkas aktif: File lama di Google Drive akan diganti dengan yang baru."
                          ) : allowSupplementary ? (
                            "✓ Mode susulan aktif: File baru akan ditambahkan tanpa menghapus file lama."
                          ) : (
                            "🔒 Pilih salah satu opsi di atas untuk mengizinkan pengiriman."
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {duplicateInfo && !duplicateInfo.isDuplicate && fieldAnswers.kelas && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        {fieldAnswers.kelas} belum mengisi {selectedCategory.name} hari ini. Berkas Anda akan menjadi data pertama.
                      </span>
                    </div>
                  )}

                  {/* Catatan Tambahan */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="general-notes" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Catatan Tambahan untuk Arsip Madrasah <span className="text-muted-foreground font-normal">(Opsional)</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextSeed = notesSeed + 1;
                          setNotesSeed(nextSeed);
                          const autoNote = generatePedagogicalNote({
                            categoryName: selectedCategory.name,
                            kelas: fieldAnswers.kelas,
                            waliKelas: submitterName,
                            seedIndex: nextSeed,
                          });
                          setNotes(autoNote);
                          toast.success("Catatan tambahan berhasil dibuat oleh AI! ✨", {
                            description: "Klik lagi untuk melihat variasi contoh lainnya.",
                          });
                        }}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Buat dengan AI (Ganti Variasi)
                      </button>
                    </div>
                    <Textarea
                      id="general-notes"
                      placeholder="Tuliskan catatan khusus atau pesan untuk arsip madrasah jika diperlukan..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isUploading}
                      rows={2}
                      className="text-sm bg-white dark:bg-slate-900 leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: File Upload Zone */}
            {selectedCategory && (
              <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900 transition-all">
                <CardHeader className="bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-900/80 dark:via-emerald-950/20 dark:to-slate-900/80 border-b border-border/80 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-xs font-black shadow-sm">
                        3
                      </span>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                          Pilih Berkas Foto & Video Dokumentasi
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Maksimal {selectedCategory.maxFileSizeMb} MB per berkas. Mendukung pengunggahan banyak berkas sekaligus.
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-bold border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                      Langkah 3 dari 3
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Info Notice: Pemisahan Foto & Video */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-sky-50/70 dark:from-emerald-950/20 dark:via-slate-900/40 dark:to-sky-950/20 border border-slate-200/90 dark:border-slate-800 text-xs shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                          Formulir Foto & Video Terpisah
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Gunakan kolom hijau untuk foto dokumentasi dan kolom biru untuk rekaman video kegiatan.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-mono text-xs">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-bold px-2.5 py-1 ${
                          photoFiles.length > 0
                            ? "border-emerald-500 text-emerald-800 bg-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                        }`}
                      >
                        📷 {photoFiles.length} Foto
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-bold px-2.5 py-1 ${
                          videoFiles.length > 0
                            ? "border-sky-500 text-sky-800 bg-sky-100/80 dark:bg-sky-950/60 dark:text-sky-300"
                            : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                        }`}
                      >
                        🎬 {videoFiles.length} Video
                      </Badge>
                    </div>
                  </div>

                  {/* 2-Column Split Zones: Foto & Video */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Zone 1: Foto Dokumentasi */}
                    <div className="p-5 rounded-3xl border-2 border-emerald-200/90 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-100 dark:border-emerald-900/40">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Camera className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              Foto Dokumentasi
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                {photoFiles.length > 0 ? `${photoFiles.length} Foto Siap` : "Multi-Upload"}
                              </span>
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Lembar jurnal syukur, kreasi pojok syukur, kartu apresiasi
                            </p>
                          </div>
                        </div>
                      </div>

                      <FileUploadZone
                        files={photoFiles}
                        onFilesChange={setPhotoFiles}
                        maxFileSizeMb={selectedCategory.maxFileSizeMb}
                        targetType="IMAGE"
                        accentColor="emerald"
                        title="Pilih atau Tarik Foto ke Sini"
                        description={`Format foto: JPG, JPEG, PNG, WEBP (Maks. ${selectedCategory.maxFileSizeMb} MB per foto)`}
                        badgeLabel="Bisa Banyak Foto Sekaligus"
                        disabled={isUploading}
                      />
                    </div>

                    {/* Zone 2: Video Kegiatan */}
                    <div className="p-5 rounded-3xl border-2 border-sky-200/90 dark:border-sky-900/60 bg-gradient-to-b from-sky-50/40 via-white to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between pb-1 border-b border-sky-100 dark:border-sky-900/40">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                            <Film className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              Video Kegiatan
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                                {videoFiles.length > 0 ? `${videoFiles.length} Video Siap` : "Opsional"}
                              </span>
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Rekaman video aktivitas siswa, presentasi, atau testimoni
                            </p>
                          </div>
                        </div>
                      </div>

                      <FileUploadZone
                        files={videoFiles}
                        onFilesChange={setVideoFiles}
                        maxFileSizeMb={selectedCategory.maxFileSizeMb}
                        targetType="VIDEO"
                        accentColor="blue"
                        title="Pilih atau Tarik Video ke Sini"
                        description={`Format video: MP4, MOV, MKV, WebM (Maks. ${selectedCategory.maxFileSizeMb} MB per video)`}
                        badgeLabel="Opsional / Jika Ada Rekaman"
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  {/* Summary & Folder Path Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-sky-50/70 dark:from-emerald-950/20 dark:via-slate-900 dark:to-sky-950/20 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap font-extrabold text-slate-900 dark:text-slate-100">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            Total {selectedFiles.length} berkas siap diunggah ({formatBytes(totalSelectedFileSize)}):
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300/80">
                            📷 {photoFiles.length} Foto
                          </span>
                          {videoFiles.length > 0 && (
                            <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-300/80">
                              🎬 {videoFiles.length} Video
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px]">
                          Tujuan folder Google Drive:{" "}
                          <code className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                            SIMATA ➔ {selectedMadrasah} ➔ {selectedCategory.name} ➔ {todaySimpleDate || "19 Oktober 2026"} ➔ {fieldAnswers.kelas || "kelas 1 a"}
                          </code>
                        </p>
                      </div>

                      <Badge variant="secondary" className="self-start sm:self-auto font-mono text-xs">
                        Siap Transmisi
                      </Badge>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isUploading || (duplicateInfo?.isDuplicate && !allowSupplementary && !replacePrevious)}
                      className={`w-full h-14 rounded-2xl font-black text-base transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-60 cursor-pointer gap-2 ${
                        duplicateInfo?.isDuplicate && !allowSupplementary && !replacePrevious
                          ? "bg-slate-400 hover:bg-slate-400 text-white cursor-not-allowed shadow-none"
                          : replacePrevious
                          ? "bg-gradient-to-r from-amber-600 via-teal-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-xl shadow-amber-600/25"
                          : allowSupplementary
                          ? "bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white shadow-xl shadow-teal-600/25"
                          : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/25"
                      }`}
                    >
                      {duplicateInfo?.isDuplicate && !allowSupplementary && !replacePrevious ? (
                        <>
                          <AlertTriangle className="h-5 w-5" />
                          <span>Pilih Tindakan Duplikasi di Atas</span>
                        </>
                      ) : replacePrevious ? (
                        <>
                          <RotateCcw className="h-5 w-5" />
                          <span>Ganti Berkas Lama di Google Drive</span>
                        </>
                      ) : allowSupplementary ? (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Unggah Berkas Susulan ke Google Drive</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Unggah & Simpan ke Google Drive</span>
                        </>
                      )}
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground mt-2">
                      Dengan mengirimkan berkas, arsip dokumentasi akan langsung tersimpan di cloud storage resmi MI Bustanul Huda Dawuhan.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              M
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              SIMATA • Madrasah Ibtidaiyah Bustanul Huda Dawuhan
            </span>
          </div>

          <p className="text-center sm:text-right text-[11px]">
            Sistem Informasi Manajemen Berkas & Dokumentasi Terintegrasi Google Drive Cloud API
          </p>
        </div>
      </footer>
    </div>
  );
}
