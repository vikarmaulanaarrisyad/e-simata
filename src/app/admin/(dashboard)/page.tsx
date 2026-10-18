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
    <div className="space-y-8">
      {/* Hero Welcome Banner with Emerald Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10">
        {/* Background decorative pattern */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>Portal Manajemen Resmi Madrasah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Ahlan wa Sahlan di Dashboard SIMATA
            </h1>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Pantau seluruh berkas foto kegiatan, video tugas siswa, dan transmisi dokumen publik yang terorganisir otomatis ke Google Drive madrasah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/admin/categories">
              <Button
                size="lg"
                className="gap-2 bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-lg shadow-black/10 rounded-xl"
              >
                <Plus className="h-4 w-4 text-emerald-700" /> Kelola Kategori
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/20 text-white hover:bg-white/10 rounded-xl font-semibold backdrop-blur-sm"
              >
                <HardDrive className="h-4 w-4" /> Status Drive
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Google Drive Status Alert if in Mock Mode */}
      {stats?.driveStatus && !stats.driveStatus.connected && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <p className="font-bold text-sm">Google Drive Service Account Berjalan dalam Mode Mock (Simulasi)</p>
              <p className="text-amber-700 dark:text-amber-300">
                Aplikasi tetap aman dan dapat digunakan secara penuh. Berkas tersimpan dengan tautan simulasi. Tempatkan file <code>service-account.json</code> di root proyek untuk upload nyata ke cloud madrasah.
              </p>
            </div>
          </div>
          <Link href="/admin/settings" className="shrink-0 self-end sm:self-center">
            <Button size="sm" variant="outline" className="text-xs border-amber-300 hover:bg-amber-100 text-amber-900 font-bold">
              Konfigurasi Sekarang
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Submisi */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Submisi Masuk
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalSubmissions ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Realtime database sync</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total Berkas */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-teal-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Berkas Terunggah
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardDrive className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalFiles ?? 0}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <ImageIcon className="h-3 w-3" /> {stats?.imageCount ?? 0} Foto
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <FileVideo className="h-3 w-3" /> {stats?.videoCount ?? 0} Video
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Kategori Aktif */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kategori Berkas
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderTree className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalCategories ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dengan dynamic custom fields
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Google Drive Status */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              stats?.driveStatus.connected
                ? "bg-gradient-to-r from-emerald-500 to-green-500"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            }`}
          />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Penyimpanan Google Drive
            </CardTitle>
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                stats?.driveStatus.connected
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-600"
              }`}
            >
              {stats?.driveStatus.connected ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-black truncate text-slate-900 dark:text-white">
              {stats?.driveStatus.connected ? "Service Account Aktif" : "Mode Simulasi (Mock)"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {stats?.driveStatus.user || "Belum ada kredensial JSON"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/categories"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sliders className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
              Dynamic Form Builder
            </h4>
            <p className="text-xs text-muted-foreground">
              Tambah & atur kolom input custom untuk setiap kategori berkas.
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/submissions"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-teal-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600 transition-colors">
              Explorer Berkas & Submisi
            </h4>
            <p className="text-xs text-muted-foreground">
              Telusuri jawaban formulir pengirim dan buka berkas di Google Drive.
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/settings"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <HardDrive className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
              Pengaturan Google Drive
            </h4>
            <p className="text-xs text-muted-foreground">
              Uji koneksi Service Account, kelola folder tujuan, dan petunjuk setup.
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>
      </div>

      {/* Main 2-Column Feed: Berkas Terbaru & Submisi Masuk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kolom 1: Galeri Berkas Terkini */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                Berkas Foto & Video Terkini
              </CardTitle>
              <CardDescription className="text-xs">
                Berkas yang dialirkan langsung ke Google Drive
              </CardDescription>
            </div>
            <Link
              href="/admin/submissions"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-bold"
            >
              Lihat Semua <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 flex-1">
            {!stats?.recentFiles || stats.recentFiles.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <FolderArchive className="h-8 w-8 mx-auto text-slate-300" />
                <p>Belum ada berkas foto atau video yang diunggah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-2 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                        {file.fileType === "IMAGE" ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : (
                          <FileVideo className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                          {file.fileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatBytes(file.fileSize)} • {file.category.name}
                        </p>
                      </div>
                    </div>

                    <a
                      href={file.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-[11px] gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <HardDrive className="h-3 w-3 text-emerald-600" /> Buka di Drive
                        <ExternalLink className="h-2.5 w-2.5 ml-auto opacity-60" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kolom 2: Submisi Formulir Terkini */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-teal-600" />
                Submisi Masuk Terkini
              </CardTitle>
              <CardDescription className="text-xs">
                Data isian formulir dinamis dari pengunjung publik
              </CardDescription>
            </div>
            <Link
              href="/admin/submissions"
              className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-bold"
            >
              Buka Semua <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 flex-1">
            {!stats?.recentSubmissions || stats.recentSubmissions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <FileCheck2 className="h-8 w-8 mx-auto text-slate-300" />
                <p>Belum ada pengiriman formulir dari publik.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="text-[10px] font-bold">
                        {sub.category.name}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDate(sub.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {sub.submitterName || "Pengunjung Publik"}
                        </p>
                        {sub.submitterContact && (
                          <p className="text-[11px] text-muted-foreground">
                            {sub.submitterContact}
                          </p>
                        )}
                      </div>

                      <Badge variant="secondary" className="text-[11px] font-semibold">
                        {sub.files.length} Berkas
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
