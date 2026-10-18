import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadStreamToDrive, sanitizeFileName, setupSubmissionFolder } from "@/lib/google-drive";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const submissionId = formData.get("submissionId") as string;
    const file = formData.get("file") as File;

    if (!submissionId || !file) {
      return NextResponse.json(
        { success: false, error: "ID submisi dan berkas wajib disertakan." },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        category: true,
        files: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: "Data submisi tidak ditemukan." },
        { status: 404 }
      );
    }

    // Tentukan folder Google Drive (gunakan folder dari file yang sudah ada jika ada)
    let targetFolderId = submission.files[0]?.driveFolderId;
    const answers = (submission.answersJson as Record<string, any>) || {};
    const className = answers.kelas || answers.rombel || null;
    const activityDate = answers.activityDate || null;

    if (!targetFolderId) {
      const baseFolderId = submission.category.driveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || null;
      const folderSetup = await setupSubmissionFolder({
        categoryName: submission.category.name,
        madrasahName: submission.madrasah,
        className,
        submitterName: submission.submitterName,
        activityDate,
        baseFolderId,
      });
      targetFolderId = folderSetup.submissionFolderId;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const fileType = isImage ? "IMAGE" : isVideo ? "VIDEO" : "OTHER";

    const cleanFileName = sanitizeFileName({
      originalName: file.name,
      categoryName: submission.category.name,
      madrasahName: submission.madrasah,
      className,
      submitterName: submission.submitterName,
      activityDate,
      index: submission.files.length,
      totalFiles: submission.files.length + 1,
    });

    const driveRes = await uploadStreamToDrive({
      stream: buffer,
      fileName: cleanFileName,
      mimeType: file.type || "application/octet-stream",
      folderId: targetFolderId,
    });

    const newRecord = await prisma.uploadedFile.create({
      data: {
        submissionId: submission.id,
        categoryId: submission.category.id,
        fileName: driveRes.name,
        fileSize: file.size,
        fileType,
        mimeType: file.type || "application/octet-stream",
        driveFileId: driveRes.fileId,
        driveUrl: driveRes.webViewLink,
        driveThumbnailUrl: driveRes.thumbnailLink,
        driveFolderId: targetFolderId || null,
        status: "SUCCESS",
      },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: "Berkas baru berhasil ditambahkan ke Google Drive!",
      file: newRecord,
    });
  } catch (error: any) {
    console.error("[Add File API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengunggah berkas ke Google Drive.",
      },
      { status: 500 }
    );
  }
}
