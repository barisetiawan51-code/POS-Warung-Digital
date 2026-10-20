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

export async function insertCategoryServer(name: string, prefix?: string | null): Promise<Category | null> {
  const client = await createClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  const ownerId = authData.user?.id;
  if (authError || !ownerId) return null;

  const { data, error } = await client
    .from("categories")
    .insert({ owner_id: ownerId, name, prefix: prefix || null })
    .select("id, owner_id, name, prefix, created_at, updated_at")
    .single();

  if (error || !data) return null;
  const row = data as unknown as CategoryRow;
  return { id: row.id, owner_id: row.owner_id, name: row.name, prefix: row.prefix ?? undefined, product_count: 0, created_at: row.created_at, updated_at: row.updated_at };
}

async function getOwnerId(client: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

export async function updateCategoryServer(id: string, name: string, prefix?: string | null): Promise<boolean> {
  const client = await createClient();
  const ownerId = await getOwnerId(client);
  if (!ownerId) return false;
  const { data, error } = await client.from("categories").update({ name, prefix: prefix || null, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", ownerId).select("id").maybeSingle();
  return !error && !!data;
}

export async function deleteCategoryServer(id: string): Promise<boolean> {
  const client = await createClient();
  const ownerId = await getOwnerId(client);
  if (!ownerId) return false;
  const { data, error } = await client.from("categories").delete().eq("id", id).eq("owner_id", ownerId).select("id").maybeSingle();
  return !error && !!data;
}
