"use server";

import prisma from "@/lib/prisma";
import { checkGoogleDriveStatus } from "@/lib/google-drive";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  try {
    const [totalCategories, totalSubmissions, totalFiles, recentFiles, recentSubmissions] =
      await Promise.all([
        prisma.category.count(),
        prisma.submission.count(),
        prisma.uploadedFile.count(),
        prisma.uploadedFile.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            category: { select: { name: true, color: true } },
            submission: { select: { submitterName: true, createdAt: true } },
          },
        }),
        prisma.submission.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            category: { select: { name: true, color: true } },
            files: true,
          },
        }),
      ]);

    // Count images vs videos
    const imageCount = await prisma.uploadedFile.count({
      where: { fileType: "IMAGE" },
    });
    const videoCount = await prisma.uploadedFile.count({
      where: { fileType: "VIDEO" },
    });

    // Check Drive status
    const driveStatus = await checkGoogleDriveStatus();

    return {
      success: true,
      stats: {
        totalCategories,
        totalSubmissions,
        totalFiles,
        imageCount,
        videoCount,
        driveStatus,
        recentFiles,
        recentSubmissions,
      },
    };
  } catch (error: any) {
    console.error("[getDashboardStats error]", error);
    return { success: false, error: error.message };
  }
}

export async function getSubmissions(params?: {
  categoryId?: string;
  search?: string;
}) {
  try {
    const where: any = {};
    if (params?.categoryId && params.categoryId !== "all") {
      where.categoryId = params.categoryId;
    }
    if (params?.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.OR = [
        { submitterName: { contains: q, mode: "insensitive" } },
        { submitterContact: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { madrasah: { contains: q, mode: "insensitive" } },
      ];
    }

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
        fieldValues: {
          include: { field: true },
        },
        files: true,
      },
    });

    return { success: true, data: submissions };
  } catch (error: any) {
    console.error("[getSubmissions error]", error);
    return { success: false, error: error.message };
  }
}

export async function getSubmissionById(id: string) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            fields: { orderBy: { orderIndex: "asc" } },
          },
        },
        fieldValues: {
          include: { field: true },
        },
        files: true,
      },
    });

    if (!submission) return { success: false, error: "Submission tidak ditemukan." };
    return { success: true, data: submission };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSubmission(id: string) {
  try {
    await prisma.submission.delete({
      where: { id },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pengecekan data ganda:
 * Memastikan tidak ada pengiriman ganda pada kategori, madrasah, dan kelas yang sama pada tanggal hari ini (WIB).
 */
export async function checkDuplicateSubmission(params: {
  categoryId: string;
  madrasah?: string | null;
  kelas?: string | null;
  date?: string | Date;
}) {
  try {
    const { categoryId, madrasah, kelas, date } = params;
    if (!categoryId || !kelas || kelas.trim() === "") {
      return { success: true, isDuplicate: false };
    }

    // 1. Tentukan rentang waktu 00:00:00 s.d. 23:59:59 WIB (Asia/Jakarta, UTC+7)
    const targetDate = date ? new Date(date) : new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(targetDate);
    const year = parts.find((p) => p.type === "year")!.value;
    const month = parts.find((p) => p.type === "month")!.value;
    const day = parts.find((p) => p.type === "day")!.value;

    const startOfDayWIB = new Date(`${year}-${month}-${day}T00:00:00+07:00`);
    const endOfDayWIB = new Date(`${year}-${month}-${day}T23:59:59.999+07:00`);

    // 2. Normalisasi kelas (misal: "Kelas 1 A" -> "1a", "1 a" -> "1a")
    const normalizeClass = (c: string) =>
      c.toLowerCase().replace(/kelas/g, "").replace(/rombel/g, "").replace(/[^a-z0-9]/g, "");

    const targetClassNorm = normalizeClass(kelas);

    // 3. Normalisasi madrasah (membedakan MI 01 dan MI 02)
    const normalizeMadrasah = (m?: string | null) => {
      if (!m) return "";
      const s = m.toLowerCase();
      if (s.includes("01") || s.includes("1")) return "mi01";
      if (s.includes("02") || s.includes("2")) return "mi02";
      return s.replace(/[^a-z0-9]/g, "");
    };
    const targetMadrasahNorm = normalizeMadrasah(madrasah);

    // 4. Cari submisi pada kategori dan rentang tanggal hari ini
    const submissions = await prisma.submission.findMany({
      where: {
        categoryId,
        createdAt: {
          gte: startOfDayWIB,
          lte: endOfDayWIB,
        },
      },
      include: {
        category: { select: { name: true } },
        fieldValues: true,
        files: { select: { id: true, fileName: true, fileType: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const sub of submissions) {
      // Periksa apakah madrasah cocok
      const subMadrasahNorm = normalizeMadrasah(sub.madrasah);
      if (targetMadrasahNorm && subMadrasahNorm && targetMadrasahNorm !== subMadrasahNorm) {
        continue;
      }

      // Cari nilai kelas dari answersJson atau fieldValues
      let subClassVal: string | null = null;
      if (sub.answersJson && typeof sub.answersJson === "object") {
        for (const [k, v] of Object.entries(sub.answersJson as Record<string, any>)) {
          if (
            (k.toLowerCase().includes("kelas") || k.toLowerCase().includes("rombel")) &&
            typeof v === "string"
          ) {
            subClassVal = v;
            break;
          }
        }
      }

      if (!subClassVal) {
        const classField = sub.fieldValues.find(
          (fv) =>
            fv.fieldName?.toLowerCase().includes("kelas") ||
            fv.fieldLabel?.toLowerCase().includes("kelas")
        );
        if (classField) {
          subClassVal = classField.value;
        }
      }

      // Jika kelas sama, tandai sebagai duplikat
      if (subClassVal && normalizeClass(subClassVal) === targetClassNorm) {
        const timeFormatted = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
        }).format(sub.createdAt);

        const dateFormatted = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(sub.createdAt);

        return {
          success: true,
          isDuplicate: true,
          existingSubmission: {
            id: sub.id,
            submitterName: sub.submitterName || "Wali Kelas",
            submitterContact: sub.submitterContact,
            madrasah: sub.madrasah || madrasah || "MI Bustanul Huda 01 Dawuhan",
            categoryName: sub.category.name,
            kelas: subClassVal,
            filesCount: sub.files.length,
            createdAt: sub.createdAt,
            timeFormatted: `${timeFormatted} WIB`,
            dateFormatted,
          },
        };
      }
    }

    return { success: true, isDuplicate: false };
  } catch (error: any) {
    console.error("[checkDuplicateSubmission error]", error);
    return { success: false, isDuplicate: false, error: error.message };
  }
}

