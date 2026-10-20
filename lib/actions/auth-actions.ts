"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/dashboard";

  if (!email || !password) {
    return { success: false, error: "Email dan kata sandi wajib diisi." };
  }

  // Jika Supabase belum dikonfigurasi (dev mode), izinkan demo login
  if (!isSupabaseConfigured()) {
    if (email === "owner@warungku.id" && password === "warungku123") {
      redirect(next);
    }
    return { success: false, error: "Email atau kata sandi demo tidak cocok." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message || "Email atau kata sandi tidak cocok." };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
