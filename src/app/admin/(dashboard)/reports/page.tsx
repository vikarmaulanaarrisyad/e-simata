import React from "react";
import { getCategories } from "@/actions/categories";
import { getMadrasahs } from "@/actions/madrasahs";
import { ReportGenerator } from "@/components/admin/report-generator";

export const metadata = {
  title: "Laporan Dokumentasi (PDF F4 Landscape) - SIMATA MI Bustanul Huda Dawuhan",
  description: "Susun dan unduh langsung laporan dokumentasi kegiatan pembiasaan siswa dalam format kertas F4 Landscape (330 × 215 mm)",
};

export default async function AdminReportsPage() {
  const [categoriesRes, madrasahsRes] = await Promise.all([
    getCategories(),
    getMadrasahs(),
  ]);

  const categories =
    categoriesRes.success && categoriesRes.data
      ? (categoriesRes.data as any)
      : [];

  const madrasahs =
    madrasahsRes.success && madrasahsRes.data
      ? (madrasahsRes.data as any)
      : [];

  return (
    <div className="space-y-6">
      <ReportGenerator
        initialCategories={categories}
        initialMadrasahs={madrasahs}
      />
    </div>
  );
}
