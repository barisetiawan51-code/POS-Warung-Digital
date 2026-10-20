// ==============================================================================
// WARUNGKU - SUPABASE SERVER CLIENT (NEXT.JS 16 APP ROUTER)
// ==============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseCredentials, isSupabaseConfigured } from "./config";

export async function createClient() {
  const cookieStore = await cookies();

  if (!isSupabaseConfigured()) {
    return createServerClient(
      "https://placeholder-url.supabase.co",
      "placeholder-anon-key",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Ignored in read-only server component renders
            }
          },
        },
      },
    );
  }

  const { url, anonKey } = getSupabaseCredentials();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Ignored in read-only server component renders
        }
      },
    },
  });
}
