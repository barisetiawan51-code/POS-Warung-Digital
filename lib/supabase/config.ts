// ==============================================================================
// WARUNGKU - SUPABASE CONFIGURATION CHECK
// ==============================================================================

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return false;
  }

  // Check if still placeholder values
  if (
    url.includes("your-project.supabase.co") ||
    anonKey.includes("your-anon-publishable-key")
  ) {
    return false;
  }

  return true;
}

export function getSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return { url, anonKey, serviceKey };
}
