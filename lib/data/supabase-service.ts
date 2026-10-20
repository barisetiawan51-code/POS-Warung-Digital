// ==============================================================================
// WARUNGKU - SUPABASE DATABASE SERVICE LAYER
// Handles real-time database operations with Supabase (Singleton Client)
// ==============================================================================

import {
  getSupabaseClient,
  type WarungkuSupabaseClient,
  supabase as globalSupabase,
} from "@/lib/supabaseClient";
import type { Database } from "@/lib/types/database";
import type {
  Product,
  Category,
  Order,
  OrderItem,
  Payment,
  StockMovement,
  StoreSettings,
} from "@/lib/types/pos";

interface ProductRow {
  id: string;
  owner_id: string;
  category_id: string | null;
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
  categories?: { name: string } | null;
}

interface CategoryRow {
  id: string;
  owner_id: string;
  name: string;
  prefix: string | null;
  created_at: string;
  updated_at?: string;
}

interface OrderItemRow {
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
}

interface PaymentRow {
  id: string;
  order_id: string;
  payment_method: "cash" | "transfer" | "online";
  amount: number | string;
  cash_received: number | string | null;
  cash_change: number | string | null;
  payment_status: "paid" | "pending" | "failed" | "refunded";
  provider_reference: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  owner_id: string;
  invoice_number: string;
  idempotency_key: string | null;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  transaction_status: "completed" | "cancelled" | "refunded" | "pending";
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
  payments?: PaymentRow[];
}

interface StockMovementRow {
  id: string;
  owner_id: string;
  product_id: string;
  quantity_change: number | string;
  balance_after: number | string;
  reason: "restock" | "sale" | "adjustment" | "refund" | "damage" | "loss";
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  products?: { name: string; sku: string } | null;
}

interface StoreSettingsRow {
  id: string;
  store_name?: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  default_minimum_stock: number | string;
  is_online_payment_enabled: boolean;
}

interface ProfileRow {
  id: string;
  store_name?: string;
  owner_name?: string;
  phone?: string;
  address?: string;
}

// -----------------------------------------------------------------------------
// SINGLETON SUPABASE CLIENT (INITIALIZED ONCE ONLY OUTSIDE ANY FUNCTION)
// -----------------------------------------------------------------------------

export type SupabaseClientType = WarungkuSupabaseClient;

export function getClient(): WarungkuSupabaseClient | null {
  return getSupabaseClient();
}

export const supabase = globalSupabase;

/**
 * Returns the currently authenticated user's ID.
 * Never fall back to a hard-coded owner ID.
 */
export async function getActiveOwnerId(): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error("Supabase belum dikonfigurasi.");
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) {
    throw new Error("Sesi pengguna tidak valid. Silakan login kembali.");
  }

  return data.user.id;
}

// -----------------------------------------------------------------------------
// PRODUCTS CRUD
// -----------------------------------------------------------------------------

export async function fetchProductsSupabase(): Promise<Product[] | null> {
  const client = getClient();
  if (!client) {
    console.error("[PRODUCTS FETCH ERROR] Supabase client is null");
    return null;
  }

  try {
    const ownerId = await getActiveOwnerId();
    const [{ data, error }, { data: categories }] = await Promise.all([
      client
        .from("products")
        .select("id, owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active, created_at, updated_at")
        .eq("owner_id", ownerId)
        .order("name", { ascending: true }),
      client.from("categories").select("id, name").eq("owner_id", ownerId),
    ]);

    if (error || !data) return null;
    const categoryNames = new Map(
      (categories ?? []).map((category) => [category.id, category.name]),
    );
    const rows = data as unknown as ProductRow[];
    return rows.map((row) => ({
      id: row.id,
      owner_id: row.owner_id,
      category_id: row.category_id,
      category_name: row.category_id ? categoryNames.get(row.category_id) : undefined,
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
    }));
  } catch (error) {
    console.error("[PRODUCTS FETCH EXCEPTION]", error);
    return null;
  }
}

