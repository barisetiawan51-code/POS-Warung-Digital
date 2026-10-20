"use server";

// ==============================================================================
// WARUNGKU - UNIFIED DATA ACCESS & BUSINESS LOGIC STORE
// ==============================================================================

import type {
  Category,
  Product,
  Order,
  OrderItem,
  Payment,
  StockMovement,
  StoreSettings,
  DashboardStats,
  CheckoutPayload,
  CheckoutResult,
} from "@/lib/types/pos";
import {
  initialCategories,
  initialProducts,
  initialSettings,
} from "./initial-data";
import { calculateCashChange, calculateGrowthPercent } from "@/lib/math";
import { generateInvoiceNumber } from "@/lib/format";
import { site } from "@/content/site";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getClient,
  getActiveOwnerId,
  fetchProductsSupabase,
  insertProductSupabase,
  updateProductSupabase,
  deleteProductSupabase,
  fetchCategoriesSupabase,
  insertCategorySupabase,
  updateCategorySupabase,
  deleteCategorySupabase,
  fetchOrdersSupabase,
  insertOrderWithItemsSupabase,
  verifyPaymentSupabase,
  processRefundSupabase,
  fetchStockMovementsSupabase,
  adjustStockSupabase,
  fetchStoreSettingsSupabase,
  updateStoreSettingsSupabase,
  dispatchSyncEvent,
} from "./supabase-service";
import { insertCategoryServer } from "./category-server";

// In-memory fallback state for testing and execution without live Supabase
interface StateStore {
  categories: Category[];
  products: Product[];
  orders: Order[];
  stockMovements: StockMovement[];
  settings: StoreSettings;
}

// Global persistence for dev server session
declare global {
  var __WARUNGKU_STORE__: StateStore | undefined;
}

