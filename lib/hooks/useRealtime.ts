// =============================================================================
// WARUNGKU - REALTIME REACT DATA HOOKS
// Hooks that keep UI in sync with the Supabase database in real time.
// Each hook:
//   1. Reads from the in-memory store on first render (no async waterfalls)
//   2. Re-syncs from the data layer (pulls from Supabase when available)
//   3. Subscribes to the Supabase realtime channel + cross-tab sync events
//
// These are small leaf-level client components (use client directive).
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCategoriesSupabase,
  fetchOrdersSupabase,
  fetchProductsSupabase,
  fetchStoreSettingsSupabase,
} from "@/lib/data/supabase-service";
import {
  getStockMovements,
} from "@/lib/data/store";
import type {
  Category,
  Product,
  Order,
  StockMovement,
  StoreSettings,
} from "@/lib/types/pos";
import {
  onSyncEvent,
  subscribeToCategories,
  subscribeToOrders,
  subscribeToProducts,
  subscribeToStockMovements,
  subscribeToStoreSettings,
} from "@/lib/data/realtime";

export function useCategories() {
  const [data, setData] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const cats = (await fetchCategoriesSupabase()) ?? [];
      setData(cats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetch);

    const off = onSyncEvent("categories", () => void fetch());
    return off ? off : undefined;
  }, [fetch]);

  // Realtime subscription (browser only; no-op when Supabase unconfigured)
  useEffect(() => {
    const cleanup = subscribeToCategories((cats) => {
      setData(cats);
      void fetch();
    });
    return cleanup ? cleanup : undefined;
  }, [fetch]);

  return { data, loading, refresh: fetch };
}

export function useProducts(options?: {
  categoryId?: string;
  search?: string;
  activeOnly?: boolean;
}) {
  const [data, setData] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);

  const { categoryId, search, activeOnly } = options ?? {};

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const products = (await fetchProductsSupabase()) ?? [];
      const query = search?.trim().toLowerCase();
      const filtered = products.filter((product) =>
        (!categoryId || categoryId === "all" || product.category_id === categoryId) &&
        (!query || `${product.name} ${product.sku}`.toLowerCase().includes(query)) &&
        (!activeOnly || product.is_active),
      );
      setData(filtered);
    } finally {
      setLoading(false);
    }
  }, [categoryId, search, activeOnly]);

  useEffect(() => {
    void Promise.resolve().then(fetch);

    const off = onSyncEvent("products", () => void fetch());
    return off ? off : undefined;
  }, [fetch]);

  useEffect(() => {
    const cleanup = subscribeToProducts(() => {
      setData([]);
      void fetch();
    });
    return cleanup ? cleanup : undefined;
  }, [fetch]);

  return { data, loading };
}

export function useOrders(initialData: Order[] = []) {
  const [data, setData] = useState<Order[] | null>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await fetchOrdersSupabase();
      setData(orders ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetch);

    const offOrders = onSyncEvent("orders", () => void fetch());
    const offItems = onSyncEvent("order_items", () => void fetch());
    return () => {
      offOrders?.();
      offItems?.();
    };
  }, [fetch]);

  useEffect(() => {
    const cleanup = subscribeToOrders((orders) => {
      setData(orders);
      void fetch();
    });
    return cleanup ? cleanup : undefined;
  }, [fetch]);

  return { data, loading, refresh: fetch };
}

export function useStockMovements() {
  const [data, setData] = useState<StockMovement[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const movs = await getStockMovements();
      setData(movs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetch);

    const off = onSyncEvent("stock_movements", () => void fetch());
    return off ? off : undefined;
  }, [fetch]);

  useEffect(() => {
    const cleanup = subscribeToStockMovements((movs) => {
      setData(movs);
      void fetch();
    });
    return cleanup ? cleanup : undefined;
  }, [fetch]);

  return { data, loading };
}

const SETTINGS_CACHE_TTL = 30_000;
let settingsCache: { data: StoreSettings; timestamp: number } | null = null;

export function useStoreSettings() {
  const [data, setData] = useState<StoreSettings | null>(settingsCache?.data ?? null);
  const [loading, setLoading] = useState(!settingsCache);

  const fetch = useCallback(async () => {
    if (settingsCache && Date.now() - settingsCache.timestamp < SETTINGS_CACHE_TTL) {
      setData(settingsCache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const settings = await fetchStoreSettingsSupabase();
      if (settings) {
        settingsCache = { data: settings, timestamp: Date.now() };
        setData(settings);
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan Supabase:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetch);

    const off = onSyncEvent("store_settings", () => {
      settingsCache = null;
      void fetch();
    });
    return off ? off : undefined;
  }, [fetch]);

  useEffect(() => {
    const cleanup = subscribeToStoreSettings((settings) => {
      settingsCache = { data: settings, timestamp: Date.now() };
      setData(settings);
      void fetch();
    });
    return cleanup ? cleanup : undefined;
  }, [fetch]);

  return { data, loading };
}

export function useInvalidate(
  table: "products" | "categories" | "orders" | "stock_movements" | "store_settings",
) {
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const off = onSyncEvent(table, () => setGeneration((g) => g + 1));
    return off ? off : undefined;
  }, [table]);

  return generation;
}
