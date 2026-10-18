import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCategoryById } from "@/actions/categories";
import { FormBuilder } from "@/components/admin/form-builder";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryFieldsPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getCategoryById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const category = result.data as any;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-slate-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Daftar Kategori
          </Button>
        </Link>
      </div>

      <FormBuilder
        categoryId={category.id}
        categoryName={category.name}
        initialFields={category.fields}
      />
    </div>
  );
}