function getStore(): StateStore {
  if (!globalThis.__WARUNGKU_STORE__) {
    // Generate initial completed transactions matching the reference screenshot
    const sampleOrders: Order[] = [
      {
        id: "ord-0020",
        owner_id: "owner-1",
        invoice_number: "INV-20261017-0020",
        subtotal: 17500,
        discount: 0,
        total: 17500,
        transaction_status: "completed",
        created_at: "2026-10-17T13:23:00Z",
        payment: {
          id: "pay-0020",
          order_id: "ord-0020",
          payment_method: "cash",
          amount: 17500,
          cash_received: 20000,
          cash_change: 2500,
          payment_status: "paid",
          created_at: "2026-10-17T13:23:00Z",
        },
        items: [
          {
            id: "item-20-1",
            order_id: "ord-0020",
            product_id: "prod-4",
            product_name: "Gula Pasir Gulaku 1kg",
            sku: "SEM-001",
            unit: "Kg",
            quantity: 1,
            unit_price: 17500,
            cost_price: 15000,
            line_subtotal: 17500,
            created_at: "2026-10-17T13:23:00Z",
          },
        ],
      },
      {
        id: "ord-0019",
        owner_id: "owner-1",
        invoice_number: "INV-20261017-0019",
        subtotal: 3500,
        discount: 0,
        total: 3500,
        transaction_status: "completed",
        created_at: "2026-10-17T12:24:00Z",
        payment: {
          id: "pay-0019",
          order_id: "ord-0019",
          payment_method: "cash",
          amount: 3500,
          cash_received: 5000,
          cash_change: 1500,
          payment_status: "paid",
          created_at: "2026-10-17T12:24:00Z",
        },
        items: [
          {
            id: "item-19-1",
            order_id: "ord-0019",
            product_id: "prod-1",
            product_name: "Indomie Goreng Original",
            sku: "MIE-001",
            unit: "Bks",
            quantity: 1,
            unit_price: 3500,
            cost_price: 2800,
            line_subtotal: 3500,
            created_at: "2026-10-17T12:24:00Z",
          },
        ],
      },
      {
        id: "ord-0185",
        owner_id: "owner-1",
        invoice_number: "INV-20261017-0185",
        subtotal: 70500,
        discount: 0,
        total: 70500,
        transaction_status: "completed",
        created_at: "2026-10-17T19:07:00Z",
        payment: {
          id: "pay-0185",
          order_id: "ord-0185",
          payment_method: "cash",
          amount: 70500,
          cash_received: 100000,
          cash_change: 29500,
          payment_status: "paid",
          created_at: "2026-10-17T19:07:00Z",
        },
        items: [
          {
            id: "item-185-1",
            order_id: "ord-0185",
            product_id: "prod-2",
            product_name: "Aqua Botol 600ml",
            sku: "MIN-001",
            unit: "Btl",
            quantity: 3,
            unit_price: 4000,
            cost_price: 3000,
            line_subtotal: 12000,
            created_at: "2026-10-17T19:07:00Z",
          },
          {
            id: "item-185-2",
            order_id: "ord-0185",
            product_id: "prod-5",
            product_name: "Minyak Goreng Bimoli 1L",
            sku: "SEM-002",
            unit: "Pch",
            quantity: 3,
            unit_price: 19500,
            cost_price: 17000,
            line_subtotal: 58500,
            created_at: "2026-10-17T19:07:00Z",
          },
        ],
      },
      {
        id: "ord-0184",
        owner_id: "owner-1",
        invoice_number: "INV-20261017-0184",
        subtotal: 42000,
        discount: 0,
        total: 42000,
        transaction_status: "completed",
        created_at: "2026-10-17T18:50:00Z",
        payment: {
          id: "pay-0184",
          order_id: "ord-0184",
          payment_method: "online",
          amount: 42000,
          payment_status: "paid",
          created_at: "2026-10-17T18:50:00Z",
        },
        items: [
          {
            id: "item-184-1",
            order_id: "ord-0184",
            product_id: "prod-1",
            product_name: "Indomie Goreng Original",
            sku: "MIE-001",
            unit: "Bks",
            quantity: 2,
            unit_price: 3500,
            cost_price: 2800,
            line_subtotal: 7000,
            created_at: "2026-10-17T18:50:00Z",
          },
          {
            id: "item-184-2",
            order_id: "ord-0184",
            product_id: "prod-4",
            product_name: "Gula Pasir Gulaku 1kg",
            sku: "SEM-001",
            unit: "Kg",
            quantity: 2,
            unit_price: 17500,
            cost_price: 15000,
            line_subtotal: 35000,
            created_at: "2026-10-17T18:50:00Z",
          },
        ],
      },
      {
        id: "ord-0183",
        owner_id: "owner-1",
        invoice_number: "INV-20261017-0183",
        subtotal: 91000,
        discount: 0,
        total: 91000,
        transaction_status: "completed",
        created_at: "2026-10-17T17:33:00Z",
        payment: {
          id: "pay-0183",
          order_id: "ord-0183",
          payment_method: "cash",
          amount: 91000,
          cash_received: 100000,
          cash_change: 9000,
          payment_status: "paid",
          created_at: "2026-10-17T17:33:00Z",
        },
        items: [
          {
            id: "item-183-1",
            order_id: "ord-0183",
            product_id: "prod-9",
            product_name: "Beras Pandan Wangi 5kg",
            sku: "SEM-003",
            unit: "Krg",
            quantity: 1,
            unit_price: 75000,
            cost_price: 68000,
            line_subtotal: 75000,
            created_at: "2026-10-17T17:33:00Z",
          },
          {
            id: "item-183-2",
            order_id: "ord-0183",
            product_id: "prod-3",
            product_name: "Roti Tawar Sari Roti",
            sku: "ROT-001",
            unit: "Bks",
            quantity: 1,
            unit_price: 16000,
            cost_price: 13500,
            line_subtotal: 16000,
            created_at: "2026-10-17T17:33:00Z",
          },
        ],
      },
      {
        id: "ord-0182",
        owner_id: "owner-1",
        invoice_number: "INV-20261017-0182",
        subtotal: 27000,
        discount: 0,
        total: 27000,
        transaction_status: "completed",
        created_at: "2026-10-17T16:16:00Z",
        payment: {
          id: "pay-0182",
          order_id: "ord-0182",
          payment_method: "transfer",
          amount: 27000,
          payment_status: "paid",
          created_at: "2026-10-17T16:16:00Z",
        },
        items: [
          {
            id: "item-182-1",
            order_id: "ord-0182",
            product_id: "prod-extra-1",
            product_name: "Sabun Lifebuoy Total 10 110g",
            sku: "SBN-001",
            unit: "Pcs",
            quantity: 3,
            unit_price: 5000,
            cost_price: 4000,
            line_subtotal: 15000,
            created_at: "2026-10-17T16:16:00Z",
          },
          {
            id: "item-182-2",
            order_id: "ord-0182",
            product_id: "prod-2",
            product_name: "Aqua Botol 600ml",
            sku: "MIN-001",
            unit: "Btl",
            quantity: 3,
            unit_price: 4000,
            cost_price: 3000,
            line_subtotal: 12000,
            created_at: "2026-10-17T16:16:00Z",
          },
        ],
      },
      {
        id: "ord-0181",
        owner_id: "owner-1",
        invoice_number: "INV-20261017-0181",
        subtotal: 12000,
        discount: 2000,
        total: 10000,
        transaction_status: "completed",
        created_at: "2026-10-17T15:59:00Z",
        payment: {
          id: "pay-0181",
          order_id: "ord-0181",
          payment_method: "cash",
          amount: 10000,
          cash_received: 10000,
          cash_change: 0,
          payment_status: "paid",
          created_at: "2026-10-17T15:59:00Z",
        },
        items: [
          {
            id: "item-181-1",
            order_id: "ord-0181",
            product_id: "prod-8",
            product_name: "Kopi Kapal Api Spesial Mix",
            sku: "MIN-002",
            unit: "Sachet",
            quantity: 2,
            unit_price: 2500,
            cost_price: 1800,
            line_subtotal: 5000,
            created_at: "2026-10-17T15:59:00Z",
          },
          {
            id: "item-181-2",
            order_id: "ord-0181",
            product_id: "prod-1",
            product_name: "Indomie Goreng Original",
            sku: "MIE-001",
            unit: "Bks",
            quantity: 2,
            unit_price: 3500,
            cost_price: 2800,
            line_subtotal: 7000,
            created_at: "2026-10-17T15:59:00Z",
          },
        ],
      },
    ];

    globalThis.__WARUNGKU_STORE__ = {
      categories: [...initialCategories],
      products: [...initialProducts],
      orders: sampleOrders,
      stockMovements: [
        {
          id: "sm-1",
          owner_id: "owner-1",
          product_id: "prod-1",
          product_name: "Indomie Goreng Original",
          sku: "MIE-001",
          quantity_change: 25,
          balance_after: 35,
          reason: "restock",
          notes: "Stok Masuk dari Distributor/Suplier",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-17T11:00:00Z",
        },
        {
          id: "sm-2",
          owner_id: "owner-1",
          product_id: "prod-2",
          product_name: "Aqua Botol 600ml",
          sku: "MIN-001",
          quantity_change: 24,
          balance_after: 24,
          reason: "restock",
          notes: "Kulakan Mandiri / Pasar",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-17T10:30:00Z",
        },
        {
          id: "sm-3",
          owner_id: "owner-1",
          product_id: "prod-3",
          product_name: "Roti Tawar Sari Roti",
          sku: "ROT-001",
          quantity_change: 15,
          balance_after: 15,
          reason: "restock",
          notes: "Pengiriman harian suplier roti",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-17T09:45:00Z",
        },
        {
          id: "sm-4",
          owner_id: "owner-1",
          product_id: "prod-4",
          product_name: "Gula Pasir Gulaku 1kg",
          sku: "SEM-001",
          quantity_change: -3,
          balance_after: 7,
          reason: "sale",
          reference_id: "INV-20261017-1002",
          acting_user: "Kasir Warung",
          notes: "Penjualan kasir",
          created_at: "2026-10-17T09:15:00Z",
        },
        {
          id: "sm-5",
          owner_id: "owner-1",
          product_id: "prod-5",
          product_name: "Minyak Goreng Bimoli 1L",
          sku: "SEM-002",
          quantity_change: -8,
          balance_after: 2,
          reason: "sale",
          reference_id: "INV-20261017-1001",
          acting_user: "Kasir Warung",
          notes: "Penjualan kasir",
          created_at: "2026-10-17T08:50:00Z",
        },
        {
          id: "sm-6",
          owner_id: "owner-1",
          product_id: "prod-6",
          product_name: "Telur Ayam Negeri 1kg",
          sku: "TEL-001",
          quantity_change: 10,
          balance_after: 18,
          reason: "restock",
          notes: "Kulakan peternak lokal",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-17T08:30:00Z",
        },
        {
          id: "sm-7",
          owner_id: "owner-1",
          product_id: "prod-7",
          product_name: "Susu UHT Ultra Milk 200ml",
          sku: "SUS-001",
          quantity_change: -4,
          balance_after: 1,
          reason: "sale",
          notes: "Penjualan kasir",
          acting_user: "Kasir Warung",
          created_at: "2026-10-17T08:15:00Z",
        },
        {
          id: "sm-8",
          owner_id: "owner-1",
          product_id: "prod-8",
          product_name: "Kopi Kapal Api Spesial Mix",
          sku: "MIN-002",
          quantity_change: 20,
          balance_after: 45,
          reason: "restock",
          notes: "Stok Masuk dari Distributor/Suplier",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-16T16:00:00Z",
        },
        {
          id: "sm-9",
          owner_id: "owner-1",
          product_id: "prod-9",
          product_name: "Beras Ramos Super 5kg",
          sku: "SEM-003",
          quantity_change: 12,
          balance_after: 12,
          reason: "restock",
          notes: "Kulakan agen beras",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-16T14:30:00Z",
        },
        {
          id: "sm-10",
          owner_id: "owner-1",
          product_id: "prod-10",
          product_name: "Kecap Manis Bango 550ml",
          sku: "BUM-001",
          quantity_change: 10,
          balance_after: 14,
          reason: "restock",
          notes: "Kulakan toko grosir",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-16T11:20:00Z",
        },
        {
          id: "sm-11",
          owner_id: "owner-1",
          product_id: "prod-1",
          product_name: "Indomie Goreng Original",
          sku: "MIE-001",
          quantity_change: -1,
          balance_after: 10,
          reason: "damage",
          notes: "Barang Rusak / Kadaluarsa (kemasan bocor)",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-16T09:40:00Z",
        },
        {
          id: "sm-12",
          owner_id: "owner-1",
          product_id: "prod-11",
          product_name: "Teh Celup Sariwangi 25s",
          sku: "TEH-001",
          quantity_change: 30,
          balance_after: 30,
          reason: "restock",
          notes: "Pengiriman grosir teh",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-15T15:00:00Z",
        },
        {
          id: "sm-13",
          owner_id: "owner-1",
          product_id: "prod-12",
          product_name: "Chitato Sapi Panggang 68g",
          sku: "SNK-002",
          quantity_change: 24,
          balance_after: 24,
          reason: "restock",
          notes: "Kulakan agen snack",
          acting_user: "Bari Setiawan",
          created_at: "2026-10-15T13:10:00Z",
        },
        {
          id: "sm-14",
          owner_id: "owner-1",
          product_id: "prod-12",
          product_name: "Chitato Sapi Panggang 68g",
          sku: "SNK-002",
          quantity_change: -2,
          balance_after: 22,
          reason: "sale",
          reference_id: "INV-20261015-1003",
          acting_user: "Kasir Warung",
          notes: "Penjualan kasir",
          created_at: "2026-10-15T12:00:00Z",
        },
      ],
      settings: { ...initialSettings },
    };
  }
  return globalThis.__WARUNGKU_STORE__;
}

