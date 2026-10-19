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

    // 3a. Validasi batas ukuran masing-masing berkas
    const maxAllowedMb = category.maxFileSizeMb || 500;
    for (const f of files) {
      if (typeof f?.size === "number") {
        const sizeMb = f.size / (1024 * 1024);
        if (sizeMb > maxAllowedMb) {
          return NextResponse.json(
            {
              success: false,
              error: `Berkas "${f.name}" (${sizeMb.toFixed(1)} MB) melebihi batas ukuran maksimal kategori (${maxAllowedMb} MB).`,
            },
            { status: 400 }
          );
        }
      }
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

    // 4. Siapkan hierarki folder Google Drive
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

    // 5. Buat Sesi Resumable Upload Google Drive untuk setiap berkas
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
