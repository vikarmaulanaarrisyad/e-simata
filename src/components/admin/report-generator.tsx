"use client";

import React, { useState, useEffect, useTransition, useMemo, useRef } from "react";
import {
  Download,
  Printer,
  Calendar,
  Image as ImageIcon,
  School,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Info,
  Film,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
  Grid,
  Layers,
  LayoutGrid,
  Filter,
  Check,
  Eye,
  Quote,
  Users,
  Clock,
  User,
  Building2,
  CheckCircle2,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getReportData, ReportSubmissionItem } from "@/actions/reports";
import { showSwalLoading, closeSwal, showSwalError } from "@/lib/swal";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
  color?: string | null;
}

interface MadrasahOption {
  id: string;
  name: string;
  code?: string | null;
}

interface FlattenedMediaItem {
  sub: ReportSubmissionItem;
  file: ReportSubmissionItem["files"][number];
}

interface RombelGroup {
  key: string;
  kelas: string;
  cleanKelas: string;
  madrasah: string;
  madrasahBadge: string;
  submitterName: string;
  studentCount?: string | null;
  timeFormatted: string;
  notes?: string | null;
  photos: FlattenedMediaItem[];
  videos: FlattenedMediaItem[];
}

interface RombelFullPhotoPage {
  rombel: RombelGroup;
  photos: FlattenedMediaItem[];
  partIndex: number;
  totalParts: number;
}

