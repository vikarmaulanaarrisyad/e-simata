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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

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
}

export function SettingsManager({ initialStatus }: SettingsManagerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const searchParams = useSearchParams();

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
    toast.success(`${label} berhasil disalin.`);
  };

  const [redirectUri, setRedirectUri] = useState("http://localhost:3000/api/auth/google/callback");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectUri(`${window.location.origin}/api/auth/google/callback`);
    }
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Koneksi Google Email Admin & Drive
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Hubungkan akun Google/Gmail yang digunakan admin agar berkas foto & video yang diunggah publik langsung tersimpan di Google Drive Anda.
        </p>
      </div>

      {/* Main Connection Card: OAuth 2.0 with Admin Google Email */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-md overflow-hidden relative">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border-b border-emerald-100 dark:border-emerald-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {/* Google Brand Logo / User Avatar */}
              {status.picture ? (
                <Avatar className="h-14 w-14 border-2 border-emerald-500 shadow-md">
                  <AvatarImage src={status.picture} alt={status.user || "Admin"} />
                  <AvatarFallback className="bg-emerald-600 text-white font-bold">
                    AD
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center p-2.5 border border-slate-200 dark:border-slate-700 shrink-0">
                  <svg className="h-full w-full" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {status.connected && status.email ? status.user : "Akun Google Admin"}
                  </h3>
                  {status.connected ? (
                    <Badge variant="success" className="text-xs gap-1 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Terkoneksi
                    </Badge>
                  ) : (
                    <Badge variant="amber" className="text-xs gap-1 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" /> Belum Terhubung
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {status.connected && status.email
                    ? `Google Email: ${status.email}`
                    : "Hubungkan akun Google admin agar berkas publik langsung tersimpan di Google Drive Anda."}
                </p>

                {status.authType === "oauth_admin" && (
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓ Menggunakan OAuth 2.0 (Berkas publik otomatis dialirkan ke Google Drive akun ini)
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {status.connected && status.authType === "oauth_admin" ? (
                <>
                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl"
                    >
                      <HardDrive className="h-3.5 w-3.5 text-emerald-600" /> Buka Google Drive
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Button>
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDisconnecting}
                    onClick={handleDisconnect}
                    className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 rounded-xl"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Putuskan / Ganti Akun
                  </Button>
                </>
              ) : (
                <a href="/api/auth/google">
                  <Button
                    size="lg"
                    className="gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20"
                  >
                    <Mail className="h-4 w-4" /> Hubungkan Akun Google Saya
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Card Content details */}
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card">
              <span className="text-[11px] text-muted-foreground block font-medium">Metode Otentikasi</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                {status.authType === "oauth_admin"
                  ? "Google OAuth 2.0 (Akun Admin)"
                  : status.authType === "service_account_file"
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

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Keterangan Sistem:</span>
              <p className="text-muted-foreground">{status.message}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="gap-1.5 text-xs font-semibold shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
              {isTesting ? "Menguji..." : "Periksa Status"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guide: Authorized Redirect URI Setting */}
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

          <p className="text-muted-foreground leading-relaxed">
            Jika Google menampilkan peringatan <em>redirect_uri_mismatch</em>, cukup buka menu{" "}
            <strong>APIs &amp; Services &gt; Credentials</strong> di Google Cloud Console, pilih OAuth 2.0 Client ID Anda, dan tambahkan URI di atas ke bagian <strong>Authorized redirect URIs</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
