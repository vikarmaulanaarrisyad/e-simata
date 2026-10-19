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

// Cache Drive status selama 60 detik untuk mempercepat render dashboard
let driveStatusCache: { data: any; expiresAt: number } | null = null;

/**
 * Cek status konfigurasi Google Drive untuk Admin Dashboard
 */
export async function checkGoogleDriveStatus(forceRefresh = false) {
  if (!forceRefresh && driveStatusCache && Date.now() < driveStatusCache.expiresAt) {
    return driveStatusCache.data;
  }

  // Cek apakah ada akun Google admin yang terhubung
  const adminAccount = await getConnectedAdminGoogleAccount();
  const targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  if (adminAccount) {
    const result = {
      connected: true,
      isMock: false,
      authType: "oauth_admin",
      user: adminAccount.name || adminAccount.email,
      email: adminAccount.email,
      picture: adminAccount.picture,
      targetFolderId,
      message: `Terkoneksi langsung ke Google Drive Admin (${adminAccount.email}) via OAuth 2.0.`,
    };
    driveStatusCache = { data: result, expiresAt: Date.now() + 60000 };
    return result;
  }

  // Jika tidak ada akun admin, cek service account
  const { drive, isMock, authType } = await getGoogleDriveClientAsync();

  if (isMock || !drive) {
    const result = {
      connected: false,
      isMock: true,
      authType,
      targetFolderId,
      message:
        "Belum ada akun Google admin yang terhubung. Klik tombol 'Hubungkan Akun Google' untuk langsung menghubungkan Google Drive Anda.",
    };
    driveStatusCache = { data: result, expiresAt: Date.now() + 30000 };
    return result;
  }

  try {
    const res = await drive.about.get({ fields: "user, storageQuota" });

    const result = {
      connected: true,
      isMock: false,
      authType,
      user: res.data.user?.displayName || res.data.user?.emailAddress || "Service Account",
      email: res.data.user?.emailAddress || undefined,
      targetFolderId,
      message: "Terkoneksi dengan Google Drive API via Service Account.",
    };
    driveStatusCache = { data: result, expiresAt: Date.now() + 60000 };
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const result = {
      connected: false,
      isMock: true,
      authType,
      error: errorMsg,
      targetFolderId,
      message: `Kredensial ada tetapi gagal otentikasi Google Drive: ${errorMsg}`,
    };
    driveStatusCache = { data: result, expiresAt: Date.now() + 15000 };
    return result;
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
 * Mendapatkan valid Authorization header (Bearer token) untuk direct HTTP request ke Google Drive API
 */
export async function getGoogleDriveAuthHeader(): Promise<string | null> {
  try {
    const adminOauth = await getAdminDriveClient();
    if (adminOauth && adminOauth.drive) {
      const oauth2Client = (adminOauth.drive as any).context?._options?.auth;
      if (oauth2Client) {
        const authHeaders = await oauth2Client.getRequestHeaders();
        const header =
          authHeaders.get("authorization") ||
          `Bearer ${(await oauth2Client.getAccessToken()).token}`;
        if (header) return header;
      }
    }

    const serviceAccountPath = path.join(process.cwd(), "service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: SCOPES,
      });
      const client = await auth.getClient();
      const tokenRes = await client.getAccessToken();
      if (tokenRes.token) return `Bearer ${tokenRes.token}`;
    }

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
      const client = await auth.getClient();
      const tokenRes = await client.getAccessToken();
      if (tokenRes.token) return `Bearer ${tokenRes.token}`;
    }

    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES,
      });
      const tokenRes = await auth.getAccessToken();
      if (tokenRes.token) return `Bearer ${tokenRes.token}`;
    }

    return null;
  } catch (err) {
    console.error("[getGoogleDriveAuthHeader error]", err);
    return null;
  }
}

/**
 * Membuat Sesi Resumable Upload di Google Drive API untuk berkas berukuran besar (misal video 50MB+)
 */
