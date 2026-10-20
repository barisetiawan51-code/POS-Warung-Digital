// ==============================================================================
// WARUNGKU - SUPABASE CLIENT SINGLETON
// Cookie-backed browser client for App Router Server Actions
// ==============================================================================

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseCredentials,
  isSupabaseConfigured,
} from "./supabase/config";
import type { Database } from "./types/database";

export type WarungkuSupabaseClient = SupabaseClient<Database>;

declare global {
  var __WARUNGKU_SUPABASE_CLIENT__: WarungkuSupabaseClient | undefined;
}

let localSupabaseClient: WarungkuSupabaseClient | null =
  globalThis.__WARUNGKU_SUPABASE_CLIENT__ || null;

export function getSupabaseClient(): WarungkuSupabaseClient | null {
  if (localSupabaseClient) return localSupabaseClient;
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  localSupabaseClient = createBrowserClient<Database>(url, anonKey);
  globalThis.__WARUNGKU_SUPABASE_CLIENT__ = localSupabaseClient;
  return localSupabaseClient;
}

export const supabase = getSupabaseClient();

