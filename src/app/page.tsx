import React from "react";
import { getActiveCategories } from "@/actions/categories";
import { getActiveMadrasahs } from "@/actions/madrasahs";
import { PublicUploadPortal } from "@/components/public-upload-portal";

export default async function HomePage() {
  const [catRes, madrasahRes] = await Promise.all([
    getActiveCategories(),
    getActiveMadrasahs(),
  ]);

  const categories = catRes.success && catRes.data ? (catRes.data as any) : [];
  const madrasahs = madrasahRes.success && madrasahRes.data ? (madrasahRes.data as any) : [];

  return <PublicUploadPortal categories={categories} madrasahs={madrasahs} />;
}

