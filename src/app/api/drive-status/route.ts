import { NextResponse } from "next/server";
import { checkGoogleDriveStatus } from "@/lib/google-drive";


export async function GET() {
  const status = await checkGoogleDriveStatus();
  return NextResponse.json(status);
}
