import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  createResumableDriveSession,
  setupSubmissionFolder,
  sanitizeFileName,
  deleteMultipleFilesFromDrive,
} from "@/lib/google-drive";
import { checkDuplicateSubmission } from "@/actions/submissions";

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
      files = [],
    } = body;

    let notes = body.notes || null;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Kategori wajib dipilih." },
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
        { success: false, error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Validasi field yang berstatus isRequired
    for (const field of category.fields) {
      if (field.isRequired) {
        const val = fieldsData[field.name];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          return NextResponse.json(
            {
              success: false,
              error: `Field "${field.label}" wajib diisi.`,
              fieldKey: field.name,
            },
            { status: 400 }
          );
        }
      }
    }

    // 3. Validasi daftar berkas
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Harap lampirkan minimal 1 berkas foto atau video." },
        { status: 400 }
      );
    }

    // 3b. Deteksi pilihan kelas untuk verifikasi data ganda
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

    // 3c. Cek data ganda: Cegah pengiriman berulang pada hari yang sama (kecuali jika opsi replace/update diaktifkan)
    if (selectedClass && !allowSupplementary && !replaceSubmissionId) {
      const dupCheck = await checkDuplicateSubmission({
        categoryId: category.id,
        madrasah,
        kelas: selectedClass,
        date: activityDate || undefined,
      });

      if (dupCheck.success && dupCheck.isDuplicate && dupCheck.existingSubmission) {
        const ex = dupCheck.existingSubmission;
        return NextResponse.json(
          {
            success: false,
            isDuplicate: true,
            error: `Pengiriman dicegah: ${ex.kelas} di ${ex.madrasah} sudah tercatat mengisi ${ex.categoryName} pada hari ini (${ex.dateFormatted}) pukul ${ex.timeFormatted} oleh ${ex.submitterName}.`,
            existingSubmission: ex,
          },
          { status: 409 }
        );
      }
    }

    if (allowSupplementary) {
      notes = notes ? `${notes} [Berkas Susulan]` : "[Berkas Susulan]";
    }

    // 4. Jika replaceSubmissionId disertakan, hapus berkas-berkas lama dari Google Drive dan database
    let existingSubmission = null;
    if (replaceSubmissionId) {
      existingSubmission = await prisma.submission.findUnique({
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
            console.warn("[Upload Init Replace Delete Warning]", e);
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

    // 5. Buat atau perbarui record Submission di database
    const combinedAnswers = {
      ...fieldsData,
      ...(activityDate ? { activityDate, tanggal_kegiatan: activityDate } : {}),
      ...(selectedClass ? { kelas: selectedClass, rombel: selectedClass } : {}),
    };

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

    let submission;
    if (replaceSubmissionId && existingSubmission) {
      submission = await prisma.submission.update({
        where: { id: replaceSubmissionId },
        data: {
          madrasah: madrasah || existingSubmission.madrasah,
          submitterName: submitterName || existingSubmission.submitterName,
          submitterContact: submitterContact || existingSubmission.submitterContact,
          notes: notes !== null ? notes : existingSubmission.notes,
          answersJson: combinedAnswers,
          createdAt: activityDate ? creationDate : existingSubmission.createdAt,
          updatedAt: new Date(),
        },
      });
    } else {
      submission = await prisma.submission.create({
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

    // 6. Simpan isian FieldValue
    const fieldValuePromises = category.fields.map((field) => {
      const val = fieldsData[field.name];
      if (val !== undefined && val !== null && val !== "") {
        const strVal = typeof val === "object" ? JSON.stringify(val) : String(val);
        return prisma.fieldValue.create({
          data: {
            submissionId: submission.id,
            fieldId: field.id,
            fieldName: field.name,
            fieldLabel: field.label,
            value: strVal,
          },
        });
      }
      return Promise.resolve(null);
    });
    await Promise.all(fieldValuePromises);

    // 7. Siapkan hierarki folder Google Drive
    const baseFolderId = category.driveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || null;
    const folderStructure = await setupSubmissionFolder({
      categoryName: category.name,
      madrasahName: madrasah,
      className: selectedClass,
      submitterName,
      activityDate,
      baseFolderId,
    });

    const targetFolderId = folderStructure.submissionFolderId;

    // 8. Buat Sesi Resumable Upload Google Drive untuk setiap berkas
    const fileSessions = await Promise.all(
      files.map(async (fileItem: { name: string; size: number; type: string }, idx: number) => {
        const isImage = fileItem.type.startsWith("image/");
        const isVideo = fileItem.type.startsWith("video/");
        const fileType = isImage ? "IMAGE" : isVideo ? "VIDEO" : "OTHER";

        const cleanFileName = sanitizeFileName({
          originalName: fileItem.name,
          categoryName: category.name,
          madrasahName: madrasah,
          className: selectedClass,
          submitterName,
          activityDate,
          index: idx,
          totalFiles: files.length,
        });

        const session = await createResumableDriveSession({
          fileName: cleanFileName,
          mimeType: fileItem.type || "application/octet-stream",
          fileSize: fileItem.size,
          folderId: targetFolderId,
        });

        return {
          fileIndex: idx,
          originalName: fileItem.name,
          cleanFileName,
          fileSize: fileItem.size,
          mimeType: fileItem.type || "application/octet-stream",
          fileType,
          sessionUrl: session.sessionUrl,
          isMock: session.isMock,
        };
      })
    );

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      categoryName: category.name,
      submissionFolderName: folderStructure.submissionFolderName,
      submissionFolderUrl: folderStructure.submissionFolderUrl,
      targetFolderId,
      files: fileSessions,
    });
  } catch (error: unknown) {
    console.error("[Upload Init API Error]", error);
    const errorMsg = error instanceof Error ? error.message : "Kesalahan server internal";
    return NextResponse.json(
      {
        success: false,
        error: `Gagal menyiapkan pengunggahan: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