export async function insertProductSupabase(
  payload: Omit<Product, "id" | "created_at" | "updated_at">,
): Promise<Product | null> {
  const supabase = getClient();
  if (!supabase) return null;

  try {
    const ownerId = await getActiveOwnerId();

    const { data, error } = await supabase
      .from("products")
      .insert({
        owner_id: ownerId,
        category_id: payload.category_id || null,
        sku: payload.sku,
        name: payload.name,
        unit: payload.unit,
        cost_price: payload.cost_price,
        selling_price: payload.selling_price,
        stock: payload.stock,
        minimum_stock: payload.minimum_stock,
        is_active: payload.is_active,
      })
      .select("*, categories(name)")
      .single();

    if (error || !data) return null;

    const row = data as unknown as ProductRow;

    // Record initial stock movement if stock > 0. If this fails, make a
    // best-effort cleanup so a product is not silently created without history.
    if (payload.stock > 0) {
      const movementSaved = await insertStockMovementSupabase({
        product_id: row.id,
        quantity_change: payload.stock,
        balance_after: payload.stock,
        reason: "restock",
        notes: "Stok awal pendaftaran produk",
      });
      if (!movementSaved) {
        await supabase
          .from("products")
          .delete()
          .eq("id", row.id)
          .eq("owner_id", ownerId);
        return null;
      }
    }

    return {
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
  } catch {
    return null;
  }
}

export async function updateProductSupabase(
  id: string,
  payload: Partial<Product>,
): Promise<Product | null> {
  const supabase = getClient();
  if (!supabase) return null;

  try {
    const ownerId = await getActiveOwnerId();
    const { data: current, error: currentError } = await supabase
      .from("products")
      .select("id, stock")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (currentError || !current) return null;

    const previousStock = Number(current.stock);
    const requestedStock = payload.stock === undefined ? previousStock : payload.stock;
    if (!Number.isFinite(requestedStock) || requestedStock < 0) return null;

    const updateData: Database["public"]["Tables"]["products"]["Update"] = {
      updated_at: new Date().toISOString(),
    };
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.sku !== undefined) updateData.sku = payload.sku;
    if (payload.category_id !== undefined)
      updateData.category_id = payload.category_id || null;
    if (payload.unit !== undefined) updateData.unit = payload.unit;
    if (payload.cost_price !== undefined)
      updateData.cost_price = payload.cost_price;
    if (payload.selling_price !== undefined)
      updateData.selling_price = payload.selling_price;
    if (payload.stock !== undefined) updateData.stock = payload.stock;
    if (payload.minimum_stock !== undefined)
      updateData.minimum_stock = payload.minimum_stock;
    if (payload.is_active !== undefined)
      updateData.is_active = payload.is_active;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .eq("stock", previousStock)
      .select("*, categories(name)")
      .single();

    if (error || !data) return null;

    const row = data as unknown as ProductRow;

    if (requestedStock !== previousStock) {
      const movementSaved = await insertStockMovementSupabase({
        product_id: row.id,
        quantity_change: requestedStock - previousStock,
        balance_after: requestedStock,
        reason: "adjustment",
        notes: "Penyesuaian stok melalui edit produk",
      });
      if (!movementSaved) {
        // Best-effort rollback guarded by the new stock value.
        await supabase
          .from("products")
          .update({ stock: previousStock, updated_at: new Date().toISOString() })
          .eq("id", row.id)
          .eq("owner_id", ownerId)
          .eq("stock", requestedStock);
        return null;
      }
    }

    return {
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
  } catch {
    return null;
  }
}

export async function deleteProductSupabase(id: string): Promise<boolean> {
  const supabase = getClient();
  if (!supabase) return false;

  try {
    const ownerId = await getActiveOwnerId();
    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select("id")
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// CATEGORIES CRUD
// -----------------------------------------------------------------------------

export async function fetchCategoriesSupabase(): Promise<Category[] | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const ownerId = await getActiveOwnerId();
    const [{ data: cats, error }, { data: products, error: productsError }] =
      await Promise.all([
        client.from("categories")
          .select("id, owner_id, name, prefix, created_at, updated_at")
          .eq("owner_id", ownerId)
          .order("name", { ascending: true }),
        client.from("products").select("category_id").eq("owner_id", ownerId),
      ]);

    if (error || productsError || !cats || !products) return null;
    const counts: Record<string, number> = {};
    for (const product of products) {
      if (product.category_id) {
        counts[product.category_id] = (counts[product.category_id] ?? 0) + 1;
      }
    }

    return (cats as unknown as CategoryRow[]).map((row) => ({
      id: row.id,
      owner_id: row.owner_id,
      name: row.name,
      prefix: row.prefix ?? undefined,
      product_count: counts[row.id] ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch {
    return null;
  }
}

export async function insertCategorySupabase(
  name: string,
  prefix?: string | null,
): Promise<Category | null> {
  const supabase = getClient();
  if (!supabase) return null;

  try {
    const ownerId = await getActiveOwnerId();
    const { data, error } = await supabase
      .from("categories")
      .insert({ owner_id: ownerId, name, prefix: prefix ?? null })
      .select("id, owner_id, name, prefix, created_at, updated_at")
      .single();

    if (error || !data) return null;
    const row = data as unknown as CategoryRow;
    return {
      id: row.id,
      owner_id: row.owner_id,
      name: row.name,
      prefix: row.prefix ?? undefined,
      product_count: 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch {
    return null;
  }
}

export async function updateCategorySupabase(
  id: string,
  name: string,
  prefix?: string | null,
): Promise<boolean> {
  const supabase = getClient();
  if (!supabase) return false;

  try {
    const ownerId = await getActiveOwnerId();
    const { data, error } = await supabase
      .from("categories")
      .update({ name, prefix: prefix ?? null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select("id")
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
}

export async function deleteCategorySupabase(id: string): Promise<boolean> {
  const supabase = getClient();
  if (!supabase) return false;

  try {
    const ownerId = await getActiveOwnerId();
    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select("id")
      .maybeSingle();
    return !error && !!data;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// ORDERS & TRANSACTIONS
// -----------------------------------------------------------------------------

export async function fetchOrdersSupabase(): Promise<Order[] | null> {
  const supabase = getClient();
  if (!supabase) return null;

  try {
    const ownerId = await getActiveOwnerId();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), payments(*)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error || !data) return null;

    const rows = data as unknown as OrderRow[];

    return rows.map((o) => {
      const pm = o.payments?.[0];
      const payment: Payment | null = pm
        ? {
            id: pm.id,
            order_id: pm.order_id,
            payment_method: pm.payment_method,
            amount: Number(pm.amount),
            cash_received: pm.cash_received == null ? null : Number(pm.cash_received),
            cash_change: pm.cash_change == null ? null : Number(pm.cash_change),
            payment_status: pm.payment_status,
            provider_reference: pm.provider_reference,
            created_at: pm.created_at,
          }
        : null;

      const items: OrderItem[] = (o.order_items || []).map((it) => ({
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
      }));

      return {
        id: o.id,
        owner_id: o.owner_id,
        invoice_number: o.invoice_number,
        idempotency_key: o.idempotency_key,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        total: Number(o.total),
        transaction_status: o.transaction_status,
        notes: o.notes,
        created_at: o.created_at,
        updated_at: o.updated_at,
        items,
        payment,
      };
    });
  } catch {
    return null;
  }
}

export async function verifyPaymentSupabase(orderId: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    const ownerId = await getActiveOwnerId();
    const now = new Date().toISOString();

    const { data: order, error: findError } = await client
      .from("orders")
      .select("id, transaction_status")
      .eq("id", orderId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (findError || !order || order.transaction_status === "cancelled" ||
        order.transaction_status === "refunded") return false;

    const { data: payments, error: paymentFindError } = await client
      .from("payments")
      .select("id, payment_status")
      .eq("order_id", orderId);

    if (paymentFindError || !payments?.length) return false;

    const { data: updatedPayments, error: paymentError } = await client
      .from("payments")
      .update({
        payment_status: "paid",
        verification_user: ownerId,
        verification_timestamp: now,
        updated_at: now,
      })
      .eq("order_id", orderId)
      .select("id");

    if (paymentError || !updatedPayments?.length) return false;

    const { data: updatedOrder, error: orderError } = await client
      .from("orders")
      .update({ transaction_status: "completed", updated_at: now })
      .eq("id", orderId)
      .eq("owner_id", ownerId)
      .select("id")
      .maybeSingle();

    return !orderError && !!updatedOrder;
  } catch {
    return false;
  }
}

export async function processRefundSupabase(
  orderId: string,
  invoiceNumber: string,
  reason: string,
  items: { product_id: string | null; quantity: number }[],
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    const ownerId = await getActiveOwnerId();
    const now = new Date().toISOString();

    const { data: order, error: orderReadError } = await client
      .from("orders")
      .select("id, transaction_status")
      .eq("id", orderId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (orderReadError || !order) return false;
    if (order.transaction_status === "refunded" || order.transaction_status === "cancelled") {
      return false;
    }

    const { data: payments, error: paymentReadError } = await client
      .from("payments")
      .select("id, payment_status")
      .eq("order_id", orderId);
    if (paymentReadError || !payments?.length) return false;

    const isCancellation = payments.every((p) => p.payment_status === "pending");
    const txnStatus = isCancellation ? "cancelled" : "refunded";
    const payStatus = isCancellation ? "failed" : "refunded";

    // Validate requested restock quantities before mutating any data.
    for (const item of items) {
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) return false;
      if (!item.product_id || item.product_id.startsWith("prod-")) continue;

      const { data: product, error } = await client
        .from("products")
        .select("id, stock")
        .eq("id", item.product_id)
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (error || !product) return false;
    }

    // Without a database transaction/RPC, this sequence cannot be fully atomic.
    // Check every mutation and return false immediately on any failure.
    const { data: orderUpdated, error: orderUpdateError } = await client
      .from("orders")
      .update({ transaction_status: txnStatus, updated_at: now })
      .eq("id", orderId)
      .eq("owner_id", ownerId)
      .select("id")
      .maybeSingle();
    if (orderUpdateError || !orderUpdated) return false;

    const { data: paymentUpdated, error: paymentUpdateError } = await client
      .from("payments")
      .update({ payment_status: payStatus, updated_at: now })
      .eq("order_id", orderId)
      .select("id");
    if (paymentUpdateError || !paymentUpdated?.length) return false;

    for (const item of items) {
      if (!item.product_id || item.product_id.startsWith("prod-")) continue;

      const { data: product, error: productReadError } = await client
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (productReadError || !product) return false;

      const currentStock = Number(product.stock);
      const newStock = currentStock + item.quantity;
      const { data: updatedProduct, error: productUpdateError } = await client
        .from("products")
        .update({ stock: newStock, updated_at: now })
        .eq("id", item.product_id)
        .eq("owner_id", ownerId)
        .eq("stock", currentStock)
        .select("id")
        .maybeSingle();
      if (productUpdateError || !updatedProduct) return false;

      const movementSaved = await insertStockMovementSupabase({
        product_id: item.product_id,
        quantity_change: item.quantity,
        balance_after: newStock,
        reason: isCancellation ? "restock" : "refund",
        reference_id: invoiceNumber,
        notes: `${isCancellation ? "Pembatalan" : "Refund"} transaksi: ${reason}`,
      });
      if (!movementSaved) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export interface CheckoutOrderSupabasePayload {
  invoiceNumber: string;
  idempotencyKey?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
  paymentMethod: "cash" | "transfer" | "online";
  cashReceived?: number | null;
  cashChange?: number | null;
  items: {
    product_id: string | null;
    product_name: string;
    sku: string;
    unit: string;
    quantity: number;
    unit_price: number;
    cost_price: number;
    line_subtotal: number;
  }[];
  stockDeductions: {
    product: {
      id: string;
      name: string;
      sku: string;
      stock: number;
    };
    qty: number;
  }[];
}

export async function insertOrderWithItemsSupabase(
  payload: CheckoutOrderSupabasePayload,
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const client = getClient();
  if (!client) return { success: false, error: "Database tidak terhubung" };

  try {
    const ownerId = await getActiveOwnerId();
    if (!payload.items.length) {
      return { success: false, error: "Transaksi harus memiliki minimal satu item." };
    }
    if (![payload.subtotal, payload.discount, payload.total].every(Number.isFinite) ||
        payload.subtotal < 0 || payload.discount < 0 || payload.total < 0) {
      return { success: false, error: "Nilai transaksi tidak valid." };
    }
    if (payload.items.some((item) =>
      !Number.isFinite(item.quantity) || item.quantity <= 0 ||
      !Number.isFinite(item.unit_price) || item.unit_price < 0 ||
      !Number.isFinite(item.line_subtotal) || item.line_subtotal < 0
    )) {
      return { success: false, error: "Data item transaksi tidak valid." };
    }
    if (payload.stockDeductions.some((d) =>
      !Number.isFinite(d.qty) || d.qty <= 0
    )) {
      return { success: false, error: "Jumlah pengurangan stok tidak valid." };
    }

    // Idempotency: return the previously created order for a repeated request.
    if (payload.idempotencyKey) {
      const { data: existing, error: existingError } = await client
        .from("orders")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("idempotency_key", payload.idempotencyKey)
        .maybeSingle();
      if (existingError) return { success: false, error: existingError.message };
      if (existing) return { success: true, orderId: existing.id };
    }

    const paymentStatus = payload.paymentMethod === "transfer" ? "pending" : "paid";
    const transactionStatus = paymentStatus === "paid" ? "completed" : "pending";
    const { data: order, error: orderError } = await client
      .from("orders")
      .insert({
        owner_id: ownerId,
        invoice_number: payload.invoiceNumber,
        idempotency_key: payload.idempotencyKey || null,
        subtotal: payload.subtotal,
        discount: payload.discount,
        total: payload.total,
        transaction_status: transactionStatus,
        notes: payload.notes ?? null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return { success: false, error: orderError?.message ?? "Gagal membuat order." };
    }

    const itemsToInsert = payload.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id && !item.product_id.startsWith("prod-")
        ? item.product_id : null,
      product_name: item.product_name,
      sku: item.sku,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      line_subtotal: item.line_subtotal,
    }));

    const { error: itemsError } = await client.from("order_items").insert(itemsToInsert);
    if (itemsError) {
      return { success: false, orderId: order.id,
        error: `Order dibuat, tetapi item gagal disimpan: ${itemsError.message}` };
    }

    const { error: paymentError } = await client.from("payments").insert({
      order_id: order.id,
      payment_method: payload.paymentMethod,
      amount: payload.total,
      cash_received: payload.paymentMethod === "cash" ? (payload.cashReceived ?? null) : null,
      cash_change: payload.paymentMethod === "cash" ? (payload.cashChange ?? null) : null,
      payment_status: paymentStatus,
      provider_reference: null,
    });
    if (paymentError) {
      return { success: false, orderId: order.id,
        error: `Order dan item tersimpan, tetapi pembayaran gagal disimpan: ${paymentError.message}` };
    }

    for (const deduction of payload.stockDeductions) {
      const productId = deduction.product.id;
      if (!productId || productId.startsWith("prod-")) continue;

      const { data: product, error: productReadError } = await client
        .from("products")
        .select("id, name, stock")
        .eq("id", productId)
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (productReadError || !product) {
        return { success: false, orderId: order.id,
          error: `Produk ${deduction.product.name} tidak ditemukan atau bukan milik pengguna ini.` };
      }

      const currentStock = Number(product.stock);
      if (!Number.isFinite(currentStock) || currentStock < deduction.qty) {
        return { success: false, orderId: order.id,
          error: `Stok ${product.name} tidak mencukupi.` };
      }
      const newStock = currentStock - deduction.qty;

      const { data: updatedProduct, error: stockError } = await client
        .from("products")
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("owner_id", ownerId)
        .eq("stock", currentStock)
        .gte("stock", deduction.qty)
        .select("id")
        .maybeSingle();

      if (stockError || !updatedProduct) {
        return { success: false, orderId: order.id,
          error: `Stok ${product.name} gagal diperbarui atau sudah berubah. Muat ulang stok lalu coba lagi.` };
      }

      const { error: movementError } = await client.from("stock_movements").insert({
        owner_id: ownerId,
        product_id: productId,
        quantity_change: -deduction.qty,
        balance_after: newStock,
        reason: "sale",
        reference_id: payload.invoiceNumber,
        notes: `Penjualan kasir (${payload.paymentMethod})`,
      });
      if (movementError) {
        return { success: false, orderId: order.id,
          error: `Stok berubah, tetapi riwayat stok gagal disimpan: ${movementError.message}` };
      }
    }

    return { success: true, orderId: order.id };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Kesalahan sistem database",
    };
  }
}

// -----------------------------------------------------------------------------
// STOCK MOVEMENTS & ADJUSTMENTS
// -----------------------------------------------------------------------------

export async function fetchStockMovementsSupabase(): Promise<StockMovement[] | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const ownerId = await getActiveOwnerId();
    const { data, error } = await client
      .from("stock_movements")
      .select("*, products(name, sku)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !data) return null;

    return (data as unknown as StockMovementRow[]).map((row) => ({
      id: row.id,
      owner_id: row.owner_id,
      product_id: row.product_id,
      product_name: row.products?.name ?? "Produk",
      sku: row.products?.sku ?? "-",
      quantity_change: Number(row.quantity_change),
      balance_after: Number(row.balance_after),
      reason: row.reason,
      reference_id: row.reference_id,
      notes: row.notes,
      acting_user: row.owner_id,
      created_at: row.created_at,
    }));
  } catch {
    return null;
  }
}

export async function insertStockMovementSupabase(payload: {
  product_id: string;
  quantity_change: number;
  balance_after: number;
  reason: "restock" | "sale" | "adjustment" | "refund" | "damage" | "loss";
  reference_id?: string;
  notes?: string;
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  if (!Number.isFinite(payload.quantity_change) ||
      !Number.isFinite(payload.balance_after) || payload.balance_after < 0) return false;

  try {
    const ownerId = await getActiveOwnerId();
    const { data: product, error: productError } = await client
      .from("products")
      .select("id")
      .eq("id", payload.product_id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (productError || !product) return false;

    const { error } = await client.from("stock_movements").insert({
      owner_id: ownerId,
      product_id: payload.product_id,
      quantity_change: payload.quantity_change,
      balance_after: payload.balance_after,
      reason: payload.reason,
      reference_id: payload.reference_id || null,
      notes: payload.notes || null,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function adjustStockSupabase(payload: {
  product_id: string;
  new_stock: number;
  quantity_change: number;
  reason: "restock" | "adjustment" | "damage" | "loss";
  notes?: string;
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  if (!Number.isFinite(payload.new_stock) || payload.new_stock < 0 ||
      !Number.isFinite(payload.quantity_change)) return false;

  try {
    const ownerId = await getActiveOwnerId();
    const now = new Date().toISOString();
    const { data: product, error: readError } = await client
      .from("products")
      .select("id, stock")
      .eq("id", payload.product_id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (readError || !product) return false;

    const expectedChange = payload.new_stock - Number(product.stock);
    if (expectedChange !== payload.quantity_change) return false;

    const { data: updated, error: updateError } = await client
      .from("products")
      .update({ stock: payload.new_stock, updated_at: now })
      .eq("id", payload.product_id)
      .eq("owner_id", ownerId)
      .eq("stock", Number(product.stock))
      .select("id")
      .maybeSingle();
    if (updateError || !updated) return false;

    return await insertStockMovementSupabase({
      product_id: payload.product_id,
      quantity_change: payload.quantity_change,
      balance_after: payload.new_stock,
      reason: payload.reason,
      notes: payload.notes,
    });
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// STORE SETTINGS
// -----------------------------------------------------------------------------

export async function fetchStoreSettingsSupabase(): Promise<StoreSettings | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const ownerId = await getActiveOwnerId();

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id, store_name, owner_name, phone, address")
      .eq("id", ownerId)
      .maybeSingle();
    if (profileError) return null;

    const { error: profileCreateError } = await client.from("profiles").upsert(
      {
        id: ownerId,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (profileCreateError) return null;

    const { data: ensuredProfile, error: ensuredProfileError } = await client
      .from("profiles")
      .select("id, store_name, owner_name, phone, address")
      .eq("id", ownerId)
      .single();
    if (ensuredProfileError || !ensuredProfile) return null;

    const { data: settings, error: settingsError } = await client
      .from("store_settings")
      .select("*")
      .eq("id", ownerId)
      .maybeSingle();
    if (settingsError) return null;

    const { data: ensuredSettings, error: settingsCreateError } = await client
      .from("store_settings")
      .upsert({ id: ownerId }, { onConflict: "id", ignoreDuplicates: true })
      .select("*")
      .maybeSingle();
    if (settingsCreateError) return null;

    const row = (settings ?? ensuredSettings) as StoreSettingsRow | null;
    if (!row) return null;

    const { data: authData } = await client.auth.getUser();
    const prof = ensuredProfile as unknown as Omit<ProfileRow, "email" | "password">;

    return {
      id: row.id,
      store_name: prof?.store_name ?? "",
      owner_name: prof?.owner_name ?? "",
      phone: prof?.phone ?? "",
      address: prof?.address ?? "",
      bank_name: row.bank_name,
      bank_account_number: row.bank_account_number,
      bank_account_holder: row.bank_account_holder,
      default_minimum_stock: Number(row.default_minimum_stock),
      is_online_payment_enabled: row.is_online_payment_enabled,
      qris_image_url: "",
      qris_nmid: "",
      email: authData.user?.email ?? "",
      password: "",
    };
  } catch {
    return null;
  }
}

export async function updateStoreSettingsSupabase(
  payload: Partial<StoreSettings>,
  clientOverride?: WarungkuSupabaseClient,
): Promise<boolean> {
  const client = clientOverride ?? getClient();
  if (!client) return false;

  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user?.id) {
      console.error("Supabase settings save auth failed", authError);
      return false;
    }

    const ownerId = user.id;
    const now = new Date().toISOString();

    if (payload.email !== undefined && payload.email.trim() && payload.email !== user.email) {
      const { error: emailUpdateError } = await client.auth.updateUser({
        email: payload.email.trim(),
      });
      if (emailUpdateError) {
        console.error("Supabase Auth email update failed", emailUpdateError);
        return false;
      }
    }

    const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {
      updated_at: now,
    };
    if (payload.store_name !== undefined) profileUpdate.store_name = payload.store_name;
    if (payload.owner_name !== undefined) profileUpdate.owner_name = payload.owner_name;
    if (payload.phone !== undefined) profileUpdate.phone = payload.phone;
    if (payload.address !== undefined) profileUpdate.address = payload.address;

    const hasProfileChanges =
      payload.store_name !== undefined ||
      payload.owner_name !== undefined ||
      payload.phone !== undefined ||
      payload.address !== undefined;

    if (hasProfileChanges) {
      const { error: profileUpdateError } = await client
        .from("profiles")
        .update(profileUpdate)
        .eq("id", ownerId);
      if (profileUpdateError) {
        console.error("Supabase profile settings update failed", profileUpdateError);
        return false;
      }
    }

    const settingsPayload: Database["public"]["Tables"]["store_settings"]["Insert"] = {
      id: ownerId,
      updated_at: now,
    };

    if (payload.bank_name !== undefined) settingsPayload.bank_name = payload.bank_name;
    if (payload.bank_account_number !== undefined)
      settingsPayload.bank_account_number = payload.bank_account_number;
    if (payload.bank_account_holder !== undefined)
      settingsPayload.bank_account_holder = payload.bank_account_holder;
    if (payload.default_minimum_stock !== undefined) {
      if (!Number.isFinite(payload.default_minimum_stock) || payload.default_minimum_stock < 0)
        return false;
      settingsPayload.default_minimum_stock = payload.default_minimum_stock;
    }
    if (payload.is_online_payment_enabled !== undefined)
      settingsPayload.is_online_payment_enabled = payload.is_online_payment_enabled;

    const { error: settingsError } = await client
      .from("store_settings")
      .update(settingsPayload)
      .eq("id", ownerId);
    if (settingsError) {
      console.error("Supabase store settings update failed", settingsError);
    }
    return !settingsError;
  } catch (error) {
    console.error("Supabase store settings update failed unexpectedly", error);
    return false;
  }
}

/**
 * Realtime subscription helper for any table.
 * On any INSERT/UPDATE/DELETE, re-fetches the table via the provided fetcher
 * and invokes `onChange` with freshly synced data, then dispatches a
 * window CustomEvent so the in-memory store (lib/data/store.ts) â€” and any
 * other tab/listener â€” refreshes its cache in real time.
 * Returns a cleanup function that removes the Realtime channel, or null when
 * Supabase is not configured.
 */
export function subscribeToTable<T>(
  table: string,
  fetcher: () => Promise<T[] | null>,
  onChange: (data: T[]) => void,
  ownerId?: string,
): (() => void) | null {
  const client = getClient();
  if (!client) return null;

  let active = true;
  const refresh = async () => {
    try {
      const fresh = await fetcher();
      if (active && fresh !== null) {
        onChange(fresh);
        dispatchSyncEvent(table);
      }
    } catch {
      // Realtime callbacks must not create unhandled promise rejections.
    }
  };

  const filter = ownerId ? { filter: `owner_id=eq.${ownerId}` } : {};
  const channelName = `realtime:${table}:${ownerId ?? "current"}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

  try {
    const channel = client
      .channel(channelName)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table,
        ...filter,
      }, () => { void refresh(); })
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  } catch {
    active = false;
    return () => undefined;
  }
}

/**
 * Dispatches a `warungku:sync:<table>` CustomEvent on `window` so the
 * in-memory data store and any React hooks can re-fetch affected table
 * data in real time. Noop outside the browser.
 */
export function dispatchSyncEvent(table: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(`warungku:sync:${table}`, { detail: { table } }),
  );
}

/**
 * Reacts to `warungku:sync:<table>` events â€” used by the in-memory store
 * to invalidate its cache and the React hooks layer to re-fetch.
 * Returns an unsubscribe function.
 */
export function onSyncEvent(
  table: string,
  handler: () => void,
): (() => void) | null {
  if (typeof window === "undefined") return null;
  window.addEventListener(`warungku:sync:${table}`, handler);
  return () => window.removeEventListener(`warungku:sync:${table}`, handler);
}

/**
 * Realtime subscription for categories.
 * On any change, re-fetches categories (matching fetchCategoriesSupabase)
 * and invokes `onChange`. Returns a cleanup function, or null when offline.
 */
export function subscribeToCategories(
  onChange: (categories: Category[]) => void,
): (() => void) | null {
  return subscribeToTable("categories", fetchCategoriesSupabase, onChange);
}

/**
 * Realtime subscription for products.
 * On any change, re-fetches products and invokes `onChange`.
 * Returns a cleanup function, or null when offline.
 */
export function subscribeToProducts(
  onChange: (products: Product[]) => void,
): (() => void) | null {
  return subscribeToTable("products", fetchProductsSupabase, onChange);
}

/**
 * Realtime subscription for stock movements.
 * On any change, re-fetches stock movements and invokes `onChange`.
 * Returns a cleanup function, or null when offline.
 */
export function subscribeToStockMovements(
  onChange: (movements: StockMovement[]) => void,
): (() => void) | null {
  return subscribeToTable("stock_movements", fetchStockMovementsSupabase, onChange);
}

/**
 * Realtime subscription for orders + order_items.
 * On any INSERT/UPDATE/DELETE on either table, re-fetches the full order list
 * (matching fetchOrdersSupabase) and invokes `onChange` with the fresh Orders[].
 * Returns a cleanup function that removes the Realtime channel.
 *
 * Filters by owner_id when a service role key is in use so multi-tenant
 * deployments only receive relevant rows.
 */
export function subscribeToOrders(
  onChange: (orders: Order[]) => void,
): (() => void) | null {
  const client = getClient();
  if (!client) return null;

  let active = true;
  const refresh = async () => {
    const fresh = await fetchOrdersSupabase();
    if (active && fresh) {
      onChange(fresh);
      dispatchSyncEvent("orders");
      dispatchSyncEvent("order_items");
    }
  };

  const channel = client
    .channel("realtime:orders:reports")
    .on("postgres_changes", {
      event: "*", schema: "public", table: "orders",
    }, () => { void refresh(); })
    .on("postgres_changes", {
      event: "*", schema: "public", table: "order_items",
    }, () => { void refresh(); })
    .on("postgres_changes", {
      event: "*", schema: "public", table: "payments",
    }, () => { void refresh(); })
    .subscribe();

  return () => {
    active = false;
    void client.removeChannel(channel);
  };
}

/**
 * Realtime subscription for profiles (email, store name, etc).
 * On any change, re-fetches settings and invokes `onChange`.
 * Returns a cleanup function, or null when Supabase is not configured.
 */
export function subscribeToStoreSettings(
  onChange: (settings: StoreSettings) => void,
): (() => void) | null {
  const refreshSettings = async (): Promise<StoreSettings[]> => {
    const settings = await fetchStoreSettingsSupabase();
    return settings ? [settings] : [];
  };
  const deliver = (settingsList: StoreSettings[]) => {
    if (settingsList[0]) onChange(settingsList[0]);
  };

  const stopProfiles = subscribeToTable("profiles", refreshSettings, deliver);
  const stopSettings = subscribeToTable("store_settings", refreshSettings, deliver);

  if (!stopProfiles && !stopSettings) return null;
  return () => {
    stopProfiles?.();
    stopSettings?.();
  };
}
