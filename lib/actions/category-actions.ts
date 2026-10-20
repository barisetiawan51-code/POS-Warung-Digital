"use server";

import {
  insertCategoryServer,
  updateCategoryServer,
  deleteCategoryServer,
} from "@/lib/data/category-server";

function deriveCategoryPrefix(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "CAT";
}

export async function createCategoryAction(name: string, prefix?: string) {
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Nama kategori tidak boleh kosong." };
  const category = await insertCategoryServer(trimmed, prefix?.trim() || deriveCategoryPrefix(trimmed));
  return category ? { success: true, category } : { success: false, error: "Kategori gagal disimpan ke Supabase." };
}

export async function updateCategoryAction(id: string, name: string, prefix?: string) {
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Nama kategori tidak boleh kosong." };
  const ok = await updateCategoryServer(id, trimmed, prefix?.trim() || deriveCategoryPrefix(trimmed));
  return ok ? { success: true } : { success: false, error: "Kategori gagal diperbarui di Supabase." };
}

export async function deleteCategoryAction(id: string) {
  const ok = await deleteCategoryServer(id);
  return ok ? { success: true } : { success: false, error: "Kategori gagal dihapus dari Supabase." };
}
