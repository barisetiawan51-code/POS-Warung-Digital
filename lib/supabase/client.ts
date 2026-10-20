// ==============================================================================
// WARUNGKU - SUPABASE BROWSER CLIENT
// ==============================================================================

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCredentials, isSupabaseConfigured } from "./config";

export function createClient() {
  if (!isSupabaseConfigured()) {
    // Return a dummy client or null to prevent throwing when config is missing
    return createBrowserClient(
      "https://placeholder-url.supabase.co",
      "placeholder-anon-key",
    );
  }

  const { url, anonKey } = getSupabaseCredentials();
  return createBrowserClient(url, anonKey);
}
