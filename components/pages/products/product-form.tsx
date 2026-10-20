"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft,
  LuSave,
  LuCircleAlert,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import type { Product, Category } from "@/lib/types/pos";
import { deleteProductAction } from "@/lib/actions/product-actions";
import { createProductAction, updateProductAction } from "@/lib/actions/product-actions";
import { AppShell } from "@/components/layouts/app-shell";
import { CustomSelect } from "@/components/ui/custom-select";
import { useStoreSettings } from "@/lib/settings-client";

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const settings = useStoreSettings();
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [unit, setUnit] = useState(product?.unit || "pcs");
  const [costPrice, setCostPrice] = useState(product?.cost_price || 0);
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price || 0);
  const [stock, setStock] = useState(product?.stock || 0);
  const [minimumStock, setMinimumStock] = useState(product?.minimum_stock || 5);
  const [isActive, setIsActive] = useState(product ? product.is_active : true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        router.push("/produk");
      } else {
        setError(res.error || "Gagal menghapus produk.");
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("Terjadi kesalahan saat menghapus produk.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Profit margin calculation
  const marginRp = sellingPrice - costPrice;
  const marginPercent =
    costPrice > 0 ? Math.round((marginRp / costPrice) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // SKU optional; if empty backend auto-generates
    if (!name.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (costPrice < 0 || sellingPrice < 0) {
      setError("Harga modal dan harga jual tidak boleh bernilai negatif.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && product) {
        const res = await updateProductAction(product.id, {
          name: name.trim(),
          category_id: categoryId || null,
          unit: unit.trim(),
          cost_price: costPrice,
          selling_price: sellingPrice,
          stock,
          minimum_stock: minimumStock,
          is_active: isActive,
        });

        if (!res.success) {
          setError(res.error || "Gagal memperbarui produk.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createProductAction({
          name: name.trim(),
          category_id: categoryId || null,
          unit: unit.trim(),
          cost_price: costPrice,
          selling_price: sellingPrice,
          stock,
          minimum_stock: minimumStock,
        });

        if (!res.success) {
          setError(res.error || "Gagal membuat produk.");
          setIsSubmitting(false);
          return;
        }
      }

      router.push("/produk");
    } catch {
      setError("Terjadi kesalahan sistem saat menyimpan produk.");
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      pageTitle={isEditing ? "Edit Produk" : "Tambah Produk Baru"}
      breadcrumb={`${settings.store_name || ""} / Produk / ${isEditing ? "Edit" : "Tambah"}`}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/produk"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <LuArrowLeft className="size-4" />
            <span>Kembali ke Daftar Produk</span>
          </Link>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <LuCircleAlert className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  SKU / Kode Barcode
                </label>
                <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Dibuat otomatis berdasarkan kategori saat produk disimpan.
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Kategori Produk
                </label>
                <CustomSelect
                  id="product-category"
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Pilih Kategori..."
                  options={[
                    { value: "", label: "Pilih Kategori..." },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Nama Produk Lengkap *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Beras Ramos Super 5kg"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Satuan *
                </label>
                <CustomSelect
                  id="product-unit"
                  value={unit}
                  onChange={setUnit}
                  options={[
                    { value: "pcs", label: "pcs" },
                    { value: "kg", label: "kg" },
                    { value: "botol", label: "botol" },
                    { value: "pack", label: "pack" },
                    { value: "pouch", label: "pouch" },
                    { value: "sachet", label: "sachet" },
                    { value: "karung", label: "karung" },
                    { value: "bungkus", label: "bungkus" },
                    { value: "dus", label: "dus" },
                  ]}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Harga Modal (Beli) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={costPrice || ""}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Harga Jual *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={sellingPrice || ""}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Margin Preview Banner */}
            <div className="flex items-center justify-between rounded-lg bg-muted/60 p-3 text-xs">
              <span className="text-muted-foreground">
                Estimasi Keuntungan:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                +Rp{" "}
                {new Intl.NumberFormat("id-ID").format(Math.max(0, marginRp))} (
                {marginPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {isEditing ? "Stok Saat Ini" : "Stok Awal"} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Ambang Batas Minimum Stok *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
                <label
                  htmlFor="isActive"
                  className="cursor-pointer text-xs font-medium text-foreground"
                >
                  Produk aktif dan dapat dijual di kasir
                </label>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-destructive/40 bg-transparent px-5 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 sm:w-auto"
                >
                  <LuTrash2 className="size-4" />
                  <span>Hapus Produk</span>
                </button>
              ) : (
                <div />
              )}

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
                <Link
                  href="/produk"
                  className="w-full rounded-full border border-border bg-card px-5 py-2.5 text-center text-xs font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto sm:px-6"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto sm:px-6"
                >
                  <LuSave className="size-4" />
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan Produk"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && product && (
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
                onClick={() => setShowDeleteConfirm(false)}
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
                <strong className="text-foreground">{product.name}</strong> ({product.sku})?
              </p>

              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
                <p className="font-semibold">Peringatan Penghapusan Stok:</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Stok saat ini sebanyak{" "}
                  <strong>
                    {product.stock} {product.unit}
                  </strong>{" "}
                  akan otomatis hilang dan terhapus dari sistem inventaris warung.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/80 bg-card px-6 py-4">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="cursor-pointer rounded-xl border border-border/80 bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
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