// -----------------------------------------------------------------------------
// PRODUCTS
// -----------------------------------------------------------------------------

export async function getProducts(options?: {
  categoryId?: string;
  search?: string;
  activeOnly?: boolean;
}): Promise<Product[]> {
  const list = await fetchProductsSupabase();
  let filtered = [...(list ?? [])];

  if (options?.activeOnly) {
    filtered = filtered.filter((p) => p.is_active);
  }
  if (options?.categoryId && options.categoryId !== "all") {
    filtered = filtered.filter((p) => p.category_id === options.categoryId);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }

  return filtered;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  const found = products.find((p) => p.id === id);
  if (found) return found;

  // Direct Supabase lookup if not in list
  const supabase = getClient();
  if (supabase) {
    try {
      const ownerId = await getActiveOwnerId();
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .eq("owner_id", ownerId)
        .maybeSingle();

      if (data) {
        const row = data as unknown as {
          id: string;
          owner_id: string;
          category_id: string | null;
          categories?: { name: string } | null;
          sku: string;
          name: string;
          unit: string;
          cost_price: number | string;
          selling_price: number | string;
          stock: number | string;
          minimum_stock: number | string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        const prod: Product = {
          id: row.id,
          owner_id: row.owner_id,
          category_id: row.category_id,
          category_name: row.categories?.name,
          sku: row.sku,
          name: row.name,
          unit: row.unit,
          cost_price: Number(row.cost_price),
          selling_price: Number(row.selling_price),
          stock: Number(row.stock),
          minimum_stock: Number(row.minimum_stock),
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
        const store = getStore();
        store.products.unshift(prod);
        return prod;
      }
    } catch {
      // fallback
    }
  }

  return null;
}

/**
 * Derives a 3-letter upper-case SKU prefix from a category name.
 * Takes the first letter of each of the first three words, padded to 3 chars.
 * Falls back to "PRD" when no usable name is supplied.
 */
function derivePrefix(name?: string): string | undefined {
  if (!name || !name.trim()) return undefined;
  const words = name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .filter(Boolean);
  let prefix = words.slice(0, 3).join("").toUpperCase();
  if (prefix.length < 3) prefix = prefix.padEnd(3, "X");
  return prefix || undefined;
}

/**
 * Builds the next available sequential SKU for a given prefix.
 * Format: `PREFIX-001`, incrementing until a free slot is found.
 */
function generateSequentialSku(prefix: string, products: Product[]): string {
  const base = prefix.toUpperCase();
  let seq = 0;
  let sku: string;
  do {
    seq += 1;
    sku = `${base}-${seq.toString().padStart(3, "0")}`;
  } while (products.some((p) => p.sku.toUpperCase() === sku.toUpperCase()));
  return sku;
}

export async function createProduct(payload: {
  sku?: string;
  name: string;
  category_id?: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  minimum_stock: number;
}): Promise<{ success: boolean; product?: Product; error?: string }> {
  // Resolve products + category for SKU logic
  const products = await getProducts();
  const categories = await getCategories();
  const category = categories.find((c) => c.id === payload.category_id);

  let finalSku: string;

  if (payload.sku && payload.sku.trim()) {
    finalSku = payload.sku.trim().toUpperCase();
    const existing = products.find(
      (p) => p.sku.trim().toLowerCase() === finalSku.toLowerCase(),
    );
    if (existing) {
      return {
        success: false,
        error: `SKU "${finalSku}" sudah digunakan oleh produk lain.`,
      };
    }
  } else {
    // Auto-generate SKU: category prefix + next sequential number
    const prefix = category?.prefix || derivePrefix(category?.name) || "PRD";
    finalSku = generateSequentialSku(prefix, products);
  }

  if (payload.selling_price < 0 || payload.cost_price < 0) {
    return { success: false, error: "Harga tidak boleh bernilai negatif." };
  }

  if (payload.stock < 0) {
    return { success: false, error: "Stok awal tidak boleh bernilai negatif." };
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    owner_id: "owner-1",
    sku: finalSku,
    name: payload.name.trim(),
    category_id: payload.category_id || null,
    category_name: category?.name,
    unit: payload.unit.trim() || "pcs",
    cost_price: payload.cost_price,
    selling_price: payload.selling_price,
    stock: payload.stock,
    minimum_stock: payload.minimum_stock,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const store = getStore();

  // Sync to Supabase in real-time
  const ownerId = await getActiveOwnerId();
  newProduct.owner_id = ownerId;

  const dbProd = await insertProductSupabase({
    owner_id: ownerId,
    sku: newProduct.sku,
    name: newProduct.name,
    category_id: newProduct.category_id,
    unit: newProduct.unit,
    cost_price: newProduct.cost_price,
    selling_price: newProduct.selling_price,
    stock: newProduct.stock,
    minimum_stock: newProduct.minimum_stock,
    is_active: newProduct.is_active,
  });

  if (dbProd) {
    newProduct.id = dbProd.id;
    newProduct.owner_id = dbProd.owner_id;
  }

  store.products.unshift(newProduct);

  // Record initial stock movement if initial stock > 0
  if (payload.stock > 0) {
    store.stockMovements.unshift({
      id: `sm-${Date.now()}`,
      owner_id: newProduct.owner_id,
      product_id: newProduct.id,
      product_name: newProduct.name,
      sku: newProduct.sku,
      quantity_change: payload.stock,
      balance_after: payload.stock,
      reason: "restock",
      notes: "Stok awal saat pendaftaran produk",
      created_at: new Date().toISOString(),
    });
  }

  dispatchSyncEvent("products");
  if (payload.stock > 0) dispatchSyncEvent("stock_movements");

  return { success: true, product: newProduct };
}

export async function updateProduct(
  id: string,
  payload: Partial<Product>,
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const store = getStore();
  await getProducts();
  const index = store.products.findIndex((p) => p.id === id);

  if (payload.sku) {
    const existing = store.products.find(
      (p) =>
        p.id !== id &&
        p.sku.trim().toLowerCase() === payload.sku?.trim().toLowerCase(),
    );
    if (existing) {
      return {
        success: false,
        error: `SKU "${payload.sku}" sudah digunakan produk lain.`,
      };
    }
  }

  // Sync to Supabase in real-time
  const dbProd = await updateProductSupabase(id, payload);
  if (dbProd) {
    if (index !== -1) {
      store.products[index] = dbProd;
    } else {
      store.products.unshift(dbProd);
    }
    return { success: true, product: dbProd };
  }

  if (index === -1) {
    return { success: false, error: "Produk tidak ditemukan." };
  }

  const current = store.products[index];
  const updated: Product = {
    ...current,
    ...payload,
    updated_at: new Date().toISOString(),
  };

  store.products[index] = updated;

  dispatchSyncEvent("products");

  return { success: true, product: updated };
}

export async function deleteProduct(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const store = getStore();
  await getProducts();
  const index = store.products.findIndex((p) => p.id === id);
  if (index !== -1) {
    const prod = store.products[index];
    // Jika stok ada saat produk di-delete, catat di ledger mutasi bahwa stok hilang/dihapus
    if (prod.stock > 0) {
      store.stockMovements.unshift({
        id: `sm-${Date.now()}`,
        owner_id: prod.owner_id || "owner-1",
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        quantity_change: -prod.stock,
        balance_after: 0,
        reason: "loss",
        acting_user: store.settings.owner_name || "Bari Setiawan",
        notes: `Produk "${prod.name}" dihapus dari sistem (stok ${prod.stock} dihapus)`,
        created_at: new Date().toISOString(),
      });
    }
    // Hapus dari daftar produk sehingga stok hilang dari inventaris
    store.products.splice(index, 1);
  }

  // Sync to Supabase in real-time
  const ok = await deleteProductSupabase(id);
  if (!ok && index === -1) {
    return { success: false, error: "Produk tidak ditemukan." };
  }

  dispatchSyncEvent("products");
  dispatchSyncEvent("stock_movements");
  return { success: true };
}

// -----------------------------------------------------------------------------
// CATEGORIES
// -----------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  const store = getStore();
  const supabaseCats = await fetchCategoriesSupabase();
  if (!supabaseCats) {
    return store.categories.map((category) => ({
      ...category,
      product_count: store.products.filter(
        (product) => product.category_id === category.id,
      ).length,
    }));
  }

  store.categories = supabaseCats;
  return supabaseCats;
}

export async function createCategory(
  name: string,
  prefix?: string,
): Promise<{ success: boolean; category?: Category; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Nama kategori tidak boleh kosong." };
  const finalPrefix = prefix?.trim() ? prefix.trim().toUpperCase() : derivePrefix(trimmed);
  const dbCat = await insertCategoryServer(trimmed, finalPrefix);
  if (!dbCat) return { success: false, error: "Kategori gagal disimpan ke Supabase." };
  getStore().categories.push(dbCat);
  dispatchSyncEvent("categories");
  return { success: true, category: dbCat };
}

export async function updateCategory(
  id: string,
  name: string,
  prefix?: string,
): Promise<{ success: boolean; category?: Category; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Nama kategori tidak boleh kosong." };
  const store = getStore();
  await getCategories();
  const index = store.categories.findIndex((c) => c.id === id);
  if (index < 0) return { success: false, error: "Kategori tidak ditemukan." };
  const finalPrefix = prefix?.trim() ? prefix.trim().toUpperCase() : derivePrefix(trimmed);
  if (!(await updateCategorySupabase(id, trimmed, finalPrefix))) {
    return { success: false, error: "Kategori gagal diperbarui di Supabase." };
  }
  store.categories[index] = { ...store.categories[index], name: trimmed, prefix: finalPrefix };
  dispatchSyncEvent("categories");
  return { success: true, category: store.categories[index] };
}

export async function deleteCategory(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const store = getStore();
  await getCategories();
  const index = store.categories.findIndex((c) => c.id === id);
  if (index < 0) return { success: false, error: "Kategori tidak ditemukan." };
  if (!(await deleteCategorySupabase(id))) {
    return { success: false, error: "Kategori gagal dihapus dari Supabase." };
  }
  store.categories.splice(index, 1);
  dispatchSyncEvent("categories");
  dispatchSyncEvent("products");
  return { success: true };
}

// -----------------------------------------------------------------------------
// CHECKOUT & ORDERS
// -----------------------------------------------------------------------------

export async function processCheckout(
  payload: CheckoutPayload,
): Promise<CheckoutResult> {
  const store = getStore();
  // Ensure products are up-to-date from Supabase
  await getProducts();

  if (!payload.items || payload.items.length === 0) {
    return {
      success: false,
      order_id: "",
      invoice_number: "",
      subtotal: 0,
      discount: 0,
      total: 0,
      cash_change: 0,
      payment_status: "failed",
      message: "Keranjang belanja masih kosong.",
    };
  }

  // Idempotency check
  if (payload.idempotency_key) {
    const existing = store.orders.find(
      (o) => o.idempotency_key === payload.idempotency_key,
    );
    if (existing) {
      return {
        success: true,
        order_id: existing.id,
        invoice_number: existing.invoice_number,
        subtotal: existing.subtotal,
        discount: existing.discount,
        total: existing.total,
        cash_change: existing.payment?.cash_change || 0,
        payment_status: existing.payment?.payment_status || "paid",
        message: "Transaksi telah berhasil diproses sebelumnya.",
      };
    }
  }

  // Verify stock & calculate server totals
  let subtotal = 0;
  const orderItems: OrderItem[] = [];
  const stockDeductions: { product: Product; qty: number }[] = [];

  for (const item of payload.items) {
    let product = store.products.find(
      (p) => p.id === item.product_id && p.is_active,
    );
    if (!product) {
      const dbProd = await getProductById(item.product_id);
      if (dbProd && dbProd.is_active) {
        product = dbProd;
        store.products.push(dbProd);
      }
    }
    if (!product) {
      return {
        success: false,
        order_id: "",
        invoice_number: "",
        subtotal: 0,
        discount: 0,
        total: 0,
        cash_change: 0,
        payment_status: "failed",
        message: `Produk dengan ID ${item.product_id} tidak ditemukan atau sudah tidak aktif.`,
      };
    }

    if (product.stock < item.quantity) {
      return {
        success: false,
        order_id: "",
        invoice_number: "",
        subtotal: 0,
        discount: 0,
        total: 0,
        cash_change: 0,
        payment_status: "failed",
        message: `Stok produk "${product.name}" tidak mencukupi (Tersedia: ${product.stock}, Diminta: ${item.quantity}).`,
      };
    }

    const lineSubtotal = product.selling_price * item.quantity;
    subtotal += lineSubtotal;

    orderItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order_id: "",
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      unit: product.unit,
      quantity: item.quantity,
      unit_price: product.selling_price,
      cost_price: product.cost_price,
      line_subtotal: lineSubtotal,
      created_at: new Date().toISOString(),
    });

    stockDeductions.push({ product, qty: item.quantity });
  }

  // Fitur diskon dinonaktifkan pada transaksi (selalu 0)
  const discount = 0;
  const total = subtotal;

  let cashChange = 0;
  if (payload.payment_method === "cash") {
    const cashCheck = calculateCashChange(total, payload.cash_received || 0);
    if (!cashCheck.isSufficient) {
      return {
        success: false,
        order_id: "",
        invoice_number: "",
        subtotal,
        discount,
        total,
        cash_change: 0,
        payment_status: "failed",
        message: `Jumlah uang tunai yang diterima kurang Rp ${new Intl.NumberFormat("id-ID").format(cashCheck.deficit)}.`,
      };
    }
    cashChange = cashCheck.change;
  }

  const invoiceNumber = generateInvoiceNumber();
  const orderId = `order-${Date.now()}`;
  const paymentStatus =
    payload.payment_method === "transfer" ? "pending" : "paid";

  const dbRes = await insertOrderWithItemsSupabase({
    invoiceNumber,
    idempotencyKey: payload.idempotency_key || null,
    subtotal,
    discount,
    total,
    notes: payload.notes || null,
    paymentMethod: payload.payment_method,
    cashReceived: payload.payment_method === "cash" ? payload.cash_received : null,
    cashChange: payload.payment_method === "cash" ? cashChange : null,
    items: orderItems,
    stockDeductions: stockDeductions.map(({ product, qty }) => ({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
      },
      qty,
    })),
  });

  if (!dbRes.success || !dbRes.orderId) {
    return {
      success: false,
      order_id: "",
      invoice_number: invoiceNumber,
      subtotal,
      discount,
      total,
      cash_change: cashChange,
      payment_status: paymentStatus,
      message: dbRes.error ?? "Transaksi gagal disimpan ke Supabase.",
    };
  }

  dispatchSyncEvent("products");
  dispatchSyncEvent("stock_movements");
  dispatchSyncEvent("orders");

  return {
    success: true,
    order_id: dbRes.orderId,
    invoice_number: invoiceNumber,
    subtotal,
    discount,
    total,
    cash_change: cashChange,
    payment_status: paymentStatus,
    message: "Transaksi berhasil diproses.",
  };
}

