import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteMultipleFilesFromDrive } from "@/lib/google-drive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      categoryId,
      submitterName = null,
      submitterContact = null,
      madrasah = null,
      activityDate = null,
      fieldsData = {},
      allowSupplementary = false,
      replaceSubmissionId = null,
      submissionFolderName = null,
      submissionFolderUrl = null,
      targetFolderId = null,
      files = [],
    } = body;

    let notes = body.notes || null;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Kategori wajib dipilih." },
        { status: 400 }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada berkas yang berhasil tersimpan di Google Drive. Mohon unggah ulang berkas.",
        },
        { status: 400 }
      );
    }

    // 1. Ambil data kategori beserta custom fields
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        fields: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan di sistem." },
        { status: 404 }
      );
    }

    // 2. Deteksi kelas/rombel untuk konsistensi query
    let selectedClass: string | null = null;
    const directClass = body.className || body.kelas || body.class;
    if (directClass && typeof directClass === "string" && directClass.trim() !== "") {
      selectedClass = directClass.trim();
    } else {
      for (const [key, value] of Object.entries(fieldsData)) {
        const kLower = key.toLowerCase();
        if (kLower.includes("kelas") || kLower.includes("rombel") || kLower.includes("class")) {
          if (value && typeof value === "string" && value.trim() !== "") {
            selectedClass = value.trim();
            break;
          }
        }
      }
      if (!selectedClass) {
        for (const field of category.fields) {
          if (field.label.toLowerCase().includes("kelas")) {
            const val = fieldsData[field.name];
            if (val && typeof val === "string" && val.trim() !== "") {
              selectedClass = val.trim();
              break;
            }
          }
        }
      }
    }

    if (allowSupplementary) {
      notes = notes ? `${notes} [Berkas Susulan]` : "[Berkas Susulan]";
    }

    // 3. Waktu pengiriman menggunakan jam aktual server zona WIB (Asia/Jakarta)
    const now = new Date();
    let creationDate = now;
    if (activityDate) {
      const parts = activityDate.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        const timeWibStr = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now);

        creationDate = new Date(`${activityDate}T${timeWibStr}+07:00`);
      }
    }

    const combinedAnswers = {
      ...fieldsData,
      ...(activityDate ? { activityDate, tanggal_kegiatan: activityDate } : {}),
      ...(selectedClass ? { kelas: selectedClass, rombel: selectedClass } : {}),
    };

    // 4. Jika replaceSubmissionId disertakan, hapus berkas-berkas lama dari Google Drive & database
    if (replaceSubmissionId) {
      const existingSubmission = await prisma.submission.findUnique({
        where: { id: replaceSubmissionId },
        include: { files: true },
      });

      if (existingSubmission) {
        const oldDriveIds = existingSubmission.files
          .map((f) => f.driveFileId)
          .filter((id): id is string => Boolean(id && id.trim() !== ""));

        if (oldDriveIds.length > 0) {
          try {
            await deleteMultipleFilesFromDrive(oldDriveIds);
          } catch (e) {
            console.warn("[Upload Complete Replace Delete Warning]", e);
          }
        }

        await prisma.uploadedFile.deleteMany({
          where: { submissionId: replaceSubmissionId },
        });

        await prisma.fieldValue.deleteMany({
          where: { submissionId: replaceSubmissionId },
        });
      }
    }

    // 5. Simpan ke database secara transaksi atomik
    const result = await prisma.$transaction(async (tx) => {
      let submissionRecord;
      if (replaceSubmissionId) {
        submissionRecord = await tx.submission.update({
          where: { id: replaceSubmissionId },
          data: {
            madrasah,
            submitterName,
            submitterContact,
            notes,
            answersJson: combinedAnswers,
            createdAt: activityDate ? creationDate : undefined,
            updatedAt: new Date(),
          },
        });
      } else {
        submissionRecord = await tx.submission.create({
          data: {
            categoryId: category.id,
            madrasah,
            submitterName,
            submitterContact,
            notes,
            answersJson: combinedAnswers,
            createdAt: creationDate,
          },
        });
      }

      // Simpan isian custom fields
      for (const field of category.fields) {
        const val = fieldsData[field.name];
        if (val !== undefined && val !== null && val !== "") {
          const strVal = typeof val === "object" ? JSON.stringify(val) : String(val);
          await tx.fieldValue.create({
            data: {
              submissionId: submissionRecord.id,
              fieldId: field.id,
              fieldName: field.name,
              fieldLabel: field.label,
              value: strVal,
            },
          });
        }
      }

      // Simpan record UploadedFile untuk semua berkas yang sudah berhasil tersimpan di Google Drive
      const createdFiles = [];
      for (const f of files) {
        const uploadedFile = await tx.uploadedFile.create({
          data: {
            submissionId: submissionRecord.id,
            categoryId: category.id,
            fileName: f.fileName || f.name,
            fileSize: typeof f.fileSize === "number" ? f.fileSize : parseInt(f.fileSize || "0", 10),
            fileType: f.fileType || "OTHER",
            mimeType: f.mimeType || "application/octet-stream",
            driveFileId: f.driveFileId || f.fileId,
            driveUrl: f.driveUrl || f.webViewLink,
            driveThumbnailUrl: f.driveThumbnailUrl || f.thumbnailLink || null,
            driveFolderId: f.driveFolderId || targetFolderId,
            status: "SUCCESS",
          },
        });
        createdFiles.push(uploadedFile);
      }

      return {
        submission: submissionRecord,
        createdFiles,
      };
    });

    return NextResponse.json({
      success: true,
      submissionId: result.submission.id,
      categoryName: category.name,
      submissionFolderName,
      submissionFolderUrl,
      filesCount: result.createdFiles.length,
      files: result.createdFiles.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileSize: f.fileSize,
        fileType: f.fileType,
        driveUrl: f.driveUrl,
        driveThumbnailUrl: f.driveThumbnailUrl,
      })),
      message: "Seluruh berkas berhasil tersimpan di Google Drive dan tercatat di database!",
    });
  } catch (error: unknown) {
    console.error("[Upload Complete API Error]", error);
    const errorMsg = error instanceof Error ? error.message : "Kesalahan server internal";
    return NextResponse.json(
      {
        success: false,
        error: `Gagal mencatat submisi ke database: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
