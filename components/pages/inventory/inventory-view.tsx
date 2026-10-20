"use client";

import { useState } from "react";
import {
  LuCirclePlus,
  LuCircleMinus,
  LuLayers,
  LuX,
  LuCircleAlert,
} from "react-icons/lu";
import type { Product } from "@/lib/types/pos";
import { formatDateTimeIndonesian } from "@/lib/format";
import { adjustStock } from "@/lib/data/store";
import { useProducts, useStockMovements, useCategories } from "@/lib/hooks/useRealtime";
import { useStoreSettings } from "@/lib/settings-client";
import { AppShell } from "@/components/layouts/app-shell";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";

interface InventoryViewProps {
  storeName: string;
}

export function InventoryView({ storeName }: InventoryViewProps) {
  const settings = useStoreSettings();
  const { data: productsData, loading: loadingProducts } = useProducts();
  const { data: movementsData, loading: loadingMovements } = useStockMovements();
  const { data: categoriesData } = useCategories();
  const products = productsData ?? [];
  const movements = movementsData ?? [];
  const categories = categoriesData ?? [];
  const [activeTab, setActiveTab] = useState<"inventory" | "ledger">(
    "inventory",
  );

  // Modal Penyesuaian / Restock Stok
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "reduce">("add");
  const [qtyChange, setQtyChange] = useState<string>("");
  const [reason, setReason] = useState<string>("Stok Masuk dari Distributor/Suplier");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProductId = selectedProductId;
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const getCategoryName = (prod: Product) =>
    (prod.category_id && categoryMap.get(prod.category_id)) || "Tanpa kategori";

  const lowStockCount = products.filter(
    (p) => p.stock <= p.minimum_stock,
  ).length;

  const filteredProducts = products;

  // Buka Modal untuk Stok Masuk (Restock)
  const handleOpenRestock = (prod?: Product) => {
    const target = prod;
    if (target) {
      setSelectedProductId(target.id);
    }
    setAdjustmentType("add");
    setQtyChange("");
    setReason("Stok Masuk dari Distributor/Suplier");
    setNotes("");
    setError(null);
    setIsModalOpen(true);
  };

  // Buka Modal untuk Penyesuaian / Rusak
  const handleOpenAdjust = (prod?: Product) => {
    const target = prod;
    if (target) {
      setSelectedProductId(target.id);
    }
    setAdjustmentType("reduce");
    setQtyChange("");
    setReason("Barang Rusak / Kadaluarsa");
    setNotes("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const target = products.find((p) => p.id === activeProductId);
    if (!target) {
      setError("Pilih produk yang ingin disesuaikan.");
      return;
    }

    const numQty = Number(qtyChange);
    if (!numQty || numQty <= 0) {
      setError("Jumlah kuantitas harus lebih besar dari 0.");
      return;
    }

    if (adjustmentType === "reduce" && target.stock - numQty < 0) {
      setError(
        `Pengurangan stok (${numQty} ${target.unit}) melebihi stok yang ada saat ini (${target.stock} ${target.unit}).`,
      );
      return;
    }

    setIsSubmitting(true);
    const delta = adjustmentType === "add" ? numQty : -numQty;

    let backendReason: "restock" | "adjustment" | "damage" | "loss" = "adjustment";
    if (reason.includes("Distributor") || reason.includes("Suplier") || reason.includes("Kulakan")) {
      backendReason = "restock";
    } else if (reason.includes("Rusak") || reason.includes("Kadaluarsa")) {
      backendReason = "damage";
    } else if (reason.includes("Hilang") || reason.includes("Selisih")) {
      backendReason = "loss";
    } else {
      backendReason = "adjustment";
    }

    try {
      const res = await adjustStock({
        product_id: target.id,
        quantity_change: delta,
        reason: backendReason,
        notes: notes.trim() || reason,
      });

      if (!res.success) {
        setError(res.error || "Gagal melakukan penyesuaian stok.");
        setIsSubmitting(false);
        return;
      }

      // Sync event + realtime hooks refresh products and movements automatically

      setIsModalOpen(false);
    } catch {
      setError("Terjadi kesalahan sistem saat menyimpan penyesuaian.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      pageTitle="Inventaris & Pergerakan Stok"
      breadcrumb={`${storeName || ""} / Stok`}
      lowStockCount={lowStockCount}
    >
      <div className="space-y-6">
        {/* Banner Card Atas: Inventaris & Stok Warung */}
        <div className="bg-card flex flex-col gap-4 rounded-2xl border border-border/80 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Inventaris & Stok Warung
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Kelola stok masuk dari suplier, penyesuaian barang rusak/hilang, dan audit audit pergerakan stok.
            </p>
          </div>
        </div>

        {/* Tab Navigasi Underline Style */}
        <div className="border-b border-border">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={cn(
                "relative flex items-center gap-2 pb-3.5 text-xs font-semibold transition-colors",
                activeTab === "inventory"
                  ? "border-b-2 border-primary font-bold text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>Status Stok Barang ({products.length})</span>
              {lowStockCount > 0 && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  {lowStockCount} Menipis
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className={cn(
                "relative flex items-center gap-2 pb-3.5 text-xs font-semibold transition-colors",
                activeTab === "ledger"
                  ? "border-b-2 border-primary font-bold text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>Riwayat Pergerakan Stok ({movements.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Status Stok Barang */}
        {activeTab === "inventory" && (
          <div className="bg-card overflow-hidden rounded-2xl border border-border/80 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="border-b border-border/80 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  <tr>
                    <th className="py-4 pl-6 pr-4">SKU / Nama Produk</th>
                    <th className="px-4 py-4">Kategori</th>
                    <th className="px-4 py-4">Stok Saat Ini</th>
                    <th className="px-4 py-4">Batas Minimum</th>
                    <th className="px-4 py-4 text-center">Kondisi</th>
                    <th className="py-4 pr-6 pl-4 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loadingProducts ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="mb-1 h-3 w-36 rounded bg-muted" />
                          <div className="h-2 w-24 rounded bg-muted" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-3 w-16 rounded bg-muted" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-3 w-10 rounded bg-muted" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-3 w-12 rounded bg-muted" />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="h-3 w-14 rounded bg-muted mx-auto" />
                        </td>
                        <td className="py-3.5 pr-6 pl-4 text-right">
                          <div className="ml-auto flex gap-1.5 justify-end">
                            <div className="h-5 w-16 rounded bg-muted" />
                            <div className="h-5 w-16 rounded bg-muted" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredProducts.map((p) => {
                    const isZero = p.stock <= 0;
                    const isLow = p.stock <= p.minimum_stock;

                    return (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="py-3.5 pl-6 pr-4">
                          <p className="font-bold text-foreground text-[13px]">
                            {p.name}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground uppercase">
                            {p.sku}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-muted-foreground">
                          {getCategoryName(p)}
                        </td>
                        <td className="px-4 py-3.5 text-[13px]">
                          <span
                            className={cn(
                              "font-bold",
                              isZero
                                ? "text-rose-600 dark:text-rose-400"
                                : isLow
                                  ? "text-amber-500 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {p.stock}
                          </span>{" "}
                          <span className="text-muted-foreground font-medium">
                            {p.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-muted-foreground font-medium">
                          {p.minimum_stock} {p.unit}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
                              isZero
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                                : isLow
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
                            )}
                          >
                            {isZero
                              ? "Habis"
                              : isLow
                                ? "Menipis"
                                : "Aman"}
                          </span>
                        </td>
                        <td className="py-3.5 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenRestock(p)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/30 px-2.5 py-1 text-xs font-semibold text-emerald-600 shadow-2xs transition-colors hover:bg-emerald-100/60 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                            >
                              <LuCirclePlus className="size-3.5" />
                              <span>+ Restock</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(p)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
                            >
                              <LuCircleMinus className="size-3.5 text-muted-foreground" />
                              <span>Sesuaikan</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }))}
                </tbody>
              </table>
            </div>

            {!loadingProducts && filteredProducts.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <LuLayers className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                Tidak ada produk di inventaris.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Riwayat Pergerakan Stok */}
        {activeTab === "ledger" && (
          <div className="bg-card overflow-hidden rounded-2xl border border-border/80 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-border/80 bg-muted/30 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  <tr>
                    <th className="py-4 pl-6 pr-4">Waktu</th>
                    <th className="px-4 py-4">SKU / Nama Produk</th>
                    <th className="px-4 py-4 text-center">Jenis / Alasan</th>
                    <th className="px-4 py-4 text-right">Perubahan</th>
                    <th className="px-4 py-4 text-right">Sisa Stok</th>
                    <th className="py-4 pr-6 pl-4">Petugas / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loadingMovements ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="h-3 w-24 rounded bg-muted" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="mb-1 h-3 w-28 rounded bg-muted" />
                          <div className="h-2 w-16 rounded bg-muted" />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="h-3 w-12 rounded bg-muted mx-auto" />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="h-3 w-8 rounded bg-muted ml-auto" />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="h-3 w-8 rounded bg-muted ml-auto" />
                        </td>
                        <td className="py-3.5 pr-6 pl-4">
                          <div className="h-3 w-20 rounded bg-muted mb-1" />
                          <div className="h-2 w-14 rounded bg-muted" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    movements.map((m) => {
                    const isPositive = m.quantity_change > 0;

                    return (
                      <tr
                        key={m.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="py-3.5 pl-6 pr-4 text-muted-foreground">
                          {formatDateTimeIndonesian(m.created_at)}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-foreground">
                            {m.product_name}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {m.sku}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={cn(
                              "inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase",
                              m.reason === "sale"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                                : m.reason === "restock"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : m.reason === "refund"
                                    ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
                            )}
                          >
                            {m.reason}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3.5 text-right font-bold sm:text-[13px]",
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400",
                          )}
                        >
                          {isPositive
                            ? `+${m.quantity_change}`
                            : m.quantity_change}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                          {m.balance_after}
                        </td>
                        <td className="py-3.5 pr-6 pl-4 text-muted-foreground">
                          <p className="font-medium text-foreground">
                            {m.acting_user || "-"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {m.notes || m.reference_id || "-"}
                          </p>
                        </td>
                      </tr>
                    )
                  }))}
                </tbody>
              </table>
            </div>

            {!loadingMovements && movements.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <LuLayers className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                Belum ada catatan mutasi pergerakan stok.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog: Catat Stok Masuk (Restock) / Penyesuaian Stok Barang */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-card bg-white dark:bg-slate-900 w-full max-w-[500px] rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-muted/20 text-muted-foreground">
                  <LuLayers className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {adjustmentType === "add"
                    ? "Catat Stok Masuk (Restock)"
                    : "Penyesuaian Stok Barang"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <LuX className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust}>
              <div className="space-y-4 px-6 py-5">
                <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Rincian Penyesuaian Stok
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
                    <LuCircleAlert className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Pilih Produk * */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Pilih Produk *
                  </label>
                  <CustomSelect
                    id="inventory-product"
                    value={activeProductId}
                    onChange={setSelectedProductId}
                    placeholder="Pilih Produk..."
                    searchable
                    options={products.map((p) => ({
                      value: p.id,
                      label: p.name,
                      sublabel: `Stok: ${p.stock} ${p.unit}`,
                    }))}
                  />
                </div>

                {/* Jenis Penyesuaian */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Jenis Penyesuaian
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentType("add");
                        if (
                          reason === "Barang Rusak / Kadaluarsa" ||
                          reason === "Barang Hilang / Selisih Fisik" ||
                          reason === "Pemakaian Internal / Tester"
                        ) {
                          setReason("Stok Masuk dari Distributor/Suplier");
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center rounded-xl border py-2.5 px-3 text-xs transition-all cursor-pointer",
                        adjustmentType === "add"
                          ? "border-emerald-500 bg-emerald-50/80 font-bold text-emerald-600 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "border-border/80 bg-background font-medium text-muted-foreground hover:bg-muted/40",
                      )}
                    >
                      + Tambah Stok (Masuk)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentType("reduce");
                        if (
                          reason === "Stok Masuk dari Distributor/Suplier" ||
                          reason === "Kulakan Mandiri / Pasar" ||
                          reason === "Retur Pelanggan"
                        ) {
                          setReason("Barang Rusak / Kadaluarsa");
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center rounded-xl border py-2.5 px-3 text-xs transition-all cursor-pointer",
                        adjustmentType === "reduce"
                          ? "border-rose-400 bg-rose-50/80 font-bold text-rose-600 dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                          : "border-border/80 bg-background font-medium text-muted-foreground hover:bg-muted/40",
                      )}
                    >
                      - Kurangi Stok (Keluar)
                    </button>
                  </div>
                </div>

                {/* Jumlah Kuantitas * */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Jumlah Kuantitas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Contoh: 12"
                    value={qtyChange}
                    onChange={(e) => setQtyChange(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-hidden"
                  />
                </div>

                {/* Alasan Perubahan */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Alasan Perubahan
                  </label>
                  <CustomSelect
                    id="inventory-reason"
                    value={reason}
                    onChange={setReason}
                    searchable
                    options={
                      adjustmentType === "add"
                        ? [
                            {
                              value: "Stok Masuk dari Distributor/Suplier",
                              label: "Stok Masuk dari Distributor/Suplier",
                            },
                            {
                              value: "Kulakan Mandiri / Pasar",
                              label: "Kulakan Mandiri / Pasar",
                            },
                            {
                              value: "Koreksi Hitung Fisik (Opname)",
                              label: "Koreksi Hitung Fisik (Opname)",
                            },
                            {
                              value: "Retur Pelanggan",
                              label: "Retur Pelanggan",
                            },
                          ]
                        : [
                            {
                              value: "Barang Rusak / Kadaluarsa",
                              label: "Barang Rusak / Kadaluarsa",
                            },
                            {
                              value: "Barang Hilang / Selisih Fisik",
                              label: "Barang Hilang / Selisih Fisik",
                            },
                            {
                              value: "Koreksi Hitung Fisik (Opname)",
                              label: "Koreksi Hitung Fisik (Opname)",
                            },
                            {
                              value: "Pemakaian Internal / Tester",
                              label: "Pemakaian Internal / Tester",
                            },
                          ]
                    }
                  />
                </div>

                {/* Catatan Tambahan (Opsional) */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: No faktur suplier / kondisi kemasan bocor"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Divider & Actions */}
              <div className="flex items-center justify-between border-t border-border/80 bg-card px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-border/80 bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
                >
                  Batal
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan Stok"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
