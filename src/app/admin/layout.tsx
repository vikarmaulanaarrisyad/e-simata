import React from "react";
import { checkGoogleDriveStatus } from "@/lib/google-drive";
import { AdminSidebar, AdminHeader } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const driveStatus = await checkGoogleDriveStatus();

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <AdminSidebar driveStatus={driveStatus} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <AdminHeader driveStatus={driveStatus} />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
