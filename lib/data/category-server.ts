import type { Category } from "@/lib/types/pos";
import { createClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  owner_id: string;
  name: string;
  prefix: string | null;
  created_at: string;
  updated_at?: string;
};

export async function fetchCategoriesServer(): Promise<Category[] | null> {
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await client
    .from("categories")
    .select("id, owner_id, name, prefix, created_at, updated_at")
    .eq("owner_id", auth.user.id)
    .order("name", { ascending: true });

  if (error || !data) return null;
  return (data as unknown as CategoryRow[]).map((row) => ({
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    prefix: row.prefix ?? undefined,
    product_count: 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function insertCategoryServer(
  name: string,
  prefix?: string | null,
): Promise<Category | null> {
  const client = await createClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  const ownerId = authData.user?.id;
  if (authError || !ownerId) return null;

  const { data, error } = await client
    .from("categories")
    .insert({ owner_id: ownerId, name, prefix: prefix || null })
    .select("id, owner_id, name, prefix, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("Supabase category insert failed", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return null;
  }

  const row = data as unknown as CategoryRow;
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    prefix: row.prefix ?? undefined,
    product_count: 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
