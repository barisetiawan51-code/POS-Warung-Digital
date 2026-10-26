"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LuArrowLeft,
  LuSave,
  LuCircleAlert,
  LuTrash2,
  LuX,
  LuImagePlus,
} from "react-icons/lu";
import type { Product, Category, ProductImage } from "@/lib/types/pos";
import { deleteProductAction } from "@/lib/actions/product-actions";
import { createProductAction, updateProductAction } from "@/lib/actions/product-actions";
import { fetchProductImagesSupabase, uploadProductImageSupabase, deleteProductImageSupabase } from "@/lib/data/supabase-service";
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
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!product) return;
    void fetchProductImagesSupabase(product.id)
      .then(setImages)
      .catch(() => setError("Gambar produk gagal dimuat."));
  }, [product]);

  useEffect(() => {
    if (!pendingImage) {
      setPendingImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingImage);
    setPendingImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImage]);

  const handleImageUpload = async (file: File) => {
    if (!product) {
      setPendingImage(file);
      setError(null);
      return;
    }
    if (images.length > 0) {
      setError("Produk hanya dapat memiliki 1 gambar.");
      return;
    }
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      setError("Format gambar hanya boleh JPG atau PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }

    setIsUploadingImage(true);
    setError(null);
    try {
      const image = await uploadProductImageSupabase(product.id, file);
      setImages((current) => [...current.map((item) => ({ ...item, is_primary: false })), image]);
    } catch (uploadError: unknown) {
      const errorData = uploadError as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };
      const message = [errorData.message, errorData.details, errorData.hint, errorData.code ? `kode ${errorData.code}` : ""]
        .filter(Boolean)
        .join(" — ") || "Kesalahan tidak diketahui.";
      setError(`Gagal mengunggah gambar: ${message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageDelete = async (image: ProductImage) => {
    try {
      await deleteProductImageSupabase(image);
      setImages((current) => current.filter((item) => item.id !== image.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus gambar.");
    }
  };
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
        if (pendingImage && res.product) {
          await uploadProductImageSupabase(res.product.id, pendingImage);
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

            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Gambar Produk</label>
                {images.length === 0 && <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                  <LuImagePlus className="size-4" />
                  {isUploadingImage ? "Mengunggah..." : pendingImage ? "Gambar Dipilih" : "Unggah Gambar"}
                  <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="sr-only" disabled={isUploadingImage} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImageUpload(file); e.currentTarget.value = ""; }} />
                </label>}
              </div>
              {images.length > 0 ? <div>
                <div className="grid grid-cols-3 gap-3">{images.map((image) => <div key={image.id} className="bg-primary-foreground relative aspect-square overflow-hidden rounded-md border border-border"><Image src={image.public_url || "/placeholder.svg"} alt={image.alt_text || name} fill sizes="120px" loading="eager" className="object-cover" /><button type="button" onClick={() => void handleImageDelete(image)} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white" aria-label="Hapus gambar"><LuX className="size-3" /></button></div>)}</div>
                <p className="mt-2 text-[11px] text-muted-foreground">Maksimal 1 gambar, ukuran maksimal 5 MB</p>
              </div> : pendingImageUrl ? <div>
                <div className="relative size-32 bg-primary-foreground overflow-hidden rounded-md border border-border"><Image src={pendingImageUrl} alt={pendingImage?.name || name} fill sizes="128px" loading="eager" className="object-cover p-2.5" /><button type="button" onClick={() => setPendingImage(null)} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white" aria-label="Hapus gambar pilihan"><LuX className="size-3" /></button></div>
                <p className="mt-2 text-[11px] text-muted-foreground">Maksimal 1 gambar, ukuran maksimal 5 MB</p>
              </div> : <div>
                <p className="text-xs text-muted-foreground">Belum ada gambar produk.</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Maksimal 1 gambar, ukuran maksimal 5 MB</p>
              </div>}
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
                  type="text"
                  inputMode="numeric"
                  required
                  pattern="[0-9]*"
                  value={stock}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
                    setStock(value === "" ? 0 : Number(value));
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Ambang Batas Minimum Stok *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  pattern="[0-9]*"
                  value={minimumStock}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
                    setMinimumStock(value === "" ? 0 : Number(value));
                  }}
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
