"use client";

import { useSyncExternalStore } from "react";
import type { StoreSettings } from "@/lib/types/pos";
import { site } from "@/content/site";

export const SETTINGS_STORAGE_KEY = "warungku_store_settings";
export const AUTH_STORAGE_KEY = "warungku_auth_credentials";
export const SETTINGS_CHANGED_EVENT = "warungku-settings-updated";

export const defaultSettings: StoreSettings = {
  id: "owner-1",
  store_name: site.storeName || "Warung Barokah Rezeki",
  owner_name: site.ownerName || "Bari Setiawan",
  phone: "0812-3456-7890",
  address: "Jl. Mawar No. 14, RT 03/05, Kebayoran, Jakarta",
  bank_name: "BCA",
  bank_account_number: "7820192834",
  bank_account_holder: "Bari Setiawan",
  default_minimum_stock: 5,
  is_online_payment_enabled: true,
  qris_image_url: "/qris-warung.svg",
  qris_nmid: "ID1020261017001",
  email: "owner@warungku.id",
  password: "warungku123",
};

export function getClientStoredSettings(): StoreSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // fallback
  }
  return defaultSettings;
}

export function saveClientStoredSettings(updated: StoreSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    if (updated.email || updated.password) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          email: updated.email || defaultSettings.email,
          password: updated.password || defaultSettings.password,
        }),
      );
    }
    // Update active memory cache
    activeSnapshot = { ...defaultSettings, ...updated };
    // Broadcast event across app
    window.dispatchEvent(
      new CustomEvent(SETTINGS_CHANGED_EVENT, { detail: updated }),
    );
  } catch {
    // ignore
  }
}

export function getClientAuthCredentials(): { email: string; password: string } {
  if (typeof window === "undefined") {
    return {
      email: defaultSettings.email || "owner@warungku.id",
      password: defaultSettings.password || "warungku123",
    };
  }
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  const settings = getClientStoredSettings();
  return {
    email: settings.email || defaultSettings.email || "owner@warungku.id",
    password: settings.password || defaultSettings.password || "warungku123",
  };
}

/**
 * Sync credentials from Supabase settings to localStorage.
 * Called when settings are updated from Supabase (e.g., on page load or realtime update).
 */
export function syncAuthCredentialsFromSettings(
  settings: StoreSettings,
): void {
  if (typeof window === "undefined") return;
  
  if (settings.email || settings.password) {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        email: settings.email || defaultSettings.email || "owner@warungku.id",
        password: settings.password || defaultSettings.password || "warungku123",
      }),
    );
  }
}

let activeSnapshot: StoreSettings | null = null;

function subscribe(callback: () => void) {
  const handler = () => {
    activeSnapshot = getClientStoredSettings();
    callback();
  };
  window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot(): StoreSettings {
  if (!activeSnapshot) {
    activeSnapshot = getClientStoredSettings();
  }
  return activeSnapshot;
}

function getServerSnapshot(): StoreSettings {
  return defaultSettings;
}

/**
 * React 19 external store hook to listen for changes to store settings across pages and components
 */
export function useStoreSettings(initialSettings?: Partial<StoreSettings>): StoreSettings {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (initialSettings) {
    return { ...settings, ...initialSettings };
  }
  return settings;
}
