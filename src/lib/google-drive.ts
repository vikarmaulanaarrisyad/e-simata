import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { getAdminDriveClient, getConnectedAdminGoogleAccount } from "@/lib/google-oauth";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive",
];

export interface DriveUploadResult {
  fileId: string;
  name: string;
  webViewLink: string;
  thumbnailLink?: string | null;
  mimeType: string;
  size?: number;
  isMock?: boolean;
}

/**
 * Mendapatkan Google Drive client aktif secara asinkron
 * Prioritas:
 * 1. Akun Google Admin (OAuth 2.0) - Mengunggah langsung ke akun Google milik admin
 * 2. Service Account (service-account.json atau environment variables)
 * 3. Mock mode (fallback aman)
 */
export async function getGoogleDriveClientAsync() {
  try {
    // 1. Cek koneksi Akun Google Admin (OAuth 2.0)
    const adminOauth = await getAdminDriveClient();
    if (adminOauth && adminOauth.drive) {
      return {
        drive: adminOauth.drive,
        isMock: false,
        authType: "oauth_admin",
        account: adminOauth.account,
      };
    }

    // 2. Cek file service-account.json di root
    const serviceAccountPath = path.join(process.cwd(), "service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: SCOPES,
      });
      return { drive: google.drive({ version: "v3", auth }), isMock: false, authType: "service_account_file" };
    }

    // 3. Cek GOOGLE_SERVICE_ACCOUNT_JSON string
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
      return { drive: google.drive({ version: "v3", auth }), isMock: false, authType: "service_account_json" };
    }

    // 4. Cek GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES,
      });
      return { drive: google.drive({ version: "v3", auth }), isMock: false, authType: "service_account_keys" };
    }

    return { drive: null, isMock: true, authType: "none" };
  } catch (error) {
    console.error("[getGoogleDriveClientAsync error]", error);
    return { drive: null, isMock: true, authType: "error", error };
  }
}

/**
 * Cek status konfigurasi Google Drive untuk Admin Dashboard
 */
export async function checkGoogleDriveStatus() {
  // Cek apakah ada akun Google admin yang terhubung
  const adminAccount = await getConnectedAdminGoogleAccount();
  const targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  if (adminAccount) {
    return {
      connected: true,
      isMock: false,
      authType: "oauth_admin",
      user: adminAccount.name || adminAccount.email,
      email: adminAccount.email,
      picture: adminAccount.picture,
      targetFolderId,
      message: `Terkoneksi langsung ke Google Drive Admin (${adminAccount.email}) via OAuth 2.0.`,
    };
  }

  // Jika tidak ada akun admin, cek service account
  const { drive, isMock, authType } = await getGoogleDriveClientAsync();

  if (isMock || !drive) {
    return {
      connected: false,
      isMock: true,
      authType,
      targetFolderId,
      message:
        "Belum ada akun Google admin yang terhubung. Klik tombol 'Hubungkan Akun Google' untuk langsung menghubungkan Google Drive Anda.",
    };
  }

  try {
    const res = await drive.about.get({ fields: "user, storageQuota" });

    return {
      connected: true,
      isMock: false,
      authType,
      user: res.data.user?.displayName || res.data.user?.emailAddress || "Service Account",
      email: res.data.user?.emailAddress || undefined,
      targetFolderId,
      message: "Terkoneksi dengan Google Drive API via Service Account.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      isMock: true,
      authType,
      error: errorMsg,
      targetFolderId,
      message: `Kredensial ada tetapi gagal otentikasi Google Drive: ${errorMsg}`,
    };
  }
}

/**
 * Upload streaming buffer/readable stream langsung ke Google Drive
 */
