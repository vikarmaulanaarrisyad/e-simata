import React from "react";
import { getActiveCategories } from "@/actions/categories";
import { PublicUploadPortal } from "@/components/public-upload-portal";

export default async function HomePage() {
  const result = await getActiveCategories();
  const categories = result.success && result.data ? (result.data as any) : [];

  return <PublicUploadPortal categories={categories} />;
}