export async function getOrders(): Promise<Order[]> {
  const supabaseOrders = await fetchOrdersSupabase();
  return supabaseOrders ?? [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const store = getStore();
  const orders = await getOrders();
  const order = orders.find((o) => o.id === id || o.invoice_number === id);
  if (order) return order;

  // Direct Supabase lookup if not in list
  const supabase = getClient();
  if (supabase) {
    try {
      const ownerId = await getActiveOwnerId();
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*)")
        .eq("owner_id", ownerId)
        .or(`id.eq.${id},invoice_number.eq.${id}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        const rows = data as unknown as {
          id: string;
          owner_id: string;
          invoice_number: string;
          idempotency_key: string | null;
          subtotal: number | string;
          discount: number | string;
          total: number | string;
          transaction_status:
            "completed" | "cancelled" | "refunded" | "pending";
          notes: string | null;
          created_at: string;
          updated_at: string;
          order_items?: {
            id: string;
            order_id: string;
            product_id: string | null;
            product_name: string;
            sku: string;
            unit: string;
            quantity: number | string;
            unit_price: number | string;
            cost_price: number | string;
            line_subtotal: number | string;
            created_at: string;
          }[];
          payments?: {
            id: string;
            order_id: string;
            payment_method: "cash" | "transfer" | "online";
            amount: number | string;
            cash_received: number | string | null;
            cash_change: number | string | null;
            payment_status: "paid" | "pending" | "failed" | "refunded";
            provider_reference: string | null;
            created_at: string;
          }[];
        };

        const pm = rows.payments?.[0];
        const payment: Payment | null = pm
          ? {
              id: pm.id,
              order_id: pm.order_id,
              payment_method: pm.payment_method,
              amount: Number(pm.amount),
              cash_received: pm.cash_received ? Number(pm.cash_received) : null,
              cash_change: pm.cash_change ? Number(pm.cash_change) : null,
              payment_status: pm.payment_status,
              provider_reference: pm.provider_reference,
              created_at: pm.created_at,
            }
          : null;

        const singleOrder: Order = {
          id: rows.id,
          owner_id: rows.owner_id,
          invoice_number: rows.invoice_number,
          idempotency_key: rows.idempotency_key,
          subtotal: Number(rows.subtotal),
          discount: Number(rows.discount),
          total: Number(rows.total),
          transaction_status: rows.transaction_status,
          notes: rows.notes,
          created_at: rows.created_at,
          updated_at: rows.updated_at,
          items: (rows.order_items || []).map((it) => ({
            id: it.id,
            order_id: it.order_id,
            product_id: it.product_id,
            product_name: it.product_name,
            sku: it.sku,
            unit: it.unit,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            cost_price: Number(it.cost_price),
            line_subtotal: Number(it.line_subtotal),
            created_at: it.created_at,
          })),
          payment,
        };

        store.orders.unshift(singleOrder);
        return singleOrder;
      }
    } catch {
      // fallback
    }
  }

  return null;
}

export async function refundOrder(
  orderId: string,
  reason: string,
): Promise<{ success: boolean; message: string }> {
  const store = getStore();
  await getOrders();
  let order = store.orders.find(
    (o) => o.id === orderId || o.invoice_number === orderId,
  );
  if (!order) {
    const fetched = await getOrderById(orderId);
    if (fetched) {
      order = fetched;
    }
  }

  if (!order) {
    return { success: false, message: "Transaksi tidak ditemukan." };
  }

  if (
    order.transaction_status === "cancelled" ||
    order.transaction_status === "refunded"
  ) {
    return {
      success: false,
      message: "Transaksi ini sudah dibatalkan atau direfund sebelumnya.",
    };
  }

  // Restore stock
  if (order.items) {
    for (const item of order.items) {
      if (item.product_id) {
        const product = store.products.find((p) => p.id === item.product_id);
        if (product) {
          product.stock += item.quantity;
          product.updated_at = new Date().toISOString();

          store.stockMovements.unshift({
            id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            owner_id: "owner-1",
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            quantity_change: item.quantity,
            balance_after: product.stock,
            reason: "refund",
            reference_id: order.invoice_number,
            acting_user: "Bari Setiawan",
            notes: `Refund transaksi: ${reason}`,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  const isCancellation = order.payment?.payment_status === "pending";
  order.transaction_status = isCancellation ? "cancelled" : "refunded";
  if (order.payment) {
    order.payment.payment_status = isCancellation ? "failed" : "refunded";
  }

  const refundSaved = await processRefundSupabase(
    order.id,
    order.invoice_number,
    reason,
    (order.items || []).map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    })),
  );
  if (!refundSaved) {
    return { success: false, message: "Refund gagal disimpan ke Supabase." };
  }

  dispatchSyncEvent("products");
  dispatchSyncEvent("stock_movements");
  dispatchSyncEvent("orders");

  return {
    success: true,
    message: isCancellation
      ? "Transaksi berhasil dibatalkan dan stok telah dipulihkan."
      : "Transaksi berhasil direfund dan stok telah dipulihkan.",
  };
}

export async function verifyPayment(
  orderId: string,
): Promise<{ success: boolean; message: string }> {
  const store = getStore();
  await getOrders();
  let order = store.orders.find(
    (o) => o.id === orderId || o.invoice_number === orderId,
  );
  if (!order) {
    const fetched = await getOrderById(orderId);
    if (fetched) {
      order = fetched;
    }
  }

  if (!order || !order.payment) {
    return { success: false, message: "Pembayaran tidak ditemukan." };
  }

  order.payment.payment_status = "paid";
  order.payment.verification_timestamp = new Date().toISOString();
  order.payment.verification_user = "Bari Setiawan";
  order.transaction_status = "completed";

  const paymentSaved = await verifyPaymentSupabase(order.id);
  if (!paymentSaved) {
    return { success: false, message: "Verifikasi pembayaran gagal disimpan ke Supabase." };
  }

  dispatchSyncEvent("orders");

  return {
    success: true,
    message:
      "Pembayaran transfer bank berhasil diverifikasi dan ditandai lunas.",
  };
}

// -----------------------------------------------------------------------------
// STOCK MOVEMENTS & ADJUSTMENTS
// -----------------------------------------------------------------------------

export async function getStockMovements(): Promise<StockMovement[]> {
  const supabaseSm = await fetchStockMovementsSupabase();
  return supabaseSm ?? [];
}

export async function adjustStock(payload: {
  product_id: string;
  quantity_change: number;
  reason: "restock" | "adjustment" | "damage" | "loss";
  notes?: string;
}): Promise<{ success: boolean; new_stock?: number; error?: string }> {
  const store = getStore();
  // Ensure products are up-to-date from Supabase
  await getProducts();
  let product = store.products.find((p) => p.id === payload.product_id);
  if (!product) {
    const fetched = await getProductById(payload.product_id);
    if (fetched) {
      product = fetched;
    }
  }
  if (!product) {
    return { success: false, error: "Produk tidak ditemukan." };
  }

  const newStock = product.stock + payload.quantity_change;
  if (newStock < 0) {
    return {
      success: false,
      error: `Pengurangan stok melebihi stok yang ada (Stok saat ini: ${product.stock}).`,
    };
  }

  product.stock = newStock;
  product.updated_at = new Date().toISOString();

  store.stockMovements.unshift({
    id: `sm-${Date.now()}`,
    owner_id: product.owner_id || "owner-1",
    product_id: product.id,
    product_name: product.name,
    sku: product.sku,
    quantity_change: payload.quantity_change,
    balance_after: newStock,
    reason: payload.reason,
    acting_user: "Bari Setiawan",
    notes: payload.notes || "Penyesuaian stok manual",
    created_at: new Date().toISOString(),
  });

  const stockSaved = await adjustStockSupabase({
    product_id: product.id,
    new_stock: newStock,
    quantity_change: payload.quantity_change,
    reason: payload.reason,
    notes: payload.notes,
  });
  if (!stockSaved) {
    return { success: false, error: "Penyesuaian stok gagal disimpan ke Supabase." };
  }

  dispatchSyncEvent("products");
  dispatchSyncEvent("stock_movements");

  return { success: true, new_stock: newStock };
}

// -----------------------------------------------------------------------------
// DASHBOARD STATS
// -----------------------------------------------------------------------------

export async function getDashboardStats(): Promise<DashboardStats> {
  const [products, orders] = await Promise.all([getProducts(), getOrders()]);
  const completedOrders = orders.filter(
    (order) =>
      order.transaction_status === "completed" ||
      order.payment?.payment_status === "paid",
  );

  // Use local calendar dates so dashboard values match the store's timezone.
  const toDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  const salesByDate = new Map<string, number>();
  const transactionsByDate = new Map<string, number>();
  const productSales = new Map<
    string,
    { id: string; name: string; sku: string; quantitySold: number; revenue: number }
  >();

  for (const order of completedOrders) {
    const orderDateKey = toDateKey(new Date(order.created_at));
    salesByDate.set(
      orderDateKey,
      (salesByDate.get(orderDateKey) ?? 0) + order.total,
    );
    transactionsByDate.set(
      orderDateKey,
      (transactionsByDate.get(orderDateKey) ?? 0) + 1,
    );

    for (const item of order.items ?? []) {
      const key = item.product_id ?? `${item.sku}:${item.product_name}`;
      const existing = productSales.get(key) ?? {
        id: item.product_id ?? key,
        name: item.product_name,
        sku: item.sku,
        quantitySold: 0,
        revenue: 0,
      };
      existing.quantitySold += item.quantity;
      existing.revenue += item.line_subtotal;
      productSales.set(key, existing);
    }
  }

  const todaySales = salesByDate.get(todayKey) ?? 0;
  const yesterdaySales = salesByDate.get(yesterdayKey) ?? 0;
  const todayTransactions = transactionsByDate.get(todayKey) ?? 0;
  const yesterdayTransactions = transactionsByDate.get(yesterdayKey) ?? 0;

  const lowStockItems = products
    .filter((product) => product.stock <= product.minimum_stock)
    .slice(0, 5)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit || "Pcs",
      stock: product.stock,
      minimum_stock: product.minimum_stock,
    }));

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateKey = toDateKey(date);
    return {
      date: dateKey,
      label: `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`,
      sales: salesByDate.get(dateKey) ?? 0,
    };
  });

  const topSellingProducts = [...productSales.values()]
    .sort(
      (a, b) =>
        b.quantitySold - a.quantitySold || b.revenue - a.revenue,
    )
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return {
    todaySales,
    yesterdaySales,
    salesGrowthPercent: calculateGrowthPercent(todaySales, yesterdaySales),
    todayTransactions,
    yesterdayTransactions,
    transactionGrowthPercent: calculateGrowthPercent(
      todayTransactions,
      yesterdayTransactions,
    ),
    lowStockCount: products.filter(
      (product) => product.stock <= product.minimum_stock,
    ).length,
    chartData,
    topSellingProducts,
    lowStockItems,
    recentOrders,
  };
}

// -----------------------------------------------------------------------------
// SETTINGS
export async function getStoreSettings(): Promise<StoreSettings> {
  const supabaseSettings = await fetchStoreSettingsSupabase();
  if (!supabaseSettings) {
    throw new Error("Data pengaturan Supabase tidak tersedia.");
  }
  return supabaseSettings;
}

export async function updateStoreSettings(
  payload: Partial<StoreSettings>,
): Promise<StoreSettings> {
  const store = getStore();
  const saved = await updateStoreSettingsSupabase(
    payload,
    await createServerSupabaseClient(),
  );
  if (!saved) {
    throw new Error("Pengaturan gagal disimpan ke Supabase.");
  }

  store.settings = {
    ...store.settings,
    ...payload,
  };

  // Sync site metadata globally
  if (payload.store_name) {
    site.storeName = payload.store_name;
    site.name = payload.store_name;
  }
  if (payload.owner_name) {
    site.ownerName = payload.owner_name;
  }
  if (payload.phone) {
    site.phone = payload.phone;
  }

  return { ...store.settings };
}

