import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/lib/types/pos";

export async function fetchStoreSettingsServer(): Promise<StoreSettings> {
  const client = await createClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error("Sesi Supabase tidak valid. Silakan login kembali.");
  const ownerId = authData.user.id;
  const { data: profile, error: profileError } = await client.from("profiles").select("id, store_name, owner_name, phone, address").eq("id", ownerId).maybeSingle();
  if (profileError) throw new Error("Profil toko gagal dibaca dari Supabase.");
  if (!profile) {
    const { error } = await client.from("profiles").insert({ id: ownerId });
    if (error) throw new Error("Profil toko belum tersedia di Supabase.");
  }
  const { data: settings, error: settingsError } = await client.from("store_settings").select("*").eq("id", ownerId).maybeSingle();
  if (settingsError) throw new Error("Pengaturan toko gagal dibaca dari Supabase.");
  let row = settings;
  if (!row) {
    const { data: created, error } = await client.from("store_settings").insert({ id: ownerId }).select("*").single();
    if (error || !created) throw new Error("Data pengaturan Supabase tidak tersedia.");
    row = created;
  }
  const { data: currentProfile, error: currentProfileError } = await client.from("profiles").select("store_name, owner_name, phone, address").eq("id", ownerId).single();
  if (currentProfileError || !currentProfile) throw new Error("Profil toko belum tersedia di Supabase.");
  return { id: ownerId, store_name: currentProfile.store_name ?? "", owner_name: currentProfile.owner_name ?? "", phone: currentProfile.phone ?? "", address: currentProfile.address ?? "", bank_name: row.bank_name, bank_account_number: row.bank_account_number, bank_account_holder: row.bank_account_holder, default_minimum_stock: Number(row.default_minimum_stock), is_online_payment_enabled: row.is_online_payment_enabled, qris_image_url: "", qris_nmid: "", email: authData.user.email ?? "", password: "" };
}
