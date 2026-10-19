import { NextRequest, NextResponse } from "next/server";
import { getGoogleDriveClientAsync } from "@/lib/google-drive";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getFallbackSvg(label = "Dokumentasi Foto") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#f8fafc"/>
    <rect x="15" y="15" width="370" height="270" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-dasharray="4 4"/>
    <circle cx="200" cy="120" r="30" fill="#cbd5e1"/>
    <circle cx="200" cy="120" r="14" fill="#94a3b8"/>
    <rect x="175" y="100" width="10" height="6" rx="2" fill="#94a3b8"/>
    <text x="200" y="180" font-family="sans-serif" font-size="12" font-weight="bold" fill="#334155" text-anchor="middle">${label}</text>
    <text x="200" y="200" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Tersimpan di Google Drive Resmi Madrasah</text>
  </svg>`;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const fileId = req.nextUrl.searchParams.get("fileId");

  if (!url && !fileId) {
    return new NextResponse(getFallbackSvg("Foto Tidak Ditemukan"), {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  // 1. Coba ambil dari URL CDN terlebih dahulu (cepat)
  if (url) {
    try {
      const parsedUrl = new URL(url);
      if (["http:", "https:"].includes(parsedUrl.protocol)) {
        // Coba fetch dengan timeout 6 detik
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get("content-type") || "image/jpeg";
          const arrayBuffer = await response.arrayBuffer();

          return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
            },
          });
        }
      }
    } catch (urlErr) {
      console.warn("[Proxy Image URL fetch warning]", urlErr);
    }
  }

  // 2. Jika URL gagal / 403 / 404, fallback langsung ke Google Drive API resmi via fileId
  if (fileId && fileId.trim() !== "") {
    try {
      const { drive, isMock } = await getGoogleDriveClientAsync();
      if (drive && !isMock) {
        const driveRes = await drive.files.get(
          { fileId: fileId.trim(), alt: "media", supportsAllDrives: true },
          { responseType: "arraybuffer" }
        );

        const contentType =
          (driveRes.headers as Record<string, string>)?.["content-type"] || "image/jpeg";
        const buffer = Buffer.from(driveRes.data as ArrayBuffer);

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
        });
      }
    } catch (driveErr) {
      console.error("[Proxy Image Google Drive API error]", driveErr);
    }
  }

  // 3. Fallback terakhir: Kembalikan SVG elegan agar dokumen PDF tidak gagal render
  return new NextResponse(getFallbackSvg("Dokumentasi Siswa"), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
