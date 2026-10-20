"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LuArrowLeft,
  LuCreditCard,
  LuCircleCheck,
  LuExternalLink,
} from "react-icons/lu";
import type { Order } from "@/lib/types/pos";
import { formatRupiah, formatDateTimeIndonesian } from "@/lib/format";
import { verifyPayment } from "@/lib/data/store";
import { AppShell } from "@/components/layouts/app-shell";

interface PaymentDetailProps {
  order: Order;
}

export function PaymentDetail({ order: initialOrder }: PaymentDetailProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  const payment = order.payment;
  const isPaid = payment?.payment_status === "paid";

  const handleVerify = async () => {
    setIsVerifying(true);
    const res = await verifyPayment(order.id);
    if (res.success) {
      setOrder((prev) => ({
        ...prev,
        transaction_status: "completed",
        payment: prev.payment
          ? { ...prev.payment, payment_status: "paid" }
          : null,
      }));
      setSuccess(true);
    }
    setIsVerifying(false);
  };

  return (
    <AppShell
      pageTitle="Verifikasi Pembayaran"
      breadcrumb={`WarungKu / Pembayaran / ${order.invoice_number}`}
    >
      <div className="mx-auto max-w-lg space-y-6">
        <Link
          href="/transaksi"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <LuArrowLeft className="size-4" />
          <span>Kembali ke Transaksi</span>
        </Link>

        <div className="bg-card space-y-5 rounded-xl border border-border p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LuCreditCard className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Verifikasi Pembayaran Transfer
              </h2>
              <p className="text-xs text-muted-foreground">
                Invoice {order.invoice_number}
              </p>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <LuCircleCheck className="size-4 shrink-0" />
              <span>
                Pembayaran berhasil diverifikasi dan pesanan telah lunas.
              </span>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-border/80 bg-background p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jumlah Tagihan:</span>
              <span className="text-sm font-extrabold text-foreground">
                {formatRupiah(order.total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metode:</span>
              <span className="font-bold text-foreground uppercase">
                {payment?.payment_method || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-bold uppercase">
                {isPaid ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    LUNAS
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    MENUNGGU VERIFIKASI
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waktu Masuk:</span>
              <span>{formatDateTimeIndonesian(order.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {!isPaid && (
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                <LuCircleCheck className="size-4" />
                <span>
                  {isVerifying
                    ? "Memproses..."
                    : "Konfirmasi Dana Masuk (Tandai Lunas)"}
                </span>
              </button>
            )}

            <Link
              href={`/transaksi/${order.id}`}
              className="bg-card flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <span>Lihat Detail Nota Belanja</span>
              <LuExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
