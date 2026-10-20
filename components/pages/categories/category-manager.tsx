"use client";

import { useState } from "react";
import {
  LuPlus,
  LuSearch,
  LuTags,
  LuPenLine,
  LuSave,
  LuX,
  LuCircleAlert,
  LuTrash2,
  LuCircleCheck,
} from "react-icons/lu";
import type { Category } from "@/lib/types/pos";
import { useCategories, useStoreSettings } from "@/lib/hooks/useRealtime";
import { createCategory, updateCategory, deleteCategory } from "@/lib/data/store";
import { dispatchSyncEvent } from "@/lib/data/supabase-service";
import { AppShell } from "@/components/layouts/app-shell";
import { cn } from "@/lib/utils";

export function CategoryManager() {
  // Realtime sync via hook (cross-tab + Supabase channel)
  const { data: catData, loading, refresh } = useCategories();
  const { data: liveSettings } = useStoreSettings();
  const storeName = liveSettings?.store_name || "Warung";
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const categories = [
    ...localCategories,
    ...(catData ?? []).filter(
      (category) => !localCategories.some((local) => local.id === category.id),
    ),
  ];

  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPrefix, setNewCatPrefix] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPrefix, setEditingPrefix] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = await createCategory(newCatName, newCatPrefix);
    if (!res.success) {
      setFeedback({
        type: "error",
        message: res.error || "Gagal membuat kategori.",
      });
      return;
    }

    const createdCategory = res.category;
    if (createdCategory) {
      setLocalCategories((current) =>
        current.some((category) => category.id === createdCategory.id)
          ? current
          : [...current, createdCategory],
      );
    }
    await refresh();
    setNewCatName("");
    setNewCatPrefix("");
    setIsAdding(false);
    setFeedback({
      type: "success",
      message: `Kategori "${res.category?.name ?? newCatName}" berhasil ditambahkan.`,
    });
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingPrefix(cat.prefix || "");
    setFeedback(null);
  };

  const handleSaveEdit = async (id: string) => {
    setFeedback(null);
    const res = await updateCategory(id, editingName, editingPrefix);
    if (!res.success) {
      setFeedback({
        type: "error",
        message: res.error || "Gagal menyimpan perubahan.",
      });
      return;
    }

    dispatchSyncEvent("categories");
    setEditingId(null);
    setEditingPrefix("");
    setFeedback({
      type: "success",
      message: "Nama kategori berhasil diperbarui. Prefix SKU diperbarui otomatis.",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await deleteCategory(deletingCategory.id);
      if (res.success) {
        // Sync event refreshes UI automatically
        setFeedback({
          type: "success",
          message: `Kategori "${deletingCategory.name}" berhasil dihapus. Produk terkait kini berstatus tanpa kategori.`,
        });
        setDeletingCategory(null);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menghapus kategori.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan saat menghapus kategori.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell pageTitle="Manajemen Kategori" breadcrumb={`${storeName} / Kategori`}>
      <div className="mx-auto max-w-4xl space-y-6">
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

        {/* Controls Bar */}
        <div className="bg-card flex flex-col gap-3 rounded-xl border border-border p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
              <LuSearch className="size-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori..."
              className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-xs text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setFeedback(null);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary/90"
          >
            <LuPlus className="size-4" />
            <span>Kategori Baru</span>
          </button>
        </div>

        {/* Add Category Modal */}
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="bg-card bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-muted/20 text-muted-foreground">
                    <LuTags className="size-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Tambah Kategori Baru
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="cursor-pointer text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  <LuX className="size-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="space-y-4 px-6 py-5">
                  <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Detail Kategori
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Nama Kategori *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Contoh: Bumbu Dapur, Perlengkapan Bayi..."
                      className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-hidden"
                    />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Kategori memudahkan filter produk di kasir dan laporan inventaris.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Prefix SKU (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newCatPrefix}
                      onChange={(e) => setNewCatPrefix(e.target.value.toUpperCase())}
                      placeholder="Contoh: BMD, PBL, MIE"
                      maxLength={6}
                      className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-hidden uppercase tracking-wider"
                    />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Kode awal untuk SKU produk otomatis. Kosongkan untuk otomatis dari nama kategori.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/80 bg-card px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="cursor-pointer rounded-xl border border-border/80 bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                  >
                    Simpan Kategori
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Categories Table */}
        <div className="bg-card  overflow-hidden rounded-xl border border-border shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3.5">Nama Kategori</th>
                <th className="px-4 py-3.5 text-center">Jumlah Produk</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-3.5 w-40 rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="h-3.5 w-16 rounded bg-muted mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="h-3.5 w-20 rounded bg-muted mx-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {editingId === cat.id ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="rounded border border-primary bg-background px-2 py-1 text-xs text-foreground focus:outline-hidden"
                            />
                            <input
                              type="text"
                              value={editingPrefix}
                              onChange={(e) => setEditingPrefix(e.target.value.toUpperCase())}
                              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-hidden uppercase tracking-wider"
                              maxLength={6}
                              placeholder="Prefix"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(cat.id)}
                              className="rounded p-1 text-emerald-600 hover:bg-muted"
                            >
                              <LuSave className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted"
                            >
                              <LuX className="size-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{cat.name}</span>
                          {cat.prefix && (
                            <span className="text-xs text-muted-foreground">
                              ({cat.prefix})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-foreground">
                        {cat.product_count || 0} produk
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId !== cat.id && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Ubah Nama Kategori"
                          >
                            <LuPenLine className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(cat)}
                            className="rounded p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus Kategori"
                          >
                            <LuTrash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <LuTags className="mx-auto mb-2 size-8 text-muted-foreground/40" />
              Belum ada kategori yang cocok.
            </div>
          )}
        </div>
      </div>

      {/* Delete Category Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-card bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
                  <LuTrash2 className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Konfirmasi Hapus Kategori
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
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
                Apakah Anda yakin ingin menghapus kategori{" "}
                <strong className="text-foreground">
                  {deletingCategory.name}
                </strong>
                ?
              </p>

              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Informasi Produk Terkait:</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Produk yang berada di kategori ini ({deletingCategory.product_count || 0} produk) tidak akan ikut terhapus, melainkan dialihkan menjadi <em>Tanpa Kategori</em>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/80 bg-card px-6 py-4">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCategory(null)}
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
                <span>
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Kategori"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
