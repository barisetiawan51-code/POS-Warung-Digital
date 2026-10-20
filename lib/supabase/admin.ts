// ==============================================================================
// WARUNGKU - SUPABASE ADMIN SERVICE ROLE CLIENT (SERVER-SIDE ONLY)
// ==============================================================================

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseCredentials, isSupabaseConfigured } from "./config";

export function createAdminClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, serviceKey } = getSupabaseCredentials();

  if (!serviceKey) {
    return null;
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
