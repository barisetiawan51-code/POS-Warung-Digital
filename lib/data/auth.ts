// =============================================================================
// WARUNGKU - SERVER-SIDE AUTHENTICATION UTILITIES
// Handles authentication checks and login gate middleware
// =============================================================================

import { randomBytes } from "crypto";
import type { StoreSettings } from "@/lib/types/pos";
import { fetchStoreSettingsSupabase } from "./supabase-service";

/**
 * Credential type for login
 */
export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Validates login credentials against store settings
 * In production, this would use proper password hashing
 */
export async function validateCredentials(
  credentials: LoginCredentials,
): Promise<StoreSettings | null> {
  const settings = await fetchStoreSettingsSupabase();
  
  if (!settings) return null;
  
  // Check if store has credentials configured
  const expectedEmail = settings.email;
  const expectedPassword = settings.password;
  
  if (!expectedEmail || !expectedPassword) {
    // No credentials configured - store settings should be synced first
    return null;
  }
  
  // Simple equality check (in production, use bcrypt for password verification)
  if (
    credentials.email === expectedEmail &&
    credentials.password === expectedPassword
  ) {
    return settings;
  }
  
  return null;
}

/**
 * Generates a secure session token
 */
export function generateSessionToken(): string {
  // Use crypto for secure random token generation
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  // Fallback for server-side (Node.js)
return randomBytes(32).toString("hex");
}

/**
 * Gets the current authenticated store settings from request headers
 * Used by middleware to check auth status
 */
export function getAuthFromRequest(
  request: Request,
): { isAuthenticated: boolean; storeId?: string } {
  // Check for session token in cookies or authorization header
  const sessionToken = 
    request.headers.get("cookie")?.match(/warungku_session=([^;]+)/)?.[1] ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!sessionToken) {
    return { isAuthenticated: false };
  }
  
  // In a real implementation, verify the session token against a store
  // For now, we'll use a simple check
  return { isAuthenticated: true };
}

/**
 * Creates login response with session cookie
 */
export async function createLoginResponse(
  settings: StoreSettings,
  redirectTo: string = "/dashboard",
): Promise<Response> {
  const token = generateSessionToken();
  const encodedToken = Buffer.from(token).toString("base64");
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": `warungku_session=${encodedToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
    },
  });
}

/**
 * Creates logout response (clears session)
 */
export function createLogoutResponse(
  redirectTo: string = "/login",
): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": `warungku_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    },
  });
}

/**
 * Checks if the store has valid credentials configured
 */
export async function hasStoreCredentials(): Promise<boolean> {
  const settings = await fetchStoreSettingsSupabase();
  return !!(settings?.email && settings?.password);
}
