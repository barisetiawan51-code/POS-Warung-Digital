"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LuSearch,
  LuEye,
  LuPrinter,
  LuX,
  LuReceipt,
} from "react-icons/lu";
import type { Order } from "@/lib/types/pos";
import { formatRupiah } from "@/lib/format";
import { AppShell } from "@/components/layouts/app-shell";
import { CustomSelect } from "@/components/ui/custom-select";
import type { StoreSettings } from "@/lib/types/pos";
import { useOrders, useStoreSettings } from "@/lib/hooks/useRealtime";

interface TransactionListProps {
  initialOrders: Order[];
}

export function TransactionList({ initialOrders }: TransactionListProps) {
  const { data: liveOrders } = useOrders(initialOrders);
  const orders = liveOrders ?? initialOrders;
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const { data: liveSettings } = useStoreSettings();
  const settings: Partial<StoreSettings> = liveSettings ?? {};
  const storeName = settings.store_name || "Warung";

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase().trim();
    const itemMatch = o.items?.some((item) =>
      item.product_name.toLowerCase().includes(q),
    );
    const matchQ =
      !q ||
      o.invoice_number.toLowerCase().includes(q) ||
      Boolean(itemMatch) ||
      (o.notes && o.notes.toLowerCase().includes(q));

    const method = o.payment?.payment_method;
    const matchMethod =
      methodFilter === "all" ||
      (methodFilter === "cash" && method === "cash") ||
      (methodFilter === "online" && method === "online") ||
      (methodFilter === "transfer" && method === "transfer");

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" &&
        (o.transaction_status === "completed" ||
          o.payment?.payment_status === "paid")) ||
      (statusFilter === "pending" && o.payment?.payment_status === "pending") ||
      (statusFilter === "refunded" &&
        (o.transaction_status === "refunded" ||
          o.transaction_status === "cancelled"));

    // Klasifikasi filter tanggal
    const matchDate = (() => {
      if (dateFilter === "all") return true;
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      if (isNaN(d.getTime())) return false;

      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
      const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
      const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
      const thirtyDaysAgo = startOfToday - 29 * 24 * 60 * 60 * 1000;
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      const time = d.getTime();

      if (dateFilter === "today") return time >= startOfToday && time <= endOfToday;
      if (dateFilter === "yesterday")
        return time >= startOfYesterday && time < startOfToday;
      if (dateFilter === "7days") return time >= sevenDaysAgo;
      if (dateFilter === "30days") return time >= thirtyDaysAgo;
      if (dateFilter === "this_month") return time >= startOfMonth;
    })();

    return matchQ && matchMethod && matchStatus && matchDate;
  });

  const formatTransactionTime = (dateInput: string | Date | number): string => {
    if (!dateInput) return "-";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "-";

    const datePart = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${datePart}, ${hours}.${minutes}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell pageTitle="Riwayat Transaksi" breadcrumb={`${storeName} / Transaksi`}>
      <div className="space-y-5">
        {/* Filter Controls Card Atas */}
        <div className="bg-card flex flex-col gap-3 rounded-2xl border border-border/80 p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/70">
              <LuSearch className="size-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Invoice atau nama barang..."
              className="w-full rounded-xl border border-border/80 bg-background py-2.5 pr-3.5 pl-10 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <CustomSelect
              id="method-filter"
              value={methodFilter}
              onChange={setMethodFilter}
              options={[
                { value: "all", label: "Semua Metode" },
                { value: "cash", label: "Tunai" },
                { value: "online", label: "QRIS" },
                { value: "transfer", label: "Transfer" },
              ]}
            />

            <CustomSelect
              id="status-filter"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "Semua Status" },
                { value: "completed", label: "Lunas" },
                { value: "pending", label: "Pending" },
                { value: "refunded", label: "Batal / Refund" },
              ]}
            />

            {/* Tombol Klasifikasi Tanggal (di sebelah kanan tombol status) */}
            <CustomSelect
              id="date-filter"
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { value: "all", label: "Semua Tanggal" },
                { value: "today", label: "Hari Ini" },
                { value: "yesterday", label: "Kemarin" },
                { value: "this_month", label: "Bulan Ini" },
                { value: "7days", label: "7 Hari Terakhir" },
                { value: "30days", label: "30 Hari Terakhir" },
              ]}
            />
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="bg-card overflow-hidden rounded-2xl border border-border/80 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/20 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-4 pl-6 pr-4">No. Invoice</th>
                  <th className="px-4 py-4">Waktu Transaksi</th>
                  <th className="px-4 py-4">Barang Belanjaan</th>
                  <th className="px-4 py-4">Total Tagihan</th>
                  <th className="px-4 py-4">Metode</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="py-4 pr-6 pl-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((order) => {
                  const isPaid =
                    order.transaction_status === "completed" ||
                    order.payment?.payment_status === "paid";
                  const isRefunded =
                    order.transaction_status === "refunded" ||
                    order.transaction_status === "cancelled";

                  const paymentMethodDisplay =
                    order.payment?.payment_method === "online"
                      ? "QRIS"
                      : order.payment?.payment_method === "transfer"
                        ? "Transfer"
                        : "Tunai";

                  const itemsDisplay =
                    order.items && order.items.length > 0
                      ? order.items
                          .map((i) => `${i.product_name} (${i.quantity})`)
                          .join(", ")
                      : "-";

                  const itemsCount = order.items?.length || 1;

                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      {/* No. Invoice */}
                      <td className="py-4 pl-6 pr-4">
                        <Link
                          href={`/transaksi/${order.id}`}
                          className="font-bold text-foreground transition-colors hover:text-primary"
                        >
                          {order.invoice_number}
                        </Link>
                      </td>

                      {/* Waktu Transaksi */}
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatTransactionTime(order.created_at)}
                      </td>

                      {/* Barang Belanjaan */}
                      <td className="px-4 py-4 max-w-sm">
                        <p className="font-semibold text-foreground leading-snug line-clamp-1">
                          {itemsDisplay}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {itemsCount} jenis item
                        </p>
                      </td>

                      {/* Total Tagihan */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-bold text-foreground">
                          {formatRupiah(order.total)}
                        </span>
                        {order.discount > 0 && (
                          <span className="block text-[10px] font-medium text-rose-500 mt-0.5">
                            Diskon: {formatRupiah(order.discount)}
                          </span>
                        )}
                      </td>

                      {/* Metode */}
                      <td className="px-4 py-4 text-foreground font-medium whitespace-nowrap">
                        {paymentMethodDisplay}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={
                            isRefunded
                              ? "inline-flex items-center rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                              : isPaid
                                ? "inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "inline-flex items-center rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                          }
                        >
                          {isRefunded ? "Batal" : isPaid ? "Lunas" : "Pending"}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 pr-6 pl-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/transaksi/${order.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:underline"
                          >
                            <LuEye className="size-4" />
                            <span>Rincian</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPrintingOrder(order)}
                            title="Cetak Struk"
                            className="cursor-pointer p-1 text-muted-foreground/70 transition-colors hover:text-foreground"
                          >
                            <LuPrinter className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <LuReceipt className="mx-auto mb-2 size-8 text-muted-foreground/40" />
              Tidak ada data transaksi yang cocok dengan pencarian.
            </div>
          )}
        </div>
      </div>

      {/* Modal Cetak Struk Cepat */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-card bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-border/80 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-muted/20 text-muted-foreground">
                  <LuPrinter className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Cetak Struk Penjualan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintingOrder(null)}
                className="cursor-pointer text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <LuX className="size-4.5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Invoice #{printingOrder.invoice_number}
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
                    {formatTransactionTime(printingOrder.created_at)}
                  </p>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-border/80 pb-2">
                  {printingOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-[11px]"
                    >
                      <div>
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity} x {formatRupiah(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatRupiah(item.line_subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between border-t border-border/80 pt-1 text-xs font-bold">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(printingOrder.total)}</span>
                  </div>
                  {printingOrder.discount > 0 && (
                    <div className="flex justify-between text-[10px] text-rose-500">
                      <span>Diskon:</span>
                      <span>-{formatRupiah(printingOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 text-[10px] text-muted-foreground">
                    <span>Metode:</span>
                    <span className="uppercase font-semibold">
                      {printingOrder.payment?.payment_method || "TUNAI"}
                    </span>
                  </div>
                  {printingOrder.payment?.cash_received ? (
                    <>
                      <div className="flex justify-between text-[10px]">
                        <span>Tunai Diterima:</span>
                        <span>
                          {formatRupiah(printingOrder.payment.cash_received)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Kembalian:</span>
                        <span>
                          {formatRupiah(printingOrder.payment.cash_change || 0)}
                        </span>
                      </div>
                    </>
                  ) : null}
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
                onClick={() => setPrintingOrder(null)}
                className="cursor-pointer rounded-xl border border-border/80 bg-card px-5 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
              >
                <LuPrinter className="size-3.5" />
                <span>Cetak Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
