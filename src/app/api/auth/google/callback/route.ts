import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    console.error("[Google OAuth callback error]", error);
    return NextResponse.redirect(
      `${appUrl.replace(/\/+$/, "")}/admin/settings?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl.replace(/\/+$/, "")}/admin/settings?error=no_code`
    );
  }

  try {
    const account = await handleGoogleCallback(code);
    return NextResponse.redirect(
      `${appUrl.replace(/\/+$/, "")}/admin/settings?connected=true&email=${encodeURIComponent(account.email)}`
    );
  } catch (err: any) {
    console.error("[Google OAuth token exchange error]", err);
    return NextResponse.redirect(
      `${appUrl.replace(/\/+$/, "")}/admin/settings?error=${encodeURIComponent(err.message || "Failed to exchange token")}`
    );
  }
}