export async function createResumableDriveSession(params: {
  fileName: string;
  mimeType: string;
  fileSize: number;
  folderId?: string | null;
}): Promise<{ sessionUrl: string | null; isMock: boolean; mockId?: string }> {
  const { drive, isMock } = await getGoogleDriveClientAsync();
  const authHeader = await getGoogleDriveAuthHeader();

  if (isMock || !drive || !authHeader) {
    const mockId = `mock_drive_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      sessionUrl: `mock_session_${mockId}`,
      isMock: true,
      mockId,
    };
  }

  const targetFolderId = params.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const metadata: { name: string; parents?: string[] } = {
    name: params.fileName,
  };
  if (targetFolderId && targetFolderId.trim() !== "") {
    metadata.parents = [targetFolderId.trim()];
  }

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": params.mimeType,
        "X-Upload-Content-Length": String(params.fileSize),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API gagal menginisiasi sesi unggahan: ${errText}`);
  }

  const sessionUrl = res.headers.get("location");
  if (!sessionUrl) {
    throw new Error("Google Drive tidak mengembalikan header Location (URL sesi upload).");
  }

  return { sessionUrl, isMock: false };
}

/**
 * Mengirim potongan biner (chunk) ke Sesi Resumable Upload Google Drive
 */
export async function sendChunkToDrive(params: {
  sessionUrl: string;
  chunkBuffer: Buffer;
  startByte: number;
  endByte: number;
  totalSize: number;
  mimeType: string;
  fileName: string;
  isMock?: boolean;
}): Promise<{ isComplete: boolean; driveFile?: DriveUploadResult }> {
  const { sessionUrl, chunkBuffer, startByte, endByte, totalSize, mimeType, fileName, isMock } = params;

  // Handle mock mode (simulasi tanpa akun Google asli)
  if (isMock || sessionUrl.startsWith("mock_session_")) {
    const isComplete = endByte + 1 >= totalSize;
    if (isComplete) {
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        isComplete: true,
        driveFile: {
          fileId: mockId,
          name: fileName,
          webViewLink: `https://drive.google.com/file/d/${mockId}/view?usp=sharing`,
          thumbnailLink: mimeType.startsWith("image/")
            ? "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"
            : null,
          mimeType,
          size: totalSize,
          isMock: true,
        },
      };
    }
    return { isComplete: false };
  }

  // Kirim potongan byte chunk ke Google Drive
  const res = await fetch(sessionUrl, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes ${startByte}-${endByte}/${totalSize}`,
      "Content-Length": String(chunkBuffer.length),
      "Content-Type": mimeType,
    },
    body: new Uint8Array(chunkBuffer),
  });

  if (res.status === 308) {
    // 308 Resume Incomplete: Berhasil diterima, Google menunggu potongan berikutnya
    return { isComplete: false };
  }

  if (res.status === 200 || res.status === 201) {
    // Unggahan berkas selesai sepenuhnya!
    const data = await res.json();
    const fileId = data.id;

    const { drive } = await getGoogleDriveClientAsync();
    if (drive && fileId) {
      // Atur izin baca publik untuk tautan
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { role: "reader", type: "anyone" },
          supportsAllDrives: true,
        });
      } catch (permError) {
        console.warn("[Google Drive Permissions Warning]", permError);
      }

      // Ambil metadata tautan lengkap Google Drive
      try {
        const fileRes = await drive.files.get({
          fileId,
          fields: "id, name, webViewLink, thumbnailLink, mimeType, size",
          supportsAllDrives: true,
        });

        return {
          isComplete: true,
          driveFile: {
            fileId: fileRes.data.id || fileId,
            name: fileRes.data.name || fileName,
            webViewLink: fileRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
            thumbnailLink: fileRes.data.thumbnailLink || null,
            mimeType: fileRes.data.mimeType || mimeType,
            size: fileRes.data.size ? parseInt(fileRes.data.size, 10) : totalSize,
            isMock: false,
          },
        };
      } catch (getErr) {
        console.warn("[Google Drive files.get Warning]", getErr);
      }
    }

    return {
      isComplete: true,
      driveFile: {
        fileId,
        name: data.name || fileName,
        webViewLink: data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        thumbnailLink: data.thumbnailLink || null,
        mimeType: data.mimeType || mimeType,
        size: totalSize,
        isMock: false,
      },
    };
  }

  const errText = await res.text();
  throw new Error(`Gagal mengunggah potongan berkas ke Google Drive (Status ${res.status}): ${errText}`);
}

/**
 * Membersihkan dan menstandarisasi penamaan berkas sebelum diunggah ke Google Drive
 * Format: [Kategori]_[Kelas]_[YYYYMMDD]_[Pengirim]_[NamaBerkasAsliBersih]_[Nomor].[ext]
 */
export function sanitizeFileName(params: {
  originalName: string;
  categoryName: string;
  madrasahName?: string | null;
  className?: string | null;
  submitterName?: string | null;
  activityDate?: string | Date | null;
  index?: number;
  totalFiles?: number;
}): string {
  const { originalName, categoryName, madrasahName, className, submitterName, activityDate, index = 0, totalFiles = 1 } = params;

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

  // 2b. Bersihkan nama madrasah jika ada (misal: "MI01" atau "MI02")
  let cleanMadrasah = "";
  if (madrasahName && madrasahName.trim() !== "") {
    const mStr = madrasahName.replace(/[^a-zA-Z0-9]/g, "");
    if (mStr.includes("01")) cleanMadrasah = "_MI01";
    else if (mStr.includes("02")) cleanMadrasah = "_MI02";
    else cleanMadrasah = `_${mStr.slice(0, 10)}`;
  }

  // 3. Bersihkan string kelas jika ada (misal: "Kelas1A")
  const cleanClass = className && className.trim() !== ""
    ? `_${className.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15)}`
    : "";

  // 4. Tanggal format YYYYMMDD (mengikuti tanggal yang dipilih guru jika ada)
  let yyyy: number;
  let mm: string;
  let dd: string;

  if (activityDate) {
    if (typeof activityDate === "string") {
      const parts = activityDate.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        yyyy = parseInt(parts[0], 10);
        mm = parts[1].padStart(2, "0");
        dd = parts[2].padStart(2, "0");
      } else {
        const d = new Date(activityDate);
        yyyy = !isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
        mm = !isNaN(d.getTime()) ? String(d.getMonth() + 1).padStart(2, "0") : String(new Date().getMonth() + 1).padStart(2, "0");
        dd = !isNaN(d.getTime()) ? String(d.getDate()).padStart(2, "0") : String(new Date().getDate()).padStart(2, "0");
      }
    } else if (activityDate instanceof Date && !isNaN(activityDate.getTime())) {
      yyyy = activityDate.getFullYear();
      mm = String(activityDate.getMonth() + 1).padStart(2, "0");
      dd = String(activityDate.getDate()).padStart(2, "0");
    } else {
      const now = new Date();
      yyyy = now.getFullYear();
      mm = String(now.getMonth() + 1).padStart(2, "0");
      dd = String(now.getDate()).padStart(2, "0");
    }
  } else {
    const now = new Date();
    yyyy = now.getFullYear();
    mm = String(now.getMonth() + 1).padStart(2, "0");
    dd = String(now.getDate()).padStart(2, "0");
  }

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

  return `${cleanCat}${cleanMadrasah}${cleanClass}_${dateStr}_${cleanSubmitter}_${cleanBase}${indexSuffix}${ext}`;
}

// In-memory cache folder Google Drive untuk memangkas latensi upload hierarki bertingkat
interface FolderCacheItem {
  id: string;
  name: string;
  isMock: boolean;
  webViewLink?: string;
  expiresAt: number;
}
const folderCache = new Map<string, FolderCacheItem>();

/**
 * Mencari folder dengan nama tertentu di dalam parentFolderId, atau membuatnya jika belum ada
 * Dilengkapi caching in-memory ber-TTL agar upload tidak terhambat query berulang ke Google Drive
 */
export async function getOrCreateDriveFolder(params: {
  folderName: string;
  parentFolderId?: string | null;
}): Promise<{ id: string; name: string; isMock: boolean; webViewLink?: string }> {
  const parentId = params.parentFolderId?.trim() || null;
  const cacheKey = `${parentId || "root"}::${params.folderName.trim()}`;

  // Periksa cache in-memory terlebih dahulu (TTL 2 jam)
  const cached = folderCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return {
      id: cached.id,
      name: cached.name,
      isMock: cached.isMock,
      webViewLink: cached.webViewLink,
    };
  }

  const { drive, isMock } = await getGoogleDriveClientAsync();

  if (isMock || !drive) {
    const mockId = `mock_folder_${params.folderName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const mockRes = {
      id: mockId,
      name: params.folderName,
      webViewLink: `https://drive.google.com/drive/folders/${mockId}`,
      isMock: true,
    };
    folderCache.set(cacheKey, { ...mockRes, expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
    return mockRes;
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
      const result = {
        id: existing.id!,
        name: existing.name!,
        webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
        isMock: false,
      };
      // Simpan di cache in-memory selama 2 jam
      folderCache.set(cacheKey, { ...result, expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
      return result;
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

    // Berikan izin reader ke folder non-blocking
    drive.permissions
      .create({
        fileId: newFolderId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      })
      .catch(() => {});

    const newResult = {
      id: newFolderId,
      name: params.folderName,
      webViewLink: createRes.data.webViewLink || `https://drive.google.com/drive/folders/${newFolderId}`,
      isMock: false,
    };
    folderCache.set(cacheKey, { ...newResult, expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
    return newResult;
  } catch (error) {
    console.error(`[getOrCreateDriveFolder error for ${params.folderName}]`, error);
    folderCache.delete(cacheKey);
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
 * Menyiapkan hierarki folder bertingkat di Google Drive sesuai alur SIMATA:
 * SIMATA ➔ [Nama Madrasah] ➔ [Kategori] ➔ [Tanggal: 19 Oktober 2026] ➔ [Kelas] ➔ File-file
 */
export async function setupSubmissionFolder(params: {
  categoryName: string;
  madrasahName?: string | null;
  className?: string | null;
  submitterName?: string | null;
  activityDate?: string | Date | null;
  baseFolderId?: string | null;
}): Promise<{
  rootFolderId: string;
  madrasahFolderId: string;
  categoryFolderId: string;
  dateFolderId: string;
  classFolderId: string;
  submissionFolderId: string;
  submissionFolderName: string;
  submissionFolderUrl: string;
  isMock: boolean;
}> {
  const { categoryName, madrasahName, className, submitterName, activityDate, baseFolderId } = params;

  // 1. Root Utama: Folder "SIMATA"
  const rootFolder = await getOrCreateDriveFolder({
    folderName: "SIMATA",
    parentFolderId: baseFolderId,
  });

  // 2. Subfolder Level 1: [Nama Madrasah] (misal: "MI Bustanul Huda 01")
  const cleanMadrasah =
    madrasahName && madrasahName.trim() !== ""
      ? madrasahName.trim()
      : "MI Bustanul Huda 01";
  const madrasahFolder = await getOrCreateDriveFolder({
    folderName: cleanMadrasah,
    parentFolderId: rootFolder.id,
  });

  // 3. Subfolder Level 2: [Kategori] (misal: "Jurnal Syukur")
  const cleanCategory = categoryName.trim();
  const categoryFolder = await getOrCreateDriveFolder({
    folderName: cleanCategory,
    parentFolderId: madrasahFolder.id,
  });

  // 4. Subfolder Level 3: [Tanggal] Format Indonesia (misal: "19 Oktober 2026")
  // Mengikuti tanggal yang dipilih guru!
  const MONTHS_ID = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  let dateFolderName = "";
  if (activityDate) {
    if (typeof activityDate === "string") {
      const parts = activityDate.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m < 12) {
          dateFolderName = `${d} ${MONTHS_ID[m]} ${y}`;
        }
      } else {
        const parsed = new Date(activityDate);
        if (!isNaN(parsed.getTime())) {
          dateFolderName = `${parsed.getDate()} ${MONTHS_ID[parsed.getMonth()]} ${parsed.getFullYear()}`;
        }
      }
    } else if (activityDate instanceof Date && !isNaN(activityDate.getTime())) {
      dateFolderName = `${activityDate.getDate()} ${MONTHS_ID[activityDate.getMonth()]} ${activityDate.getFullYear()}`;
    }
  }

  // Fallback ke tanggal hari ini jika kosong
  if (!dateFolderName) {
    const now = new Date();
    dateFolderName = `${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
  }

  const dateFolder = await getOrCreateDriveFolder({
    folderName: dateFolderName,
    parentFolderId: categoryFolder.id,
  });

  // 5. Subfolder Level 4: [Kelas] (misal: "Kelas 1 A" atau "kelas 1 a")
  const cleanClass = className && className.trim() !== "" ? className.trim() : "Semua Kelas";
  const classFolder = await getOrCreateDriveFolder({
    folderName: cleanClass,
    parentFolderId: dateFolder.id,
  });

  // File-file submisi langsung masuk dan diarsipkan ke dalam subfolder kelas ini!
  const submissionFolderName = `SIMATA / ${cleanMadrasah} / ${cleanCategory} / ${dateFolderName} / ${cleanClass}`;
  const submissionFolderUrl =
    classFolder.webViewLink ||
    `https://drive.google.com/drive/folders/${classFolder.id}`;

  return {
    rootFolderId: rootFolder.id,
    madrasahFolderId: madrasahFolder.id,
    categoryFolderId: categoryFolder.id,
    dateFolderId: dateFolder.id,
    classFolderId: classFolder.id,
    submissionFolderId: classFolder.id,
    submissionFolderName,
    submissionFolderUrl,
    isMock: classFolder.isMock,
  };
}

/**
 * Menghapus satu berkas dari Google Drive secara permanen
 */
export async function deleteFileFromDrive(fileId: string): Promise<{
  success: boolean;
  isMock: boolean;
  error?: string;
}> {
  if (!fileId || fileId.trim() === "") {
    return { success: false, isMock: false, error: "File ID kosong." };
  }

  // Jika fileId adalah ID mock simulasi
  if (fileId.startsWith("mock_")) {
    console.log(`[Google Drive Mock] Menghapus file mock "${fileId}".`);
    return { success: true, isMock: true };
  }

  const { drive, isMock } = await getGoogleDriveClientAsync();

  if (isMock || !drive) {
    console.log(`[Google Drive Mock] Berkas "${fileId}" disimulasikan terhapus.`);
    return { success: true, isMock: true };
  }

  try {
    await drive.files.delete({
      fileId: fileId.trim(),
      supportsAllDrives: true,
    });
    console.log(`[Google Drive Success] Berkas "${fileId}" berhasil dihapus dari Google Drive.`);
    return { success: true, isMock: false };
  } catch (err: any) {
    // Jika file sudah dihapus di Google Drive (404), anggap sukses agar alur sistem tidak terhambat
    if (err?.code === 404 || err?.status === 404 || err?.message?.includes("File not found")) {
      console.warn(`[Google Drive Info] Berkas "${fileId}" sudah tidak ada di Drive (404), dilewati.`);
      return { success: true, isMock: false };
    }
    console.error(`[Google Drive Delete Error] Gagal menghapus berkas "${fileId}":`, err);
    return { success: false, isMock: false, error: err?.message || String(err) };
  }
}

/**
 * Menghapus kumpulan berkas sekaligus dari Google Drive secara paralel
 */
export async function deleteMultipleFilesFromDrive(fileIds: string[]): Promise<{
  deletedCount: number;
  failedCount: number;
}> {
  let deletedCount = 0;
  let failedCount = 0;
  const validIds = fileIds.filter((id): id is string => Boolean(id && id.trim() !== ""));

  if (validIds.length === 0) {
    return { deletedCount: 0, failedCount: 0 };
  }

  // Hapus berkas secara paralel dengan batasan batch 4
  const batchSize = 4;
  for (let i = 0; i < validIds.length; i += batchSize) {
    const batch = validIds.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((id) => deleteFileFromDrive(id)));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.success) {
        deletedCount++;
      } else {
        failedCount++;
      }
    }
  }

  return { deletedCount, failedCount };
}

