import React from "react";
import { getCategories } from "@/actions/categories";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const result = await getCategories();
  const categories = result.success && result.data ? (result.data as any) : [];

  return <CategoryManager initialCategories={categories} />;
}
