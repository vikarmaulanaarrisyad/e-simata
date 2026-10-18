import React, { Suspense } from "react";
import { checkGoogleDriveStatus } from "@/lib/google-drive";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function AdminSettingsPage() {
  const status = await checkGoogleDriveStatus();

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Memuat pengaturan Google Drive...</div>}>
      <SettingsManager initialStatus={status} />
    </Suspense>
  );
}
