import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendChunkToDrive } from "@/lib/google-drive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const submissionId = formData.get("submissionId") as string;
    const categoryId = formData.get("categoryId") as string;
    const cleanFileName = formData.get("cleanFileName") as string;
    const fileType = ((formData.get("fileType") as string) || "OTHER") as "IMAGE" | "VIDEO" | "OTHER";
    const mimeType = (formData.get("mimeType") as string) || "application/octet-stream";
    const totalSize = parseInt(formData.get("totalSize") as string, 10);
    const startByte = parseInt(formData.get("startByte") as string, 10);
    const endByte = parseInt(formData.get("endByte") as string, 10);
    const sessionUrl = formData.get("sessionUrl") as string;
    const isMock = formData.get("isMock") === "true";
    const targetFolderId = (formData.get("targetFolderId") as string) || null;

    const chunk = formData.get("chunk") as File | null;

    if (!sessionUrl || !chunk || isNaN(totalSize) || isNaN(startByte) || isNaN(endByte)) {
      return NextResponse.json(
        { success: false, error: "Parameter potongan berkas tidak lengkap." },
        { status: 400 }
      );
    }

    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

    const result = await sendChunkToDrive({
      sessionUrl,
      chunkBuffer,
      startByte,
      endByte,
      totalSize,
      mimeType,
      fileName: cleanFileName,
      isMock,
    });

    if (result.isComplete && result.driveFile) {
      // Simpan record UploadedFile ke database
      const uploadedRecord = await prisma.uploadedFile.create({
        data: {
          submissionId,
          categoryId,
          fileName: result.driveFile.name || cleanFileName,
          fileSize: totalSize,
          fileType: fileType,
          mimeType: mimeType,
          driveFileId: result.driveFile.fileId,
          driveUrl: result.driveFile.webViewLink,
          driveThumbnailUrl: result.driveFile.thumbnailLink || null,
          driveFolderId: targetFolderId,
          status: "SUCCESS",
        },
      });

      return NextResponse.json({
        success: true,
        isComplete: true,
        file: {
          id: uploadedRecord.id,
          fileName: uploadedRecord.fileName,
          fileSize: uploadedRecord.fileSize,
          fileType: uploadedRecord.fileType,
          driveUrl: uploadedRecord.driveUrl,
          driveThumbnailUrl: uploadedRecord.driveThumbnailUrl,
          isMock: result.driveFile.isMock,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isComplete: false,
      bytesReceived: endByte + 1,
    });
  } catch (error: unknown) {
    console.error("[Upload Chunk API Error]", error);
    const errorMsg = error instanceof Error ? error.message : "Kesalahan transmisi";
    return NextResponse.json(
      {
        success: false,
        error: `Gagal mentransmisikan bagian berkas: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
