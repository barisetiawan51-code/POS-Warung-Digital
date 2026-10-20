import { createClient } from "@/lib/supabase/server";
import type { Product, OrderItem, Order } from "@/lib/types/pos";

type ProductRow = {
  id: string; owner_id: string; category_id: string | null; sku: string; name: string; unit: string;
  cost_price: number | string; selling_price: number | string; stock: number | string;
  minimum_stock: number | string; is_active: boolean; created_at: string; updated_at: string;
};

export async function fetchProductsServer(): Promise<Product[]> {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return [];
  const [{ data, error }, { data: categories }] = await Promise.all([
    client
      .from("products")
      .select("id, owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active, created_at, updated_at")
      .eq("owner_id", userData.user.id)
      .order("name", { ascending: true }),
    client.from("categories").select("id, name").eq("owner_id", userData.user.id),
  ]);
  if (error || !data) return [];
  const categoryNames = new Map(
    (categories ?? []).map((category) => [category.id, category.name]),
  );
  return (data as unknown as ProductRow[]).map((row) => ({
    ...row,
    category_name: row.category_id ? categoryNames.get(row.category_id) : undefined,
    cost_price: Number(row.cost_price),
    selling_price: Number(row.selling_price),
    stock: Number(row.stock),
    minimum_stock: Number(row.minimum_stock),
  }));
}

export async function fetchProductServer(id: string): Promise<Product | null> {
  const products = await fetchProductsServer();
  return products.find((product) => product.id === id && product.is_active) ?? null;
}
export async function insertOrderServer(payload: { invoiceNumber: string; idempotencyKey?: string | null; subtotal: number; discount: number; total: number; notes?: string | null; paymentMethod: "cash" | "transfer" | "online"; cashReceived?: number | null; cashChange?: number | null; items: OrderItem[]; stockDeductions: { product: { id: string; name: string }; qty: number }[] }): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return { success: false, error: "Sesi pengguna tidak valid." };
  const ownerId = userData.user.id;
  const { data: order, error: orderError } = await client.from("orders").insert({ owner_id: ownerId, invoice_number: payload.invoiceNumber, idempotency_key: payload.idempotencyKey ?? null, subtotal: payload.subtotal, discount: payload.discount, total: payload.total, transaction_status: payload.paymentMethod === "transfer" ? "pending" : "completed", notes: payload.notes ?? null }).select("id").single();
  if (orderError || !order) return { success: false, error: orderError?.message ?? "Gagal membuat order." };
  const { error: itemError } = await client.from("order_items").insert(payload.items.map((item) => ({ order_id: order.id, product_id: item.product_id && !item.product_id.startsWith("prod-") ? item.product_id : null, product_name: item.product_name, sku: item.sku, unit: item.unit, quantity: item.quantity, unit_price: item.unit_price, cost_price: item.cost_price, line_subtotal: item.line_subtotal })));
  if (itemError) return { success: false, orderId: order.id, error: itemError.message };
  const { error: paymentError } = await client.from("payments").insert({ order_id: order.id, payment_method: payload.paymentMethod, amount: payload.total, cash_received: payload.paymentMethod === "cash" ? payload.cashReceived ?? null : null, cash_change: payload.paymentMethod === "cash" ? payload.cashChange ?? null : null, payment_status: payload.paymentMethod === "transfer" ? "pending" : "paid", provider_reference: null });
  if (paymentError) return { success: false, orderId: order.id, error: paymentError.message };
  for (const deduction of payload.stockDeductions) { const { data: product } = await client.from("products").select("stock").eq("id", deduction.product.id).eq("owner_id", ownerId).maybeSingle(); if (!product || Number(product.stock) < deduction.qty) return { success: false, orderId: order.id, error: `Stok ${deduction.product.name} tidak mencukupi.` }; const { error } = await client.from("products").update({ stock: Number(product.stock) - deduction.qty, updated_at: new Date().toISOString() }).eq("id", deduction.product.id).eq("owner_id", ownerId); if (error) return { success: false, orderId: order.id, error: error.message }; }
  return { success: true, orderId: order.id };
}

