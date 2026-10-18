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

    // 6. Listen for manual trigger (e.g. from header button)
    const handleOpenRequest = () => {
      setShowIOSGuide(false);
      setIsOpen(true);
    };

    window.addEventListener("simata:open-install-prompt", handleOpenRequest);

    // 7. Check if prompt should show automatically for teachers who haven't installed
    const isInstalled = localStorage.getItem("simata_pwa_installed");
    const dismissedAt = localStorage.getItem("simata_pwa_install_prompt_dismissed_at");
    
    // Check if dismissed within the last 24 hours
    const dismissedRecently = dismissedAt
      ? Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000
      : false;

    if (!dismissedRecently && !isInstalled && !standalone) {
      // Delay popup slightly (1.5s) for a smooth first-load visual presentation
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("simata:open-install-prompt", handleOpenRequest);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("simata:open-install-prompt", handleOpenRequest);
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
    setShowIOSGuide(false);
    // Save timestamp so we don't bother the user again for the next 24 hours
    localStorage.setItem("simata_pwa_install_prompt_dismissed_at", Date.now().toString());
    localStorage.setItem("simata_pwa_install_prompt_seen", "true");
  };

  // If already standalone or closed, render nothing
  if (isStandalone || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs sm:backdrop-blur-sm animate-in fade-in-50 duration-200 select-none">
      <div className="relative w-full max-w-[340px] sm:max-w-[360px] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Background glow header */}
        <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white overflow-hidden text-center">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-6 bottom-0 w-24 h-24 rounded-full bg-emerald-400/20 blur-lg pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer z-10"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>

          {/* SIMATA App Icon Badge */}
          <div className="mx-auto mb-2 relative flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-md shadow-emerald-950/30 ring-2 ring-white/30">
            <img
              src="/icons/icon-192x192.png"
              alt="SIMATA Icon"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-[10px] font-bold text-emerald-100 mb-1 border border-white/20">
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Aplikasi Madrasah</span>
          </div>

          <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
            Pasang Aplikasi SIMATA
          </h3>
          <p className="text-[11px] text-emerald-100/90 mt-0.5 font-medium">
            MI Bustanul Huda
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 space-y-3">
          {!showIOSGuide ? (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-center">
                Pasang di layar utama HP Bapak/Ibu Guru untuk akses upload berkas yang lebih cepat tanpa browser.
              </p>

              {/* Feature Benefit Chips */}
              <div className="grid grid-cols-3 gap-1.5 py-0.5">
                <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100/80 dark:border-emerald-900/40">
                  <div className="h-6 w-6 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">1-Ketukan</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Layar Utama</span>
                </div>

                <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-100/80 dark:border-teal-900/40">
                  <div className="h-6 w-6 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1">
                    <Smartphone className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Layar Penuh</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Tanpa URL bar</span>
                </div>

                <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="h-6 w-6 rounded-lg bg-slate-700/10 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Ringan</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Hemat kuota</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <Button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full h-9 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Pasang Sekarang</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="w-full h-7 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Nanti Saja
                </Button>
              </div>
            </>
          ) : (
            /* iOS Safari Step-by-Step Guide */
            <div className="space-y-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-center text-emerald-900 dark:text-emerald-200 font-bold">
                📱 Panduan di iPhone / iPad (Safari)
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <div className="flex-1 leading-snug">
                    <span>Ketuk </span>
                    <strong className="inline-flex items-center gap-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <Share2 className="h-3 w-3 inline" /> Bagikan (Share)
                    </strong>
                    <span> di Safari.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <div className="flex-1 leading-snug">
                    <span>Pilih </span>
                    <strong className="inline-flex items-center gap-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <PlusSquare className="h-3 w-3 inline" /> Tambah ke Layar Utama
                    </strong>
                    <span>.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <div className="flex-1 leading-snug">
                    <span>Ketuk </span>
                    <strong className="font-bold text-emerald-700 dark:text-emerald-400">
                      "Tambah" (Add)
                    </strong>
                    <span> di kanan atas. 🎉</span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleDismiss}
                className="w-full h-8 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                Tutup Panduan
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
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsStandalone(isStandaloneMode);
  }, []);

  if (isStandalone) return null;

  const handleInstall = () => {
    window.dispatchEvent(new CustomEvent("simata:open-install-prompt"));
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      title="Pasang aplikasi SIMATA di HP/Laptop"
      className="gap-1.5 text-xs font-bold rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-100/80 dark:border-emerald-700 dark:text-emerald-300 shadow-xs cursor-pointer bg-emerald-50/70"
    >
      <Download className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
      <span className="hidden sm:inline">Install</span> App
    </Button>
  );
}
