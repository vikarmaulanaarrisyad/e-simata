import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-oauth";

export async function GET() {
  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("[Google OAuth init error]", error);
    return NextResponse.json(
      { error: error.message || "Gagal menginisialisasi Google OAuth." },
      { status: 500 }
    );
  }
}