export function ReportGenerator({
  initialCategories,
  initialMadrasahs,
}: {
  initialCategories: CategoryOption[];
  initialMadrasahs: MadrasahOption[];
}) {
  const todayISO = new Date().toISOString().split("T")[0];

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategories[0]?.id || ""
  );
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [startDate, setStartDate] = useState<string>(todayISO);
  const [endDate, setEndDate] = useState<string>(todayISO);
  const [selectedMadrasah, setSelectedMadrasah] = useState<string>("all");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");

  // Mode Tata Letak Lampiran Foto:
  // - "rombel-full": 1 Rombel per Halaman (Eksklusif, Foto Luas & Sangat Rapi)
  // - "rombel-compact": 2 Rombel per Halaman (Kompak & Hemat Kertas)
  // - "grid-flat": Grid Campuran (6 Foto per Halaman)
  const [photoLayoutMode, setPhotoLayoutMode] = useState<
    "rombel-full" | "rombel-compact" | "grid-flat"
  >("rombel-full");

  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeVideos, setIncludeVideos] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

  // Pengaturan Kepala Madrasah MI 01 & MI 02
  const [headmaster01Name, setHeadmaster01Name] = useState<string>(
    "H. Ahmad Fauzi, S.Pd.I., M.Pd."
  );
  const [headmaster01Nip, setHeadmaster01Nip] = useState<string>(
    "19750812 200501 1 003"
  );
  const [headmaster02Name, setHeadmaster02Name] = useState<string>(
    "Drs. H. M. Syukron, M.Pd.I."
  );
  const [headmaster02Nip, setHeadmaster02Nip] = useState<string>(
    "19780520 200701 1 012"
  );

  // Pilihan penandatangan Kepala Madrasah di dokumen: 'auto' | 'MI01' | 'MI02'
  const [headmasterChoice, setHeadmasterChoice] = useState<"auto" | "MI01" | "MI02">("auto");

  // Pengaturan Guru yang Mengisi
  const [teacherRoleTitle, setTeacherRoleTitle] = useState<string>("Guru yang Mengisi");
  const [teacherCustomName, setTeacherCustomName] = useState<string>("");
  const [teacherNip, setTeacherNip] = useState<string>("-");

  // Muat pengaturan TTD yang tersimpan dari localStorage di peramban
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const s01Name = localStorage.getItem("simata_report_km01_name");
      const s01Nip = localStorage.getItem("simata_report_km01_nip");
      const s02Name = localStorage.getItem("simata_report_km02_name");
      const s02Nip = localStorage.getItem("simata_report_km02_nip");
      const sTeacherRole = localStorage.getItem("simata_report_teacher_role");
      const sTeacherNip = localStorage.getItem("simata_report_teacher_nip");

      if (s01Name) setHeadmaster01Name(s01Name);
      if (s01Nip) setHeadmaster01Nip(s01Nip);
      if (s02Name) setHeadmaster02Name(s02Name);
      if (s02Nip) setHeadmaster02Nip(s02Nip);
      if (sTeacherRole) setTeacherRoleTitle(sTeacherRole);
      if (sTeacherNip) setTeacherNip(sTeacherNip);
    } catch (e) {
      console.warn("Could not read signature settings from localStorage:", e);
    }
  }, []);

  const handleUpdateHeadmaster01 = (name: string, nip: string) => {
    setHeadmaster01Name(name);
    setHeadmaster01Nip(nip);
    try {
      localStorage.setItem("simata_report_km01_name", name);
      localStorage.setItem("simata_report_km01_nip", nip);
    } catch {}
  };

  const handleUpdateHeadmaster02 = (name: string, nip: string) => {
    setHeadmaster02Name(name);
    setHeadmaster02Nip(nip);
    try {
      localStorage.setItem("simata_report_km02_name", name);
      localStorage.setItem("simata_report_km02_nip", nip);
    } catch {}
  };

  const handleUpdateTeacherRole = (role: string) => {
    setTeacherRoleTitle(role);
    try {
      localStorage.setItem("simata_report_teacher_role", role);
    } catch {}
  };

  const handleUpdateTeacherNip = (nip: string) => {
    setTeacherNip(nip);
    try {
      localStorage.setItem("simata_report_teacher_nip", nip);
    } catch {}
  };

  // Zoom control untuk pratinjau F4 Landscape di layar
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Modal zoom pratinjau gambar di layar
  const [modalImage, setModalImage] = useState<{
    src: string;
    title: string;
    rombel: string;
    notes?: string | null;
  } | null>(null);

  // Report Data
  const [reportData, setReportData] = useState<{
    category: any;
    dateFormatted: string;
    rawDate: string;
    madrasahFilter: string;
    kelasFilter?: string;
    totalSubmissions: number;
    totalFiles: number;
    submissions: ReportSubmissionItem[];
    availableClasses?: string[];
    submissionCountByClass?: Record<string, number>;
    categories: CategoryOption[];
    madrasahs: MadrasahOption[];
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const isFirstMount = useRef(true);

  const loadReport = (isSilent = false) => {
    startTransition(async () => {
      if (!isSilent) {
        showSwalLoading({
          title: "Menyusun Laporan...",
          stepText: "Mengumpulkan data rombel & berkas dokumentasi...",
          progressPercent: 50,
        });
      }

      try {
        const queryParams: any = {
          categoryId: selectedCategory,
          madrasah: selectedMadrasah,
        };
        if (dateMode === "single") {
          queryParams.date = selectedDate;
        } else {
          queryParams.startDate = startDate;
          queryParams.endDate = endDate;
        }

        const res = await getReportData(queryParams);

        if (!isSilent) {
          closeSwal();
        }

        if (res.success && res.report) {
          setReportData(res.report as any);
          if (!isSilent) {
            toast.success("Laporan berhasil disusun dan siap diunduh ke PDF F4 Landscape.");
          }
        } else {
          if (!isSilent) {
            showSwalError("Gagal Memuat Laporan", res.error || "Terjadi kesalahan.");
          }
        }
      } catch (err: any) {
        if (!isSilent) {
          closeSwal();
          showSwalError("Terjadi Kesalahan", err.message || "Gagal menyusun laporan.");
        }
      }
    });
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadReport(true);
    } else {
      loadReport(false);
    }
  }, [selectedCategory, selectedDate, selectedMadrasah, dateMode, startDate, endDate]);

  // Master kelas standar
  const DEFAULT_CLASSES = useMemo(
    () => [
      "Kelas 1 A",
      "Kelas 1 B",
      "Kelas 2 A",
      "Kelas 2 B",
      "Kelas 3 A",
      "Kelas 3 B",
      "Kelas 4 A",
      "Kelas 4 B",
      "Kelas 5 A",
      "Kelas 5 B",
      "Kelas 6 A",
      "Kelas 6 B",
    ],
    []
  );

  // Daftar opsi kelas yang tersedia (gabungan master + dari kategori + dari data)
  const availableClasses = useMemo(() => {
    if (reportData?.availableClasses && reportData.availableClasses.length > 0) {
      return reportData.availableClasses;
    }
    const set = new Set<string>(DEFAULT_CLASSES);
    (reportData?.submissions || []).forEach((sub) => {
      if (sub.kelas && sub.kelas !== "-") set.add(sub.kelas);
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [reportData, DEFAULT_CLASSES]);

  // Jumlah submisi per kelas untuk indikator badge
  const submissionCountByClass = useMemo<Record<string, number>>(() => {
    if (reportData?.submissionCountByClass) {
      return reportData.submissionCountByClass;
    }
    const counts: Record<string, number> = {};
    availableClasses.forEach((cls) => {
      counts[cls] = (reportData?.submissions || []).filter(
        (s) => s.kelas.toLowerCase() === cls.toLowerCase()
      ).length;
    });
    return counts;
  }, [reportData, availableClasses]);

  // Submisi yang sudah difilter kelas jika ada
  const filteredSubmissions = useMemo(() => {
    const list = reportData?.submissions || [];
    if (selectedKelas === "all") return list;
    return list.filter((sub) => sub.kelas.toLowerCase() === selectedKelas.toLowerCase());
  }, [reportData, selectedKelas]);

  // Data submisi spesifik untuk kelas yang dipilih saat ini
  const selectedClassInfo = useMemo(() => {
    if (selectedKelas === "all") return null;
    return (
      (reportData?.submissions || []).find(
        (s) => s.kelas.toLowerCase() === selectedKelas.toLowerCase()
      ) || null
    );
  }, [reportData, selectedKelas]);

  // Otomatis sinkronkan nama guru pengisi saat memilih rombel/kelas
  useEffect(() => {
    if (selectedKelas !== "all") {
      if (selectedClassInfo?.submitterName) {
        setTeacherCustomName(selectedClassInfo.submitterName);
      } else {
        setTeacherCustomName("");
      }
    }
  }, [selectedKelas, selectedClassInfo]);

  // Deteksi otomatis madrasah yang relevan berdasarkan kelas atau filter yang dipilih
  const detectedMadrasahCode = useMemo<"MI01" | "MI02">(() => {
    // 1. Cek dari kelas terpilih jika ada data submisi
    if (selectedKelas !== "all" && selectedClassInfo?.madrasah) {
      if (selectedClassInfo.madrasah.includes("02")) return "MI02";
      if (selectedClassInfo.madrasah.includes("01")) return "MI01";
    }

    // 2. Cek dari filter madrasah yang dipilih
    if (selectedMadrasah !== "all") {
      const mObj = initialMadrasahs.find((m) => m.id === selectedMadrasah);
      const combined = `${mObj?.name || ""} ${mObj?.code || ""} ${selectedMadrasah}`;
      if (combined.includes("02")) return "MI02";
      if (combined.includes("01")) return "MI01";
    }

    // 3. Cek dari submisi yang sedang tampil
    const firstSub = filteredSubmissions[0];
    if (firstSub?.madrasah?.includes("02")) return "MI02";
    if (firstSub?.madrasah?.includes("01")) return "MI01";

    return "MI01";
  }, [
    selectedKelas,
    selectedClassInfo,
    selectedMadrasah,
    initialMadrasahs,
    filteredSubmissions,
  ]);

  // Kode madrasah yang aktif digunakan untuk Kepala Madrasah & Kop Surat
  const activeMadrasahCode =
    headmasterChoice === "auto" ? detectedMadrasahCode : headmasterChoice;

  // Profil Kepala Madrasah Aktif
  const activeHeadmaster = useMemo(() => {
    if (activeMadrasahCode === "MI02") {
      return {
        code: "MI 02",
        shortName: "MI 02 Dawuhan",
        fullName: "MI Bustanul Huda 02 Dawuhan",
        name: headmaster02Name,
        nip: headmaster02Nip,
        nsm: "111233020085",
        npsn: "60710778",
      };
    }
    return {
      code: "MI 01",
      shortName: "MI 01 Dawuhan",
      fullName: "MI Bustanul Huda 01 Dawuhan",
      name: headmaster01Name,
      nip: headmaster01Nip,
      nsm: "111233020084",
      npsn: "60710777",
    };
  }, [
    activeMadrasahCode,
    headmaster01Name,
    headmaster01Nip,
    headmaster02Name,
    headmaster02Nip,
  ]);

  // Data Profil Guru yang Mengisi
  const activeTeacher = useMemo(() => {
    const rawName =
      teacherCustomName.trim() ||
      (selectedKelas !== "all" && selectedClassInfo?.submitterName
        ? selectedClassInfo.submitterName
        : filteredSubmissions[0]?.submitterName || "Guru Pengisi");

    let role = teacherRoleTitle.trim() || "Guru yang Mengisi";
    if (selectedKelas !== "all" && role === "Guru yang Mengisi") {
      role = `Guru yang Mengisi (${selectedKelas})`;
    }

    return {
      name: rawName,
      nip: teacherNip && teacherNip !== "-" ? `NIP. ${teacherNip}` : "NIP. -",
      rawNip: teacherNip,
      role,
    };
  }, [
    teacherCustomName,
    selectedKelas,
    selectedClassInfo,
    filteredSubmissions,
    teacherRoleTitle,
    teacherNip,
  ]);

  // Kelompokkan data submisi & foto berdasarkan Rombel / Kelas
  const rombelGroups = useMemo<RombelGroup[]>(() => {
    const map = new Map<string, RombelGroup>();

    filteredSubmissions.forEach((sub) => {
      const groupKey = `${sub.kelas}___${sub.madrasah}`;
      const photos: FlattenedMediaItem[] = sub.files
        .filter(
          (file) =>
            file.fileType === "IMAGE" ||
            (!file.fileType?.includes("VIDEO") && !file.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
        )
        .map((file) => ({ sub, file }));

      const videos: FlattenedMediaItem[] = sub.files
        .filter(
          (file) =>
            file.fileType === "VIDEO" ||
            Boolean(file.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
        )
        .map((file) => ({ sub, file }));

      if (!map.has(groupKey)) {
        const rawKelas = sub.kelas || "-";
        const cleanKelas = rawKelas.toLowerCase().startsWith("kelas")
          ? rawKelas
          : `Kelas ${rawKelas}`;
        const madrasahBadge = sub.madrasah.includes("01")
          ? "MI 01"
          : sub.madrasah.includes("02")
          ? "MI 02"
          : "MI BH";

        map.set(groupKey, {
          key: groupKey,
          kelas: sub.kelas,
          cleanKelas,
          madrasah: sub.madrasah,
          madrasahBadge,
          submitterName: sub.submitterName,
          studentCount: sub.studentCount,
          timeFormatted: sub.timeFormatted,
          notes: sub.notes,
          photos,
          videos,
        });
      } else {
        const existing = map.get(groupKey)!;
        existing.photos.push(...photos);
        existing.videos.push(...videos);
        if (!existing.notes && sub.notes) existing.notes = sub.notes;
        if (!existing.studentCount && sub.studentCount)
          existing.studentCount = sub.studentCount;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.kelas.localeCompare(b.kelas, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [filteredSubmissions]);

  // Rombel yang memiliki foto
  const rombelsWithPhotos = useMemo(() => {
    return rombelGroups.filter((rg) => rg.photos.length > 0);
  }, [rombelGroups]);

  // Kumpulan foto dan video datar (untuk mode grid-flat dan video page)
  const { flatPhotos, flatVideos } = useMemo(() => {
    const photos: FlattenedMediaItem[] = rombelGroups.flatMap((rg) => rg.photos);
    const videos: FlattenedMediaItem[] = rombelGroups.flatMap((rg) => rg.videos);
    return { flatPhotos: photos, flatVideos: videos };
  }, [rombelGroups]);

  // Mode 1: Halaman Foto 1 Rombel per Halaman (Eksklusif & Rapi)
  // Maksimal 6 foto per halaman untuk 1 rombel; jika rombel punya >6 foto, lanjut ke bagian 2
  const rombelFullPages = useMemo<RombelFullPhotoPage[]>(() => {
    if (!includePhotos || rombelsWithPhotos.length === 0) return [];
    const pages: RombelFullPhotoPage[] = [];

    rombelsWithPhotos.forEach((rg) => {
      const chunkSize = 6;
      const totalParts = Math.ceil(rg.photos.length / chunkSize) || 1;
      for (let p = 0; p < totalParts; p++) {
        pages.push({
          rombel: rg,
          photos: rg.photos.slice(p * chunkSize, (p + 1) * chunkSize),
          partIndex: p,
          totalParts,
        });
      }
    });

    return pages;
  }, [includePhotos, rombelsWithPhotos]);

  // Mode 2: Halaman Foto 2 Rombel per Halaman (Kompak & Hemat Kertas)
  const rombelCompactPairs = useMemo<RombelGroup[][]>(() => {
    if (!includePhotos || rombelsWithPhotos.length === 0) return [];
    const pairs: RombelGroup[][] = [];
    for (let i = 0; i < rombelsWithPhotos.length; i += 2) {
      pairs.push(rombelsWithPhotos.slice(i, i + 2));
    }
    return pairs;
  }, [includePhotos, rombelsWithPhotos]);

  // Mode 3: Halaman Foto Campuran (6 Foto per Halaman Flat)
  const photoChunksFlat = useMemo<FlattenedMediaItem[][]>(() => {
    if (!includePhotos || flatPhotos.length === 0) return [];
    const chunks: FlattenedMediaItem[][] = [];
    for (let i = 0; i < flatPhotos.length; i += 6) {
      chunks.push(flatPhotos.slice(i, i + 6));
    }
    return chunks;
  }, [includePhotos, flatPhotos]);

  // Hitung jumlah baris tabel rekapitulasi di Halaman 1
  const submissionsList = filteredSubmissions;
  const primaryTableRows = submissionsList.slice(0, 8);
  const overflowTableRows = submissionsList.slice(8);
  const hasOverflowTable = overflowTableRows.length > 0;

  // Halaman Video
  const hasVideoPage = includeVideos && flatVideos.length > 0;

  // Total Halaman Dokumen F4 Landscape
  const totalPages = useMemo(() => {
    let count = 1; // Halaman 1: Rekapitulasi Rombel
    if (hasOverflowTable) count += 1;

    if (includePhotos) {
      if (photoLayoutMode === "rombel-full") {
        count += rombelFullPages.length;
      } else if (photoLayoutMode === "rombel-compact") {
        count += rombelCompactPairs.length;
      } else {
        count += photoChunksFlat.length;
      }
    }

    if (hasVideoPage) count += 1;

    // Lembar Pengesahan:
    // Jika laporan hanya 1 halaman dan rombel <= 8, TTD dicantumkan di halaman 1.
    // Jika banyak halaman (ada foto / video / lanjutan rombel), buat lembar pengesahan tersendiri yang berwibawa di akhir dokumen.
    const isSinglePage =
      count === 1 &&
      !hasOverflowTable &&
      (!includePhotos || rombelsWithPhotos.length === 0) &&
      !hasVideoPage;

    if (!isSinglePage && includeSignatures) {
      count += 1;
    }

    return count;
  }, [
    hasOverflowTable,
    includePhotos,
    photoLayoutMode,
    rombelFullPages.length,
    rombelCompactPairs.length,
    photoChunksFlat.length,
    rombelsWithPhotos.length,
    hasVideoPage,
    includeSignatures,
  ]);

  // Direct PDF Download Handler
  const handleDirectDownloadPdf = async () => {
    if (!reportData || submissionsList.length === 0) {
      showSwalError(
        "Tidak Ada Data",
        "Belum ada data submisi untuk kategori dan tanggal yang dipilih."
      );
      return;
    }

    try {
      setIsExportingPdf(true);
      showSwalLoading({
        title: "Menyiapkan Berkas PDF...",
        stepText: "Mengumpulkan data dan memvalidasi lampiran gambar...",
        progressPercent: 20,
      });

      // Import jsPDF and html2canvas dynamically
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Ambil seluruh elemen halaman F4 Landscape
      const pageElements = document.querySelectorAll<HTMLElement>(".f4-landscape-page");
      if (!pageElements || pageElements.length === 0) {
        closeSwal();
        setIsExportingPdf(false);
        showSwalError("Gagal Mengunduh", "Elemen dokumen tidak ditemukan di tampilan.");
        return;
      }

      // Tunggu hingga semua gambar di halaman terdecode sempurna dengan toleransi timeout
      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>(".f4-landscape-page img")
      );
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 4000);
          });
        })
      );

      showSwalLoading({
        title: "Merender Dokumen F4 Landscape...",
        stepText: `Merender ${pageElements.length} halaman F4 Landscape (330 × 215 mm)...`,
        progressPercent: 45,
      });

      // Simpan dan normalkan zoom transform container pratinjau agar html2canvas menangkap skala 1:1 tanpa terpotong
      const zoomContainer = document.getElementById("report-zoom-container");
      const savedTransform = zoomContainer?.style.transform;
      if (zoomContainer) {
        zoomContainer.style.transform = "none";
      }

      // Pastikan posisi horizontal scroll di 0 agar html2canvas tidak tergeser
      const outerScroll = zoomContainer?.parentElement;
      const savedScrollLeft = outerScroll?.scrollLeft || 0;
      if (outerScroll) {
        outerScroll.scrollLeft = 0;
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [330, 215],
        compress: true,
      });

      try {
        for (let i = 0; i < pageElements.length; i++) {
          const pageEl = pageElements[i];

          showSwalLoading({
            title: "Menyusun Halaman PDF...",
            stepText: `Merender halaman ${i + 1} dari ${pageElements.length}...`,
            progressPercent: Math.round(45 + ((i + 1) / pageElements.length) * 45),
          });

          const canvas = await html2canvas(pageEl, {
            scale: 2, // 300 DPI high-quality print
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
            width: pageEl.offsetWidth,
            height: pageEl.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.95);

          if (i > 0) {
            pdf.addPage([330, 215], "landscape");
          }

          pdf.addImage(imgData, "JPEG", 0, 0, 330, 215, undefined, "FAST");
        }

        showSwalLoading({
          title: "Menyimpan Berkas PDF...",
          stepText: "Mengunduh berkas laporan ke perangkat Anda...",
          progressPercent: 98,
        });

        const safeCategory = (reportData.category?.name || "Laporan").replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );
        const safeKelas =
          selectedKelas !== "all"
            ? selectedKelas.replace(/[^a-zA-Z0-9_-]/g, "_")
            : "Semua_Rombel";
        const safeMadrasah = activeHeadmaster.code.replace(/\s+/g, "");
        const safeDate = reportData.rawDate || selectedDate;
        const filename = `Laporan_SIMATA_${safeCategory}_${safeKelas}_${safeMadrasah}_${safeDate}_F4_Landscape.pdf`;

        pdf.save(filename);

        closeSwal();
        setIsExportingPdf(false);
        toast.success(
          selectedKelas !== "all"
            ? `Berkas PDF Laporan ${selectedKelas} berhasil diunduh!`
            : "Berkas PDF Rekapitulasi Rombel berhasil diunduh!"
        );
      } finally {
        if (zoomContainer && savedTransform !== undefined) {
          zoomContainer.style.transform = savedTransform;
        }
        if (outerScroll) {
          outerScroll.scrollLeft = savedScrollLeft;
        }
      }
    } catch (err: any) {
      console.error("PDF Download error:", err);
      closeSwal();
      setIsExportingPdf(false);
      showSwalError(
        "Gagal Mengunduh PDF",
        err.message || "Terjadi kesalahan saat memproses berkas PDF."
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentCategoryName =
    reportData?.category?.name ||
    initialCategories.find((c) => c.id === selectedCategory)?.name ||
    "Jurnal Syukur";

  // Kop Surat Resmi Kedinasan MI Bustanul Huda Dawuhan
  const renderOfficialKop = () => (
    <div className="border-b-4 border-double border-black pb-2 mb-2.5">
      <div className="flex items-center justify-between">
        {/* Logo Kemenag / Madrasah di sisi kiri kop */}
        <div className="w-20 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full border-2 border-emerald-800 flex flex-col items-center justify-center p-1 bg-emerald-50 text-center">
            <School className="h-6 w-6 text-emerald-800" />
            <span className="text-[7px] font-black uppercase tracking-tighter text-emerald-950 mt-0.5">
              {activeHeadmaster.code} DAWUHAN
            </span>
          </div>
        </div>

        {/* Teks Identitas Resmi Madrasah */}
        <div className="flex-1 px-4 text-center">
          <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-slate-800 m-0 leading-tight">
            Kementerian Agama Republik Indonesia
          </h3>
          <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 m-0 leading-tight mt-0.5">
            Kantor Kementerian Agama Kabupaten Banyumas
          </h2>
          <h1 className="text-[16px] font-black uppercase tracking-wide text-black m-0 leading-tight mt-0.5 font-serif">
            {activeHeadmaster.fullName.toUpperCase()}
          </h1>
          <p className="text-[9.5px] text-slate-700 m-0 mt-0.5 leading-snug">
            NSM: {activeHeadmaster.nsm} • NPSN: {activeHeadmaster.npsn} • Terakreditasi "A" (Unggul)
          </p>
          <p className="text-[9px] text-slate-600 m-0 leading-tight">
            Alamat: Dawuhan, Kec. Banyumas, Kab. Banyumas - Jawa Tengah 53192 • SIMATA Digital System
          </p>
        </div>

        {/* Logo SIMATA di sisi kanan */}
        <div className="w-20 flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl border-2 border-slate-400 flex flex-col items-center justify-center p-1 bg-slate-50 text-center">
            <Sparkles className="h-6 w-6 text-emerald-700" />
            <span className="text-[8px] font-black text-slate-800 uppercase tracking-tight mt-0.5">
              SIMATA
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Running Header Kecil untuk Halaman 2 dan seterusnya
  const renderRunningHeader = (pageTitle: string) => (
    <div className="border-b border-slate-300 pb-1 mb-2 flex items-center justify-between text-[9px] text-slate-600 font-serif">
      <div className="flex items-center gap-1.5 truncate">
        <strong className="text-black uppercase font-bold">
          {activeHeadmaster.fullName.toUpperCase()}
        </strong>
        <span>•</span>
        <span className="truncate">
          Laporan: {currentCategoryName}
          {selectedKelas !== "all" ? ` • ${selectedKelas}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-right">
        <span className="font-semibold text-emerald-800">{pageTitle}</span>
        <span>•</span>
        <span>Tanggal: {reportData?.dateFormatted || selectedDate}</span>
      </div>
    </div>
  );

  // Lembar Pengesahan Tanda Tangan: Kiri Kepala Madrasah, Kanan Guru yang Mengisi
  const renderSignatures = () => {
    return (
      <div className="mt-4 pt-2 text-xs font-serif avoid-break">
        <div className="flex justify-between items-start px-8">
          {/* Sisi Kiri: Kepala Madrasah (MI 01 atau MI 02 sesuai pilihan) */}
          <div className="w-72 text-center">
            <p className="m-0 leading-tight">Mengetahui,</p>
            <p className="font-bold m-0 leading-tight">
              Kepala {activeHeadmaster.fullName}
            </p>
            <div className="h-14 flex items-end justify-center">
              {/* Ruang TTD & Stempel */}
            </div>
            <p className="font-bold underline uppercase m-0 leading-tight text-[11.5px]">
              {activeHeadmaster.name}
            </p>
            <p className="text-[10px] font-mono m-0 mt-0.5 text-slate-700">
              NIP. {activeHeadmaster.nip}
            </p>
          </div>

          {/* Sisi Kanan: Guru yang Mengisi */}
          <div className="w-72 text-center">
            <p className="m-0 leading-tight">
              Banyumas, {reportData?.dateFormatted || "19 Oktober 2026"}
            </p>
            <p className="font-bold m-0 leading-tight">{activeTeacher.role}</p>
            <div className="h-14 flex items-end justify-center">
              {/* Ruang TTD */}
            </div>
            <p className="font-bold underline uppercase m-0 leading-tight text-[11.5px]">
              {activeTeacher.name}
            </p>
            <p className="text-[10px] font-mono m-0 mt-0.5 text-slate-700">
              {activeTeacher.nip}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Running Footer di Setiap Halaman
  const renderRunningFooter = (pageNum: number, total: number) => (
    <div className="border-t border-slate-300 pt-1 mt-auto text-[8.5px] text-slate-500 flex justify-between items-center font-serif">
      <span>
        SIMATA {activeHeadmaster.code} Dawuhan •{" "}
        {selectedKelas !== "all"
          ? `Dokumen Laporan ${selectedKelas}`
          : "Rekapitulasi Dokumen Resmi"}{" "}
        Pembiasaan Siswa
      </span>
      <span className="font-bold text-slate-700">
        Kertas F4 Landscape (330 × 215 mm) • Halaman {pageNum} dari {total}
      </span>
    </div>
  );

  // Helper render foto tunggal
  const renderPhotoCard = ({
    item,
    photoIdx,
    cardHeight,
    imageHeight,
    showSubInfo = false,
  }: {
    item: FlattenedMediaItem;
    photoIdx: number;
    cardHeight: string;
    imageHeight: string;
    showSubInfo?: boolean;
  }) => {
    const { sub, file } = item;
    const imageProxySrc = `/api/proxy-image?fileId=${encodeURIComponent(
      file.driveFileId || ""
    )}&url=${encodeURIComponent(file.driveThumbnailUrl || "")}`;

    return (
      <div
        key={file.id}
        className="border border-slate-300 rounded-lg p-1.5 bg-white shadow-none overflow-hidden flex flex-col justify-between group transition-shadow hover:shadow-sm"
        style={{
          height: cardHeight,
          boxSizing: "border-box",
        }}
      >
        {/* Gambar Foto */}
        <div
          className="w-full bg-slate-100 rounded border border-slate-200 overflow-hidden relative flex items-center justify-center shrink-0 cursor-pointer"
          style={{
            height: imageHeight,
            minHeight: imageHeight,
            maxHeight: imageHeight,
          }}
          onClick={() =>
            setModalImage({
              src: imageProxySrc,
              title: file.fileName,
              rombel: `${sub.kelas} (${sub.madrasah})`,
              notes: sub.notes,
            })
          }
          title="Klik untuk memperbesar pratinjau di layar"
        >
          <img
            src={imageProxySrc}
            alt={file.fileName}
            className="h-full w-full object-cover object-center"
            crossOrigin="anonymous"
            loading="eager"
          />

          {/* Badge Nomor Foto */}
          <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[8px] font-bold font-sans tracking-wide shadow-sm flex items-center gap-1">
            <ImageIcon className="h-2.5 w-2.5" />
            <span>Foto #{photoIdx + 1}</span>
          </div>

          {/* Waktu Kirim Mengambang */}
          <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm text-slate-800 px-1 py-0.5 rounded text-[7.5px] font-mono font-bold shadow-sm">
            {sub.timeFormatted}
          </div>
        </div>

        {/* Informasi Keterangan di Bawah Foto */}
        <div className="w-full flex items-center justify-between text-[8px] text-slate-600 font-sans pt-1 px-0.5 shrink-0 truncate">
          <div className="truncate flex items-center gap-1">
            {showSubInfo ? (
              <span className="font-bold text-black truncate">
                {sub.kelas} • {sub.submitterName}
              </span>
            ) : (
              <span className="truncate text-slate-700">
                Wali Kelas: <strong className="text-black font-semibold">{sub.submitterName}</strong>
              </span>
            )}
          </div>
          <span className="text-[7.5px] font-mono text-slate-400 shrink-0 ml-1">
            {file.fileSize ? formatBytes(file.fileSize) : "Tersimpan"}
          </span>
        </div>
      </div>
    );
  };

  let pageCounter = 1;

  return (
    <div className="space-y-6">
      {/* CSS Khusus Kertas F4 Landscape (330mm x 215mm) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 330mm 215mm; /* Standar Ukuran Kertas F4 / Folio Landscape */
            margin: 0 !important;
          }

          html,
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 330mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Sembunyikan elemen dashboard non-cetak */
          header,
          aside,
          nav,
          .no-print,
          button,
          .toast,
          footer {
            display: none !important;
          }

          .f4-landscape-page {
            width: 330mm !important;
            min-width: 330mm !important;
            max-width: 330mm !important;
            height: 215mm !important;
            min-height: 215mm !important;
            max-height: 215mm !important;
            padding: 8mm 12mm !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }

          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #000000 !important;
            padding: 4px 6px !important;
            font-size: 10pt !important;
          }

          .print-table th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* Control Panel Filter & Cetak (Sembunyi saat print) */}
      <Card className="no-print border-emerald-100 dark:border-emerald-950 shadow-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 border-b border-emerald-100/80 dark:border-emerald-950/60 pb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Penyusun Laporan Dokumentasi</span>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                    F4 Landscape (330 × 215 mm)
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Susun dokumentasi foto kegiatan secara rapi per kelas/rombel, lengkap dengan catatan refleksi wali kelas dan unduhan PDF langsung.
                </CardDescription>
              </div>
            </div>

            {/* Tombol Aksi Utama: Unduh PDF Langsung & Cetak Printer */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadReport(false)}
                disabled={isPending || isExportingPdf}
                className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 gap-1.5 cursor-pointer"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isPending || isExportingPdf}
                className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 gap-1.5 cursor-pointer"
                title="Buka dialog cetak printer jika ingin mencetak fisik"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Printer</span>
              </Button>

              {/* TOMBOL UTAMA: UNDUH LANGSUNG PDF */}
              <Button
                onClick={handleDirectDownloadPdf}
                disabled={isPending || isExportingPdf}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold px-5 py-2 shadow-lg shadow-emerald-600/25 gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Berkas PDF (Langsung)</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Baris Pemilihan Mode Periode & Banner Laporan Per Kelas */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Periode Laporan:
                </span>
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setDateMode("single")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      dateMode === "single"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Harian (1 Tanggal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode("range")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      dateMode === "range"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Rentang Periode (Banyak Hari)
                  </button>
                </div>
              </div>

              {selectedKelas !== "all" && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs py-1 px-3 font-bold gap-1.5">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>Laporan Khusus: <strong>{selectedKelas}</strong></span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedKelas("all")}
                    className="h-7 text-xs border-slate-300 dark:border-slate-700 text-slate-700 hover:text-slate-900 rounded-lg cursor-pointer"
                  >
                    ✕ Tampilkan Semua Rombel
                  </Button>
                </div>
              )}
            </div>

            {/* Grid Form Filter Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Pilih Kategori */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kategori Kegiatan
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 font-bold">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Pilih Tanggal (Harian atau Rentang Periode) */}
              {dateMode === "single" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tanggal Kegiatan
                  </Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 font-bold pl-9"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rentang Tanggal Kegiatan
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 font-bold px-2"
                      title="Dari Tanggal"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 font-bold px-2"
                      title="Sampai Tanggal"
                    />
                  </div>
                </div>
              )}

              {/* 3. Filter Satuan Madrasah */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Satuan Madrasah
                </Label>
                <Select value={selectedMadrasah} onValueChange={setSelectedMadrasah}>
                  <SelectTrigger className="rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 font-bold">
                    <SelectValue placeholder="Semua Madrasah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      Semua Madrasah (MI 01 & MI 02)
                    </SelectItem>
                    {initialMadrasahs.map((m) => (
                      <SelectItem key={m.id} value={m.name} className="text-xs font-semibold">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Filter Rombel / Kelas Khusus */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Filter Rombel / Kelas
                </Label>
                <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                  <SelectTrigger className="rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 font-bold">
                    <SelectValue placeholder="Semua Rombel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-semibold">
                      Semua Rombel ({rombelGroups.length} Rombel)
                    </SelectItem>
                    {availableClasses.map((cls) => {
                      const count = submissionCountByClass[cls] || 0;
                      return (
                        <SelectItem key={cls} value={cls} className="text-xs font-semibold">
                          {cls} {count > 0 ? `(${count} terdata)` : "(0)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bilah Navigasi Cepat Kelas (Pills / Quick Buttons) */}
            <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Navigasi Cepat Laporan Per Kelas:</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  Pilih rombel untuk menyusun laporan kelas & unduh PDF khusus rombel tersebut
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedKelas("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedKelas === "all"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-600/30"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Semua Rombel</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedKelas === "all"
                        ? "bg-emerald-800 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {rombelGroups.length}
                  </span>
                </button>

                {availableClasses.map((cls) => {
                  const isSelected = selectedKelas.toLowerCase() === cls.toLowerCase();
                  const count = submissionCountByClass[cls] || 0;

                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedKelas(cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-600/30"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{cls}</span>
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected
                            ? "bg-emerald-800 text-white"
                            : count > 0
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        }`}
                      >
                        {count > 0 ? `✓ ${count}` : "0"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Opsi Format Tampilan Foto Per Rombel */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                <span>Format Pengelompokan Foto Kegiatan</span>
              </div>

              {/* Mode Foto Selector Buttons */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPhotoLayoutMode("rombel-full")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    photoLayoutMode === "rombel-full"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                  title="Format Eksklusif: Setiap rombel ditampilkan dalam 1 halaman F4 penuh dengan foto besar & catatan kegiatan"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Per Rombel (1 Rombel / Hal)</span>
                  <span className="text-[9px] bg-emerald-800/50 text-white px-1.5 py-0.2 rounded font-mono">
                    Rekomendasi
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPhotoLayoutMode("rombel-compact")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    photoLayoutMode === "rombel-compact"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                  title="Format Kompak: 2 rombel per halaman untuk menghemat kertas cetak"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Per Rombel Kompak (2 Rombel / Hal)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPhotoLayoutMode("grid-flat")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    photoLayoutMode === "grid-flat"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                  title="Format Grid Campuran: 6 foto per halaman tanpa pemisahan blok kelas"
                >
                  <Grid className="h-3.5 w-3.5" />
                  <span>Grid Campuran (6 Foto)</span>
                </button>
              </div>
            </div>

            {/* Checkbox Kelengkapan Dokumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Sertakan Lampiran Foto
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeVideos}
                  onChange={(e) => setIncludeVideos(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Sertakan Link Video Drive
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Sertakan Catatan Refleksi
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Sertakan Lembar Pengesahan
                </span>
              </label>
            </div>

            {/* Input Pejabat Penandatangan: Kepala MI 01, Kepala MI 02, dan Guru yang Mengisi */}
            {includeSignatures && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                {/* Header & Mode Switcher Kepala Madrasah */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white m-0">
                        Pengaturan Tanda Tangan: Kepala Madrasah (MI 01 & MI 02) & Guru Pengisi
                      </p>
                      <p className="text-[11px] text-muted-foreground m-0">
                        Nama dan NIP otomatis tersimpan di peramban (browser) untuk pencetakan berikutnya.
                      </p>
                    </div>
                  </div>

                  {/* Switcher Kepala Madrasah yang dicantumkan */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 uppercase tracking-tight">
                      TTD Kepala:
                    </span>
                    <button
                      type="button"
                      onClick={() => setHeadmasterChoice("auto")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        headmasterChoice === "auto"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      }`}
                      title={`Otomatis mendeteksi berdasarkan rombel atau filter (Saat ini: ${detectedMadrasahCode})`}
                    >
                      Otomatis ({detectedMadrasahCode})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeadmasterChoice("MI01")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        headmasterChoice === "MI01"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      }`}
                    >
                      MI 01
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeadmasterChoice("MI02")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        headmasterChoice === "MI02"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      }`}
                    >
                      MI 02
                    </button>
                  </div>
                </div>

                {/* 3 Kolom Pengaturan: MI 01, MI 02, dan Guru Pengisi */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Kartu 1: Kepala Madrasah MI 01 */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      activeMadrasahCode === "MI01"
                        ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Kepala MI 01 Dawuhan
                        </span>
                      </div>
                      {activeMadrasahCode === "MI01" ? (
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Aktif
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setHeadmasterChoice("MI01")}
                          className="text-[10px] text-slate-500 hover:text-emerald-700 font-bold underline cursor-pointer"
                        >
                          Gunakan
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          Nama & Gelar:
                        </Label>
                        <Input
                          value={headmaster01Name}
                          onChange={(e) =>
                            handleUpdateHeadmaster01(e.target.value, headmaster01Nip)
                          }
                          placeholder="Nama Kepala MI 01"
                          className="h-8 text-xs rounded-lg mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          NIP:
                        </Label>
                        <Input
                          value={headmaster01Nip}
                          onChange={(e) =>
                            handleUpdateHeadmaster01(headmaster01Name, e.target.value)
                          }
                          placeholder="NIP Kepala MI 01"
                          className="h-8 text-xs rounded-lg font-mono mt-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kartu 2: Kepala Madrasah MI 02 */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      activeMadrasahCode === "MI02"
                        ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Kepala MI 02 Dawuhan
                        </span>
                      </div>
                      {activeMadrasahCode === "MI02" ? (
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Aktif
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setHeadmasterChoice("MI02")}
                          className="text-[10px] text-slate-500 hover:text-emerald-700 font-bold underline cursor-pointer"
                        >
                          Gunakan
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          Nama & Gelar:
                        </Label>
                        <Input
                          value={headmaster02Name}
                          onChange={(e) =>
                            handleUpdateHeadmaster02(e.target.value, headmaster02Nip)
                          }
                          placeholder="Nama Kepala MI 02"
                          className="h-8 text-xs rounded-lg mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          NIP:
                        </Label>
                        <Input
                          value={headmaster02Nip}
                          onChange={(e) =>
                            handleUpdateHeadmaster02(headmaster02Name, e.target.value)
                          }
                          placeholder="NIP Kepala MI 02"
                          className="h-8 text-xs rounded-lg font-mono mt-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kartu 3: Guru yang Mengisi */}
                  <div className="p-3 rounded-xl border bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Guru yang Mengisi
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Sisi Kanan
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          Nama Guru:
                        </Label>
                        {selectedClassInfo?.submitterName &&
                          teacherCustomName !== selectedClassInfo.submitterName && (
                            <button
                              type="button"
                              onClick={() => setTeacherCustomName(selectedClassInfo.submitterName)}
                              className="text-[9.5px] text-emerald-700 hover:underline cursor-pointer"
                              title="Kembalikan ke nama guru dari data pengisian"
                            >
                              Reset ke Submisi
                            </button>
                          )}
                      </div>
                      <Input
                        value={teacherCustomName}
                        onChange={(e) => setTeacherCustomName(e.target.value)}
                        placeholder={
                          selectedClassInfo?.submitterName || "Nama Guru yang Mengisi"
                        }
                        className="h-8 text-xs rounded-lg mt-0.5 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          Label Jabatan:
                        </Label>
                        <Input
                          value={teacherRoleTitle}
                          onChange={(e) => handleUpdateTeacherRole(e.target.value)}
                          placeholder="Guru yang Mengisi"
                          className="h-8 text-xs rounded-lg mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium">
                          NIP:
                        </Label>
                        <Input
                          value={teacherNip}
                          onChange={(e) => handleUpdateTeacherNip(e.target.value)}
                          placeholder="NIP Guru (-)"
                          className="h-8 text-xs rounded-lg font-mono mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bar Kontrol Zoom & Info Kertas */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Info className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Format Standar Dokumen: <strong>Kertas F4 / Folio Mendatar (330 × 215 mm)</strong>. Total{" "}
                <strong>{totalPages} Halaman</strong> tersusun rapi per rombel.
              </span>
            </div>

            {/* Zoom Selector untuk kemudahan membaca di layar */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="text-[11px] px-2 text-muted-foreground">Skala Tampilan:</span>
              <button
                type="button"
                onClick={() => setPreviewZoom(70)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  previewZoom === 70
                    ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                    : ""
                }`}
              >
                70%
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(85)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  previewZoom === 85
                    ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                    : ""
                }`}
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  previewZoom === 100
                    ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                    : ""
                }`}
              >
                100% (Asli)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          PRATINJAU DOKUMEN F4 LANDSCAPE (330mm x 215mm)
          ========================================================================= */}
      <div className="bg-slate-200/80 dark:bg-slate-950/80 p-4 sm:p-8 rounded-3xl border border-slate-300/80 dark:border-slate-800 overflow-x-auto select-text shadow-inner">
        <div
          id="report-zoom-container"
          className="flex flex-col items-center gap-8 mx-auto origin-top transition-transform duration-200"
          style={{
            transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : "none",
            transformOrigin: "top center",
          }}
        >
          {/* =====================================================================
              HALAMAN 1: KOP SURAT, JUDUL, RINGKASAN, & TABEL REKAPITULASI
              ===================================================================== */}
          <div
            className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
            style={{
              width: "330mm",
              height: "215mm",
              padding: "8mm 12mm",
              boxSizing: "border-box",
              backgroundColor: "#ffffff",
              color: "#000000",
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            <div>
              {/* Kop Surat Resmi */}
              {renderOfficialKop()}

              {/* Judul Dokumen Laporan */}
              <div className="text-center my-1.5 space-y-0.5">
                <h2 className="text-[12.5px] font-black uppercase tracking-wider underline underline-offset-4 decoration-2">
                  {selectedKelas !== "all"
                    ? "LAPORAN DOKUMENTASI KEGIATAN PEMBIASAAN SISWA"
                    : "LAPORAN REKAPITULASI DOKUMENTASI KEGIATAN PEMBIASAAN SISWA"}
                </h2>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-800">
                  PROGRAM: {currentCategoryName}
                  {selectedKelas !== "all" && (
                    <span className="text-emerald-900 font-black ml-1.5">
                      • ROMBEL: {selectedKelas.toUpperCase()}
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-center gap-3 text-[10px] text-slate-700 font-semibold pt-0.5">
                  <span>
                    Hari / Tanggal: <strong>{reportData?.dateFormatted || "Hari Ini"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Satuan Pendidikan:{" "}
                    <strong>
                      {selectedClassInfo?.madrasah ||
                        (selectedMadrasah === "all"
                          ? "MI Bustanul Huda 01 & 02 Dawuhan"
                          : selectedMadrasah)}
                    </strong>
                  </span>
                  {selectedKelas !== "all" && selectedClassInfo?.submitterName && (
                    <>
                      <span>•</span>
                      <span>
                        Wali Kelas:{" "}
                        <strong className="text-emerald-950 font-bold">
                          {selectedClassInfo.submitterName}
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Ringkasan Statistik Cepat */}
              {selectedKelas !== "all" ? (
                /* Ringkasan Khusus Rombel / Kelas Terpilih */
                <div className="my-1.5 p-2 rounded-lg border-2 border-emerald-800/30 bg-emerald-50/50 text-[10px] flex items-center justify-around text-center">
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">
                      Rombel / Kelas
                    </span>
                    <strong className="text-xs font-black text-emerald-950 uppercase">
                      {selectedKelas}
                    </strong>
                  </div>
                  <div className="border-r border-emerald-300 h-5"></div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">
                      Wali Kelas
                    </span>
                    <strong className="text-xs font-black text-black">
                      {selectedClassInfo?.submitterName || "Belum Mengisi"}
                    </strong>
                  </div>
                  <div className="border-r border-emerald-300 h-5"></div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">
                      Jumlah Siswa Hadir
                    </span>
                    <strong className="text-xs font-black text-slate-900">
                      {selectedClassInfo?.studentCount
                        ? `${selectedClassInfo.studentCount} Siswa`
                        : "-"}
                    </strong>
                  </div>
                  <div className="border-r border-emerald-300 h-5"></div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">
                      Dokumentasi Terlampir
                    </span>
                    <strong className="text-xs font-black text-emerald-800">
                      {flatPhotos.length} Foto • {flatVideos.length} Video
                    </strong>
                  </div>
                </div>
              ) : (
                /* Ringkasan Semua Rombel Gabungan */
                <div className="my-1.5 p-1.5 rounded-lg border border-slate-300 bg-slate-50/80 text-[10px] flex items-center justify-around text-center">
                  <div>
                    <span className="text-[8.5px] text-slate-500 uppercase font-bold block">
                      Total Rombel
                    </span>
                    <strong className="text-xs font-black text-black">
                      {submissionsList.length} Rombel Terdata
                    </strong>
                  </div>
                  <div className="border-r border-slate-300 h-5"></div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 uppercase font-bold block">
                      Dokumentasi Foto & Video
                    </span>
                    <strong className="text-xs font-black text-emerald-800">
                      {flatPhotos.length} Foto • {flatVideos.length} Video Terarsip
                    </strong>
                  </div>
                  <div className="border-r border-slate-300 h-5"></div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 uppercase font-bold block">
                      Penyimpanan & Keamanan
                    </span>
                    <strong className="text-xs font-black text-teal-800">
                      Google Drive Cloud Resmi Madrasah
                    </strong>
                  </div>
                </div>
              )}

              {/* Catatan Refleksi Khusus Kelas Terpilih */}
              {selectedKelas !== "all" && includeNotes && selectedClassInfo?.notes && (
                <div className="my-1.5 p-2 rounded-lg border border-emerald-300 bg-emerald-50/60 text-[9.5px] text-slate-800 leading-snug font-serif">
                  <div className="flex items-center gap-1.5 font-sans font-bold text-emerald-900 text-[10px] mb-0.5">
                    <Quote className="h-3 w-3" />
                    <span>Catatan Refleksi & Pembiasaan dari Wali Kelas:</span>
                  </div>
                  <p className="italic m-0 pl-4 border-l-2 border-emerald-700">
                    "{selectedClassInfo.notes}"
                  </p>
                </div>
              )}

              {/* Bagian I: Tabel Rekapitulasi Rombel atau Detail Kelas */}
              <div className="mt-1.5">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[10.5px] font-black uppercase tracking-wide text-slate-900 m-0">
                    {selectedKelas !== "all"
                      ? `I. Rincian Pelaksanaan Pembiasaan: ${selectedKelas}`
                      : "I. Rekapitulasi Kehadiran & Partisipasi Rombel"}
                  </h4>
                  {selectedKelas !== "all" && (
                    <span className="text-[9px] text-emerald-800 font-sans font-bold no-print">
                      Mode Laporan Per Kelas
                    </span>
                  )}
                </div>

                {primaryTableRows.length > 0 ? (
                  <table className="print-table w-full border border-black text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black text-[10px]">
                        <th className="p-1 border border-black text-center w-8">No</th>
                        <th className="p-1 border border-black text-center w-24">
                          {selectedKelas !== "all" ? "Tanggal / Hari" : "Rombel / Kelas"}
                        </th>
                        <th className="p-1 border border-black w-44">Satuan Pendidikan</th>
                        <th className="p-1 border border-black w-40">Nama Wali Kelas</th>
                        <th className="p-1 border border-black text-center w-20">Siswa</th>
                        <th className="p-1 border border-black text-center w-24">Waktu</th>
                        <th className="p-1 border border-black text-center w-28">Dokumentasi</th>
                        {includeNotes && (
                          <th className="p-1 border border-black">Catatan Refleksi / Pembiasaan</th>
                        )}
                        {selectedKelas === "all" && (
                          <th className="p-1 border border-black text-center w-20 no-print">
                            Aksi
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {primaryTableRows.map((item, idx) => {
                        const pCount = item.files.filter(
                          (f) =>
                            f.fileType === "IMAGE" ||
                            (!f.fileType?.includes("VIDEO") &&
                              !f.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
                        ).length;

                        const vCount = item.files.filter(
                          (f) =>
                            f.fileType === "VIDEO" ||
                            Boolean(f.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
                        ).length;

                        return (
                          <tr key={item.id} className="border-b border-black text-[9.5px]">
                            <td className="p-1 border border-black text-center font-mono">
                              {idx + 1}
                            </td>
                            <td className="p-1 border border-black text-center font-bold">
                              {selectedKelas !== "all" ? item.dateFormatted : item.kelas}
                            </td>
                            <td className="p-1 border border-black">
                              {item.madrasah.includes("01")
                                ? "MI Bustanul Huda 01 Dawuhan"
                                : "MI Bustanul Huda 02 Dawuhan"}
                            </td>
                            <td className="p-1 border border-black font-semibold">
                              {item.submitterName}
                            </td>
                            <td className="p-1 border border-black text-center font-mono">
                              {item.studentCount ? `${item.studentCount}` : "-"}
                            </td>
                            <td className="p-1 border border-black text-center font-mono">
                              {item.timeFormatted}
                            </td>
                            <td className="p-1 border border-black text-center font-bold">
                              {pCount > 0 && <span>{pCount} Foto</span>}
                              {pCount > 0 && vCount > 0 && <span className="text-slate-400"> • </span>}
                              {vCount > 0 && (
                                <span className="text-blue-800 font-semibold">{vCount} Video</span>
                              )}
                              {pCount === 0 && vCount === 0 && (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            {includeNotes && (
                              <td className="p-1 border border-black leading-snug">
                                {item.notes || "-"}
                              </td>
                            )}
                            {selectedKelas === "all" && (
                              <td className="p-1 border border-black text-center no-print">
                                <button
                                  type="button"
                                  onClick={() => setSelectedKelas(item.kelas)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1 shadow-sm"
                                  title={`Susun & unduh laporan khusus ${item.kelas}`}
                                >
                                  <FileCheck2 className="h-2.5 w-2.5" />
                                  <span>Laporan</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl">
                    <p className="text-xs text-slate-500 italic">
                      {selectedKelas !== "all"
                        ? `Belum ada pengisian kegiatan untuk ${selectedKelas} pada ${reportData?.dateFormatted || selectedDate}.`
                        : `Belum ada data pengisian kegiatan pada tanggal ${reportData?.dateFormatted || selectedDate}.`}
                    </p>
                  </div>
                )}
              </div>

              {/* Tanda Tangan di Halaman 1 jika laporan hanya 1 halaman */}
              {totalPages === 1 && includeSignatures && renderSignatures()}
            </div>

            {/* Footer Halaman 1 */}
            {renderRunningFooter(pageCounter++, totalPages)}
          </div>

          {/* =====================================================================
              HALAMAN 1B: OVERFLOW TABEL SUBMISI (JIKA SUBMISI > 8)
              ===================================================================== */}
          {hasOverflowTable && (
            <div
              className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
              style={{
                width: "330mm",
                height: "215mm",
                padding: "8mm 12mm",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontFamily: "'Times New Roman', Times, serif",
              }}
            >
              <div>
                {renderRunningHeader("Lanjutan Rekapitulasi Rombel")}

                <div className="mt-2">
                  <h4 className="text-[11px] font-black uppercase mb-1.5 tracking-wide text-slate-900">
                    {selectedKelas !== "all"
                      ? `I. Rincian Pelaksanaan Pembiasaan: ${selectedKelas} (Lanjutan)`
                      : "I. Rekapitulasi Kehadiran & Partisipasi Rombel (Lanjutan)"}
                  </h4>

                  <table className="print-table w-full border border-black text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black text-[10px]">
                        <th className="p-1 border border-black text-center w-8">No</th>
                        <th className="p-1 border border-black text-center w-24">
                          {selectedKelas !== "all" ? "Tanggal / Hari" : "Rombel / Kelas"}
                        </th>
                        <th className="p-1 border border-black w-44">Satuan Pendidikan</th>
                        <th className="p-1 border border-black w-40">Nama Wali Kelas</th>
                        <th className="p-1 border border-black text-center w-20">Siswa</th>
                        <th className="p-1 border border-black text-center w-24">Waktu</th>
                        <th className="p-1 border border-black text-center w-28">Dokumentasi</th>
                        {includeNotes && (
                          <th className="p-1 border border-black">Catatan Refleksi / Pembiasaan</th>
                        )}
                        {selectedKelas === "all" && (
                          <th className="p-1 border border-black text-center w-20 no-print">
                            Aksi
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {overflowTableRows.map((item, idx) => {
                        const pCount = item.files.filter(
                          (f) =>
                            f.fileType === "IMAGE" ||
                            (!f.fileType?.includes("VIDEO") &&
                              !f.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
                        ).length;

                        const vCount = item.files.filter(
                          (f) =>
                            f.fileType === "VIDEO" ||
                            Boolean(f.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
                        ).length;

                        return (
                          <tr key={item.id} className="border-b border-black text-[9.5px]">
                            <td className="p-1 border border-black text-center font-mono">
                              {idx + 9}
                            </td>
                            <td className="p-1 border border-black text-center font-bold">
                              {selectedKelas !== "all" ? item.dateFormatted : item.kelas}
                            </td>
                            <td className="p-1 border border-black">
                              {item.madrasah.includes("01")
                                ? "MI Bustanul Huda 01 Dawuhan"
                                : "MI Bustanul Huda 02 Dawuhan"}
                            </td>
                            <td className="p-1 border border-black font-semibold">
                              {item.submitterName}
                            </td>
                            <td className="p-1 border border-black text-center font-mono">
                              {item.studentCount ? `${item.studentCount}` : "-"}
                            </td>
                            <td className="p-1 border border-black text-center font-mono">
                              {item.timeFormatted}
                            </td>
                            <td className="p-1 border border-black text-center font-bold">
                              {pCount > 0 && <span>{pCount} Foto</span>}
                              {pCount > 0 && vCount > 0 && <span className="text-slate-400"> • </span>}
                              {vCount > 0 && (
                                <span className="text-blue-800 font-semibold">{vCount} Video</span>
                              )}
                              {pCount === 0 && vCount === 0 && (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            {includeNotes && (
                              <td className="p-1 border border-black leading-snug">
                                {item.notes || "-"}
                              </td>
                            )}
                            {selectedKelas === "all" && (
                              <td className="p-1 border border-black text-center no-print">
                                <button
                                  type="button"
                                  onClick={() => setSelectedKelas(item.kelas)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1 shadow-sm"
                                  title={`Susun & unduh laporan khusus ${item.kelas}`}
                                >
                                  <FileCheck2 className="h-2.5 w-2.5" />
                                  <span>Laporan</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* TTD jika tidak ada lampiran foto & video */}
                {rombelsWithPhotos.length === 0 && !hasVideoPage && includeSignatures && renderSignatures()}
              </div>

              {renderRunningFooter(pageCounter++, totalPages)}
            </div>
          )}

          {/* =====================================================================
              MODE 1: LAMPIRAN FOTO PER ROMBEL (1 ROMBEL PER HALAMAN F4)
              ===================================================================== */}
          {includePhotos &&
            photoLayoutMode === "rombel-full" &&
            rombelFullPages.map((page, idx) => {
              const { rombel: rg, photos: pList, partIndex, totalParts } = page;
              const photoCount = pList.length;

              return (
                <div
                  key={`rombel-full-${rg.key}-${partIndex}`}
                  className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
                  style={{
                    width: "330mm",
                    height: "215mm",
                    padding: "8mm 12mm",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontFamily: "'Times New Roman', Times, serif",
                  }}
                >
                  <div>
                    {renderRunningHeader(
                      `Dokumentasi Foto: ${rg.cleanKelas} (${idx + 1} dari ${rombelFullPages.length})`
                    )}

                    {/* Banner Header Rombel / Kelas yang Rapi & Elegan */}
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-900 text-white font-sans font-black text-[12px] px-3 py-1 rounded-md tracking-wider uppercase shadow-sm">
                            {rg.cleanKelas}
                          </span>
                          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
                            {rg.madrasah}
                          </span>
                          {totalParts > 1 && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                              Bagian {partIndex + 1} dari {totalParts}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[9.5px] text-slate-700 font-sans">
                          <span>
                            Wali Kelas:{" "}
                            <strong className="text-black font-bold">{rg.submitterName}</strong>
                          </span>
                          {rg.studentCount && (
                            <>
                              <span>•</span>
                              <span>
                                Siswa: <strong>{rg.studentCount} Siswa</strong>
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-mono text-slate-600">{rg.timeFormatted}</span>
                        </div>
                      </div>

                      {/* Catatan Pembiasaan / Refleksi Wali Kelas */}
                      {includeNotes && rg.notes && (
                        <div className="bg-emerald-50/70 border-l-4 border-emerald-700 px-3 py-1.5 rounded-r-md text-[9px] text-slate-800 italic leading-snug font-serif">
                          <span className="font-bold text-emerald-900 not-italic mr-1.5 font-sans">
                            Catatan Kegiatan / Refleksi:
                          </span>
                          "{rg.notes}"
                        </div>
                      )}
                    </div>

                    {/* Galeri Foto Adaptif Sesuai Jumlah Foto Rombel */}
                    <div className="w-full">
                      {/* Kasus 1 Foto: Tampilan Pusat Megah */}
                      {photoCount === 1 && (
                        <div className="flex justify-center items-center py-1">
                          <div style={{ width: "220mm" }}>
                            {renderPhotoCard({
                              item: pList[0],
                              photoIdx: 0,
                              cardHeight: "130mm",
                              imageHeight: "112mm",
                            })}
                          </div>
                        </div>
                      )}

                      {/* Kasus 2 Foto: 2 Kolom Berdampingan Seimbang */}
                      {photoCount === 2 && (
                        <div className="grid grid-cols-2 gap-4 py-1">
                          {pList.map((item, pIdx) =>
                            renderPhotoCard({
                              item,
                              photoIdx: pIdx,
                              cardHeight: "128mm",
                              imageHeight: "110mm",
                            })
                          )}
                        </div>
                      )}

                      {/* Kasus 3 Foto: 3 Kolom Berjajar Rapi */}
                      {photoCount === 3 && (
                        <div className="grid grid-cols-3 gap-3.5 py-1">
                          {pList.map((item, pIdx) =>
                            renderPhotoCard({
                              item,
                              photoIdx: pIdx,
                              cardHeight: "122mm",
                              imageHeight: "105mm",
                            })
                          )}
                        </div>
                      )}

                      {/* Kasus 4 Foto: Grid 2 Kolom x 2 Baris */}
                      {photoCount === 4 && (
                        <div className="grid grid-cols-2 gap-3 py-1">
                          {pList.map((item, pIdx) =>
                            renderPhotoCard({
                              item,
                              photoIdx: pIdx,
                              cardHeight: "68mm",
                              imageHeight: "53mm",
                            })
                          )}
                        </div>
                      )}

                      {/* Kasus 5 atau 6 Foto: Grid 3 Kolom x 2 Baris Presisi */}
                      {photoCount >= 5 && (
                        <div className="grid grid-cols-3 gap-3 py-1">
                          {pList.map((item, pIdx) =>
                            renderPhotoCard({
                              item,
                              photoIdx: pIdx,
                              cardHeight: "68mm",
                              imageHeight: "53mm",
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {renderRunningFooter(pageCounter++, totalPages)}
                </div>
              );
            })}

          {/* =====================================================================
              MODE 2: LAMPIRAN FOTO PER ROMBEL KOMPAK (2 ROMBEL PER HALAMAN)
              ===================================================================== */}
          {includePhotos &&
            photoLayoutMode === "rombel-compact" &&
            rombelCompactPairs.map((pair, pairIdx) => (
              <div
                key={`rombel-compact-page-${pairIdx}`}
                className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
                style={{
                  width: "330mm",
                  height: "215mm",
                  padding: "8mm 12mm",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                <div>
                  {renderRunningHeader(
                    `Dokumentasi Foto Per Rombel (Halaman ${pairIdx + 1} dari ${
                      rombelCompactPairs.length
                    })`
                  )}

                  <div className="space-y-3 mt-1">
                    {pair.map((rg, rgIdx) => {
                      const displayPhotos = rg.photos.slice(0, 4);

                      return (
                        <div
                          key={rg.key}
                          className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/50"
                          style={{
                            height: "86mm",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          {/* Mini Header Rombel */}
                          <div className="shrink-0 mb-1.5">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-900 text-white font-sans font-black text-[10.5px] px-2 py-0.5 rounded tracking-wide uppercase">
                                  {rg.cleanKelas}
                                </span>
                                <span className="text-[10px] font-bold text-slate-800">
                                  {rg.madrasah}
                                </span>
                                {rg.studentCount && (
                                  <span className="text-[9px] text-slate-500 font-sans">
                                    • {rg.studentCount} Siswa
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-700 font-sans">
                                Wali Kelas:{" "}
                                <strong className="text-black font-semibold">
                                  {rg.submitterName}
                                </strong>{" "}
                                • <span className="font-mono">{rg.timeFormatted}</span>
                              </div>
                            </div>

                            {includeNotes && rg.notes && (
                              <p className="text-[8.5px] text-slate-600 italic line-clamp-1 mt-1 font-serif">
                                "{rg.notes}"
                              </p>
                            )}
                          </div>

                          {/* Foto-Foto Rombel (Maks 4 foto berjajar dalam 1 baris) */}
                          <div
                            className={`grid gap-2.5 shrink-0 ${
                              displayPhotos.length === 1
                                ? "grid-cols-1 max-w-sm mx-auto"
                                : displayPhotos.length === 2
                                ? "grid-cols-2"
                                : displayPhotos.length === 3
                                ? "grid-cols-3"
                                : "grid-cols-4"
                            }`}
                          >
                            {displayPhotos.map((item, pIdx) =>
                              renderPhotoCard({
                                item,
                                photoIdx: pIdx,
                                cardHeight: "58mm",
                                imageHeight: "45mm",
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {renderRunningFooter(pageCounter++, totalPages)}
              </div>
            ))}

          {/* =====================================================================
              MODE 3: LAMPIRAN FOTO GRID CAMPURAN (6 FOTO PER HALAMAN)
              ===================================================================== */}
          {includePhotos &&
            photoLayoutMode === "grid-flat" &&
            photoChunksFlat.map((chunk, chunkIdx) => (
              <div
                key={`photo-flat-${chunkIdx}`}
                className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
                style={{
                  width: "330mm",
                  height: "215mm",
                  padding: "8mm 12mm",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                <div>
                  {renderRunningHeader(
                    `Lampiran Foto Dokumentasi (Bagian ${chunkIdx + 1} dari ${
                      photoChunksFlat.length
                    })`
                  )}

                  <div className="mt-1">
                    <h4 className="text-[11px] font-black uppercase mb-2 tracking-wide text-slate-900 flex items-center justify-between">
                      <span>
                        II. Lampiran Foto Dokumentasi Kegiatan Siswa ({chunkIdx * 6 + 1} -{" "}
                        {Math.min((chunkIdx + 1) * 6, flatPhotos.length)} dari {flatPhotos.length})
                      </span>
                      <span className="text-[9.5px] font-normal lowercase text-slate-500 italic">
                        Diunggah oleh Wali Kelas melalui SIMATA
                      </span>
                    </h4>

                    {/* Grid 3 Kolom x 2 Baris Presisi */}
                    <div className="grid grid-cols-3 gap-3">
                      {chunk.map((item, pIdx) =>
                        renderPhotoCard({
                          item,
                          photoIdx: chunkIdx * 6 + pIdx,
                          cardHeight: "72mm",
                          imageHeight: "56mm",
                          showSubInfo: true,
                        })
                      )}
                    </div>
                  </div>
                </div>

                {renderRunningFooter(pageCounter++, totalPages)}
              </div>
            ))}

          {/* =====================================================================
              HALAMAN LAMPIRAN VIDEO GOOGLE DRIVE (JIKA ADA)
              ===================================================================== */}
          {hasVideoPage && (
            <div
              className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
              style={{
                width: "330mm",
                height: "215mm",
                padding: "8mm 12mm",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontFamily: "'Times New Roman', Times, serif",
              }}
            >
              <div>
                {renderRunningHeader("Lampiran Tautan Video Google Drive")}

                <div className="mt-2">
                  <h4 className="text-[11px] font-black uppercase mb-1.5 tracking-wide text-slate-900 flex items-center justify-between">
                    <span>
                      {includePhotos && flatPhotos.length > 0 ? "III." : "II."} Tautan / Link Video
                      Kegiatan Siswa (Google Drive Cloud)
                    </span>
                    <span className="text-[9.5px] font-normal lowercase text-slate-500 italic">
                      Dapat diklik langsung pada berkas PDF
                    </span>
                  </h4>

                  <table className="print-table w-full border border-black text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black text-[10px]">
                        <th className="p-1.5 border border-black text-center w-8">No</th>
                        <th className="p-1.5 border border-black text-center w-28">
                          Rombel & Madrasah
                        </th>
                        <th className="p-1.5 border border-black w-40">Nama Wali Kelas</th>
                        <th className="p-1.5 border border-black w-48">Nama Berkas Video</th>
                        <th className="p-1.5 border border-black text-center w-20">Ukuran</th>
                        <th className="p-1.5 border border-black">
                          Tautan / Link Google Drive Cloud
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {flatVideos.map(({ sub, file }, vIdx) => (
                        <tr key={file.id} className="border-b border-black text-[9.5px]">
                          <td className="p-1.5 border border-black text-center font-mono">
                            {vIdx + 1}
                          </td>
                          <td className="p-1.5 border border-black text-center font-bold">
                            {sub.kelas} ({sub.madrasah.includes("01") ? "MI 01" : "MI 02"})
                          </td>
                          <td className="p-1.5 border border-black font-semibold">
                            {sub.submitterName}
                          </td>
                          <td className="p-1.5 border border-black font-mono text-[9px] break-all">
                            🎬 {file.fileName}
                          </td>
                          <td className="p-1.5 border border-black text-center font-mono text-[9px]">
                            {file.fileSize ? formatBytes(file.fileSize) : "-"}
                          </td>
                          <td className="p-1.5 border border-black">
                            <a
                              href={file.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 underline font-mono text-[9px] break-all hover:text-blue-900"
                            >
                              {file.driveUrl || "Buka di Google Drive"}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="text-[9px] text-slate-500 italic mt-2">
                    * Berkas video disimpan secara aman pada cloud Google Drive resmi madrasah.
                    Tautan link di atas aktif dan dapat diakses dengan mengklik alamat URL pada
                    dokumen PDF ini.
                  </p>
                </div>
              </div>

              {renderRunningFooter(pageCounter++, totalPages)}
            </div>
          )}

          {/* =====================================================================
              HALAMAN PENGESAHAN RESMI (LEMBAR PENGESAHAN DOKUMEN LAPORAN)
              ===================================================================== */}
          {pageCounter <= totalPages && includeSignatures && (
            <div
              className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
              style={{
                width: "330mm",
                height: "215mm",
                padding: "8mm 12mm",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontFamily: "'Times New Roman', Times, serif",
              }}
            >
              <div>
                {renderRunningHeader("Lembar Pengesahan Resmi")}

                <div className="text-center my-6 space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider underline underline-offset-4 decoration-2">
                    LEMBAR PENGESAHAN DOKUMEN LAPORAN
                  </h3>
                  <p className="text-xs font-bold uppercase text-slate-800">
                    PROGRAM PEMBIASAAN: {currentCategoryName}
                    {selectedKelas !== "all" && (
                      <span className="text-emerald-900 font-black ml-1.5">
                        • {selectedKelas.toUpperCase()}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Disahkan di Banyumas pada tanggal {reportData?.dateFormatted || selectedDate}
                  </p>
                </div>

                <div className="max-w-2xl mx-auto my-6 p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-xs text-slate-700 leading-relaxed text-justify">
                  <p>
                    {selectedKelas !== "all"
                      ? `Demikian Laporan Dokumentasi Kegiatan Pembiasaan Siswa untuk ${selectedKelas} ini disusun secara sistematis dan rapi melalui Sistem Informasi Madrasah Digital (SIMATA) ${activeHeadmaster.fullName} berdasarkan laporan harian guru yang mengisi, dokumentasi foto, dan berkas video kegiatan yang tersimpan pada cloud Google Drive madrasah. Laporan ini sah dan dapat dipergunakan sebagaimana mestinya untuk keperluan portofolio kelas, evaluasi internal madrasah, maupun pelaporan kedinasan Kementerian Agama.`
                      : `Demikian Laporan Rekapitulasi Dokumentasi Kegiatan Pembiasaan Siswa ini disusun secara sistematis dan rapi melalui Sistem Informasi Madrasah Digital (SIMATA) ${activeHeadmaster.fullName} berdasarkan laporan harian guru yang mengisi per rombel, dokumentasi foto, dan berkas video kegiatan yang tersimpan pada cloud Google Drive madrasah. Laporan ini sah dan dapat dipergunakan sebagaimana mestinya untuk keperluan evaluasi internal madrasah maupun pelaporan kedinasan Kementerian Agama.`}
                  </p>
                </div>

                {renderSignatures()}
              </div>

              {renderRunningFooter(pageCounter++, totalPages)}
            </div>
          )}
        </div>
      </div>

      {/* Modal Zoom Foto di Layar */}
      <Dialog open={Boolean(modalImage)} onOpenChange={(open) => !open && setModalImage(null)}>
        <DialogContent className="max-w-3xl p-5 rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-600" />
              <span>{modalImage?.rombel || "Pratinjau Foto"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 truncate">
              {modalImage?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex flex-col items-center gap-3">
            <div className="w-full max-h-[65vh] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-1">
              {modalImage?.src && (
                <img
                  src={modalImage.src}
                  alt={modalImage.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            {modalImage?.notes && (
              <div className="w-full p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-slate-700 dark:text-slate-300 italic">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 not-italic mr-1.5">
                  Catatan Wali Kelas:
                </span>
                "{modalImage.notes}"
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
