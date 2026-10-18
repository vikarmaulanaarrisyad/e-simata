"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  HardDrive,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Mail,
  Key,
  ExternalLink,
  Copy,
  Info,
  LogOut,
  Sparkles,
  User,
  ArrowRight,
  School,
  Building2,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createMadrasah, updateMadrasah, deleteMadrasah } from "@/actions/madrasahs";

export interface MadrasahItem {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  orderIndex: number;
}

interface SettingsManagerProps {
  initialStatus: {
    connected: boolean;
    isMock: boolean;
    authType: string;
    user?: string;
    email?: string;
    picture?: string | null;
    targetFolderId?: string | null;
    message?: string;
    error?: string;
  };
  initialMadrasahs?: MadrasahItem[];
}

export function SettingsManager({ initialStatus, initialMadrasahs = [] }: SettingsManagerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const searchParams = useSearchParams();

  // Madrasah Management State
  const [madrasahs, setMadrasahs] = useState<MadrasahItem[]>(initialMadrasahs);
  const [isMadrasahDialogOpen, setIsMadrasahDialogOpen] = useState(false);
  const [editingMadrasahId, setEditingMadrasahId] = useState<string | null>(null);
  const [madrasahNameInput, setMadrasahNameInput] = useState("");
  const [madrasahCodeInput, setMadrasahCodeInput] = useState("");
  const [isSavingMadrasah, setIsSavingMadrasah] = useState(false);

  // Compute redirect URI safely on client side
  const [redirectUri, setRedirectUri] = useState("/api/auth/google/callback");
  useEffect(() => {
    setRedirectUri(`${window.location.origin}/api/auth/google/callback`);
  }, []);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected === "true") {
      toast.success("Akun Google Admin berhasil terhubung ke Google Drive!");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (err) {
      toast.error(`Gagal menghubungkan Google: ${err}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/drive-status");
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        toast.success("Koneksi Google Drive aktif dan siap menerima berkas!");
      } else {
        toast.warning(data.message || "Masih menggunakan mode simulasi.");
      }
    } catch {
      toast.error("Gagal memeriksa koneksi.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Putuskan koneksi akun Google ini? Pengunggahan berkas akan beralih ke mode cadangan.")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/auth/google/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Koneksi akun Google berhasil diputuskan.");
        setStatus({
          connected: false,
          isMock: true,
          authType: "none",
          message: "Belum ada akun Google admin yang terhubung.",
        });
      } else {
        toast.error(data.error || "Gagal memutuskan koneksi.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke papan klip!`);
  };

  // Madrasah CRUD handlers
  const handleOpenAddMadrasah = () => {
    setEditingMadrasahId(null);
    setMadrasahNameInput("");
    setMadrasahCodeInput("");
    setIsMadrasahDialogOpen(true);
  };

  const handleOpenEditMadrasah = (item: MadrasahItem) => {
    setEditingMadrasahId(item.id);
    setMadrasahNameInput(item.name);
    setMadrasahCodeInput(item.code || "");
    setIsMadrasahDialogOpen(true);
  };

  const handleSaveMadrasah = async () => {
    if (!madrasahNameInput.trim()) {
      toast.error("Nama Madrasah wajib diisi.");
      return;
    }

    setIsSavingMadrasah(true);
    try {
      if (editingMadrasahId) {
        const res = await updateMadrasah(editingMadrasahId, {
          name: madrasahNameInput,
          code: madrasahCodeInput,
        });

        if (res.success && res.data) {
          setMadrasahs((prev) =>
            prev.map((m) => (m.id === editingMadrasahId ? (res.data as MadrasahItem) : m))
          );
          toast.success("Data Madrasah berhasil diperbarui!");
          setIsMadrasahDialogOpen(false);
        } else {
          toast.error(res.error || "Gagal memperbarui data madrasah.");
        }
      } else {
        const res = await createMadrasah({
          name: madrasahNameInput,
          code: madrasahCodeInput,
        });

        if (res.success && res.data) {
          setMadrasahs((prev) => [...prev, res.data as MadrasahItem]);
          toast.success("Nama Madrasah baru berhasil ditambahkan!");
          setIsMadrasahDialogOpen(false);
        } else {
          toast.error(res.error || "Gagal menambahkan madrasah.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSavingMadrasah(false);
    }
  };

  const handleToggleMadrasahActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await updateMadrasah(id, { isActive: !currentStatus });
      if (res.success) {
        setMadrasahs((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isActive: !currentStatus } : m))
        );
        toast.success(`Status madrasah diubah menjadi ${!currentStatus ? "Aktif" : "Non-aktif"}.`);
      } else {
        toast.error(res.error || "Gagal mengubah status.");
      }
    } catch {
      toast.error("Gagal mengubah status madrasah.");
    }
  };

  const handleDeleteMadrasah = async (id: string, name: string) => {
    if (!confirm(`Hapus madrasah "${name}" dari daftar pilihan formulir?`)) {
      return;
    }

    try {
      const res = await deleteMadrasah(id);
      if (res.success) {
        setMadrasahs((prev) => prev.filter((m) => m.id !== id));
        toast.success(`Madrasah "${name}" berhasil dihapus.`);
      } else {
        toast.error(res.error || "Gagal menghapus madrasah.");
      }
    } catch {
      toast.error("Gagal menghapus madrasah.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Pengaturan Sistem & Madrasah
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola daftar nama madrasah binaan (MI 01, MI 02), serta integrasi Google Drive Cloud API.
        </p>
      </div>

      {/* SECTION 1: MANAJEMEN NAMA MADRASAH (MI) */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 dark:from-slate-900/80 dark:via-emerald-950/20 dark:to-slate-900/80 border-b border-border/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                <School className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Daftar Pilihan Madrasah Ibtidaiyah (MI)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Daftar MI yang tampil di formulir pengunggahan berkas publik untuk Wali Kelas.
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={handleOpenAddMadrasah}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm text-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> Tambah Nama MI Baru
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {madrasahs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Belum ada data madrasah. Klik tombol di atas untuk menambahkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {madrasahs.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between gap-3 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 font-black text-xs">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.code && (
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">
                              {item.code}
                            </Badge>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.isActive
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {item.isActive ? "Aktif di Formulir" : "Non-aktif"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditMadrasah(item)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600"
                        title="Ubah nama madrasah"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMadrasah(item.id, item.name)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
                        title="Hapus madrasah"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Tampilkan di Pilihan Formulir:</span>
                    <Switch
                      checked={item.isActive}
                      onCheckedChange={() => handleToggleMadrasahActive(item.id, item.isActive)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Info Struktur Folder:</strong> Berkas yang dikirimkan oleh Wali Kelas akan otomatis dikelompokkan ke subfolder Google Drive sesuai madrasah yang dipilih (misal: <code>SIMATA - [Kategori] / [Nama Madrasah] / [Kelas] / ...</code>).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: GOOGLE DRIVE CONNECTION STATUS */}
      <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-teal-50/40 to-slate-50 dark:from-slate-900/80 dark:via-teal-950/20 dark:to-slate-900/80 border-b border-border/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Koneksi Google Drive Cloud Storage
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Status akun Google admin dan folder tujuan penyimpanan berkas terpusat.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status.connected ? (
                <Badge variant="success" className="gap-1.5 px-3 py-1 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Google Drive Terhubung
                </Badge>
              ) : (
                <Badge variant="amber" className="gap-1.5 px-3 py-1 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" /> Belum Terhubung (Simulasi)
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Active Account / Service Account Info */}
          {status.connected ? (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar className="h-12 w-12 border-2 border-emerald-300 dark:border-emerald-700 shadow-sm">
                  {status.picture && <AvatarImage src={status.picture} alt={status.user || "Admin"} />}
                  <AvatarFallback className="bg-emerald-600 text-white font-bold">
                    {status.user ? status.user[0] : "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {status.user || "Google Account Admin"}
                    <Badge variant="outline" className="text-[10px] font-normal border-emerald-300 text-emerald-800">
                      {status.authType === "oauth" ? "OAuth 2.0" : "Service Account"}
                    </Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5" /> {status.email || "Drive Service Connected"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="gap-1.5 text-xs font-semibold rounded-xl"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
                  {isTesting ? "Memeriksa..." : "Uji Koneksi"}
                </Button>

                {status.authType === "oauth" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="gap-1.5 text-xs font-semibold rounded-xl"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Putuskan
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 justify-center sm:justify-start">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  Koneksi Google Drive Belum Aktif
                </h4>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 max-w-xl">
                  Hubungkan akun Google Drive resmi MI Bustanul Huda Dawuhan dalam satu klik melalui Google OAuth 2.0. Berkas yang diunggah akan otomatis langsung mengalir ke Google Drive.
                </p>
              </div>

              <a href="/api/auth/google" className="shrink-0 w-full sm:w-auto">
                <Button className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md">
                  <Key className="h-3.5 w-3.5" />
                  Hubungkan Google Drive
                </Button>
              </a>
            </div>
          )}

          {/* Details & Target Folder */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card">
              <span className="text-[11px] text-muted-foreground block font-medium">Metode Autentikasi</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {status.authType === "oauth"
                  ? "Google OAuth 2.0 (Akun Admin)"
                  : status.authType === "service_account"
                  ? "Service Account JSON"
                  : status.connected
                  ? "Terkoneksi"
                  : "Mode Simulasi (Mock)"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card">
              <span className="text-[11px] text-muted-foreground block font-medium">Alamat Email Penyimpanan</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block truncate">
                {status.email || "(Belum terhubung)"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card">
              <span className="text-[11px] text-muted-foreground block font-medium">Folder Tujuan Default</span>
              <span className="text-xs font-mono text-slate-800 dark:text-slate-100 mt-1 block truncate">
                {status.targetFolderId || "(Root Google Drive)"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: GUIDE REDIRECT URI */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <CardTitle className="text-base font-bold">
              Konfigurasi Google Cloud Console (OAuth 2.0 Client)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Pastikan Authorized Redirect URI di Google Cloud Console telah ditambahkan agar proses login berjalan lancar:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                Authorized Redirect URI:
              </span>
              <code className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate block mt-0.5">
                {redirectUri}
              </code>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs shrink-0 rounded-xl"
              onClick={() => copyToClipboard(redirectUri, "Authorized Redirect URI")}
            >
              <Copy className="h-3.5 w-3.5" /> Salin URI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DIALOG: TAMBAH / UBAH MADRASAH */}
      <Dialog open={isMadrasahDialogOpen} onOpenChange={setIsMadrasahDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingMadrasahId ? "Ubah Data Madrasah" : "Tambah Nama Madrasah Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nama madrasah akan muncul di pilihan formulir pengunggahan berkas publik untuk Wali Kelas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-name" className="text-xs font-bold">
                Nama Lengkap Madrasah <span className="text-red-500">*</span>
              </Label>
              <Input
                id="m-name"
                placeholder="Contoh: MI Bustanul Huda 01 Dawuhan"
                value={madrasahNameInput}
                onChange={(e) => setMadrasahNameInput(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-code" className="text-xs font-bold">
                Singkatan / Kode Singkat <span className="text-muted-foreground font-normal">(Opsional)</span>
              </Label>
              <Input
                id="m-code"
                placeholder="Contoh: MI 01"
                value={madrasahCodeInput}
                onChange={(e) => setMadrasahCodeInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Digunakan sebagai awalan penamaan file Google Drive secara ringkas.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsMadrasahDialogOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveMadrasah}
              disabled={isSavingMadrasah}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
            >
              {isSavingMadrasah ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
