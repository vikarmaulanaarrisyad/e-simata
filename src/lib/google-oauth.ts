import { google } from "googleapis";
import prisma from "@/lib/prisma";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl.replace(/\/+$/, "")}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET belum dikonfigurasi di file .env."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Menghasilkan URL login/consent Google OAuth untuk Admin
 */
export function getGoogleAuthUrl() {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // Wajib agar Google selalu mengembalikan refresh_token
    scope: SCOPES,
    include_granted_scopes: true,
  });
}

/**
 * Pertukaran authorization code dengan access token & refresh token
 */
export async function handleGoogleCallback(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Ambil profil email admin dari Google
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  const email = userInfo.data.email;
  const name = userInfo.data.name || null;
  const picture = userInfo.data.picture || null;

  if (!email) {
    throw new Error("Gagal mengambil alamat email dari akun Google.");
  }

  // Simpan atau perbarui akun Google admin di database
  const account = await prisma.adminGoogleAccount.upsert({
    where: { id: "primary" },
    update: {
      email,
      name,
      picture,
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || undefined, // Pertahankan refresh_token lama jika Google tidak kirim yang baru
      scope: tokens.scope || null,
      tokenType: tokens.token_type || null,
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
    },
    create: {
      id: "primary",
      email,
      name,
      picture,
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || null,
      scope: tokens.scope || null,
      tokenType: tokens.token_type || null,
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
    },
  });

  return account;
}

/**
 * Mengambil Akun Google Admin yang sedang aktif
 */
export async function getConnectedAdminGoogleAccount() {
  try {
    const account = await prisma.adminGoogleAccount.findUnique({
      where: { id: "primary" },
    });
    return account;
  } catch (error) {
    console.error("[getConnectedAdminGoogleAccount error]", error);
    return null;
  }
}

/**
 * Memutuskan koneksi akun Google admin
 */
export async function disconnectAdminGoogleAccount() {
  try {
    await prisma.adminGoogleAccount.deleteMany({
      where: { id: "primary" },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Mendapatkan authenticated Google Drive Client dari akun Google Admin
 */
export async function getAdminDriveClient() {
  const account = await getConnectedAdminGoogleAccount();
  if (!account || (!account.accessToken && !account.refreshToken)) {
    return null;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken || undefined,
  });

  // Listener untuk menyimpan refresh token baru jika otomatis di-refresh oleh googleapis
  oauth2Client.on("tokens", async (tokens) => {
    try {
      await prisma.adminGoogleAccount.update({
        where: { id: "primary" },
        data: {
          accessToken: tokens.access_token || undefined,
          refreshToken: tokens.refresh_token || undefined,
          expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
        },
      });
    } catch (e) {
      console.warn("Gagal memperbarui token otomatis:", e);
    }
  });

  return {
    drive: google.drive({ version: "v3", auth: oauth2Client }),
    account,
  };
}
