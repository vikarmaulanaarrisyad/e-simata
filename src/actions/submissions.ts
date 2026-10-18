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
