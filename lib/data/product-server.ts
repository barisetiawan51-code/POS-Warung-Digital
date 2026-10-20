"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/pos";

type ProductRow = {
  id: string; owner_id: string; category_id: string | null; categories?: { name: string } | null;
  sku: string; name: string; unit: string; cost_price: number | string; selling_price: number | string;
  stock: number | string; minimum_stock: number | string; is_active: boolean; created_at: string; updated_at: string;
};

export async function fetchProductsServer(): Promise<Product[] | null> {
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await client.from("products").select("*, categories(name)").eq("owner_id", auth.user.id).order("name", { ascending: true });
  if (error || !data) return null;
  return (data as unknown as ProductRow[]).map((row) => ({
    id: row.id, owner_id: row.owner_id, category_id: row.category_id, category_name: row.categories?.name,
    sku: row.sku, name: row.name, unit: row.unit, cost_price: Number(row.cost_price), selling_price: Number(row.selling_price),
    stock: Number(row.stock), minimum_stock: Number(row.minimum_stock), is_active: row.is_active,
    created_at: row.created_at, updated_at: row.updated_at,
  }));
}
