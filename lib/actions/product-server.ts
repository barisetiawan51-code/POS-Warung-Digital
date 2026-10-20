"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/pos";

type ProductRow = { id: string; owner_id: string; category_id: string | null; sku: string; name: string; unit: string; cost_price: number | string; selling_price: number | string; stock: number | string; minimum_stock: number | string; is_active: boolean; created_at: string; updated_at: string; categories?: { name: string; prefix?: string } | null };
type ProductPayload = { sku?: string; name: string; category_id?: string | null; unit: string; cost_price: number; selling_price: number; stock: number; minimum_stock: number };

async function authorizedClient() {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) throw new Error("Sesi pengguna tidak valid. Silakan login kembali.");
  return { client, ownerId: data.user.id };
}

function mapProduct(row: ProductRow): Product {
  return { id: row.id, owner_id: row.owner_id, category_id: row.category_id, category_name: row.categories?.name, sku: row.sku, name: row.name, unit: row.unit, cost_price: Number(row.cost_price), selling_price: Number(row.selling_price), stock: Number(row.stock), minimum_stock: Number(row.minimum_stock), is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at };
}

async function generateSequentialSku(prefix: string, client: Awaited<ReturnType<typeof createClient>>, ownerId: string): Promise<string> {
  const { data: existing } = await client.from("products").select("sku").eq("owner_id", ownerId).like("sku", `${prefix}-%`);
  const skus = (existing || []).map((p: { sku: string }) => p.sku);
  let seq = 0;
  let sku: string;
  do {
    seq += 1;
    sku = `${prefix}-${seq.toString().padStart(3, "0")}`;
  } while (skus.some((s: string) => s.toUpperCase() === sku.toUpperCase()));
  return sku;
}

export async function createProductServer(payload: ProductPayload) {
  const { client, ownerId } = await authorizedClient();
  const categoryId = payload.category_id || null;

  let category: { id: string; prefix: string | null } | null = null;
  if (categoryId) {
    const { data, error } = await client
      .from("categories")
      .select("id, prefix")
      .eq("id", categoryId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error || !data) throw new Error("Kategori tidak ditemukan. Muat ulang halaman lalu pilih kategori dari database.");
    category = data;
  }

  let finalSku = payload.sku;
  if (!finalSku || !finalSku.trim()) {
    const prefix = category?.prefix || "PRD";
    finalSku = await generateSequentialSku(prefix, client, ownerId);
  }

  const { data, error } = await client
    .from("products")
    .insert({
      owner_id: ownerId,
      sku: finalSku.trim().toUpperCase(),
      name: payload.name.trim(),
      category_id: category?.id || null,
      unit: payload.unit.trim() || "pcs",
      cost_price: payload.cost_price,
      selling_price: payload.selling_price,
      stock: payload.stock,
      minimum_stock: payload.minimum_stock,
      is_active: true,
    })
    .select("*, categories(name, prefix)")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Produk gagal disimpan.");
  return { success: true, product: mapProduct(data as unknown as ProductRow) };
}

export async function updateProductServer(id: string, payload: ProductPayload & { is_active: boolean }) {
  const { client, ownerId } = await authorizedClient();
  const categoryId = payload.category_id || null;

  let verifiedCategoryId: string | null = null;
  if (categoryId) {
    const { data, error } = await client
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error || !data) throw new Error("Kategori tidak ditemukan. Muat ulang halaman lalu pilih kategori dari database.");
    verifiedCategoryId = data.id;
  }

  const { data, error } = await client
    .from("products")
    .update({
      name: payload.name.trim(),
      category_id: verifiedCategoryId,
      unit: payload.unit.trim() || "pcs",
      cost_price: payload.cost_price,
      selling_price: payload.selling_price,
      stock: payload.stock,
      minimum_stock: payload.minimum_stock,
      is_active: payload.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("*, categories(name, prefix)")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Produk gagal diperbarui.");
  return { success: true, product: mapProduct(data as unknown as ProductRow) };
}

export async function deleteProductServer(id: string) {
  const { client, ownerId } = await authorizedClient();
  const { data, error } = await client
    .from("products")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? "Produk gagal dihapus.");
  return { success: true };
}

export async function setProductActiveServer(id: string, isActive: boolean) {
  const { client, ownerId } = await authorizedClient();
  const { data, error } = await client
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? "Produk tidak ditemukan.");
  return { success: true };
}
