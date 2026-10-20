"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LuArrowLeft,
  LuPrinter,
  LuRotateCcw,
  LuCircleCheck,
  LuCircleAlert,
  LuClock,
  LuX,
} from "react-icons/lu";
import type { Order } from "@/lib/types/pos";
import { formatRupiah, formatDateTimeIndonesian } from "@/lib/format";
import { refundOrder, verifyPayment } from "@/lib/data/store";
import { AppShell } from "@/components/layouts/app-shell";
import { useStoreSettings } from "@/lib/hooks/useRealtime";
import { cn } from "@/lib/utils";

interface TransactionDetailProps {
  order: Order;
}

export function TransactionDetail({
  order: initialOrder,
}: TransactionDetailProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState(
    "Pelanggan membatalkan pembelian",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPaid = order.payment?.payment_status === "paid";
  const isPending = order.payment?.payment_status === "pending";
  const isCancelled = order.transaction_status === "cancelled";
  const isRefunded = order.transaction_status === "refunded";

  const handlePrint = () => {
    window.print();
  };

  const handleVerify = async () => {
    setIsSubmitting(true);
    const res = await verifyPayment(order.id);
    if (res.success) {
      setOrder((prev) => ({
        ...prev,
        transaction_status: "completed",
        payment: prev.payment
          ? { ...prev.payment, payment_status: "paid" }
          : null,
      }));
      setMessage(res.message);
    } else {
      setError(res.message);
    }
    setIsSubmitting(false);
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const res = await refundOrder(order.id, refundReason);
    if (res.success) {
      setOrder((prev) => {
        const isCancellation = prev.payment?.payment_status === "pending";
        return {
          ...prev,
          transaction_status: isCancellation ? "cancelled" : "refunded",
          payment: prev.payment
            ? {
                ...prev.payment,
                payment_status: isCancellation ? "failed" : "refunded",
              }
            : null,
        };
      });
      setMessage(res.message);
      setIsRefundModalOpen(false);
    } else {
      setError(res.message);
    }
    setIsSubmitting(false);
  };

  const { data: liveSettings } = useStoreSettings();
  const storeName = liveSettings?.store_name || "Warung";

  return (
    <AppShell
      pageTitle={`Detail Transaksi ${order.invoice_number}`}
      breadcrumb={`${storeName} / Transaksi / ${order.invoice_number}`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/transaksi"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <LuArrowLeft className="size-4" />
            <span>Kembali ke Riwayat Transaksi</span>
          </Link>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-card inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <LuPrinter className="size-4" />
              <span>Cetak Struk</span>
            </button>

            {!isRefunded && (
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20"
              >
                <LuRotateCcw className="size-4" />
                <span>Batalkan & Refund Stok</span>
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
            <LuCircleCheck className="size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <LuCircleAlert className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Card */}
        <div className="bg-card space-y-6 rounded-xl border border-border p-6 shadow-xs">
          {/* Header Info */}
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Nomor Invoice
              </span>
              <h2 className="font-mono text-xl font-extrabold text-foreground">
                {order.invoice_number}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Waktu Transaksi: {formatDateTimeIndonesian(order.created_at)}
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 sm:items-end">
               <span
                 className={cn(
                   "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase",
                    isCancelled
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary/15 text-primary",
                 )}
               >
                 {isPaid ? (
                   <>
                     <LuCircleCheck className="size-3.5" />
                     <span>Lunas</span>
                   </>
                 ) : isPending ? (
                   <>
                     <LuClock className="size-3.5" />
                     <span>Menunggu Pembayaran</span>
                   </>
                 ) : isCancelled ? (
                   <>
                     <LuX className="size-3.5" />
                     <span>Dibatalkan</span>
                   </>
                 ) : isRefunded ? (
                   <>
                     <LuRotateCcw className="size-3.5" />
                     <span>Refund</span>
                   </>
                 ) : (
                   <span>Transaksi Dibatalkan (Refund)</span>
                 )}
               </span>

              {isPending && order.payment?.payment_method === "transfer" && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isSubmitting}
                  className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Verifikasi & Tandai Lunas
                </button>
              )}
            </div>
          </div>

          {/* Items Table Snapshot */}
          <div>
            <h3 className="mb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Rincian Barang Belanja (Snapshot Historis)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  <tr>
                    <th className="px-3 py-2.5">SKU</th>
                    <th className="px-3 py-2.5">Nama Produk</th>
                    <th className="px-3 py-2.5 text-center">Jumlah</th>
                    <th className="px-3 py-2.5 text-right">Harga Satuan</th>
                    <th className="px-3 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        {item.sku}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {item.product_name}
                      </td>
                      <td className="px-3 py-2.5 text-center text-foreground">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">
                        {formatRupiah(item.unit_price)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-foreground">
                        {formatRupiah(item.line_subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col items-end space-y-2 border-t border-border pt-4 text-xs">
            <div className="flex w-64 justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-semibold text-foreground">
                {formatRupiah(order.subtotal)}
              </span>
            </div>

            <div className="flex w-64 justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
              <span>Total Akhir:</span>
              <span className="text-base text-primary">
                {formatRupiah(order.total)}
              </span>
            </div>

            <div className="flex w-64 justify-between pt-1 text-[11px] text-muted-foreground">
              <span>Metode Pembayaran:</span>
              <span className="font-bold text-foreground uppercase">
                {order.payment?.payment_method || "-"}
              </span>
            </div>

            {order.payment?.payment_method === "cash" && (
              <>
                <div className="flex w-64 justify-between text-[11px] text-muted-foreground">
                  <span>Uang Diterima:</span>
                  <span>{formatRupiah(order.payment.cash_received || 0)}</span>
                </div>
                <div className="flex w-64 justify-between text-[11px] font-bold text-foreground">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(order.payment.cash_change || 0)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* REFUND CONFIRMATION MODAL */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-card bg-white dark:bg-slate-900 w-[calc(100%-2rem)] max-w-[480px] rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
                  <LuRotateCcw className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Batalkan Transaksi & Refund
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="cursor-pointer text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <LuX className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleRefund}>
              <div className="space-y-4 px-6 py-5">
                <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Konfirmasi Pembatalan
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
                  <p className="font-semibold">Pemulihan Stok Otomatis:</p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Tindakan ini akan mengembalikan stok seluruh barang yang ada di nota #{order.invoice_number} ke inventaris warung dan mencatatnya di buku mutasi.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Alasan Pembatalan / Refund *
                  </label>
                  <input
                    type="text"
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Contoh: Pelanggan membatalkan pembelian..."
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/80 bg-card px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-border/80 bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  <LuRotateCcw className="size-3.5" />
                  <span>{isSubmitting ? "Memproses..." : "Ya, Batalkan Transaksi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
