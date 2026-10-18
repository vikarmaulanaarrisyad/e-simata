"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Download,
  Smartphone,
  Sparkles,
  X,
  CheckCircle2,
  Share2,
  PlusSquare,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered:", registration.scope);
          })
          .catch((err) => {
            console.log("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Detect Standalone Mode (Already installed & opened as PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const standalone = checkStandalone();
    if (standalone) return; // If already installed & running as standalone app, don't show prompt

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 4. Listen for beforeinstallprompt event (Android / Chromium / Edge / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalledSuccessfully(true);
      setIsOpen(false);
      setDeferredPrompt(null);
      localStorage.setItem("simata_pwa_installed", "true");
      toast.success("Alhamdulillah! Aplikasi SIMATA berhasil dipasang di perangkat Anda.");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 6. Check if this is the first time the teacher accesses the portal
    const promptSeen = localStorage.getItem("simata_pwa_install_prompt_seen");
    const isInstalled = localStorage.getItem("simata_pwa_installed");

    if (!promptSeen && !isInstalled && !standalone) {
      // Delay popup slightly (1.5s) for a smooth first-load visual presentation
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // If iOS Safari
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // If native prompt is available
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("Memasang aplikasi SIMATA ke layar utama...");
          setInstalledSuccessfully(true);
          setIsOpen(false);
          localStorage.setItem("simata_pwa_installed", "true");
        } else {
          toast.info("Pemasangan aplikasi ditunda.");
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    // Fallback: Show manual browser instructions if prompt not caught yet
    toast.info(
      "Ketuk menu browser (titik tiga ⋮ di kanan atas) lalu pilih 'Instal Aplikasi' atau 'Tambahkan ke Layar Utama'."
    );
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Mark as seen so teacher is not interrupted on subsequent visits
    localStorage.setItem("simata_pwa_install_prompt_seen", "true");
  };

  // If already standalone or closed, render nothing
  if (isStandalone || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-sm animate-in fade-in-50 duration-300 select-none">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Background glow header */}
        <div className="relative p-6 sm:p-7 pb-6 bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white overflow-hidden text-center">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>

          {/* SIMATA App Icon Badge */}
          <div className="mx-auto mb-3.5 relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-xl shadow-emerald-950/30 ring-4 ring-white/20">
            <img
              src="/icons/icon-192x192.png"
              alt="SIMATA Icon"
              className="h-16 w-16 rounded-xl object-contain"
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-emerald-100 mb-2 border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>Aplikasi Resmi Madrasah</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            Pasang Aplikasi SIMATA
          </h3>
          <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto leading-relaxed">
            MI Bustanul Huda Dawuhan
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {!showIOSGuide ? (
            <>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-center">
                Pasang SIMATA langsung di layar utama HP atau Laptop Bapak/Ibu Guru untuk pengalaman pengunggahan berkas yang lebih cepat, praktis, dan tanpa perlu membuka browser berulang kali!
              </p>

              {/* Feature Benefit Chips */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 text-xs">
                  <div className="h-7 w-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">
                      1-Ketukan dari Layar Utama (Home Screen)
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      Buka aplikasi langsung dari icon di menu HP Anda seperti aplikasi native Play Store / App Store.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/60 text-xs">
                  <div className="h-7 w-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">
                      Layar Penuh Tanpa Address Bar
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      Tampilan bersih dan luas, memudahkan pengunggahan foto dan video kegiatan kelas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="h-7 w-7 rounded-xl bg-slate-700 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">
                      Ringan & Hemat Kuota (PWA)
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      Hanya berukuran beberapa kilobyte dengan cache cerdas untuk akses super cepat.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full h-12 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Pasang Aplikasi Sekarang</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="w-full h-10 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Nanti Saja, Lanjut ke Web
                </Button>
              </div>
            </>
          ) : (
            /* iOS Safari Step-by-Step Guide */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-center text-emerald-900 dark:text-emerald-200 font-bold">
                📱 Panduan Pemasangan di iPhone / iPad (Safari)
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80">
                  <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div className="flex-1">
                    <span>Ketuk tombol </span>
                    <strong className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                      <Share2 className="h-3.5 w-3.5 inline" /> Bagikan (Share)
                    </strong>
                    <span> di bilah bawah browser Safari.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80">
                  <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div className="flex-1">
                    <span>Gulir ke bawah lalu pilih menu </span>
                    <strong className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                      <PlusSquare className="h-3.5 w-3.5 inline" /> Tambah ke Layar Utama
                    </strong>
                    <span>.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80">
                  <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div className="flex-1">
                    <span>Ketuk tombol </span>
                    <strong className="font-bold text-emerald-700 dark:text-emerald-400">
                      "Tambah" (Add)
                    </strong>
                    <span> di sudut kanan atas layar. Selesai! 🎉</span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleDismiss}
                className="w-full h-11 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
              >
                Saya Sudah Mengerti, Tutup Panduan
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Discrete Install Button for Header / Footer so users who dismissed the popup
 * or want to install later can trigger the install anytime!
 */
export function HeaderInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("Aplikasi SIMATA berhasil dipasang!");
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      toast.info(
        "Untuk memasang aplikasi: Ketuk menu titik tiga (⋮) di browser Anda lalu pilih 'Instal aplikasi' atau 'Tambahkan ke Layar Utama'."
      );
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      title="Pasang aplikasi SIMATA di HP/Laptop"
      className="gap-1.5 text-xs font-bold rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-100/80 dark:border-emerald-700 dark:text-emerald-300 shadow-xs cursor-pointer bg-emerald-50/70"
    >
      <Download className="h-3.5 w-3.5 text-emerald-600" />
      <span className="hidden sm:inline">Install</span> App
    </Button>
  );
}