export async function fetchOrderServer(id: string): Promise<Order | null> {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  console.log("[ORDER LOOKUP DEBUG]", {
    id,
    userId: userData.user?.id,
    userError: userError?.message,
  });
  if (userError || !userData.user) return null;
  const { data, error } = await client
    .from("orders")
    .select("*, order_items(*), payments(*)")
    .eq("owner_id", userData.user.id)
    .or(`id.eq.${id},invoice_number.eq.${id}`)
    .limit(1)
    .maybeSingle();
  console.log("[ORDER LOOKUP RESULT]", {
    id,
    found: Boolean(data),
    error: error?.message,
    code: error?.code,
  });
  if (error || !data) return null;
  const row = data as any;
  const payment = row.payments?.[0];
  return { ...row, subtotal: Number(row.subtotal), discount: Number(row.discount), total: Number(row.total), items: (row.order_items ?? []).map((item: any) => ({ ...item, quantity: Number(item.quantity), unit_price: Number(item.unit_price), cost_price: Number(item.cost_price), line_subtotal: Number(item.line_subtotal) })), payment: payment ? { ...payment, amount: Number(payment.amount), cash_received: payment.cash_received == null ? null : Number(payment.cash_received), cash_change: payment.cash_change == null ? null : Number(payment.cash_change) } : null } as Order;
}

export async function verifyPaymentServer(orderId: string): Promise<boolean> {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return false;
  const ownerId = userData.user.id;
  const now = new Date().toISOString();
  const { data: order } = await client.from("orders").select("id, transaction_status").eq("id", orderId).eq("owner_id", ownerId).maybeSingle();
  if (!order || order.transaction_status === "cancelled" || order.transaction_status === "refunded") return false;
  const { data: payments, error: paymentError } = await client.from("payments").update({ payment_status: "paid", verification_user: ownerId, verification_timestamp: now, updated_at: now }).eq("order_id", orderId).select("id");
  if (paymentError || !payments?.length) return false;
  const { data: updatedOrder, error: orderError } = await client.from("orders").update({ transaction_status: "completed", updated_at: now }).eq("id", orderId).eq("owner_id", ownerId).select("id").maybeSingle();
  return !orderError && !!updatedOrder;
}

export async function processRefundServer(orderId: string, items: { product_id: string | null; quantity: number }[]): Promise<boolean> {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return false;
  const ownerId = userData.user.id;
  const now = new Date().toISOString();
  const { data: order } = await client.from("orders").select("id, transaction_status").eq("id", orderId).eq("owner_id", ownerId).maybeSingle();
  if (!order || ["refunded", "cancelled"].includes(order.transaction_status)) return false;
  const { data: payments } = await client.from("payments").select("payment_status").eq("order_id", orderId);
  if (!payments?.length) return false;
  const cancelled = payments.every((payment) => payment.payment_status === "pending");
  const { data: updatedOrder, error: orderError } = await client.from("orders").update({ transaction_status: cancelled ? "cancelled" : "refunded", updated_at: now }).eq("id", orderId).eq("owner_id", ownerId).select("id").maybeSingle();
  if (orderError || !updatedOrder) return false;
  const { data: updatedPayments, error: paymentError } = await client.from("payments").update({ payment_status: cancelled ? "failed" : "refunded", updated_at: now }).eq("order_id", orderId).select("id");
  if (paymentError || !updatedPayments?.length) return false;
  for (const item of items) { if (!item.product_id || item.product_id.startsWith("prod-")) continue; const { data: product } = await client.from("products").select("stock").eq("id", item.product_id).eq("owner_id", ownerId).maybeSingle(); if (!product) return false; const { error } = await client.from("products").update({ stock: Number(product.stock) + item.quantity, updated_at: now }).eq("id", item.product_id).eq("owner_id", ownerId); if (error) return false; }
  return true;
}
