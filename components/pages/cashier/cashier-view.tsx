"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  LuSearch,
  LuPlus,
  LuMinus,
  LuTrash2,
  LuShoppingCart,
  LuStore,
  LuPrinter,
  LuCircleCheck,
  LuX,
  LuBanknote,
  LuCreditCard,
  LuQrCode,
  LuCopy,
  LuCheck,
  LuImageOff,
} from "react-icons/lu";
import type {
  Product,
  CartItem,
  PaymentMethod,
} from "@/lib/types/pos";
import { formatRupiah, formatDateTimeIndonesian } from "@/lib/format";
import { calculateCartTotals, calculateCashChange } from "@/lib/math";
import { processCheckout } from "@/lib/data/store";
import type { StoreSettings } from "@/lib/types/pos";
import { useProducts, useCategories, useStoreSettings } from "@/lib/hooks/useRealtime";
import { AppShell } from "@/components/layouts/app-shell";
import { cn } from "@/lib/utils";

const EMPTY_PRODUCTS: Product[] = [];

export function CashierView() {
  const { data: liveSettings } = useStoreSettings();
  const settings: Partial<StoreSettings> = liveSettings ?? {};
  const { data: productsData, loading: loadingProducts } = useProducts({
    activeOnly: true,
  });
  const { data: categoriesData } = useCategories();
  const products = productsData ?? EMPTY_PRODUCTS;
  const categories = categoriesData ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (loadingProducts) return;

    setCart((currentCart) =>
      currentCart
        .map((item) => {
          const latestProduct = products.find((product) => product.id === item.product.id);
          return latestProduct ? { ...item, product: latestProduct } : null;
        })
        .filter((item): item is CartItem => item !== null),
    );
  }, [loadingProducts, products]);

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Receipt Modal states
  interface CompletedReceipt {
    invoiceNumber: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    cashReceived: number;
    cashChange: number;
    timestamp: string;
  }
  const [receipt, setReceipt] = useState<CompletedReceipt | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "all" || p.category_id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations (diskon ditiadakan)
  const totals = useMemo(() => {
    return calculateCartTotals(cart, 0);
  }, [cart]);

  // Cash change calculation
  const cashCheck = useMemo(() => {
    return calculateCashChange(totals.total, cashReceived);
  }, [totals.total, cashReceived]);

  // Cart Operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          return prev; // cannot exceed available stock
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item; // capped at stock
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived(0);
  };

  // Open checkout dialog
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashReceived(totals.total); // default exact amount
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  // Process transaction
  const handleConfirmCheckout = async () => {
    setCheckoutError(null);

    const invalidCartItems = cart.filter(
      (item) => !products.some((product) => product.id === item.product.id),
    );
    if (invalidCartItems.length > 0) {
      setCart((currentCart) =>
        currentCart.filter(
          (item) => !invalidCartItems.some((invalid) => invalid.product.id === item.product.id),
        ),
      );
      setIsCheckoutOpen(false);
      setCheckoutError("Ada produk yang sudah tidak aktif. Keranjang telah diperbarui, silakan pilih produk kembali.");
      return;
    }

    if (paymentMethod === "cash" && !cashCheck.isSufficient) {
      setCheckoutError(
        `Uang tunai kurang Rp ${new Intl.NumberFormat("id-ID").format(
          cashCheck.deficit,
        )}`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await processCheckout({
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        discount: 0,
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? cashReceived : undefined,
        notes: orderNotes || undefined,
        idempotency_key: `pos-${Date.now()}`,
      });

      if (!res.success) {
        setCheckoutError(res.message || "Gagal memproses transaksi.");
        setIsSubmitting(false);
        return;
      }

      // Sync event + realtime hook refreshes stock automatically

      // Save receipt data
      setReceipt({
        invoiceNumber: res.invoice_number,
        items: [...cart],
        subtotal: res.subtotal,
        discount: res.discount,
        total: res.total,
        paymentMethod,
        cashReceived: paymentMethod === "cash" ? cashReceived : res.total,
        cashChange: res.cash_change,
        timestamp: new Date().toISOString(),
      });

      // Reset cart and modal
      setIsCheckoutOpen(false);
      clearCart();
    } catch {
      setCheckoutError("Terjadi kesalahan sistem saat menyimpan transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      pageTitle="Kasir (Point of Sale)"
      breadcrumb={`${settings.store_name || ""} / Kasir`}
      lowStockCount={products.filter((p) => p.stock <= p.minimum_stock).length}
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
        {/* Left Column: Catalog & Search (7 cols on XL) */}
        <div className="space-y-3 sm:space-y-4 xl:col-span-7">
          {/* Search bar & Category filter */}
          <div className="bg-card space-y-2.5 rounded-xl border border-border p-3 sm:space-y-3 sm:p-4 shadow-xs">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <LuSearch className="size-4.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk..."
                className="w-full rounded-lg border border-border bg-background py-2.5 pr-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-linear-to-l from-card to-transparent" />
              <div className="scrollbar-thin flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 pr-8 text-xs">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "shrink-0 snap-start rounded-lg px-3.5 py-2.5 font-medium transition-colors",
                    selectedCategory === "all"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  Semua Kategori <span className="ml-1 opacity-75">({products.length})</span>
                </button>
                {categories.map((cat) => {
                  const productCount = products.filter((product) => product.category_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "shrink-0 snap-start rounded-lg border px-3.5 py-2.5 font-medium transition-colors",
                        selectedCategory === cat.id
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                    >
                      {cat.name} <span className="ml-1 opacity-75">({productCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-3">
            {filteredProducts.map((prod) => {
              const isOutOfStock = prod.stock <= 0;
              const isLow = prod.stock <= prod.minimum_stock && !isOutOfStock;

              return (
                <div
                  key={prod.id}
                  className={cn(
                    "bg-card flex flex-col justify-between rounded-xl border border-border p-2.5 transition-shadow hover:shadow-sm sm:p-3.5",
                    isOutOfStock && "opacity-60",
                  )}
                >
                  <div>
                    <div className="relative mb-3 aspect-4/3 overflow-hidden rounded-lg bg-primary-foreground dark:bg-muted">
                      {prod.images?.[0]?.public_url ? <Image src={prod.images[0].public_url} alt={prod.name} fill sizes="(max-width: 640px) 45vw, 220px" loading="eager" className="object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><LuImageOff className="size-8" aria-label="Tidak ada gambar produk" /></div>}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{prod.sku}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          isOutOfStock
                            ? "bg-destructive/15 text-destructive"
                            : isLow
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isOutOfStock ? "Habis" : `Stok: ${prod.stock}`}
                      </span>
                    </div>

                    <h4 className="mt-1.5 line-clamp-2 text-[11px] leading-tight font-bold text-foreground sm:mt-2 sm:text-xs">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 sm:mt-3">
                    <span className="text-xs font-bold text-primary">
                      {formatRupiah(prod.selling_price)}
                    </span>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(prod)}
                      className="flex size-7 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 sm:size-7.5"
                      title={
                        isOutOfStock ? "Stok habis" : "Tambah ke keranjang"
                      }
                    >
                      <LuPlus className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!loadingProducts && filteredProducts.length === 0 && (
            <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Tidak ada produk yang cocok dengan pencarian atau kategori ini.
            </div>
          )}
        </div>

        {/* Right Column: Sticky Cart & Payment Summary (5 cols on XL) */}
        <div className="space-y-4 xl:col-span-5">
          <div className="bg-card sticky top-20 flex min-h-130 flex-col justify-between rounded-xl border border-border p-5 shadow-xs">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <LuShoppingCart className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Keranjang Belanja
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {totals.itemCount} barang dipilih
                    </p>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-destructive hover:underline"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="mt-3.5 max-h-75 space-y-2.5 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-semibold text-foreground">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {formatRupiah(item.product.selling_price)} /{" "}
                        {item.product.unit}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="bg-card flex size-6 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground"
                      >
                        <LuMinus className="size-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="bg-card flex size-6 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
                      >
                        <LuPlus className="size-3" />
                      </button>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-1 p-1 text-muted-foreground hover:text-destructive"
                      >
                        <LuTrash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    <LuStore className="mx-auto mb-2 size-8 text-muted-foreground" />
                    Keranjang masih kosong. Klik tombol (+) pada produk untuk
                    menambahkan.
                  </div>
                )}
              </div>
            </div>

            {/* Cart Summary & Checkout Action */}
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal ({totals.itemCount} item)</span>
                <span>{formatRupiah(totals.subtotal)}</span>
              </div>

              <div className="flex items-baseline justify-between border-t border-border/80 pt-2 text-base font-bold text-foreground">
                <span>Total Tagihan</span>
                <span className="text-xl font-extrabold text-primary">
                  {formatRupiah(totals.total)}
                </span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleOpenCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LuBanknote className="size-4.5" />
                <span>Bayar Transaksi ({formatRupiah(totals.total)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-card bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-muted/20 text-muted-foreground">
                  <LuCreditCard className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Proses Pembayaran Kasir
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="cursor-pointer text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <LuX className="size-4.5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5 max-h-[75vh] overflow-y-auto">
              <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Rincian Tagihan & Metode Bayar
              </div>

              {checkoutError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
                  {checkoutError}
                </div>
              )}

            {/* Total to pay display */}
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-center">
              <span className="text-xs font-semibold text-muted-foreground">
                Total Tagihan Belanja
              </span>
              <div className="mt-0.5 text-2xl font-extrabold text-primary">
                {formatRupiah(totals.total)}
              </div>
            </div>

            {/* Payment Method Selector - Tunai Utama & QRIS Barcode */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-foreground">
                Pilih Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all",
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="absolute -top-2 right-2 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Utama
                  </span>
                  <LuBanknote className="size-5" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all",
                    paymentMethod === "online"
                      ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Scan Gambar
                  </span>
                  <LuQrCode className="size-5" />
                  <span>Scan QRIS</span>
                </button>
              </div>

              {/* Optional Transfer Bank Option */}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium transition-colors",
                    paymentMethod === "transfer"
                      ? "font-bold text-primary underline"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LuCreditCard className="size-3" />
                  <span>Atau gunakan Transfer Bank BCA</span>
                </button>
              </div>
            </div>

            {/* Method Details - TUNAI */}
            {paymentMethod === "cash" && (
              <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground">
                    Uang Diterima dari Pembeli:
                  </label>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Tagihan: {formatRupiah(totals.total)}
                  </span>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashReceived || ""}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    placeholder="0"
                    autoFocus
                    className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-9 text-base font-extrabold text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                {/* Quick denomination chips */}
                <div>
                  <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">
                    Pecahan Uang Cepat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashReceived(totals.total)}
                      className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20"
                    >
                      Uang Pas ({formatRupiah(totals.total)})
                    </button>
                    {[10000, 20000, 50000, 100000, 200000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => setCashReceived(denom)}
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {formatRupiah(denom)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change or deficit readout */}
                <div
                  className={cn(
                    "rounded-lg p-3 text-xs transition-colors",
                    cashCheck.isSufficient
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                >
                  {cashCheck.isSufficient ? (
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-xs">
                        <LuCircleCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        Kembalian Tunai:
                      </span>
                      <span className="text-base font-extrabold">
                        {formatRupiah(cashCheck.change)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between font-bold">
                      <span>Uang Tunai Kurang:</span>
                      <span className="text-base font-extrabold">
                        {formatRupiah(cashCheck.deficit)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Method Details - QRIS SCAN BARCODE (GAMBAR) */}
            {paymentMethod === "online" && (
              <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
                <div className="rounded-lg bg-background p-2.5 shadow-xs">
                  <div className="mx-auto flex w-full max-w-52.5 flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-2">
                    <Image
                      src={settings.qris_image_url || "/images/qris-warung.svg"}
                      alt={`Barcode QRIS ${settings.store_name || "Warung"}`}
                      width={200}
                      height={240}
                      loading="eager"
                      unoptimized={Boolean(settings.qris_image_url?.startsWith("data:"))}
                      className="h-auto w-full object-contain"
                      priority
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-bold text-foreground">
                      {settings.store_name || "Warung"}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      NMID: {settings.qris_nmid || "ID1020261017001"}
                    </p>
                    <div className="mt-1.5 rounded-md bg-primary/10 py-1 text-center font-bold text-primary">
                      <span className="text-[11px]">Total Tagihan: </span>
                      <span className="text-sm font-extrabold">
                        {formatRupiah(totals.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-background/80 p-2.5 text-left text-[11px] text-muted-foreground">
                  <p className="font-bold text-foreground">
                    Petunjuk Scan QRIS:
                  </p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px]">
                    <li>
                      Tunjukkan barcode di atas untuk dipindai oleh pembeli.
                    </li>
                    <li>
                      Pembeli dapat memindai dengan aplikasi apa saja (BCA,
                      Mandiri, BRI, GoPay, OVO, Dana, ShopeePay, dll).
                    </li>
                    <li>
                      Setelah pembeli memperlihatkan layar konfirmasi berhasil,
                      klik tombol di bawah.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Method Details - TRANSFER BANK (OPSIONAL) */}
            {paymentMethod === "transfer" && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3.5 text-xs">
                <p className="font-semibold text-foreground">
                  Rekening Transfer Warung:
                </p>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5">
                  <div>
                    <span className="block text-[11px] text-muted-foreground">
                      Bank {settings.bank_name || "BCA"}
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {settings.bank_account_number || "7820192834"}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      a/n {settings.bank_account_holder || settings.owner_name || "Pemilik toko"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(settings.bank_account_number || "7820192834");
                      setCopiedBank(true);
                      setTimeout(() => setCopiedBank(false), 2000);
                    }}
                    className="flex items-center gap-1 rounded border border-border bg-muted px-2.5 py-1 text-xs font-medium hover:bg-muted/80"
                  >
                    {copiedBank ? (
                      <LuCheck className="size-3.5 text-emerald-500" />
                    ) : (
                      <LuCopy className="size-3.5" />
                    )}
                    <span>{copiedBank ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Catatan Transaksi (Opsional)
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Contoh: Titip di kasir, pelanggan Bu Tini..."
                className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-hidden"
              />
            </div>
          </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/80 bg-card px-6 py-4">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="cursor-pointer rounded-xl border border-border/80 bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  isSubmitting ||
                  (paymentMethod === "cash" && !cashCheck.isSufficient)
                }
                onClick={handleConfirmCheckout}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Memproses...</span>
                ) : (
                  <span>
                    {paymentMethod === "online"
                      ? "Konfirmasi QRIS & Cetak Struk"
                      : "Selesaikan & Cetak Struk"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-card bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <LuCircleCheck className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Transaksi Berhasil
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="cursor-pointer text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <LuX className="size-4.5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Nomor Struk: <strong className="text-foreground">{receipt.invoiceNumber}</strong>
                </p>
              </div>

              {/* Printable Receipt Paper */}
              <div
                id="printable-receipt"
                className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 font-mono text-xs"
              >
                <div className="border-b border-dashed border-border/80 pb-2 text-center">
                  <p className="text-sm font-bold">
                    {(settings.store_name || "WARUNG BAROKAH REZEKI").toUpperCase()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Kasir: {settings.owner_name || "Kasir"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDateTimeIndonesian(receipt.timestamp)}
                  </p>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-border/80 pb-2">
                  {receipt.items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between text-[11px]"
                    >
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity} x{" "}
                          {formatRupiah(item.product.selling_price)}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatRupiah(item.quantity * item.product.selling_price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between border-t border-border/80 pt-1 text-xs font-bold">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(receipt.total)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[10px] text-muted-foreground">
                    <span>Metode:</span>
                    <span className="uppercase">{receipt.paymentMethod}</span>
                  </div>
                  {receipt.paymentMethod === "cash" && (
                    <>
                      <div className="flex justify-between text-[10px]">
                        <span>Tunai Diterima:</span>
                        <span>{formatRupiah(receipt.cashReceived)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Kembalian:</span>
                        <span>{formatRupiah(receipt.cashChange)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-dashed border-border/80 pt-2 text-center text-[10px] text-muted-foreground">
                  Terima kasih atas kunjungan Anda!
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/80 bg-card px-6 py-4">
              <button
                type="button"
                onClick={handlePrint}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
              >
                <LuPrinter className="size-3.5" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
