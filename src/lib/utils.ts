import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const TIMEZONE_WIB = "Asia/Jakarta";

/**
 * Format jam dan menit ke zona waktu resmi WIB (Asia/Jakarta)
 * Contoh: "08.15 WIB"
 */
export function formatTimeWIB(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_WIB,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${time.replace(":", ".")} WIB`;
}

/**
 * Format tanggal lengkap ke zona waktu resmi Asia/Jakarta (WIB)
 * Contoh: "Senin, 19 Oktober 2026"
 */
export function formatDateWIB(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_WIB,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Format tanggal singkat ke zona waktu resmi Asia/Jakarta (WIB)
 * Contoh: "19 Oktober 2026"
 */
export function formatSimpleDateWIB(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_WIB,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Format tanggal dan jam lengkap ke zona waktu resmi Asia/Jakarta (WIB)
 * Contoh: "19 Okt 2026, 08.15 WIB"
 */
export function formatDate(date: Date | string) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_WIB,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
