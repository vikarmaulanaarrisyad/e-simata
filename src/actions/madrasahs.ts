"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMadrasahs() {
  try {
    const list = await prisma.madrasah.findMany({
      orderBy: { orderIndex: "asc" },
    });
    return { success: true, data: list };
  } catch (error: any) {
    console.error("[getMadrasahs error]", error);
    return { success: false, error: error.message };
  }
}

export async function getActiveMadrasahs() {
  try {
    const list = await prisma.madrasah.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });
    return { success: true, data: list };
  } catch (error: any) {
    console.error("[getActiveMadrasahs error]", error);
    return { success: false, error: error.message };
  }
}

export async function createMadrasah(data: { name: string; code?: string }) {
  try {
    const count = await prisma.madrasah.count();
    const created = await prisma.madrasah.create({
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        orderIndex: count + 1,
        isActive: true,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, data: created };
  } catch (error: any) {
    console.error("[createMadrasah error]", error);
    if (error.code === "P2002") {
      return { success: false, error: "Nama Madrasah sudah terdaftar." };
    }
    return { success: false, error: error.message || "Gagal membuat madrasah." };
  }
}

export async function updateMadrasah(
  id: string,
  data: { name?: string; code?: string; isActive?: boolean }
) {
  try {
    const updated = await prisma.madrasah.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.code !== undefined && { code: data.code.trim() || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("[updateMadrasah error]", error);
    return { success: false, error: error.message || "Gagal memperbarui madrasah." };
  }
}

export async function deleteMadrasah(id: string) {
  try {
    await prisma.madrasah.delete({ where: { id } });
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[deleteMadrasah error]", error);
    return { success: false, error: error.message || "Gagal menghapus madrasah." };
  }
}
