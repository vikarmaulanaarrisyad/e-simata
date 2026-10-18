import React from "react";
import { getSubmissions } from "@/actions/submissions";
import { getCategories } from "@/actions/categories";
import { SubmissionsExplorer } from "@/components/admin/submissions-explorer";

export default async function AdminSubmissionsPage() {
  const [submissionsRes, categoriesRes] = await Promise.all([
    getSubmissions(),
    getCategories(),
  ]);

  const submissions = submissionsRes.success && submissionsRes.data ? (submissionsRes.data as any) : [];
  const categories = categoriesRes.success && categoriesRes.data ? (categoriesRes.data as any) : [];

  return (
    <SubmissionsExplorer
      initialSubmissions={submissions}
      categories={categories}
    />
  );
}
