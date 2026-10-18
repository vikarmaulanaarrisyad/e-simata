import React from "react";
import { getCategories } from "@/actions/categories";
import { getMadrasahs } from "@/actions/madrasahs";
import { ReportGenerator } from "@/components/admin/report-generator";

export const metadata = {
  title: "Laporan Kegiatan (PDF F4) - SIMATA MI Bustanul Huda",
  description: "Susun dan cetak laporan kegiatan per rombel kelas dalam format kertas F4 margin 2cm",
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
