"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  FileCheck2,
  Settings,
  ExternalLink,
  HardDrive,
  ShieldCheck,
  Menu,
  ChevronRight,
  Sparkles,
  CalendarDays,
  LogOut,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutAdminAction } from "@/lib/auth";
import { showSwalConfirm, showSwalLoading } from "@/lib/swal";

interface DriveStatus {
  connected: boolean;
  isMock: boolean;
  authType: string;
  user?: string;
  targetFolderId?: string | null;
  message?: string;
}

export function AdminSidebar({ driveStatus }: { driveStatus: DriveStatus }) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Ringkasan Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Kategori & Form Builder",
      href: "/admin/categories",
      icon: FolderTree,
      exact: false,
    },
    {
      title: "Submisi & Berkas Masuk",
      href: "/admin/submissions",
      icon: FileCheck2,
      exact: false,
    },
    {
      title: "Laporan Kegiatan (PDF F4)",
      href: "/admin/reports",
      icon: Printer,
      exact: false,
    },
    {
      title: "Koneksi Google Drive",
      href: "/admin/settings",
      icon: Settings,
      exact: false,
    },
  ];

  const isItemActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const confirmed = await showSwalConfirm(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari panel admin SIMATA?",
      "Ya, Keluar"
    );

    if (confirmed) {
      showSwalLoading({
        title: "Sedang Keluar...",
        stepText: "Menghapus sesi otentikasi admin...",
        progressPercent: 90,
      });
      await logoutAdminAction();
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-72 min-h-screen bg-white/95 dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[1px_0_10px_rgba(0,0,0,0.02)] backdrop-blur-md justify-between shrink-0 select-none">
      <div>
        {/* Logo & Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-3.5 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all duration-200">
              <ShieldCheck className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                  SIMATA
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  PRO
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-1">
                MI Bustanul Huda Dawuhan
              </p>
            </div>
          </Link>
        </div>

        {/* Live Drive Status Widget Card */}
        <div className="p-4 mx-4 my-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 flex items-center justify-center shadow-sm">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                  Google Drive API
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {driveStatus.connected ? "Service Account Aktif" : "Mode Simulasi (Mock)"}
                </span>
              </div>
            </div>

            {driveStatus.connected ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : (
              <Badge variant="amber" className="text-[9px] py-0 px-1.5 font-bold">
                MOCK
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Menu Utama
          </p>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = isItemActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group",
                    active
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                      : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-transform group-hover:scale-110",
                        active ? "text-white" : "text-slate-400 group-hover:text-emerald-600"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>
                  {active && (
                    <ChevronRight className="h-4 w-4 text-emerald-200" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Profile & Public Shortcut & Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {/* Shortcut to Public Portal */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Kunjungi Form Publik</span>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
        </Link>

        {/* Admin User Chip with Logout Button */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                Admin SIMATA
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Terautentikasi
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Keluar / Logout"
            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function AdminHeader({ driveStatus }: { driveStatus: DriveStatus }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine current page title
  const getPageTitle = () => {
    if (pathname === "/admin") return "Ringkasan Dashboard";
    if (pathname === "/admin/categories") return "Manajemen Kategori & Form Builder";
    if (pathname.includes("/admin/categories/") && pathname.includes("/fields"))
      return "Dynamic Form Builder Kustom";
    if (pathname === "/admin/submissions") return "Daftar Submisi & Berkas Masuk";
    if (pathname === "/admin/reports") return "Laporan Rekapitulasi Kegiatan (Format PDF F4)";
    if (pathname === "/admin/settings") return "Koneksi Google Drive & Pengaturan";
    return "Admin Portal";
  };

  const [todayStr, setTodayStr] = React.useState<string>("");

  React.useEffect(() => {
    setTodayStr(
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date())
    );
  }, []);

  const handleLogout = async () => {
    const confirmed = await showSwalConfirm(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari panel admin SIMATA?",
      "Ya, Keluar"
    );

    if (confirmed) {
      showSwalLoading({
        title: "Sedang Keluar...",
        stepText: "Menghapus sesi otentikasi admin...",
        progressPercent: 90,
      });
      await logoutAdminAction();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Sheet Drawer Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 flex flex-col justify-between">
            <div>
              <SheetHeader className="p-5 border-b border-slate-100 dark:border-slate-800 text-left">
                <SheetTitle className="flex items-center gap-2 text-base font-extrabold text-emerald-800 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" /> SIMATA Admin
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-2" onClick={() => setMobileOpen(false)}>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 text-slate-700"
                >
                  <LayoutDashboard className="h-4 w-4 text-emerald-600" /> Ringkasan Dashboard
                </Link>
                <Link
                  href="/admin/categories"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 text-slate-700"
                >
                  <FolderTree className="h-4 w-4 text-emerald-600" /> Kategori & Form Builder
                </Link>
                <Link
                  href="/admin/submissions"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 text-slate-700"
                >
                  <FileCheck2 className="h-4 w-4 text-emerald-600" /> Submisi & Berkas Masuk
                </Link>
                <Link
                  href="/admin/reports"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 text-slate-700"
                >
                  <Printer className="h-4 w-4 text-emerald-600" /> Laporan Kegiatan (PDF F4)
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 text-slate-700"
                >
                  <Settings className="h-4 w-4 text-emerald-600" /> Koneksi Google Drive
                </Link>
                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href="/"
                    target="_blank"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700"
                  >
                    <span>Form Publik</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile Drawer Logout footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="destructive"
                className="w-full gap-2 rounded-xl text-xs font-bold"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar dari Panel Admin</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Title & Breadcrumb */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {getPageTitle()}
          </h2>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span>Portal Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              MI Bustanul Huda Dawuhan
            </span>
          </div>
        </div>
      </div>

      {/* Right: Date pill & Quick Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
          <span suppressHydrationWarning>{todayStr}</span>
        </div>

        <Link href="/" target="_blank">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Lihat</span> Form Publik
          </Button>
        </Link>

        {/* Desktop Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          title="Keluar / Logout"
          className="gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5 text-red-500" />
          <span className="hidden md:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
