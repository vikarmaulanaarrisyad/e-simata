"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        fields: {
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            submissions: true,
            files: true,
          },
        },
      },
    });
    return { success: true, data: categories };
  } catch (error: any) {
    console.error("[getCategories error]", error);
    return { success: false, error: error.message };
  }
}

export async function getActiveCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
      include: {
        fields: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    return { success: true, data: categories };
  } catch (error: any) {
    console.error("[getActiveCategories error]", error);
    return { success: false, error: error.message };
  }
}

export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            submissions: true,
            files: true,
          },
        },
      },
    });
    if (!category) return { success: false, error: "Kategori tidak ditemukan." };
    return { success: true, data: category };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategory(formData: {
  name: string;
  slug?: string;
  description?: string;
  driveFolderId?: string;
  icon?: string;
  color?: string;
  maxFileSizeMb?: number;
  allowedFileTypes?: string;
}) {
  try {
    const slug =
      formData.slug?.trim() ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") + `-${Date.now().toString(36)}`;

    const category = await prisma.category.create({
      data: {
        name: formData.name,
        slug,
        description: formData.description || null,
        driveFolderId: formData.driveFolderId || null,
        icon: formData.icon || "FolderArchive",
        color: formData.color || "emerald",
        maxFileSizeMb: formData.maxFileSizeMb || 100,
        allowedFileTypes: formData.allowedFileTypes || "image/*,video/*",
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true, data: category };
  } catch (error: any) {
    console.error("[createCategory error]", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategory(
  id: string,
  formData: {
    name?: string;
    description?: string;
    driveFolderId?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
    maxFileSizeMb?: number;
    allowedFileTypes?: string;
  }
) {
  try {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: formData.name,
        description: formData.description,
        driveFolderId: formData.driveFolderId,
        icon: formData.icon,
        color: formData.color,
        isActive: formData.isActive,
        maxFileSizeMb: formData.maxFileSizeMb,
        allowedFileTypes: formData.allowedFileTypes,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}/fields`);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
