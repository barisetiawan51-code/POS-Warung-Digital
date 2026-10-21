"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LuPlus,
  LuSearch,
  LuPackage,
  LuPenLine,
  LuX,
  LuTriangleAlert,
  LuTrash2,
  LuCircleAlert,
  LuCircleCheck,
} from "react-icons/lu";
import type { Product } from "@/lib/types/pos";
import { useProducts, useCategories, useStoreSettings } from "@/lib/hooks/useRealtime";
import { formatRupiah } from "@/lib/format";
import { deleteProductAction } from "@/lib/actions/product-actions";
import { AppShell } from "@/components/layouts/app-shell";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";

export function ProductList() {
  const { data: productsData, loading: loadingProducts } = useProducts();
  const { data: categoriesData } = useCategories();
  const products = productsData ?? [];
  const categories = categoriesData ?? [];
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const filtered = products.filter((p) => {
    const matchCat =
      categoryFilter === "all" || p.category_id === categoryFilter;
    const q = search.toLowerCase().trim();
    const matchQ =
      !q ||
      (p.name ?? "").toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await deleteProductAction(deletingProduct.id);
      if (res.success) {
        // Sync event refreshes UI automatically
        setFeedback({
          type: "success",
          message: `Produk "${deletingProduct.name}" berhasil dihapus. Stok sebanyak ${deletingProduct.stock} ${deletingProduct.unit} telah dihilangkan dari inventaris.`,
        });
        setDeletingProduct(null);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menghapus produk.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan saat menghapus produk.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: liveSettings } = useStoreSettings();
  const storeName = liveSettings?.store_name || "";

  return (
    <AppShell
      pageTitle="Manajemen Produk"
      breadcrumb={`${storeName} / Produk`}
      lowStockCount={products.filter((p) => p.stock <= p.minimum_stock).length}
    >
      <div className="space-y-5">
        {feedback && (
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border p-3 text-xs",
              feedback.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-destructive/20 bg-destructive/10 text-destructive",
            )}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <LuCircleCheck className="size-4 shrink-0" />
              ) : (
                <LuCircleAlert className="size-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <LuX className="size-3.5" />
            </button>
          </div>
        )}

        {/* Header Actions & Filters */}
        <div className="bg-card flex flex-col gap-4 rounded-xl border border-border p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative max-w-sm flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <LuSearch className="size-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau SKU..."
                className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            {/* Category Filter */}
            <CustomSelect
              id="category-filter"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "Semua Kategori" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <Link
            href="/produk/tambah"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary/90"
          >
            <LuPlus className="size-4" />
            <span>Tambah Produk</span>
          </Link>
        </div>

        {/* Product Table */}
        <div className="bg-card overflow-hidden rounded-xl border border-border shadow-xs">
          <div className="scrollbar-thin max-h-[calc(100vh-18rem)] overflow-auto md:max-h-[calc(100vh-16rem)]">
            <table className="w-full text-left text-xs">
              <thead className="whitespace-nowrap border-b border-border bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3.5">SKU</th>
                  <th className="px-4 py-3.5">Nama Produk</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Satuan</th>
                  <th className="px-4 py-3.5 text-right">Harga Modal</th>
                  <th className="px-4 py-3.5 text-right">Harga Jual</th>
                  <th className="px-4 py-3.5 text-right">Stok</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loadingProducts ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-3 w-16 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-40 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-20 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-12 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-20 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-20 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-12 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-14 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-3 w-14 rounded bg-muted" />
                      </td>
                    </tr>
                  ))
                ) : (
                  filtered.map((prod) => {
                    const isLow = prod.stock <= prod.minimum_stock;
                    const isZero = prod.stock <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className={cn(
                        "transition-colors hover:bg-muted/30",
                        !prod.is_active && "bg-muted/10 opacity-60",
                      )}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-foreground">
                        {prod.sku}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {prod.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {prod.category_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {prod.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatRupiah(prod.cost_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {formatRupiah(prod.selling_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs",
                            isZero
                              ? "bg-destructive/15 font-bold text-destructive"
                              : isLow
                                ? "bg-amber-500/15 font-bold text-amber-600 dark:text-amber-400"
                                : "text-foreground",
                          )}
                        >
                          {isLow && <LuTriangleAlert className="size-3" />}
                          {prod.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            prod.is_active
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {prod.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/produk/${prod.id}`}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Edit Produk"
                          >
                            <LuPenLine className="size-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(prod)}
                            className="rounded p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus Produk & Stok"
                          >
                            <LuTrash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                  }))}
              </tbody>
            </table>
          </div>

          {!loadingProducts && filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <LuPackage className="mx-auto mb-2 size-8 text-muted-foreground/40" />
              Tidak ada produk yang sesuai dengan kriteria filter.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-card bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
                  <LuTrash2 className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Konfirmasi Hapus Produk
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="cursor-pointer text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <LuX className="size-4.5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Perhatian Penghapusan
              </div>

              <p className="text-xs text-muted-foreground">
                Apakah Anda yakin ingin menghapus produk{" "}
                <strong className="text-foreground">
                  {deletingProduct.name}
                </strong>{" "}
                ({deletingProduct.sku})?
              </p>

              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
                <p className="font-semibold">Peringatan Penghapusan Stok:</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Stok saat ini sebanyak{" "}
                  <strong>
                    {deletingProduct.stock} {deletingProduct.unit}
                  </strong>{" "}
                  akan otomatis hilang dan terhapus dari inventaris warung.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/80 bg-card px-6 py-4">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProduct(null)}
                className="cursor-pointer rounded-xl border border-border/80 bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                <LuTrash2 className="size-3.5" />
                <span>{isDeleting ? "Menghapus..." : "Ya, Hapus Produk"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
