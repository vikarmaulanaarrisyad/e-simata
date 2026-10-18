"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpassword";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "simata-secret-key-mibustanulhudadawuhan-2026-auth-session";
const COOKIE_NAME = "simata_admin_session";

/**
 * Membuat token sesi terenkripsi HMAC-SHA256
 */
export async function signToken(payload: object): Promise<string> {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Memvalidasi keaslian signature dan kadaluarsa token sesi
 */
export async function verifyToken(
  token: string
): Promise<{ valid: boolean; payload?: any }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false };
    const [data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("base64url");

    if (signature !== expectedSignature) return { valid: false };

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

/**
 * Menyimpan cookie sesi admin
 */
export async function createAdminSession(username: string, rememberMe = true) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24; // 7 hari atau 1 hari
  const exp = Date.now() + maxAge * 1000;
  const token = await signToken({ user: username, role: "admin", exp });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return token;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * Mendapatkan data sesi admin yang sedang login (NextAuth & Direct Cookie)
 */
export async function getAdminSession() {
  try {
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user) {
      return {
        user: nextAuthSession.user.name || "Administrator SIMATA",
        email: nextAuthSession.user.email,
        role: (nextAuthSession.user as any).role || "admin",
      };
    }
  } catch {
    // Fallback to token cookie
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { valid, payload } = await verifyToken(token);
    if (!valid) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Menghapus cookie sesi saat logout
 */
export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Server action login admin dengan username & password
 */
export async function loginAdminAction(formData: FormData) {
  try {
    const username = (formData.get("username") as string)?.trim() || "";
    const password = (formData.get("password") as string)?.trim() || "";
    const remember =
      formData.get("remember") === "true" || formData.get("remember") === "on";

    if (!username || !password) {
      return {
        success: false,
        error: "Harap isi username dan kata sandi admin.",
      };
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      await createAdminSession(username, remember);
      return { success: true, username };
    }

    return {
      success: false,
      error: "Username atau kata sandi tidak cocok. Silakan periksa kembali.",
    };
  } catch (error: any) {
    console.error("[loginAdminAction error]", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan pada sistem otentikasi.",
    };
  }
}

/**
 * Server action logout admin
 */
export async function logoutAdminAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
