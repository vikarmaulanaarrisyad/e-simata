"use server";

import prisma from "@/lib/prisma";

export interface ReportQueryParams {
  categoryId?: string;
  date?: string; // YYYY-MM-DD
  madrasah?: string;
}

export interface ReportSubmissionItem {
  id: string;
  categoryId: string;
  categoryName: string;
  madrasah: string;
  kelas: string;
  submitterName: string;
  submitterContact?: string | null;
  notes?: string | null;
  createdAt: string;
  timeFormatted: string;
  dateFormatted: string;
  fieldValues: Array<{
    label: string;
    value: string;
  }>;
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    driveUrl: string;
    driveThumbnailUrl?: string | null;
    driveFolderId?: string | null;
  }>;
}

export async function getReportData(params: ReportQueryParams) {
  try {
    // 1. Ambil Kategori yang dipilih (atau kategori pertama aktif)
    let category;
    if (params.categoryId && params.categoryId !== "all") {
      category = await prisma.category.findUnique({
        where: { id: params.categoryId },
        include: { fields: { orderBy: { orderIndex: "asc" } } },
      });
    } else {
      category = await prisma.category.findFirst({
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        include: { fields: { orderBy: { orderIndex: "asc" } } },
      });
    }

    if (!category) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }

    // 2. Tentukan rentang waktu 00:00:00 s.d. 23:59:59 WIB untuk tanggal yang dipilih
    let targetDate = new Date();
    if (params.date) {
      const parts = params.date.split("-");
      if (parts.length === 3) {
        targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }

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

    // 3. Bangun query Prisma
    const where: any = {
      categoryId: category.id,
      createdAt: {
        gte: startOfDayWIB,
        lte: endOfDayWIB,
      },
    };

    if (params.madrasah && params.madrasah !== "all") {
      where.madrasah = { contains: params.madrasah, mode: "insensitive" };
    }

    const [submissionsRaw, madrasahs, allCategories] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: "asc" },
        include: {
          category: { select: { id: true, name: true, color: true } },
          fieldValues: {
            include: { field: true },
          },
          files: true,
        },
      }),
      ((prisma as any).madrasah
        ? (prisma as any).madrasah.findMany({
            where: { isActive: true },
            orderBy: { orderIndex: "asc" },
          })
        : Promise.resolve([])),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
      }),
    ]);

    // Format tanggal Indonesia
    const dateFormatted = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(targetDate);

    // 4. Transform data submisi
    const submissions: ReportSubmissionItem[] = (submissionsRaw as any[]).map((sub: any) => {
      const answers = (sub.answersJson as Record<string, any>) || {};
      const kelas =
        answers.kelas ||
        answers.rombel ||
        sub.fieldValues?.find(
          (fv: any) =>
            fv.fieldLabel?.toLowerCase().includes("kelas") ||
            fv.fieldName?.toLowerCase().includes("kelas")
        )?.value ||
        "-";

      const timeFormatted = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      }).format(sub.createdAt);

      return {
        id: sub.id,
        categoryId: sub.categoryId,
        categoryName: sub.category?.name || "Kategori",
        madrasah: sub.madrasah || "MI Bustanul Huda 01",
        kelas,
        submitterName: sub.submitterName || "Wali Kelas",
        submitterContact: sub.submitterContact,
        notes: sub.notes,
        createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString(),
        timeFormatted: `${timeFormatted} WIB`,
        dateFormatted,
        fieldValues: (sub.fieldValues || []).map((fv: any) => ({
          label: fv.fieldLabel || fv.fieldName || fv.field?.label || "",
          value: fv.value,
        })),
        files: (sub.files || []).map((f: any) => ({
          id: f.id,
          fileName: f.fileName,
          fileSize: f.fileSize,
          fileType: f.fileType,
          driveUrl: f.driveUrl,
          driveThumbnailUrl: f.driveThumbnailUrl,
          driveFolderId: f.driveFolderId,
        })),
      };
    });

    // 5. Urutkan submisi berdasarkan kelas secara natural (Kelas 1 A, 1 B, 2 A, dst)
    submissions.sort((a, b) => {
      return a.kelas.localeCompare(b.kelas, undefined, { numeric: true, sensitivity: "base" });
    });

    // Hitung total berkas
    const totalFilesCount = submissions.reduce((acc, curr) => acc + curr.files.length, 0);

    return {
      success: true,
      report: {
        category,
        dateFormatted,
        rawDate: `${year}-${month}-${day}`,
        madrasahFilter: params.madrasah || "all",
        totalSubmissions: submissions.length,
        totalFiles: totalFilesCount,
        submissions,
        categories: allCategories,
        madrasahs,
      },
    };
  } catch (error: any) {
    console.error("[getReportData error]", error);
    return { success: false, error: error.message || "Gagal menyusun data laporan." };
  }
}
