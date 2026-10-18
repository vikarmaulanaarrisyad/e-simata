"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Printer,
  Download,
  Calendar,
  Filter,
  FileCheck2,
  Image as ImageIcon,
  CheckCircle2,
  School,
  User,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  BookOpen,
  FileText,
  SlidersHorizontal,
  Info,
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

  // Options for printable report
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [headmasterName, setHeadmasterName] = useState<string>("H. Ahmad Fauzi, S.Pd.I., M.Pd.");
  const [headmasterNip, setHeadmasterNip] = useState<string>("19750812 200501 1 003");
  const [coordinatorName, setCoordinatorName] = useState<string>("Vikar Maulana Arrisyad, S.Kom.");
  const [coordinatorNip, setCoordinatorNip] = useState<string>("19920415 201903 1 008");

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

  const isFirstMount = React.useRef(true);

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
            toast.success("Laporan berhasil disusun dan siap dicetak ke format F4.");
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
      loadReport(true); // Silent on initial load so no intrusive modal pops up
    } else {
      loadReport(false);
    }
  }, [selectedCategory, selectedDate, selectedMadrasah]);

  const handlePrint = () => {
    window.print();
  };

  const currentCategoryName =
    reportData?.category?.name ||
    initialCategories.find((c) => c.id === selectedCategory)?.name ||
    "Jurnal Syukur";

  return (
    <div className="space-y-6">
      {/* CSS Print Stylesheet Khusus Kertas F4 Margin 2cm */}
      <style jsx global>{`
        @media print {
          @page {
            size: 215mm 330mm; /* Standar Ukuran Kertas F4 / Folio Indonesia */
            margin: 20mm; /* Margin 2 cm keliling */
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

          /* Container F4 saat dicetak mengisi area cetak */
          .report-paper-container {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          .page-break {
            page-break-before: always;
            break-before: page;
          }

          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Pastikan tabel tercetak dengan garis hitam jelas */
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #000000 !important;
            padding: 5px 8px !important;
            font-size: 11pt !important;
          }

          .print-table th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* Control Panel Filter & Cetak (Sembunyi saat print) */}
      <Card className="no-print border-emerald-100 dark:border-emerald-950 shadow-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 border-b border-emerald-100/80 dark:border-emerald-950/60 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Printer className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Penyusun Laporan Kegiatan (PDF F4)</span>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase">
                    Kertas F4 • Margin 2cm
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Susun rekapitulasi dokumentasi kegiatan harian seluruh rombel kelas ke dalam format dokumen resmi siap cetak.
                </CardDescription>
              </div>
            </div>

            {/* Tombol Cetak / PDF */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadReport(false)}
                disabled={isPending}
                className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 gap-1.5"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>

              <Button
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-4 py-2 shadow-md shadow-emerald-600/20 gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Unduh PDF F4</span>
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
          </div>

          {/* Opsi Tata Letak & Data Cetak */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
              <span>Kustomisasi Tata Letak Laporan Dokumen F4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Sertakan Lampiran Foto Kegiatan
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
                  Sertakan Kolom Catatan Guru / Refleksi
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
                  Sertakan Lembar Pengesahan Resmi
                </span>
              </label>
            </div>

            {/* Input Nama Pejabat Penandatangan */}
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

          {/* Info Banner Cetak PDF */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
            <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Tips Cetak PDF Sempurna:</strong> Saat dialog cetak browser (Ctrl + P) terbuka, pastikan memilih opsi <strong>Tujuan: Simpan sebagai PDF</strong>, Ukuran Kertas: <strong>F4 / Folio</strong> (atau 215 × 330 mm), Margin: <strong>Kustom / 20 mm (2 cm)</strong>, dan centang opsi <strong>Grafik Latar Belakang (Background Graphics)</strong> agar format kop dan tabel tercetak presisi.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          PRATINJAU DOKUMEN LAPORAN RESMI (KERTAS F4: 215mm x 330mm, MARGIN 20mm)
          ========================================================================= */}
      <div className="flex justify-center select-text">
        <div
          className="report-paper-container bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-200/80 transition-all"
          style={{
            width: "215mm",
            minHeight: "330mm",
            padding: "20mm", // Margin 2 cm
            boxSizing: "border-box",
            fontFamily: "'Times New Roman', Times, serif",
          }}
        >
          {/* 1. KOP SURAT RESMI MADRASAH IBTIDAIYAH BUSTANUL HUDA */}
          <div className="text-center pb-3 relative">
            {/* Logo Kemenag / Madrasah di sisi kiri kop */}
            <div className="flex items-center justify-between border-b-4 border-double border-black pb-3">
              <div className="w-20 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border-2 border-emerald-700 flex flex-col items-center justify-center p-1 bg-emerald-50">
                  <School className="h-7 w-7 text-emerald-800" />
                  <span className="text-[7px] font-black uppercase tracking-tighter text-emerald-900">
                    MI BH
                  </span>
                </div>
              </div>

              <div className="flex-1 px-4 text-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 m-0 leading-tight">
                  Kementerian Agama Republik Indonesia
                </h3>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 m-0 leading-tight mt-0.5">
                  Kantor Kementerian Agama Kabupaten Banyumas
                </h2>
                <h1 className="text-base font-black uppercase tracking-normal text-black m-0 leading-tight mt-1 font-serif">
                  MADRASAH IBTIDAIYAH BUSTANUL HUDA
                </h1>
                <p className="text-[10px] text-slate-600 m-0 mt-1 leading-snug">
                  NSM: 111233020084 • NPSN: 60710777 • Terakreditasi "A" (Unggul)
                </p>
                <p className="text-[9.5px] text-slate-600 m-0 leading-tight">
                  Alamat: Kec. Banyumas, Kab. Banyumas - Jawa Tengah 53192
                </p>
              </div>

              {/* Logo Pendukung Kanan */}
              <div className="w-20 flex items-center justify-center">
                <div className="h-16 w-16 rounded-2xl border border-slate-300 flex flex-col items-center justify-center p-1 bg-slate-50">
                  <Sparkles className="h-6 w-6 text-emerald-700" />
                  <span className="text-[8px] font-black text-slate-700 uppercase mt-0.5">
                    SIMATA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. JUDUL DOKUMEN LAPORAN */}
          <div className="text-center my-4 space-y-1">
            <h2 className="text-sm font-black uppercase tracking-wide underline underline-offset-4 decoration-2">
              LAPORAN REKAPITULASI DOKUMENTASI KEGIATAN PEMBIASAAN SISWA
            </h2>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
              PROGRAM: {currentCategoryName}
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-700 font-semibold pt-1">
              <span>Hari / Tanggal: <strong>{reportData?.dateFormatted || "Hari Ini"}</strong></span>
              <span>•</span>
              <span>Satuan Pendidikan: <strong>{selectedMadrasah === "all" ? "MI Bustanul Huda 01 & 02" : selectedMadrasah}</strong></span>
            </div>
          </div>

          {/* 3. RINGKASAN STATISTIK PENGISIAN */}
          <div className="my-3 p-3 rounded-xl border border-slate-300 bg-slate-50/70 text-xs flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Total Rombel Mengisi
              </span>
              <strong className="text-sm font-black text-black">
                {reportData?.totalSubmissions || 0} Rombel
              </strong>
            </div>
            <div className="border-r border-slate-300 h-8"></div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Total Berkas Dokumentasi
              </span>
              <strong className="text-sm font-black text-emerald-800">
                {reportData?.totalFiles || 0} File Terarsip
              </strong>
            </div>
            <div className="border-r border-slate-300 h-8"></div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Status Penyimpanan
              </span>
              <strong className="text-sm font-black text-teal-800">
                Google Drive Cloud
              </strong>
            </div>
          </div>

          {/* 4. TABEL REKAPITULASI PENGISIAN WALI KELAS */}
          <div className="my-4">
            <h4 className="text-xs font-black uppercase mb-2 tracking-wide text-slate-900">
              I. Rekapitulasi Kehadiran & Partisipasi Rombel
            </h4>

            {reportData?.submissions && reportData.submissions.length > 0 ? (
              <table className="print-table w-full border border-black text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-black">
                    <th className="p-2 border border-black text-center w-8">No</th>
                    <th className="p-2 border border-black text-center w-24">Rombel / Kelas</th>
                    <th className="p-2 border border-black w-36">Satuan Pendidikan</th>
                    <th className="p-2 border border-black w-40">Nama Wali Kelas</th>
                    <th className="p-2 border border-black text-center w-20">Waktu Kirim</th>
                    <th className="p-2 border border-black text-center w-16">Berkas</th>
                    {includeNotes && (
                      <th className="p-2 border border-black">Catatan Refleksi / Pembiasaan</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reportData.submissions.map((item, idx) => (
                    <tr key={item.id} className="border-b border-black">
                      <td className="p-2 border border-black text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-black text-center font-bold">
                        {item.kelas}
                      </td>
                      <td className="p-2 border border-black text-[11px]">
                        {item.madrasah.includes("01") ? "MI Bustanul Huda 01" : "MI Bustanul Huda 02"}
                      </td>
                      <td className="p-2 border border-black font-semibold">
                        {item.submitterName}
                      </td>
                      <td className="p-2 border border-black text-center font-mono text-[10.5px]">
                        {item.timeFormatted}
                      </td>
                      <td className="p-2 border border-black text-center font-bold">
                        {item.files.length} Foto
                      </td>
                      {includeNotes && (
                        <td className="p-2 border border-black text-[10.5px] leading-relaxed">
                          {item.notes || "-"}
                        </td>
                      )}
                    </tr>
                  ))}
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

          {/* 5. LAMPIRAN DOKUMENTASI FOTO KEGIATAN SISWA */}
          {includePhotos && reportData?.submissions && reportData.submissions.length > 0 && (
            <div className="my-5 avoid-break">
              <h4 className="text-xs font-black uppercase mb-3 tracking-wide text-slate-900 border-t border-slate-300 pt-3">
                II. Lampiran Foto Dokumentasi Kegiatan Siswa Per Rombel
              </h4>

              <div className="grid grid-cols-2 gap-3.5">
                {reportData.submissions.flatMap((sub) =>
                  sub.files.map((file, fileIdx) => (
                    <div
                      key={file.id}
                      className="border border-slate-400 p-2 rounded-lg bg-white flex flex-col justify-between avoid-break"
                    >
                      <div className="h-44 w-full bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
                        {file.driveThumbnailUrl ? (
                          <img
                            src={file.driveThumbnailUrl}
                            alt={file.fileName}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-3 text-center">
                            <ImageIcon className="h-8 w-8 text-emerald-600 mb-1" />
                            <span className="text-[10px] font-bold text-slate-700 break-all line-clamp-2">
                              {file.fileName}
                            </span>
                            <span className="text-[9px] text-muted-foreground mt-0.5">
                              Tersimpan di Google Drive
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-[10.5px] leading-tight space-y-0.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-black">
                            {sub.kelas} ({sub.madrasah.includes("01") ? "MI 01" : "MI 02"})
                          </span>
                          <span className="font-mono text-[9.5px] text-slate-600">
                            {sub.timeFormatted}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[10px] truncate">
                          Wali Kelas: <strong>{sub.submitterName}</strong>
                        </p>
                        {sub.notes && (
                          <p className="text-slate-600 italic text-[9.5px] line-clamp-1">
                            "{sub.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 6. LEMBAR PENGESAHAN & TANDA TANGAN RESMI */}
          {includeSignatures && (
            <div className="mt-8 pt-4 avoid-break text-xs font-serif">
              <div className="flex justify-between items-start">
                <div className="w-64 text-center">
                  <p className="m-0 leading-tight">Mengetahui,</p>
                  <p className="font-bold m-0 leading-tight">Kepala Madrasah</p>
                  <div className="h-20 flex items-end justify-center">
                    {/* Ruang TTD & Stempel */}
                  </div>
                  <p className="font-bold underline uppercase m-0 leading-tight">
                    {headmasterName}
                  </p>
                  <p className="text-[11px] font-mono m-0 mt-0.5">
                    NIP. {headmasterNip}
                  </p>
                </div>

                <div className="w-64 text-center">
                  <p className="m-0 leading-tight">
                    Banyumas, {reportData?.dateFormatted || "19 Oktober 2026"}
                  </p>
                  <p className="font-bold m-0 leading-tight">
                    Koordinator Program SIMATA
                  </p>
                  <div className="h-20 flex items-end justify-center">
                    {/* Ruang TTD */}
                  </div>
                  <p className="font-bold underline uppercase m-0 leading-tight">
                    {coordinatorName}
                  </p>
                  <p className="text-[11px] font-mono m-0 mt-0.5">
                    NIP. {coordinatorNip}
                  </p>
                </div>
              </div>

              {/* Footer Catatan Sistem */}
              <div className="mt-8 pt-2 border-t border-slate-300 text-[9px] text-slate-500 flex justify-between items-center">
                <span>
                  Dokumen ini dicetak otomatis melalui SIMATA (Sistem Informasi Madrasah Digital) MI Bustanul Huda.
                </span>
                <span>Ukuran Kertas: F4 (215 × 330 mm) • Margin: 20 mm</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
