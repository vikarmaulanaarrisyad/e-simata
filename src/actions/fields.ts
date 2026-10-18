"use server";

import prisma from "@/lib/prisma";
import { FieldType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface CustomFieldInput {
  label: string;
  name?: string;
  fieldType: FieldType;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  options?: string[] | string;
  orderIndex?: number;
}

function generateFieldName(label: string): string {
  return (
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)+/g, "") || `field_${Date.now()}`
  );
}

export async function createCustomField(categoryId: string, input: CustomFieldInput) {
  try {
    const highestOrder = await prisma.customField.findFirst({
      where: { categoryId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const nextOrder = input.orderIndex ?? ((highestOrder?.orderIndex ?? 0) + 1);
    const fieldName = input.name?.trim() || `${generateFieldName(input.label)}_${Date.now().toString(36).slice(-4)}`;

    let normalizedOptions: any = null;
    if (input.fieldType === FieldType.SELECT) {
      if (Array.isArray(input.options)) {
        normalizedOptions = input.options;
      } else if (typeof input.options === "string") {
        try {
          normalizedOptions = JSON.parse(input.options);
        } catch {
          normalizedOptions = input.options.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
    }

    const field = await prisma.customField.create({
      data: {
        categoryId,
        label: input.label,
        name: fieldName,
        fieldType: input.fieldType,
        placeholder: input.placeholder || null,
        helpText: input.helpText || null,
        isRequired: input.isRequired ?? false,
        options: normalizedOptions,
        orderIndex: nextOrder,
      },
    });

    revalidatePath(`/admin/categories/${categoryId}/fields`);
    revalidatePath("/");
    return { success: true, data: field };
  } catch (error: any) {
    console.error("[createCustomField error]", error);
    return { success: false, error: error.message };
  }
}

export async function updateCustomField(
  id: string,
  input: {
    label?: string;
    fieldType?: FieldType;
    placeholder?: string;
    helpText?: string;
    isRequired?: boolean;
    options?: any;
    orderIndex?: number;
  }
) {
  try {
    let normalizedOptions: any = undefined;
    if (input.options !== undefined) {
      if (Array.isArray(input.options)) {
        normalizedOptions = input.options;
      } else if (typeof input.options === "string") {
        try {
          normalizedOptions = JSON.parse(input.options);
        } catch {
          normalizedOptions = input.options.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
    }

    const updated = await prisma.customField.update({
      where: { id },
      data: {
        label: input.label,
        fieldType: input.fieldType,
        placeholder: input.placeholder,
        helpText: input.helpText,
        isRequired: input.isRequired,
        options: normalizedOptions,
        orderIndex: input.orderIndex,
      },
    });

    revalidatePath(`/admin/categories/${updated.categoryId}/fields`);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomField(id: string) {
  try {
    const deleted = await prisma.customField.delete({
      where: { id },
    });

    revalidatePath(`/admin/categories/${deleted.categoryId}/fields`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reorderCustomFields(categoryId: string, orderedIds: string[]) {
  try {
    const updates = orderedIds.map((id, index) =>
      prisma.customField.update({
        where: { id },
        data: { orderIndex: index + 1 },
      })
    );
    await prisma.$transaction(updates);

    revalidatePath(`/admin/categories/${categoryId}/fields`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