export async function uploadStreamToDrive(params: {
  stream: Readable | Buffer;
  fileName: string;
  mimeType: string;
  folderId?: string | null;
}): Promise<DriveUploadResult> {
  const { drive, isMock, authType } = await getGoogleDriveClientAsync();
  const targetFolderId = params.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Jika belum ada kredensial atau dalam mode mock
  if (isMock || !drive) {
    console.warn(
      `[Google Drive Mock Mode] Menyimpan berkas "${params.fileName}" sebagai simulasi Google Drive.`
    );
    const mockId = `mock_drive_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      fileId: mockId,
      name: params.fileName,
      webViewLink: `https://drive.google.com/file/d/${mockId}/view?usp=sharing`,
      thumbnailLink: params.mimeType.startsWith("image/")
        ? "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"
        : null,
      mimeType: params.mimeType,
      isMock: true,
    };
  }

  // Siapkan readable stream jika berupa Buffer
  let readableStream: Readable;
  if (Buffer.isBuffer(params.stream)) {
    readableStream = new Readable();
    readableStream.push(params.stream);
    readableStream.push(null);
  } else {
    readableStream = params.stream;
  }

  const fileMetadata: { name: string; parents?: string[] } = {
    name: params.fileName,
  };

  if (targetFolderId && targetFolderId.trim() !== "") {
    fileMetadata.parents = [targetFolderId.trim()];
  }

  const media = {
    mimeType: params.mimeType,
    body: readableStream,
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name, webViewLink, webContentLink, thumbnailLink, mimeType, size",
      supportsAllDrives: true,
    });

    const file = response.data;
    if (!file.id) {
      throw new Error("Google Drive tidak mengembalikan File ID setelah upload.");
    }

    // Set permission agar berkas dapat dilihat via webViewLink
    try {
      await drive.permissions.create({
        fileId: file.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
        supportsAllDrives: true,
      });
    } catch (permError) {
      console.warn("[Google Drive Permission Warning] Tidak dapat mengatur izin publik:", permError);
    }

    return {
      fileId: file.id,
      name: file.name || params.fileName,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      thumbnailLink: file.thumbnailLink || null,
      mimeType: file.mimeType || params.mimeType,
      size: file.size ? parseInt(file.size, 10) : undefined,
      isMock: false,
    };
  } catch (error) {
    console.error("[Google Drive Upload Error]", error);
    throw error;
  }
}

/**
 * Membersihkan dan menstandarisasi penamaan berkas sebelum diunggah ke Google Drive
 * Format: [Kategori]_[Kelas]_[YYYYMMDD]_[Pengirim]_[NamaBerkasAsliBersih]_[Nomor].[ext]
 */
export function sanitizeFileName(params: {
  originalName: string;
  categoryName: string;
  className?: string | null;
  submitterName?: string | null;
  index?: number;
  totalFiles?: number;
}): string {
  const { originalName, categoryName, className, submitterName, index = 0, totalFiles = 1 } = params;

  // 1. Ekstrak ekstensi berkas
  const lastDot = originalName.lastIndexOf(".");
  let ext = lastDot !== -1 ? originalName.slice(lastDot).toLowerCase() : "";
  let baseName = lastDot !== -1 ? originalName.slice(0, lastDot) : originalName;

  // Standarisasi ekstensi gambar umum
  if (ext === ".jpeg") ext = ".jpg";

  // 2. Bersihkan string kategori (hanya alphanumeric, max 20 karakter)
  const cleanCat = categoryName
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20) || "Kategori";

  // 3. Bersihkan string kelas jika ada (misal: "Kelas1A")
  const cleanClass = className && className.trim() !== ""
    ? `_${className.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15)}`
    : "";

  // 4. Tanggal format YYYYMMDD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  // 5. Bersihkan nama wali kelas / pengirim (hanya alphanumeric, max 20 karakter)
  const rawSubmitter = submitterName
    ? submitterName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)
    : "WaliKelas";
  const cleanSubmitter = rawSubmitter.toLowerCase().includes("wali")
    ? rawSubmitter
    : `Wali_${rawSubmitter}`;

  // 6. Bersihkan nama dasar file asli (buang simbol ilegal, spasi jadi underscore, max 30 char)
  let cleanBase = baseName
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/(^_|_$)/g, "")
    .slice(0, 30);

  if (!cleanBase) cleanBase = "file";

  // 7. Jika terdapat banyak berkas dalam 1 pengiriman, tambahkan penomoran (_01, _02, dst)
  const indexSuffix = totalFiles > 1 ? `_${String(index + 1).padStart(2, "0")}` : "";

  return `${cleanCat}${cleanClass}_${dateStr}_${cleanSubmitter}_${cleanBase}${indexSuffix}${ext}`;
}

/**
 * Mencari folder dengan nama tertentu di dalam parentFolderId, atau membuatnya jika belum ada
 */
