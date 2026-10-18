import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  uploadStreamToDrive,
  setupSubmissionFolder,
  sanitizeFileName,
  deleteMultipleFilesFromDrive,
} from "@/lib/google-drive";
import { checkDuplicateSubmission } from "@/actions/submissions";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient time for multiple large file uploads

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const categoryId = formData.get("categoryId") as string;
    const submitterName = (formData.get("submitterName") as string) || null;
    const submitterContact = (formData.get("submitterContact") as string) || null;
    let notes = (formData.get("notes") as string) || null;
    const madrasah = (formData.get("madrasah") as string) || (formData.get("nama_madrasah") as string) || null;
    const activityDate = (formData.get("activityDate") as string) || (formData.get("tanggal") as string) || null;
    const fieldsDataRaw = (formData.get("fieldsData") as string) || "{}";
    const allowSupplementary = formData.get("allowSupplementary") === "true";
    const replaceSubmissionId = (formData.get("replaceSubmissionId") as string) || null;

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

    // 2. Parse dan validasi custom fields
    let fieldsData: Record<string, any> = {};
    try {
      fieldsData = JSON.parse(fieldsDataRaw);
    } catch {
      fieldsData = {};
    }

    // Validasi field yang berstatus isRequired
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

    // 3. Ambil berkas-berkas yang diunggah
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Harap lampirkan minimal 1 berkas foto atau video." },
        { status: 400 }
      );
    }

    // 3b. Deteksi pilihan kelas terlebih dahulu untuk verifikasi data ganda
    let selectedClass: string | null = null;
    const directClass = formData.get("className") || formData.get("kelas") || formData.get("class");
    if (directClass && typeof directClass === "string" && directClass.trim() !== "") {
      selectedClass = directClass.trim();
    } else {
      // Periksa dari key name pada fieldsData
      for (const [key, value] of Object.entries(fieldsData)) {
        const kLower = key.toLowerCase();
        if (kLower.includes("kelas") || kLower.includes("rombel") || kLower.includes("class")) {
          if (value && typeof value === "string" && value.trim() !== "") {
            selectedClass = value.trim();
            break;
          }
        }
      }
      // Periksa dari label field pada kategori
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

    // 3c. Cek data ganda: Cegah pengiriman berulang pada hari/tanggal yang sama (kecuali jika opsi replace/update diaktifkan)
    if (selectedClass && !allowSupplementary && !replaceSubmissionId) {
      const dupCheck = await checkDuplicateSubmission({
        categoryId: category.id,
        madrasah,
        kelas: selectedClass,
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
        console.log(`[Upload API Replace] Ditemukan submisi lama ID: ${replaceSubmissionId}`);
        // Hapus semua file lama dari Google Drive
        const oldDriveIds = existingSubmission.files
          .map((f) => f.driveFileId)
          .filter((id): id is string => Boolean(id && id.trim() !== ""));

        if (oldDriveIds.length > 0) {
          console.log(`[Upload API Replace] Menghapus ${oldDriveIds.length} file lama dari Google Drive...`);
          await deleteMultipleFilesFromDrive(oldDriveIds);
        }

        // Hapus record UploadedFile lama dari database
        await prisma.uploadedFile.deleteMany({
          where: { submissionId: replaceSubmissionId },
        });

        // Hapus record FieldValue lama dari database
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
          updatedAt: new Date(),
        },
      });
      console.log(`[Upload API Replace] Berhasil memperbarui data submisi ${submission.id}`);
    } else {
      submission = await prisma.submission.create({
        data: {
          categoryId: category.id,
          madrasah,
          submitterName,
          submitterContact,
          notes,
          answersJson: combinedAnswers,
        },
      });
    }

    // 5. Simpan isian FieldValue
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

    // 7. Siapkan hierarki folder bertingkat di Google Drive:
    // SIMATA ➔ [Nama Madrasah] ➔ [Kategori] ➔ [Tanggal: format Indonesia] ➔ [Kelas]
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

    // 8. Upload setiap berkas ke Google Drive dengan nama terstandarisasi yang rapi
    const uploadedResults = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const fileType = isImage ? "IMAGE" : isVideo ? "VIDEO" : "OTHER";

      // Standarisasi nama file: [Kategori]_[Kelas]_[YYYYMMDD]_[Pengirim]_[NamaBerkasBersih]_[Urut].[ext]
      const cleanFileName = sanitizeFileName({
        originalName: file.name,
        categoryName: category.name,
        madrasahName: madrasah,
        className: selectedClass,
        submitterName,
        activityDate,
        index: i,
        totalFiles,
      });

      // Upload ke Google Drive langsung ke subfolder submisi
      const driveRes = await uploadStreamToDrive({
        stream: buffer,
        fileName: cleanFileName,
        mimeType: file.type || "application/octet-stream",
        folderId: targetFolderId,
      });

      // Simpan ke model UploadedFile
      const uploadedRecord = await prisma.uploadedFile.create({
        data: {
          submissionId: submission.id,
          categoryId: category.id,
          fileName: driveRes.name,
          fileSize: file.size,
          fileType: fileType,
          mimeType: file.type || "application/octet-stream",
          driveFileId: driveRes.fileId,
          driveUrl: driveRes.webViewLink,
          driveThumbnailUrl: driveRes.thumbnailLink,
          driveFolderId: targetFolderId || null,
          status: "SUCCESS",
        },
      });

      uploadedResults.push({
        id: uploadedRecord.id,
        fileName: uploadedRecord.fileName,
        fileSize: uploadedRecord.fileSize,
        fileType: uploadedRecord.fileType,
        driveUrl: uploadedRecord.driveUrl,
        driveThumbnailUrl: uploadedRecord.driveThumbnailUrl,
        isMock: driveRes.isMock,
      });
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      categoryName: category.name,
      submissionFolderName: folderStructure.submissionFolderName,
      submissionFolderUrl: folderStructure.submissionFolderUrl,
      filesCount: uploadedResults.length,
      files: uploadedResults,
      message: "Berkas dan data formulir berhasil dikirim dan tersimpan rapi di Google Drive!",
    });
  } catch (error: unknown) {
    console.error("[Upload API Error]", error);
    const errorMsg = error instanceof Error ? error.message : "Terjadi kesalahan internal pada server.";
    return NextResponse.json(
      {
        success: false,
        error: `Gagal mengunggah berkas: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
