// ==============================================================================
// WARUNGKU - BUSINESS RULES & LOGIC UNIT TESTS
// ==============================================================================

import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCartTotals,
  calculateCashChange,
  calculateGrowthPercent,
  isLowStock,
} from "@/lib/math";
import {
  formatRupiah,
  formatQuantity,
  formatDateIndonesian,
  generateInvoiceNumber,
} from "@/lib/format";
import {
  processCheckout,
  getProducts,
  createProduct,
  deleteProduct,
  getCategories,
  createCategory,
  deleteCategory,
  adjustStock,
  refundOrder,
  verifyPayment,
  getStoreSettings,
  updateStoreSettings,
  getStockMovements,
} from "@/lib/data/store";
import type { CartItem } from "@/lib/types/pos";

test("1. Cart Totals & Discount Calculations", () => {
  const items: CartItem[] = [
    {
      product: {
        id: "p1",
        owner_id: "owner-1",
        category_id: "c1",
        sku: "TEST-01",
        name: "Produk A",
        unit: "pcs",
        cost_price: 10000,
        selling_price: 15000,
        stock: 10,
        minimum_stock: 2,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      quantity: 2,
    },
    {
      product: {
        id: "p2",
        owner_id: "owner-1",
        category_id: "c1",
        sku: "TEST-02",
        name: "Produk B",
        unit: "kg",
        cost_price: 20000,
        selling_price: 25000,
        stock: 5,
        minimum_stock: 1,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      quantity: 1,
    },
  ];

  // Subtotal: (2 * 15000) + (1 * 25000) = 55000
  const totalsNoDiscount = calculateCartTotals(items, 0);
  assert.equal(totalsNoDiscount.subtotal, 55000);
  assert.equal(totalsNoDiscount.discount, 0);
  assert.equal(totalsNoDiscount.total, 55000);
  assert.equal(totalsNoDiscount.itemCount, 3);

  // Discount 5000
  const totalsWithDiscount = calculateCartTotals(items, 5000);
  assert.equal(totalsWithDiscount.subtotal, 55000);
  assert.equal(totalsWithDiscount.discount, 5000);
  assert.equal(totalsWithDiscount.total, 50000);

  // Discount exceeding subtotal cannot produce negative total
  const totalsCappedDiscount = calculateCartTotals(items, 999999);
  assert.equal(totalsCappedDiscount.subtotal, 55000);
  assert.equal(totalsCappedDiscount.discount, 55000);
  assert.equal(totalsCappedDiscount.total, 0);
});

test("2. Cash Change & Validation Rules", () => {
  // Exact payment
  const exact = calculateCashChange(50000, 50000);
  assert.equal(exact.isSufficient, true);
  assert.equal(exact.change, 0);
  assert.equal(exact.deficit, 0);

  // Overpayment (returns change)
  const overpay = calculateCashChange(45500, 50000);
  assert.equal(overpay.isSufficient, true);
  assert.equal(overpay.change, 4500);
  assert.equal(overpay.deficit, 0);

  // Insufficient payment
  const underpay = calculateCashChange(100000, 75000);
  assert.equal(underpay.isSufficient, false);
  assert.equal(underpay.change, 0);
  assert.equal(underpay.deficit, 25000);
});

test("3. Currency & Locale Formatting", () => {
  assert.equal(formatRupiah(1064500), "Rp 1.064.500");
  assert.equal(formatRupiah(0), "Rp 0");
  assert.equal(formatQuantity(2, "pouch"), "2 pouch");
  assert.equal(formatQuantity(2.5, "kg"), "2.50 kg");

  const formattedDate = formatDateIndonesian(new Date("2026-10-17T08:00:00Z"));
  assert.match(formattedDate, /17 Oktober 2026/);

  const inv = generateInvoiceNumber();
  assert.match(inv, /^INV-\d{8}-\d{4}$/);
});

test("4. Stock Alert Logic & Growth Percentages", () => {
  assert.equal(isLowStock(4, 5), true);
  assert.equal(isLowStock(5, 5), true);
  assert.equal(isLowStock(6, 5), false);

  // Growth: from 16 to 19 transactions = +19%
  assert.equal(calculateGrowthPercent(19, 16), 19);
  // Growth: from 879.000 to 1.064.500 = +21%
  assert.equal(calculateGrowthPercent(1064500, 879000), 21);
});

test("5. Checkout Execution, Stock Consistency & Ledger Deduction", async () => {
  const products = await getProducts();
  const bimoli = products.find((p) => p.sku === "SEM-002");
  assert.ok(bimoli);
  const initialStock = bimoli.stock;

  // Process checkout: buy 1 pouch of Bimoli with Cash
  const result = await processCheckout({
    items: [{ product_id: bimoli.id, quantity: 1 }],
    discount: 0,
    payment_method: "cash",
    cash_received: 50000,
  });

  assert.equal(result.success, true);
  assert.equal(result.subtotal, bimoli.selling_price);
  assert.equal(result.cash_change, 50000 - bimoli.selling_price);
  assert.equal(result.payment_status, "paid");

  // Stock must decrease by 1
  const updatedProducts = await getProducts();
  const updatedBimoli = updatedProducts.find((p) => p.sku === "SEM-002");
  assert.equal(updatedBimoli?.stock, initialStock - 1);
});

test("6. Overselling Prevention Rule", async () => {
  const products = await getProducts();
  const telur = products.find((p) => p.sku === "TEL-001");
  assert.ok(telur);

  // Attempt to buy more than available stock
  const result = await processCheckout({
    items: [{ product_id: telur.id, quantity: telur.stock + 999 }],
    discount: 0,
    payment_method: "cash",
    cash_received: 10000000,
  });

  assert.equal(result.success, false);
  assert.match(result.message || "", /Stok produk.*tidak mencukupi/);
});

test("7. Idempotency Key Safeguard", async () => {
  const products = await getProducts();
  const aqua = products.find((p) => p.sku === "MIN-001");
  assert.ok(aqua);

  const key = `idem-test-${Date.now()}`;

  // First call
  const first = await processCheckout({
    items: [{ product_id: aqua.id, quantity: 1 }],
    discount: 0,
    payment_method: "cash",
    cash_received: 10000,
    idempotency_key: key,
  });
  assert.equal(first.success, true);

  // Duplicate call with same key must return existing result without double deducting stock
  const stockBeforeSecond = (await getProducts()).find(
    (p) => p.sku === "MIN-001",
  )?.stock;
  const second = await processCheckout({
    items: [{ product_id: aqua.id, quantity: 1 }],
    discount: 0,
    payment_method: "cash",
    cash_received: 10000,
    idempotency_key: key,
  });

  assert.equal(second.success, true);
  assert.equal(second.order_id, first.order_id);
  const stockAfterSecond = (await getProducts()).find(
    (p) => p.sku === "MIN-001",
  )?.stock;
  assert.equal(stockBeforeSecond, stockAfterSecond);
});

test("8. Refund & Stock Restoration Integrity", async () => {
  const products = await getProducts();
  const kopi = products.find((p) => p.sku === "MIN-002" || p.sku === "KOP-001");
  assert.ok(kopi);
  const initialStock = kopi.stock;

  // Buy 2
  const sale = await processCheckout({
    items: [{ product_id: kopi.id, quantity: 2 }],
    discount: 0,
    payment_method: "cash",
    cash_received: 10000,
  });
  assert.equal(sale.success, true);
  assert.equal(
    (await getProducts()).find((p) => p.sku === kopi.sku)?.stock,
    initialStock - 2,
  );

  // Refund order
  const refundResult = await refundOrder(
    sale.order_id,
    "Pelanggan salah beli varian",
  );
  assert.equal(refundResult.success, true);

  // Stock must be restored to initial
  const restoredStock = (await getProducts()).find(
    (p) => p.sku === kopi.sku,
  )?.stock;
  assert.equal(restoredStock, initialStock);

  // Repeated refund should be rejected
  const repeatRefund = await refundOrder(sale.order_id, "Coba refund ulang");
  assert.equal(repeatRefund.success, false);
});

test("9. Product Creation & Duplicate SKU Rule", async () => {
  const sku = `BARU-${Date.now()}`;
  const res = await createProduct({
    sku,
    name: "Kecap Manis Bango 135ml",
    unit: "pouch",
    cost_price: 8000,
    selling_price: 10000,
    stock: 25,
    minimum_stock: 5,
  });
  assert.equal(res.success, true);
  assert.ok(res.product);

  // Duplicate SKU must fail
  const duplicateRes = await createProduct({
    sku,
    name: "Kecap Manis Lain",
    unit: "botol",
    cost_price: 8000,
    selling_price: 10000,
    stock: 10,
    minimum_stock: 5,
  });
  assert.equal(duplicateRes.success, false);
});

test("10. Stock Adjustment & Transfer Verification", async () => {
  const products = await getProducts();
  const target = products[0];
  const initial = target.stock;

  // Restock 10
  const adjustRes = await adjustStock({
    product_id: target.id,
    quantity_change: 10,
    reason: "restock",
    notes: "Kulakan tambahan",
  });
  assert.equal(adjustRes.success, true);
  assert.equal(adjustRes.new_stock, initial + 10);

  // Transfer verification
  const transferOrder = await processCheckout({
    items: [{ product_id: target.id, quantity: 1 }],
    discount: 0,
    payment_method: "transfer",
  });
  assert.equal(transferOrder.success, true);
  assert.equal(transferOrder.payment_status, "pending");

  const verifyRes = await verifyPayment(transferOrder.order_id);
  assert.equal(verifyRes.success, true);
});

test("11. Product Deletion Removes Stock & Records Movement", async () => {
  // Create product with stock
  const sku = `DEL-${Date.now()}`;
  const createRes = await createProduct({
    sku,
    name: "Produk Uji Hapus",
    unit: "pcs",
    cost_price: 5000,
    selling_price: 7500,
    stock: 15,
    minimum_stock: 5,
  });
  assert.equal(createRes.success, true);
  const prodId = createRes.product!.id;

  // Delete product
  const delRes = await deleteProduct(prodId);
  assert.equal(delRes.success, true);

  // Product must no longer be in active product list
  const products = await getProducts();
  const found = products.find((p) => p.id === prodId);
  assert.equal(found, undefined);

  // Stock removal must be recorded in stock movements ledger
  const movements = await getStockMovements();
  const delMovement = movements.find(
    (sm) => sm.product_id === prodId && sm.reason === "loss",
  );
  assert.ok(delMovement);
  assert.equal(delMovement.quantity_change, -15);
  assert.equal(delMovement.balance_after, 0);
});

test("12. Category Deletion Unlinks Products Cleanly", async () => {
  const catName = `Kat-${Date.now()}`;
  const catRes = await createCategory(catName);
  assert.equal(catRes.success, true);
  const catId = catRes.category!.id;

  // Create product in that category
  const prodRes = await createProduct({
    sku: `PROD-KAT-${Date.now()}`,
    name: "Produk Dalam Kategori",
    category_id: catId,
    unit: "pcs",
    cost_price: 1000,
    selling_price: 2000,
    stock: 5,
    minimum_stock: 2,
  });
  assert.equal(prodRes.success, true);

  // Delete category
  const delCatRes = await deleteCategory(catId);
  assert.equal(delCatRes.success, true);

  // Category no longer exists
  const categories = await getCategories();
  assert.equal(
    categories.some((c) => c.id === catId),
    false,
  );

  // Product is now uncategorized (category_id null)
  const products = await getProducts();
  const linkedProd = products.find((p) => p.id === prodRes.product!.id);
  assert.ok(linkedProd);
  assert.equal(linkedProd.category_id, null);
});

test("13. Category Prefix Auto-Generation & SKU Derivation", async () => {
  // Nama statis agar prefix deterministik ("Mie Instan" -> "MIX").
  // Jangan pakai Date.now() di nama: angka menjadi "kata" ke-3 dan
  // mengubah prefix jadi "MI1" bukan "MIX".
  const catName = "Mie Instan";
  const catRes = await createCategory(catName);
  assert.equal(catRes.success, true);
  assert.ok(catRes.category, "Category should be created");
  // Prefix derived from first 3 word-initials, padded with X if < 3 letters.
  // "Mie Instan" -> M + I + pad -> "MIX"
  const expectedPrefix = "MIX";
  assert.equal(catRes.category!.prefix, expectedPrefix);

  // Create product WITHOUT explicit SKU in this category;
  // createProduct should auto-generate PREFIX-001.
  const prodRes = await createProduct({
    name: "Produk Tanpa SKU",
    category_id: catRes.category!.id,
    unit: "pcs",
    cost_price: 5000,
    selling_price: 8000,
    stock: 10,
    minimum_stock: 2,
  });
  assert.equal(prodRes.success, true);
  assert.ok(prodRes.product, "Product should be created");
  assert.ok(
    prodRes.product!.sku.startsWith(`${expectedPrefix}-`),
    `SKU "${prodRes.product!.sku}" should start with ${expectedPrefix}-`,
  );
  assert.equal(
    catRes.category!.prefix,
    prodRes.product!.sku.split("-")[0],
  );

  // Rename category -> prefix otomatis ter-derive ulang, SKUs baru
  // produk di kategori ini memakai prefix baru meski nomor tetap sekven.
  const { updateCategory } = await import("@/lib/data/store");
  const renamed = await updateCategory(catRes.category!.id, "Minuman Serbuah");
  assert.equal(renamed.success, true);
  // "Minuman Serbuah" -> 2 kata -> M + S -> padEnd "MSX"
  assert.equal(renamed.category?.prefix, "MSX");
});

test("14. Settings Update Dynamically Updates Store Name, Owner, Email & Password", async () => {
  const newStore = `Warung Sukses Makmur ${Date.now()}`;
  const newOwner = "Ahmad Fadillah";
  const newEmail = "ahmad@warungku.id";
  const newPass = "rahasiaAhmad2026";

  const updated = await updateStoreSettings({
    store_name: newStore,
    owner_name: newOwner,
    email: newEmail,
    password: newPass,
  });

  assert.equal(updated.store_name, newStore);
  assert.equal(updated.owner_name, newOwner);
  assert.equal(updated.email, newEmail);
  assert.equal(updated.password, newPass);

  // Check persistent store settings retrieval
  const fetchedSettings = await getStoreSettings();
  assert.equal(fetchedSettings.store_name, newStore);
  assert.equal(fetchedSettings.owner_name, newOwner);
  assert.equal(fetchedSettings.email, newEmail);
  assert.equal(fetchedSettings.password, newPass);
});

test("15. Transaction Checkout Has No Discount Allowed", async () => {
  const products = await getProducts();
  const sample = products[0];
  assert.ok(sample);

  // Attempt checkout even if payload attempts to specify discount
  const orderRes = await processCheckout({
    items: [{ product_id: sample.id, quantity: 1 }],
    discount: 5000, // Diskon di payload
    payment_method: "cash",
    cash_received: sample.selling_price * 2,
  });

  assert.equal(orderRes.success, true);
  // Discount must be forced to 0 on transactions
  assert.equal(orderRes.discount, 0);
  assert.equal(orderRes.total, sample.selling_price);
});

