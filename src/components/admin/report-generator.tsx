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
}

interface FlattenedMediaItem {
  sub: ReportSubmissionItem;
  file: ReportSubmissionItem["files"][number];
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
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [selectedMadrasah, setSelectedMadrasah] = useState<string>("all");

  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeVideos, setIncludeVideos] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [headmasterName, setHeadmasterName] = useState<string>("H. Ahmad Fauzi, S.Pd.I., M.Pd.");
  const [headmasterNip, setHeadmasterNip] = useState<string>("19750812 200501 1 003");
  const [coordinatorName, setCoordinatorName] = useState<string>("Vikar Maulana Arrisyad, S.Kom.");
  const [coordinatorNip, setCoordinatorNip] = useState<string>("19920415 201903 1 008");

  // Zoom control untuk pratinjau F4 Landscape di layar
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Report Data
  const [reportData, setReportData] = useState<{
    category: any;
    dateFormatted: string;
    rawDate: string;
    madrasahFilter: string;
    totalSubmissions: number;
    totalFiles: number;
    submissions: ReportSubmissionItem[];
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
          stepText: "Mengumpulkan rekapitulasi data rombel & berkas Google Drive...",
          progressPercent: 50,
        });
      }

      try {
        const res = await getReportData({
          categoryId: selectedCategory,
          date: selectedDate,
          madrasah: selectedMadrasah,
        });

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
  }, [selectedCategory, selectedDate, selectedMadrasah]);

  // Pisahkan file Foto dan Video
  const { photoItems, videoItems } = useMemo(() => {
    const allItems: FlattenedMediaItem[] = (reportData?.submissions || []).flatMap((sub) =>
      sub.files.map((file) => ({ sub, file }))
    );

    const photos = allItems.filter(
      ({ file }) =>
        file.fileType === "IMAGE" ||
        (!file.fileType?.includes("VIDEO") && !file.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
    );

    const videos = allItems.filter(
      ({ file }) =>
        file.fileType === "VIDEO" ||
        Boolean(file.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
    );

    return { photoItems: photos, videoItems: videos };
  }, [reportData]);

  // Hitung jumlah halaman untuk laporan F4 Landscape
  // Halaman 1: Rekapitulasi Rombel (hingga 8 baris, jika ada sisa berlanjut)
  const submissionsList = reportData?.submissions || [];
  const primaryTableRows = submissionsList.slice(0, 8);
  const overflowTableRows = submissionsList.slice(8);
  const hasOverflowTable = overflowTableRows.length > 0;

  // Foto: 6 foto per halaman (grid 3 x 2)
  const photoChunks: FlattenedMediaItem[][] = useMemo(() => {
    if (!includePhotos || photoItems.length === 0) return [];
    const chunks: FlattenedMediaItem[][] = [];
    for (let i = 0; i < photoItems.length; i += 6) {
      chunks.push(photoItems.slice(i, i + 6));
    }
    return chunks;
  }, [includePhotos, photoItems]);

  // Video: tabel video
  const hasVideoPage = includeVideos && videoItems.length > 0;

  // Total Halaman
  const totalPages = useMemo(() => {
    let count = 1; // Halaman 1
    if (hasOverflowTable) count += 1;
    count += photoChunks.length;
    if (hasVideoPage) count += 1;

    // Jika lampiran banyak dan tidak ada ruang di halaman terakhir untuk TTD, tambah lembar pengesahan
    // Bila hanya halaman 1 dan data <= 8 tanpa foto & video, TTD muat di hal 1.
    const isSinglePage =
      count === 1 && !hasOverflowTable && photoChunks.length === 0 && !hasVideoPage;
    if (!isSinglePage && includeSignatures) {
      // Jika halaman terakhir berupa video dan videonya sedikit (<= 4), TTD bisa di lembar video.
      // Jika halaman terakhir adalah foto penuh (6 foto), buat halaman pengesahan tersendiri.
      const lastIsFullPhoto =
        !hasVideoPage &&
        photoChunks.length > 0 &&
        photoChunks[photoChunks.length - 1].length > 3;
      if (lastIsFullPhoto) {
        count += 1;
      }
    }
    return count;
  }, [hasOverflowTable, photoChunks, hasVideoPage, includeSignatures]);

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

      // Tunggu hingga semua gambar di halaman terdecode sempurna
      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>(".f4-landscape-page img")
      );
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      showSwalLoading({
        title: "Merender Dokumen F4 Landscape...",
        stepText: `Merender ${pageElements.length} halaman F4 Landscape (330 × 215 mm)...`,
        progressPercent: 45,
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [330, 215],
        compress: true,
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        showSwalLoading({
          title: "Menyusun Halaman PDF...",
          stepText: `Merender halaman ${i + 1} dari ${pageElements.length}...`,
          progressPercent: Math.round(45 + ((i + 1) / pageElements.length) * 45),
        });

        // Simpan transform awal jika ada
        const originalTransform = pageEl.style.transform;
        pageEl.style.transform = "none";

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 300 DPI high-quality print
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: 1400,
        });

        // Kembalikan transform
        pageEl.style.transform = originalTransform;

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

      const safeCategory = (reportData.category?.name || "Laporan")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeDate = reportData.rawDate || selectedDate;
      const filename = `Laporan_SIMATA_${safeCategory}_${safeDate}_F4_Landscape.pdf`;

      pdf.save(filename);

      closeSwal();
      setIsExportingPdf(false);
      toast.success("Berkas PDF F4 Landscape berhasil diunduh langsung!");
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
    <div className="border-b-4 border-double border-black pb-2.5 mb-3">
      <div className="flex items-center justify-between">
        {/* Logo Kemenag / Madrasah di sisi kiri kop */}
        <div className="w-24 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-emerald-800 flex flex-col items-center justify-center p-1 bg-emerald-50 text-center">
            <School className="h-7 w-7 text-emerald-800" />
            <span className="text-[7.5px] font-black uppercase tracking-tighter text-emerald-950 mt-0.5">
              MI BH DAWUHAN
            </span>
          </div>
        </div>

        {/* Teks Identitas Resmi Madrasah */}
        <div className="flex-1 px-4 text-center">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-800 m-0 leading-tight">
            Kementerian Agama Republik Indonesia
          </h3>
          <h2 className="text-[12.5px] font-black uppercase tracking-wider text-slate-900 m-0 leading-tight mt-0.5">
            Kantor Kementerian Agama Kabupaten Banyumas
          </h2>
          <h1 className="text-[17px] font-black uppercase tracking-wide text-black m-0 leading-tight mt-1 font-serif">
            MADRASAH IBTIDAIYAH BUSTANUL HUDA DAWUHAN
          </h1>
          <p className="text-[10px] text-slate-700 m-0 mt-0.5 leading-snug">
            NSM: 111233020084 • NPSN: 60710777 • Terakreditasi "A" (Unggul)
          </p>
          <p className="text-[9.5px] text-slate-600 m-0 leading-tight">
            Alamat: Dawuhan, Kec. Banyumas, Kab. Banyumas - Jawa Tengah 53192 • SIMATA Digital System
          </p>
        </div>

        {/* Logo SIMATA di sisi kanan */}
        <div className="w-24 flex items-center justify-center">
          <div className="h-16 w-16 rounded-2xl border-2 border-slate-400 flex flex-col items-center justify-center p-1 bg-slate-50 text-center">
            <Sparkles className="h-7 w-7 text-emerald-700" />
            <span className="text-[8.5px] font-black text-slate-800 uppercase tracking-tight mt-0.5">
              SIMATA
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Running Header Kecil untuk Halaman 2 dan seterusnya
  const renderRunningHeader = (pageTitle: string) => (
    <div className="border-b border-slate-300 pb-1.5 mb-3 flex items-center justify-between text-[9.5px] text-slate-600 font-serif">
      <div className="flex items-center gap-2">
        <strong className="text-black uppercase">MI BUSTANUL HUDA DAWUHAN</strong>
        <span>•</span>
        <span>Laporan: {currentCategoryName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-emerald-800">{pageTitle}</span>
        <span>•</span>
        <span>Tanggal: {reportData?.dateFormatted || selectedDate}</span>
      </div>
    </div>
  );

  // Lembar Pengesahan Tanda Tangan
  const renderSignatures = () => (
    <div className="mt-4 pt-2 text-xs font-serif avoid-break">
      <div className="flex justify-between items-start px-8">
        <div className="w-72 text-center">
          <p className="m-0 leading-tight">Mengetahui,</p>
          <p className="font-bold m-0 leading-tight">Kepala Madrasah</p>
          <div className="h-16 flex items-end justify-center">
            {/* Ruang TTD & Stempel */}
          </div>
          <p className="font-bold underline uppercase m-0 leading-tight text-[11.5px]">
            {headmasterName}
          </p>
          <p className="text-[10px] font-mono m-0 mt-0.5 text-slate-700">
            NIP. {headmasterNip}
          </p>
        </div>

        <div className="w-72 text-center">
          <p className="m-0 leading-tight">
            Banyumas, {reportData?.dateFormatted || "19 Oktober 2026"}
          </p>
          <p className="font-bold m-0 leading-tight">
            Koordinator Program SIMATA
          </p>
          <div className="h-16 flex items-end justify-center">
            {/* Ruang TTD */}
          </div>
          <p className="font-bold underline uppercase m-0 leading-tight text-[11.5px]">
            {coordinatorName}
          </p>
          <p className="text-[10px] font-mono m-0 mt-0.5 text-slate-700">
            NIP. {coordinatorNip}
          </p>
        </div>
      </div>
    </div>
  );

  // Running Footer di Setiap Halaman
  const renderRunningFooter = (pageNum: number, total: number) => (
    <div className="border-t border-slate-300 pt-1.5 mt-auto text-[8.5px] text-slate-500 flex justify-between items-center font-serif">
      <span>
        SIMATA MI Bustanul Huda Dawuhan • Rekapitulasi Dokumen Resmi Pembiasaan Siswa
      </span>
      <span className="font-bold text-slate-700">
        Kertas F4 Landscape (330 × 215 mm) • Halaman {pageNum} dari {total}
      </span>
    </div>
  );

  let pageCounter = 1;

  return (
    <div className="space-y-6">
      {/* CSS Khusus Kertas F4 Landscape (330mm x 215mm) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 330mm 215mm; /* Standar Ukuran Kertas F4 / Folio Landscape */
            margin: 10mm 15mm;
          }

          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, serif !important;
            margin: 0 !important;
            padding: 0 !important;
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
            height: 215mm !important;
            max-height: 215mm !important;
            padding: 10mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            background: white !important;
            page-break-after: always;
            break-after: page;
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
                  Format resmi kertas F4 mendatar (Landscape) dengan unduh berkas PDF langsung tanpa jendela dialog print browser.
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
          {/* Form Filter Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/* 2. Pilih Tanggal Kegiatan */}
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

            {/* 3. Filter Madrasah */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Satuan Pendidikan (Madrasah)
              </Label>
              <Select value={selectedMadrasah} onValueChange={setSelectedMadrasah}>
                <SelectTrigger className="rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 font-bold">
                  <SelectValue placeholder="Semua Madrasah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-semibold">
                    Semua Madrasah (MI 01 & MI 02 Dawuhan)
                  </SelectItem>
                  {initialMadrasahs.map((m) => (
                    <SelectItem key={m.id} value={m.name} className="text-xs font-semibold">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opsi Tata Letak & Data Cetak */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
              <span>Opsi Kustomisasi Laporan F4 Landscape</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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

            {/* Input Pejabat Penandatangan */}
            {includeSignatures && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Nama & NIP Kepala Madrasah:
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={headmasterName}
                      onChange={(e) => setHeadmasterName(e.target.value)}
                      placeholder="Nama Kepala Madrasah"
                      className="h-8 text-xs rounded-lg"
                    />
                    <Input
                      value={headmasterNip}
                      onChange={(e) => setHeadmasterNip(e.target.value)}
                      placeholder="NIP Kepala Madrasah"
                      className="h-8 text-xs rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Nama & NIP Koordinator Program:
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      placeholder="Nama Koordinator Program"
                      className="h-8 text-xs rounded-lg"
                    />
                    <Input
                      value={coordinatorNip}
                      onChange={(e) => setCoordinatorNip(e.target.value)}
                      placeholder="NIP Koordinator"
                      className="h-8 text-xs rounded-lg font-mono"
                    />
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
                Format Standar Dokumen: <strong>Kertas F4 / Folio Mendatar (330 × 215 mm)</strong>. Total <strong>{totalPages} Halaman</strong> tersusun rapi.
              </span>
            </div>

            {/* Zoom Selector untuk kemudahan membaca di layar laptop/tablet */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="text-[11px] px-2 text-muted-foreground">Skala Tampilan:</span>
              <button
                onClick={() => setPreviewZoom(70)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  previewZoom === 70 ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : ""
                }`}
              >
                70%
              </button>
              <button
                onClick={() => setPreviewZoom(85)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  previewZoom === 85 ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : ""
                }`}
              >
                85%
              </button>
              <button
                onClick={() => setPreviewZoom(100)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  previewZoom === 100 ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : ""
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
              padding: "10mm 15mm",
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
              <div className="text-center my-2 space-y-0.5">
                <h2 className="text-[13px] font-black uppercase tracking-wider underline underline-offset-4 decoration-2">
                  LAPORAN REKAPITULASI DOKUMENTASI KEGIATAN PEMBIASAAN SISWA
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  PROGRAM: {currentCategoryName}
                </p>
                <div className="flex items-center justify-center gap-3 text-[10.5px] text-slate-700 font-semibold pt-0.5">
                  <span>Hari / Tanggal: <strong>{reportData?.dateFormatted || "Hari Ini"}</strong></span>
                  <span>•</span>
                  <span>
                    Satuan Pendidikan:{" "}
                    <strong>
                      {selectedMadrasah === "all"
                        ? "MI Bustanul Huda 01 & 02 Dawuhan"
                        : selectedMadrasah}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Ringkasan Statistik Cepat */}
              <div className="my-2 p-2 rounded-lg border border-slate-300 bg-slate-50/80 text-[10.5px] flex items-center justify-around text-center">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">
                    Total Rombel Mengisi
                  </span>
                  <strong className="text-xs font-black text-black">
                    {reportData?.totalSubmissions || 0} Rombel
                  </strong>
                </div>
                <div className="border-r border-slate-300 h-6"></div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">
                    Total Berkas Dokumentasi
                  </span>
                  <strong className="text-xs font-black text-emerald-800">
                    {reportData?.totalFiles || 0} File Terarsip ({photoItems.length} Foto, {videoItems.length} Video)
                  </strong>
                </div>
                <div className="border-r border-slate-300 h-6"></div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">
                    Status Penyimpanan
                  </span>
                  <strong className="text-xs font-black text-teal-800">
                    Cloud Google Drive Resmi Madrasah
                  </strong>
                </div>
              </div>

              {/* Bagian I: Tabel Rekapitulasi Rombel (Landscape Lebar 330mm) */}
              <div className="mt-2">
                <h4 className="text-[11px] font-black uppercase mb-1.5 tracking-wide text-slate-900">
                  I. Rekapitulasi Kehadiran & Partisipasi Rombel
                </h4>

                {primaryTableRows.length > 0 ? (
                  <table className="print-table w-full border border-black text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black text-[10.5px]">
                        <th className="p-1.5 border border-black text-center w-8">No</th>
                        <th className="p-1.5 border border-black text-center w-24">Rombel / Kelas</th>
                        <th className="p-1.5 border border-black w-44">Satuan Pendidikan</th>
                        <th className="p-1.5 border border-black w-40">Nama Wali Kelas</th>
                        <th className="p-1.5 border border-black text-center w-24">Waktu Kirim</th>
                        <th className="p-1.5 border border-black text-center w-28">Berkas</th>
                        {includeNotes && (
                          <th className="p-1.5 border border-black">Catatan Refleksi / Pembiasaan</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {primaryTableRows.map((item, idx) => {
                        const pCount = item.files.filter(
                          (f) =>
                            f.fileType === "IMAGE" ||
                            (!f.fileType?.includes("VIDEO") && !f.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
                        ).length;

                        const vCount = item.files.filter(
                          (f) =>
                            f.fileType === "VIDEO" ||
                            Boolean(f.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
                        ).length;

                        return (
                          <tr key={item.id} className="border-b border-black text-[10px]">
                            <td className="p-1.5 border border-black text-center font-mono">{idx + 1}</td>
                            <td className="p-1.5 border border-black text-center font-bold">
                              {item.kelas}
                            </td>
                            <td className="p-1.5 border border-black">
                              {item.madrasah.includes("01")
                                ? "MI Bustanul Huda 01 Dawuhan"
                                : "MI Bustanul Huda 02 Dawuhan"}
                            </td>
                            <td className="p-1.5 border border-black font-semibold">
                              {item.submitterName}
                            </td>
                            <td className="p-1.5 border border-black text-center font-mono">
                              {item.timeFormatted}
                            </td>
                            <td className="p-1.5 border border-black text-center font-bold">
                              {pCount > 0 && <span>{pCount} Foto</span>}
                              {pCount > 0 && vCount > 0 && <span className="text-slate-400"> • </span>}
                              {vCount > 0 && (
                                <span className="text-blue-800 font-semibold">{vCount} Video</span>
                              )}
                              {pCount === 0 && vCount === 0 && <span className="text-slate-400">-</span>}
                            </td>
                            {includeNotes && (
                              <td className="p-1.5 border border-black leading-snug">
                                {item.notes || "-"}
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
                      Belum ada data pengisian kegiatan pada tanggal {reportData?.dateFormatted || selectedDate}.
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
                padding: "10mm 15mm",
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
                    I. Rekapitulasi Kehadiran & Partisipasi Rombel (Lanjutan)
                  </h4>

                  <table className="print-table w-full border border-black text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black text-[10.5px]">
                        <th className="p-1.5 border border-black text-center w-8">No</th>
                        <th className="p-1.5 border border-black text-center w-24">Rombel / Kelas</th>
                        <th className="p-1.5 border border-black w-44">Satuan Pendidikan</th>
                        <th className="p-1.5 border border-black w-40">Nama Wali Kelas</th>
                        <th className="p-1.5 border border-black text-center w-24">Waktu Kirim</th>
                        <th className="p-1.5 border border-black text-center w-28">Berkas</th>
                        {includeNotes && (
                          <th className="p-1.5 border border-black">Catatan Refleksi / Pembiasaan</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {overflowTableRows.map((item, idx) => {
                        const pCount = item.files.filter(
                          (f) =>
                            f.fileType === "IMAGE" ||
                            (!f.fileType?.includes("VIDEO") && !f.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
                        ).length;

                        const vCount = item.files.filter(
                          (f) =>
                            f.fileType === "VIDEO" ||
                            Boolean(f.fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i))
                        ).length;

                        return (
                          <tr key={item.id} className="border-b border-black text-[10px]">
                            <td className="p-1.5 border border-black text-center font-mono">
                              {idx + 9}
                            </td>
                            <td className="p-1.5 border border-black text-center font-bold">
                              {item.kelas}
                            </td>
                            <td className="p-1.5 border border-black">
                              {item.madrasah.includes("01")
                                ? "MI Bustanul Huda 01 Dawuhan"
                                : "MI Bustanul Huda 02 Dawuhan"}
                            </td>
                            <td className="p-1.5 border border-black font-semibold">
                              {item.submitterName}
                            </td>
                            <td className="p-1.5 border border-black text-center font-mono">
                              {item.timeFormatted}
                            </td>
                            <td className="p-1.5 border border-black text-center font-bold">
                              {pCount > 0 && <span>{pCount} Foto</span>}
                              {pCount > 0 && vCount > 0 && <span className="text-slate-400"> • </span>}
                              {vCount > 0 && (
                                <span className="text-blue-800 font-semibold">{vCount} Video</span>
                              )}
                              {pCount === 0 && vCount === 0 && <span className="text-slate-400">-</span>}
                            </td>
                            {includeNotes && (
                              <td className="p-1.5 border border-black leading-snug">
                                {item.notes || "-"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Jika tidak ada lampiran foto & video, tempatkan TTD di halaman 1b */}
                {photoChunks.length === 0 && !hasVideoPage && includeSignatures && renderSignatures()}
              </div>

              {renderRunningFooter(pageCounter++, totalPages)}
            </div>
          )}

          {/* =====================================================================
              HALAMAN LAMPIRAN FOTO: GRID 3 KOLOM x 2 BARIS (6 FOTO PER HALAMAN)
              ===================================================================== */}
          {photoChunks.map((chunk, chunkIdx) => {
            const isLastPhotoChunk = chunkIdx === photoChunks.length - 1;
            const canFitSignaturesHere =
              isLastPhotoChunk && !hasVideoPage && chunk.length <= 3 && includeSignatures;

            return (
              <div
                key={`photo-page-${chunkIdx}`}
                className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
                style={{
                  width: "330mm",
                  height: "215mm",
                  padding: "10mm 15mm",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                <div>
                  {renderRunningHeader(
                    `Lampiran Foto Dokumentasi (Bagian ${chunkIdx + 1} dari ${photoChunks.length})`
                  )}

                  <div className="mt-1">
                    <h4 className="text-[11px] font-black uppercase mb-2 tracking-wide text-slate-900 flex items-center justify-between">
                      <span>
                        II. Lampiran Foto Dokumentasi Kegiatan Siswa ({chunkIdx * 6 + 1} -{" "}
                        {Math.min((chunkIdx + 1) * 6, photoItems.length)} dari {photoItems.length})
                      </span>
                      <span className="text-[9.5px] font-normal lowercase text-slate-500 italic">
                        Diunggah oleh Wali Kelas melalui SIMATA
                      </span>
                    </h4>

                    {/* Grid 3 Kolom x 2 Baris Presisi */}
                    <div className="grid grid-cols-3 gap-3">
                      {chunk.map(({ sub, file }) => {
                        const imageProxySrc = file.driveThumbnailUrl
                          ? `/api/proxy-image?url=${encodeURIComponent(file.driveThumbnailUrl)}`
                          : null;

                        return (
                          <div
                            key={file.id}
                            className="border border-slate-400 p-1.5 rounded-lg bg-white flex flex-col justify-between"
                            style={{ height: "70mm" }}
                          >
                            <div className="h-40 w-full bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
                              {imageProxySrc ? (
                                <img
                                  src={imageProxySrc}
                                  alt={file.fileName}
                                  className="h-full w-full object-cover"
                                  crossOrigin="anonymous"
                                  loading="eager"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                                  <ImageIcon className="h-7 w-7 text-emerald-600 mb-1" />
                                  <span className="text-[9px] font-bold text-slate-700 break-all line-clamp-2">
                                    {file.fileName}
                                  </span>
                                  <span className="text-[8px] text-muted-foreground mt-0.5">
                                    Google Drive Cloud
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="mt-1.5 text-[9.5px] leading-tight space-y-0.5">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-black">
                                  {sub.kelas} ({sub.madrasah.includes("01") ? "MI 01" : "MI 02"})
                                </span>
                                <span className="font-mono text-[8.5px] text-slate-600">
                                  {sub.timeFormatted}
                                </span>
                              </div>
                              <p className="text-slate-700 text-[9px] truncate">
                                Wali Kelas: <strong>{sub.submitterName}</strong>
                              </p>
                              {sub.notes && (
                                <p className="text-slate-600 italic text-[8.5px] line-clamp-1">
                                  "{sub.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Jika foto hanya 1 baris (<= 3 foto), render TTD langsung di lembar ini */}
                  {canFitSignaturesHere && renderSignatures()}
                </div>

                {renderRunningFooter(pageCounter++, totalPages)}
              </div>
            );
          })}

          {/* =====================================================================
              HALAMAN LAMPIRAN VIDEO GOOGLE DRIVE (JIKA ADA)
              ===================================================================== */}
          {hasVideoPage && (
            <div
              className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
              style={{
                width: "330mm",
                height: "215mm",
                padding: "10mm 15mm",
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
                      {includePhotos && photoItems.length > 0 ? "III." : "II."} Tautan / Link Video
                      Kegiatan Siswa (Google Drive Cloud)
                    </span>
                    <span className="text-[9.5px] font-normal lowercase text-slate-500 italic">
                      Dapat diklik langsung pada berkas PDF
                    </span>
                  </h4>

                  <table className="print-table w-full border border-black text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black text-[10.5px]">
                        <th className="p-1.5 border border-black text-center w-8">No</th>
                        <th className="p-1.5 border border-black text-center w-28">Rombel & Madrasah</th>
                        <th className="p-1.5 border border-black w-40">Nama Wali Kelas</th>
                        <th className="p-1.5 border border-black w-48">Nama Berkas Video</th>
                        <th className="p-1.5 border border-black text-center w-20">Ukuran</th>
                        <th className="p-1.5 border border-black">Tautan / Link Google Drive Cloud</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videoItems.map(({ sub, file }, vIdx) => (
                        <tr key={file.id} className="border-b border-black text-[10px]">
                          <td className="p-1.5 border border-black text-center font-mono">{vIdx + 1}</td>
                          <td className="p-1.5 border border-black text-center font-bold">
                            {sub.kelas} ({sub.madrasah.includes("01") ? "MI 01" : "MI 02"})
                          </td>
                          <td className="p-1.5 border border-black font-semibold">
                            {sub.submitterName}
                          </td>
                          <td className="p-1.5 border border-black font-mono text-[9.5px] break-all">
                            🎬 {file.fileName}
                          </td>
                          <td className="p-1.5 border border-black text-center font-mono text-[9.5px]">
                            {file.fileSize ? formatBytes(file.fileSize) : "-"}
                          </td>
                          <td className="p-1.5 border border-black">
                            <a
                              href={file.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 underline font-mono text-[9.5px] break-all hover:text-blue-900"
                            >
                              {file.driveUrl || "Buka di Google Drive"}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="text-[9px] text-slate-500 italic mt-1.5">
                    * Berkas video disimpan secara aman pada cloud Google Drive resmi madrasah. Tautan link di atas aktif dan dapat diakses dengan membuka alamat URL pada dokumen PDF ini.
                  </p>
                </div>

                {/* Lembar Pengesahan TTD jika muat di halaman video */}
                {videoItems.length <= 6 && includeSignatures && renderSignatures()}
              </div>

              {renderRunningFooter(pageCounter++, totalPages)}
            </div>
          )}

          {/* =====================================================================
              HALAMAN PENGESAHAN TERSENDIRI (JIKA DOKUMEN BANYAK LAMPIRAN & BELUM TERCETAK)
              ===================================================================== */}
          {pageCounter <= totalPages && includeSignatures && (
            <div
              className="f4-landscape-page shadow-2xl rounded-sm flex flex-col justify-between"
              style={{
                width: "330mm",
                height: "215mm",
                padding: "10mm 15mm",
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
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Disahkan di Banyumas pada tanggal {reportData?.dateFormatted || selectedDate}
                  </p>
                </div>

                <div className="max-w-2xl mx-auto my-6 p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-xs text-slate-700 leading-relaxed text-justify">
                  <p>
                    Demikian Laporan Rekapitulasi Dokumentasi Kegiatan Pembiasaan Siswa ini disusun secara otomatis melalui Sistem Informasi Madrasah Digital (SIMATA) MI Bustanul Huda Dawuhan berdasarkan data laporan harian wali kelas, lampiran dokumentasi foto, dan berkas video yang tersimpan pada cloud Google Drive madrasah. Laporan ini sah dan dapat dipergunakan sebagaimana mestinya untuk keperluan evaluasi madrasah maupun pelaporan kedinasan.
                  </p>
                </div>

                {renderSignatures()}
              </div>

              {renderRunningFooter(pageCounter++, totalPages)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
