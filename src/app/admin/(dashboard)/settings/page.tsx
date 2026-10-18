import React, { Suspense } from "react";
import { checkGoogleDriveStatus } from "@/lib/google-drive";
import { getMadrasahs } from "@/actions/madrasahs";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function AdminSettingsPage() {
  const [status, madrasahsRes] = await Promise.all([
    checkGoogleDriveStatus(),
    getMadrasahs(),
  ]);

  const initialMadrasahs = madrasahsRes.success && madrasahsRes.data ? (madrasahsRes.data as any) : [];

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Memuat pengaturan Google Drive & Madrasah...</div>}>
      <SettingsManager initialStatus={status} initialMadrasahs={initialMadrasahs} />
    </Suspense>
  );
}
