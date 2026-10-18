import React from "react";
import Link from "next/link";
import {
  FolderTree,
  FileCheck2,
  HardDrive,
  ExternalLink,
  Plus,
  Image as ImageIcon,
  FileVideo,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FolderArchive,
  ArrowUpRight,
  Zap,
  School,
  Database,
  CalendarDays,
  Layers,
  BarChart3,
} from "lucide-react";
import { getDashboardStats } from "@/actions/submissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatBytes } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const result = await getDashboardStats();
  const stats = result.success && result.stats ? result.stats : null;

  return (
    <div className="space-y-8 select-none">
      {/* Hero Welcome Banner with Emerald Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/15">
        {/* Background decorative pattern */}
        <div className="absolute -right-10 -bottom-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 top-0 h-48 w-48 rounded-full bg-teal-300/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>Pusat Kendali Administrasi Madrasah</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Dashboard SIMATA Terpadu
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Selamat datang di sistem manajemen arsip MI Bustanul Huda. Seluruh data tersimpan otomatis di database Supabase PostgreSQL dan terorganisir per rombel kelas di Google Drive cloud.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/admin/submissions">
              <Button
                size="lg"
                className="gap-2 bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold shadow-xl shadow-black/10 rounded-2xl text-xs cursor-pointer"
              >
                <Layers className="h-4 w-4 text-emerald-700" /> Buka Submisi Explorer
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/20 text-white hover:bg-white/15 rounded-2xl font-bold text-xs backdrop-blur-md cursor-pointer"
              >
                <FolderTree className="h-4 w-4" /> Form Builder
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Google Drive Status Alert if in Mock Mode */}
      {stats?.driveStatus && !stats.driveStatus.connected && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in-50">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <p className="font-extrabold text-sm">Google Drive Berjalan dalam Mode Mock (Simulasi)</p>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                Aplikasi dan database berfungsi 100%. Untuk pengunggahan nyata ke cloud Google Drive madrasah, silakan hubungkan OAuth di halaman pengaturan atau letakkan <code>service-account.json</code> di root proyek.
              </p>
            </div>
          </div>
          <Link href="/admin/settings" className="shrink-0 self-end sm:self-center">
            <Button size="sm" variant="outline" className="text-xs border-amber-300 hover:bg-amber-100 text-amber-900 font-extrabold rounded-xl cursor-pointer">
              Konfigurasi Drive
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Submisi */}
        <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group bg-white dark:bg-slate-900">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Submisi Masuk
            </CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats?.totalSubmissions ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hari ini: {stats?.submissionsToday ?? 0} berkas masuk</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total Berkas */}
        <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group bg-white dark:bg-slate-900">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Foto & Video Terunggah
            </CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <ImageIcon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats?.totalFiles ?? 0}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> {stats?.imageCount ?? 0} Foto
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-teal-600 flex items-center gap-1">
                <FileVideo className="h-3 w-3" /> {stats?.videoCount ?? 0} Video
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Kapasitas Penyimpanan */}
        <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group bg-white dark:bg-slate-900">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Volume Arsip Cloud
            </CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Database className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatBytes(stats?.totalSizeBytes ?? 0)}
            </div>
            <p className="text-xs font-medium text-muted-foreground truncate">
              Tersimpan di Google Drive & Supabase
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Google Drive Status */}
        <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group bg-white dark:bg-slate-900">
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              stats?.driveStatus.connected
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            }`}
          />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Koneksi Google Drive
            </CardTitle>
            <div
              className={`h-10 w-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs ${
                stats?.driveStatus.connected
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-600"
              }`}
            >
              {stats?.driveStatus.connected ? (
                <HardDrive className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg font-black truncate text-slate-900 dark:text-white">
              {stats?.driveStatus.connected ? "Service Account Aktif" : "Mode Simulasi (Mock)"}
            </div>
            <p className="text-xs text-muted-foreground truncate font-mono">
              Folder: {stats?.driveStatus.targetFolderId || "Root SIMATA"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Breakdown: Madrasah & Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satuan Pendidikan / Madrasah Breakdown */}
        <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold">
                <School className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Aktivitas Submisi per Madrasah
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Perbandingan volume pengiriman berkas antar madrasah
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">
              2 Satuan Pendidikan
            </Badge>
          </div>

          <div className="space-y-3 pt-2">
            {stats?.madrasahStats && stats.madrasahStats.length > 0 ? (
              stats.madrasahStats.map((m) => {
                const total = stats.totalSubmissions || 1;
                const percent = Math.round((m.count / total) * 100);
                const isMI01 = m.name.includes("01");

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isMI01 ? "bg-teal-500" : "bg-indigo-500"
                          }`}
                        />
                        {m.name}
                      </span>
                      <span className="text-slate-900 dark:text-white font-extrabold">
                        {m.count} Submisi ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMI01
                            ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500"
                        }`}
                        style={{ width: `${Math.max(8, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada data madrasah.</p>
            )}
          </div>
        </Card>

        {/* Kategori Program Breakdown */}
        <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Distribusi Program & Kategori
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Jumlah dokumen terkumpul per kategori kegiatan
                </p>
              </div>
            </div>
            <Link href="/admin/categories" className="text-xs font-bold text-emerald-600 hover:underline">
              Kelola
            </Link>
          </div>

          <div className="space-y-2.5 pt-2">
            {stats?.categoriesBreakdown && stats.categoriesBreakdown.length > 0 ? (
              stats.categoriesBreakdown.slice(0, 4).map((c) => {
                const subCount = c._count?.submissions || 0;
                const fileCount = c._count?.files || 0;

                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 text-xs shadow-xs">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {c.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {subCount} submisi
                      </Badge>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold">
                        {fileCount} berkas
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada kategori yang dibuat.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Submisi Masuk Terbaru Quick Table */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-600" />
              Submisi Masuk Terbaru
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              6 pengiriman formulir terakhir yang terverifikasi dan masuk ke database
            </CardDescription>
          </div>

          <Link href="/admin/submissions">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-extrabold border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 rounded-xl"
            >
              <span>Buka Server-Side Explorer</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {!stats?.recentSubmissions || stats.recentSubmissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <FolderArchive className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Belum ada submisi berkas yang masuk.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[11px]">
                    <th className="py-3 px-6">Waktu</th>
                    <th className="py-3 px-6">Kategori</th>
                    <th className="py-3 px-6">Madrasah & Kelas</th>
                    <th className="py-3 px-6">Wali Kelas</th>
                    <th className="py-3 px-6 text-center">Berkas</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.recentSubmissions.map((sub) => {
                    const d = new Date(sub.createdAt);
                    const isMI01 = sub.madrasah?.includes("01");
                    const kelas =
                      (sub.answersJson as any)?.kelas ||
                      (sub.answersJson as any)?.rombel ||
                      "-";

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            {formatDate(sub.createdAt)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                          </span>
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <Badge variant="outline" className="text-[11px] font-bold border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 bg-emerald-50/50">
                            {sub.category.name}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isMI01 ? "bg-teal-100 text-teal-800" : "bg-indigo-100 text-indigo-800"}`}>
                              {isMI01 ? "MI 01" : "MI 02"}
                            </span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">
                              {kelas}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {sub.submitterName || "Wali Kelas"}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                            <ImageIcon className="h-3 w-3 text-emerald-600" />
                            {sub.files.length} File
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <Link href="/admin/submissions">
                            <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg">
                              Lihat <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
