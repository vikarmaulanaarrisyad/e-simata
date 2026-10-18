import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadStreamToDrive, deleteFileFromDrive, sanitizeFileName } from "@/lib/google-drive";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileId = formData.get("fileId") as string;
    const newFile = formData.get("file") as File;

    if (!fileId || !newFile) {
      return NextResponse.json(
        { success: false, error: "ID berkas lama dan file pengganti wajib disertakan." },
        { status: 400 }
      );
    }

    // 1. Cari data berkas lama
    const oldRecord = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: {
        submission: true,
        category: true,
      },
    });

    if (!oldRecord) {
      return NextResponse.json(
        { success: false, error: "Data berkas lama tidak ditemukan di sistem." },
        { status: 404 }
      );
    }

    // 2. Hapus berkas lama dari Google Drive secara permanen
    if (oldRecord.driveFileId) {
      console.log(`[Replace File] Menghapus berkas lama di Google Drive: ${oldRecord.driveFileId}`);
      await deleteFileFromDrive(oldRecord.driveFileId);
    }

    // 3. Persiapkan buffer dan metadata untuk berkas baru
    const buffer = Buffer.from(await newFile.arrayBuffer());
    const isImage = newFile.type.startsWith("image/");
    const isVideo = newFile.type.startsWith("video/");
    const fileType = isImage ? "IMAGE" : isVideo ? "VIDEO" : "OTHER";

    const answers = (oldRecord.submission?.answersJson as Record<string, any>) || {};
    const className = answers.kelas || answers.rombel || null;
    const activityDate = answers.activityDate || null;

    const cleanFileName = sanitizeFileName({
      originalName: newFile.name,
      categoryName: oldRecord.category.name,
      madrasahName: oldRecord.submission?.madrasah,
      className,
      submitterName: oldRecord.submission?.submitterName,
      activityDate,
    });

    // 4. Upload berkas baru ke Google Drive di folder yang sama
    const driveRes = await uploadStreamToDrive({
      stream: buffer,
      fileName: cleanFileName,
      mimeType: newFile.type || "application/octet-stream",
      folderId: oldRecord.driveFolderId,
    });

    // 5. Update record di database
    const updatedRecord = await prisma.uploadedFile.update({
      where: { id: fileId },
      data: {
        fileName: driveRes.name,
        fileSize: newFile.size,
        fileType,
        mimeType: newFile.type || "application/octet-stream",
        driveFileId: driveRes.fileId,
        driveUrl: driveRes.webViewLink,
        driveThumbnailUrl: driveRes.thumbnailLink,
      },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: "Berkas lama di Google Drive berhasil dihapus dan diganti dengan berkas baru!",
      file: updatedRecord,
    });
  } catch (error: any) {
    console.error("[Replace File API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengganti berkas di Google Drive.",
      },
      { status: 500 }
    );
  }
}
