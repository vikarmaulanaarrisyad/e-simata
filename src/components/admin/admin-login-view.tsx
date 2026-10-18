"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { loginAdminAction } from "@/lib/auth";
import { showSwalSuccess, showSwalError, showSwalLoading, closeSwal } from "@/lib/swal";
import { toast } from "sonner";

export function AdminLoginView() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Mohon isi username dan kata sandi admin.");
      return;
    }

    setIsLoading(true);
    showSwalLoading({
      title: "Memverifikasi Kredensial...",
      stepText: "Mengamankan sesi autentikasi admin SIMATA...",
      progressPercent: 50,
    });

    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("password", password.trim());
      if (rememberMe) formData.append("remember", "true");

      const res = await loginAdminAction(formData);

      if (res.success) {
        closeSwal();
        showSwalSuccess({
          title: "Login Berhasil! 🎉",
          message: "Selamat datang kembali di Panel Administrasi SIMATA MI Bustanul Huda.",
          onUploadAgain: () => router.push("/admin"),
        });

        toast.success("Autentikasi berhasil, mengalihkan ke dashboard...");
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 1200);
      } else {
        closeSwal();
        setIsLoading(false);
        setErrorMsg(res.error || "Username atau kata sandi tidak cocok.");
        showSwalError(
          "Autentikasi Gagal",
          res.error || "Username atau kata sandi yang Anda masukkan salah. Silakan periksa kembali."
        );
      }
    } catch (err: any) {
      closeSwal();
      setIsLoading(false);
      const msg = err.message || "Terjadi kesalahan pada jaringan.";
      setErrorMsg(msg);
      showSwalError("Kesalahan Server", msg);
    }
  };

  const handleFillDemo = () => {
    setUsername("admin");
    setPassword("adminpassword");
    toast.info("Kredensial login default terisi!");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-emerald-300/30 via-teal-200/20 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 blur-3xl opacity-80" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/20 dark:bg-teal-900/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-amber-200/20 dark:bg-amber-950/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Back to Home button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Form Publik</span>
        </Link>

        <Badge
          variant="outline"
          className="text-[11px] font-bold border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40"
        >
          <ShieldCheck className="h-3 w-3 mr-1" /> Akses Khusus Admin
        </Badge>
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-md rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
        {/* Card Header Brand Banner */}
        <div className="p-8 pb-6 bg-gradient-to-b from-slate-50 via-emerald-50/40 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 border-b border-border/70 text-center relative">
          {/* Logo Badge */}
          <div className="mx-auto mb-4 relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-xl shadow-emerald-600/30 ring-4 ring-emerald-400/20">
            <ShieldCheck className="h-9 w-9" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              SIMATA
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
              Panel Admin
            </Badge>
          </div>

          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Madrasah Ibtidaiyah Bustanul Huda
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Masuk untuk mengelola kategori berkas, formulir, dan arsip Google Drive
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-username"
                className="text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                Username Admin
              </Label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  autoFocus
                  className="pl-10 h-11 text-sm bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-password"
                className="text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                Kata Sandi
              </Label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-11 text-sm bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 rounded-xl font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ingat sesi login (7 Hari)
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Panel Admin</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials Hint Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                <span>Kredensial Default Admin:</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-mono">
                User: <strong className="text-emerald-800 dark:text-emerald-300">admin</strong> • Pass: <strong className="text-emerald-800 dark:text-emerald-300">adminpassword</strong>
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillDemo}
              className="text-[11px] h-7 px-2.5 font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 shrink-0 cursor-pointer"
            >
              Isi Otomatis
            </Button>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <HardDrive className="h-3 w-3 text-emerald-600" />
            <span>Terhubung langsung dengan Google Drive Cloud API</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
