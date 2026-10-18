"use server";

import prisma from "@/lib/prisma";
import {
  checkGoogleDriveStatus,
  deleteFileFromDrive,
  deleteMultipleFilesFromDrive,
} from "@/lib/google-drive";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCategories,
      totalSubmissions,
      submissionsToday,
      totalFiles,
      fileSizeAgg,
      recentFiles,
      recentSubmissions,
      categoriesBreakdown,
      madrasahsList,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.submission.count(),
      prisma.submission.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.uploadedFile.count(),
      prisma.uploadedFile.aggregate({
        _sum: { fileSize: true },
      }),
      prisma.uploadedFile.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true, color: true } },
          submission: { select: { submitterName: true, createdAt: true, madrasah: true } },
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
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { submissions: true, files: true } },
        },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.madrasah.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { orderIndex: "asc" },
      }),
    ]);

    // Count images vs videos
    const [imageCount, videoCount] = await Promise.all([
      prisma.uploadedFile.count({ where: { fileType: "IMAGE" } }),
      prisma.uploadedFile.count({ where: { fileType: "VIDEO" } }),
    ]);

    // Submissions per madrasah counts
    const madrasahStats = await Promise.all(
      madrasahsList.map(async (m) => {
        const count = await prisma.submission.count({
          where: { madrasah: m.name },
        });
        return {
          id: m.id,
          name: m.name,
          count,
        };
      })
    );

    // Check Drive status
    const driveStatus = await checkGoogleDriveStatus();

    return {
      success: true,
      stats: {
        totalCategories,
        totalSubmissions,
        submissionsToday,
        totalFiles,
        totalSizeBytes: fileSizeAgg._sum.fileSize || 0,
        imageCount,
        videoCount,
        driveStatus,
        recentFiles,
        recentSubmissions,
        categoriesBreakdown,
        madrasahStats,
      },
    };
  } catch (error: any) {
    console.error("[getDashboardStats error]", error);
    return { success: false, error: error.message };
  }
}

export interface ServerSideTableParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  madrasah?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getSubmissionsServerSide(params?: ServerSideTableParams) {
  try {
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(100, Math.max(5, params?.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (params?.categoryId && params.categoryId !== "all") {
      where.categoryId = params.categoryId;
    }

    if (params?.madrasah && params.madrasah !== "all") {
      where.madrasah = params.madrasah;
    }

    if (params?.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.OR = [
        { submitterName: { contains: q, mode: "insensitive" } },
        { submitterContact: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { madrasah: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Filter date range
    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(`${params.startDate}T00:00:00.000Z`);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(`${params.endDate}T23:59:59.999Z`);
      }
    }

    // Sort order
    let orderBy: any = { createdAt: "desc" };
    if (params?.sortBy === "submitterName") {
      orderBy = { submitterName: params.sortOrder || "asc" };
    } else if (params?.sortBy === "madrasah") {
      orderBy = { madrasah: params.sortOrder || "asc" };
    } else if (params?.sortBy === "category") {
      orderBy = { category: { name: params.sortOrder || "asc" } };
    } else if (params?.sortBy === "createdAt") {
      orderBy = { createdAt: params.sortOrder || "desc" };
    }

    const [total, data, madrasahs, categories] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
          fieldValues: {
            include: { field: true },
          },
          files: true,
        },
      }),
      prisma.madrasah.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { orderIndex: "asc" },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
      filters: {
        madrasahs,
        categories,
      },
    };
  } catch (error: any) {
    console.error("[getSubmissionsServerSide error]", error);
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
    // 1. Ambil submission beserta daftar berkas terkait
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!submission) {
      return { success: false, error: "Data submisi tidak ditemukan." };
    }

    // 2. Hapus semua file lampiran langsung dari Google Drive
    const driveIds = submission.files
      .map((f) => f.driveFileId)
      .filter((driveId): driveId is string => Boolean(driveId && driveId.trim() !== ""));

    if (driveIds.length > 0) {
      console.log(`[deleteSubmission] Menghapus ${driveIds.length} berkas dari Google Drive...`);
      await deleteMultipleFilesFromDrive(driveIds);
    }

    // 3. Hapus data submisi dari database (cascade akan otomatis menghapus fieldValues dan files)
    await prisma.submission.delete({
      where: { id },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("[deleteSubmission error]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Menghapus satu berkas tertentu dari submisi sekaligus dari Google Drive
 */
export async function deleteSubmissionFile(fileId: string) {
  try {
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return { success: false, error: "Berkas tidak ditemukan." };
    }

    // Hapus berkas dari Google Drive
    if (file.driveFileId) {
      console.log(`[deleteSubmissionFile] Menghapus berkas Drive ID: ${file.driveFileId}`);
      await deleteFileFromDrive(file.driveFileId);
    }

    // Hapus record dari database
    await prisma.uploadedFile.delete({
      where: { id: fileId },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("[deleteSubmissionFile error]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Memperbarui metadata data submisi (nama wali, kontak, catatan, madrasah, tanggal kegiatan)
 */
export async function updateSubmission(
  id: string,
  data: {
    submitterName?: string;
    submitterContact?: string;
    notes?: string;
    madrasah?: string;
    activityDate?: string;
    kelas?: string;
  }
) {
  try {
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: { fieldValues: true },
    });

    if (!existing) {
      return { success: false, error: "Submisi tidak ditemukan." };
    }

    const existingAnswers = (existing.answersJson as Record<string, any>) || {};
    const updatedAnswers = {
      ...existingAnswers,
      ...(data.activityDate ? { activityDate: data.activityDate, tanggal_kegiatan: data.activityDate } : {}),
      ...(data.kelas ? { kelas: data.kelas, rombel: data.kelas } : {}),
    };

    // Update isian rombel di fieldValues jika ada
    if (data.kelas) {
      for (const fv of existing.fieldValues) {
        if (
          fv.fieldName?.toLowerCase().includes("kelas") ||
          fv.fieldLabel?.toLowerCase().includes("kelas")
        ) {
          await prisma.fieldValue.update({
            where: { id: fv.id },
            data: { value: data.kelas },
          });
        }
      }
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        submitterName: data.submitterName,
        submitterContact: data.submitterContact,
        notes: data.notes,
        madrasah: data.madrasah,
        answersJson: updatedAnswers,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        fieldValues: { include: { field: true } },
        files: true,
      },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("[updateSubmission error]", error);
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

