import { NextResponse } from "next/server";
import { disconnectAdminGoogleAccount } from "@/lib/google-oauth";

export async function POST() {
  try {
    await disconnectAdminGoogleAccount();
    return NextResponse.json({ success: true, message: "Koneksi akun Google berhasil diputuskan." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