export async function getOrCreateDriveFolder(params: {
  folderName: string;
  parentFolderId?: string | null;
}): Promise<{ id: string; name: string; isMock: boolean; webViewLink?: string }> {
  const { drive, isMock } = await getGoogleDriveClientAsync();
  const parentId = params.parentFolderId?.trim() || null;

  if (isMock || !drive) {
    const mockId = `mock_folder_${params.folderName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    return {
      id: mockId,
      name: params.folderName,
      webViewLink: `https://drive.google.com/drive/folders/${mockId}`,
      isMock: true,
    };
  }

  try {
    // 1. Cari apakah folder dengan nama yang sama sudah ada di parent
    const queryParts = [
      `name = '${params.folderName.replace(/'/g, "\\'")}'`,
      `mimeType = 'application/vnd.google-apps.folder'`,
      `trashed = false`,
    ];

    if (parentId) {
      queryParts.push(`'${parentId}' in parents`);
    }

    const searchRes = await drive.files.list({
      q: queryParts.join(" and "),
      fields: "files(id, name, webViewLink)",
      spaces: "drive",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      const existing = searchRes.data.files[0];
      return {
        id: existing.id!,
        name: existing.name!,
        webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
        isMock: false,
      };
    }

    // 2. Jika belum ada, buat folder baru
    const folderMetadata: { name: string; mimeType: string; parents?: string[] } = {
      name: params.folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    if (parentId) {
      folderMetadata.parents = [parentId];
    }

    const createRes = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id, name, webViewLink",
      supportsAllDrives: true,
    });

    const newFolderId = createRes.data.id!;

    // Berikan izin reader ke folder
    try {
      await drive.permissions.create({
        fileId: newFolderId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      });
    } catch {
      // Abaikan jika izin publik dibatasi oleh domain Google Workspace
    }

    return {
      id: newFolderId,
      name: params.folderName,
      webViewLink: createRes.data.webViewLink || `https://drive.google.com/drive/folders/${newFolderId}`,
      isMock: false,
    };
  } catch (error) {
    console.error(`[getOrCreateDriveFolder error for ${params.folderName}]`, error);
    // Jika gagal buat subfolder, kembalikan parentId jika ada agar proses upload tetap berjalan lancar
    if (parentId) {
      return {
        id: parentId,
        name: params.folderName,
        webViewLink: `https://drive.google.com/drive/folders/${parentId}`,
        isMock: false,
      };
    }
    throw error;
  }
}

/**
 * Menyiapkan hierarki folder bertingkat di Google Drive:
 * Base Folder -> Folder Kategori -> Subfolder Kelas (jika ada) -> Subfolder Submisi [YYYY-MM-DD - Nama Siswa/Pengirim]
 */
export async function setupSubmissionFolder(params: {
  categoryName: string;
  className?: string | null;
  submitterName?: string | null;
  baseFolderId?: string | null;
}): Promise<{
  categoryFolderId: string;
  classFolderId?: string | null;
  submissionFolderId: string;
  submissionFolderName: string;
  submissionFolderUrl: string;
  isMock: boolean;
}> {
  const { categoryName, className, submitterName, baseFolderId } = params;

  // 1. Level 1: Folder Kategori (misal: "SIMATA - Jurnal Syukur" atau "SIMATA - Pojok Syukur")
  const categoryFolderName = `SIMATA - ${categoryName.trim()}`;
  const categoryFolder = await getOrCreateDriveFolder({
    folderName: categoryFolderName,
    parentFolderId: baseFolderId,
  });

  let parentForSubmissionId = categoryFolder.id;
  let classFolderId: string | null = null;

  // 2. Level 2: Subfolder Kelas jika ada (misal: "Kelas 1 A", "Kelas 2 B", dst. sampai "Kelas 6 B")
  if (className && className.trim() !== "") {
    const cleanClassName = className.trim();
    const classFolder = await getOrCreateDriveFolder({
      folderName: cleanClassName,
      parentFolderId: categoryFolder.id,
    });
    parentForSubmissionId = classFolder.id;
    classFolderId = classFolder.id;
  }

  // 3. Level 3: Subfolder Submisi (misal: "2026-10-18 - Muhammad Rizky (14.30)")
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const timeStr = `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
  const rawSubmitter = submitterName?.trim();
  const submitterStr = rawSubmitter
    ? rawSubmitter.toLowerCase().includes("wali") || rawSubmitter.toLowerCase().includes("guru") || rawSubmitter.toLowerCase().includes("ustadz")
      ? rawSubmitter
      : `Wali Kelas ${rawSubmitter}`
    : "Wali Kelas";
  const submissionFolderName = `${dateStr} - ${submitterStr} (${timeStr})`;

  const submissionFolder = await getOrCreateDriveFolder({
    folderName: submissionFolderName,
    parentFolderId: parentForSubmissionId,
  });

  return {
    categoryFolderId: categoryFolder.id,
    classFolderId,
    submissionFolderId: submissionFolder.id,
    submissionFolderName,
    submissionFolderUrl:
      submissionFolder.webViewLink ||
      `https://drive.google.com/drive/folders/${submissionFolder.id}`,
    isMock: submissionFolder.isMock,
  };
}
