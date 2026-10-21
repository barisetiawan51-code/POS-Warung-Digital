"use client";

import { useState, useMemo } from "react";
import { LuDownload } from "react-icons/lu";
import type { Order } from "@/lib/types/pos";
import { formatRupiah } from "@/lib/format";
import { AppShell } from "@/components/layouts/app-shell";
import { cn } from "@/lib/utils";
import { useOrders } from "@/lib/hooks/useRealtime";

interface ReportsViewProps {
  orders: Order[];
  storeName: string;
}

interface RankedProduct {
  no: number;
  name: string;
  sku: string;
  qty: number;
  unit: string;
  revenue: number;
  profit: number;
}

interface DailySalesRecord {
  date: string;
  dayName: string;
  dateLabel: string;
  isToday: boolean;
  transactionsCount: number;
  grossSales: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: string;
}
export function ReportsView({ orders, storeName }: ReportsViewProps) {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("all");
  const [csvPreview, setCsvPreview] = useState<string | null>(null);
  const [csvPreviewFilename, setCsvPreviewFilename] = useState("Laporan_WarungKu.csv");
  const { data: liveOrders } = useOrders(orders);
  const ordersForAggregation = liveOrders ?? orders;

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

    return ordersForAggregation.filter((o) => {
      const orderTime = new Date(o.created_at).getTime();
      if (period === "today") return orderTime >= startOfToday;
      if (period === "week") return orderTime >= sevenDaysAgo;
      if (period === "month") return orderTime >= thirtyDaysAgo;
      return true;
    });
  }, [ordersForAggregation, period]);

  const dailySales = useMemo<DailySalesRecord[]>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "week") start.setDate(start.getDate() - 6);
    if (period === "month") start.setDate(start.getDate() - 29);
    if (period === "all") start.setTime(0);

    const grouped = new Map<string, DailySalesRecord>();
    for (const order of ordersForAggregation) {
      if (order.transaction_status !== "completed" && order.payment?.payment_status !== "paid") continue;
      const date = new Date(order.created_at);
      if (period !== "all" && date < start) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const existing = grouped.get(key) ?? {
        date: key,
        dayName: new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date),
        dateLabel: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date),
        isToday: key === new Date().toISOString().slice(0, 10),
        transactionsCount: 0,
        grossSales: 0,
        totalCost: 0,
        grossProfit: 0,
        profitMargin: "0.0",
      };
      existing.transactionsCount += 1;
      existing.grossSales += order.total;
      existing.totalCost += (order.items ?? []).reduce((sum, item) => sum + item.cost_price * item.quantity, 0);
      existing.grossProfit = existing.grossSales - existing.totalCost;
      existing.profitMargin = existing.grossSales > 0 ? ((existing.grossProfit / existing.grossSales) * 100).toFixed(1) : "0.0";
      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [ordersForAggregation, period]);

  // Total Agregat Riwayat Harian
  const dailySalesTotal = useMemo(() => {
    let count = 0;
    let sales = 0;
    let cost = 0;
    let profit = 0;

    for (const d of dailySales) {
      count += d.transactionsCount;
      sales += d.grossSales;
      cost += d.totalCost;
      profit += d.grossProfit;
    }

    const margin = sales > 0 ? ((profit / sales) * 100).toFixed(1) : "0.0";

    return {
      transactionsCount: count,
      grossSales: sales,
      totalCost: cost,
      grossProfit: profit,
      profitMargin: margin,
    };
  }, [dailySales]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let grossSales = 0;
    let completedCount = 0;
    let totalCost = 0;

    const paymentCounts: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      transfer: { count: 0, total: 0 },
      online: { count: 0, total: 0 },
    };

    const productSalesMap = new Map<
      string,
      {
        name: string;
        sku: string;
        qty: number;
        unit: string;
        revenue: number;
        cost: number;
      }
    >();

    for (const order of filteredOrders) {
      if (
        order.transaction_status === "completed" ||
        order.payment?.payment_status === "paid"
      ) {
        completedCount++;
        grossSales += order.total;

        const method = order.payment?.payment_method || "cash";
        if (paymentCounts[method]) {
          paymentCounts[method].count++;
          paymentCounts[method].total += order.total;
        }

        if (order.items) {
          for (const item of order.items) {
            const cost = (item.cost_price || 0) * item.quantity;
            totalCost += cost;

            const existing = productSalesMap.get(item.product_name) || {
              name: item.product_name,
              sku: item.sku,
              qty: 0,
              unit: item.unit || "Pcs",
              revenue: 0,
              cost: 0,
            };
            existing.qty += item.quantity;
            existing.revenue += item.line_subtotal;
            existing.cost += cost;
            productSalesMap.set(item.product_name, existing);
          }
        }
      }
    }

    const grossProfit = Math.max(0, grossSales - totalCost);
    const profitMargin =
      grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : "0.0";

    const rankedProducts: RankedProduct[] = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((p, idx) => ({
        no: idx + 1,
        name: p.name,
        sku: p.sku,
        qty: p.qty,
        unit: p.unit,
        revenue: p.revenue,
        profit: Math.max(0, p.revenue - p.cost),
      }));

    return {
      grossSales,
      completedCount,
      totalCost,
      grossProfit,
      profitMargin,
      paymentCounts,
      rankedProducts,
    };
  }, [filteredOrders]);

  // Format date range text
  const dateRangeText = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (period === "today") {
      return `${today} s/d ${today}`;
    }
    if (period === "week") {
      const past = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      return `${past} s/d ${today}`;
    }
    if (period === "month") {
      const past = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      return `${past} s/d ${today}`;
    }
    return "Semua Transaksi";
  }, [period]);

  // CSV Export Generator untuk Riwayat Penjualan per Hari (tanpa kolom diskon)
  const handleExportDailyCSV = () => {
    const headers = [
      "Tanggal",
      "Hari",
      "Jumlah Transaksi",
      "Total Omzet (Rp)",
      "Modal Barang HPP (Rp)",
      "Laba Bersih (Rp)",
      "Margin Laba (%)",
    ];

    const rows = dailySales.map((d) => [
      d.date,
      `"${d.dayName}"`,
      d.transactionsCount,
      d.grossSales,
      d.totalCost,
      d.grossProfit,
      `"${d.profitMargin}%"`,
    ].join(","));

    // Tambahkan baris total di akhir
    rows.push([
      "TOTAL",
      `"${dailySales.length} Hari"`,
      dailySalesTotal.transactionsCount,
      dailySalesTotal.grossSales,
      dailySalesTotal.totalCost,
      dailySalesTotal.grossProfit,
      `"${dailySalesTotal.profitMargin}%"`,
    ].join(","));

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    setCsvPreview(csvContent);
    setCsvPreviewFilename(`Riwayat_Penjualan_Harian_WarungKu_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleDownloadPreview = () => {
    if (!csvPreview) return;
    const blob = new Blob([csvPreview], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = csvPreviewFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCsvPreview(null);
  };

  // CSV Export Generator untuk Produk Terlaris (tanpa kolom diskon)
  const handleExportProductCSV = () => {
    const headers = [
      "No",
      "Nama Produk",
      "SKU",
      "Jumlah Terjual",
      "Satuan",
      "Total Omzet (Rp)",
      "Laba Bersih (Rp)",
    ];

    const rows = metrics.rankedProducts.map((p) => {
      return [
        p.no,
        `"${p.name}"`,
        `"${p.sku}"`,
        p.qty,
        `"${p.unit}"`,
        p.revenue,
        p.profit,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    setCsvPreview(csvContent);
    setCsvPreviewFilename(`Laporan_Produk_WarungKu_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AppShell pageTitle="Laporan Penjualan & Laba" breadcrumb={`${storeName || ""} / Laporan`}>
      <div className="space-y-6">
        {/* Banner Card Atas */}
        <div className="bg-card flex flex-col gap-4 rounded-2xl border border-border/80 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Laporan Penjualan & Laba
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Analisis akurat omzet kotor, modal barang terjual (HPP), dan laba bersih dari transaksi yang telah selesai.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportDailyCSV}
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[#123b6b] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#123b6b]/90 dark:bg-primary dark:hover:bg-primary/90"
          >
            <LuDownload className="size-4" />
            <span>Preview Laporan CSV</span>
          </button>
        </div>

        {/* Filter Periode Card */}
        <div className="bg-card flex flex-col gap-3 rounded-2xl border border-border/80 p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-1.5 font-semibold transition-all",
                period === "all"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              Semua Transaksi
            </button>
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-1.5 font-semibold transition-all",
                period === "today"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-1.5 font-semibold transition-all",
                period === "week"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-1.5 font-semibold transition-all",
                period === "month"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              30 Hari Terakhir
            </button>
          </div>

          <div className="text-xs text-muted-foreground">
            Menampilkan periode:{" "}
            <strong className="font-bold text-foreground">{dateRangeText}</strong>
          </div>
        </div>

        {/* 3 Summary KPI Cards (Tanpa bagian diskon) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card 1: Total Omzet Penjualan */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-xs">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              TOTAL OMZET PENJUALAN
            </span>
            <div className="mt-2 text-2xl font-extrabold text-foreground">
              {formatRupiah(metrics.grossSales)}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Dari {metrics.completedCount} transaksi lunas
            </p>
          </div>

          {/* Card 2: Modal Barang (HPP) */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-xs">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              MODAL BARANG (HPP)
            </span>
            <div className="mt-2 text-2xl font-extrabold text-foreground">
              {formatRupiah(metrics.totalCost)}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Berdasarkan snapshot harga beli
            </p>
          </div>

          {/* Card 3: Laba Kotor (Gross Profit) */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-xs">
            <span className="text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              LABA KOTOR (GROSS PROFIT)
            </span>
            <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(metrics.grossProfit)}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Margin: {metrics.profitMargin}% dari omzet
            </p>
          </div>
        </div>

        {/* Rincian Berdasarkan Metode Pembayaran */}
        <div className="bg-card space-y-4 rounded-2xl border border-border/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-foreground">
            Rincian Berdasarkan Metode Pembayaran
          </h3>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {/* Tunai (Cash) */}
            <div className="rounded-xl border border-border/80 bg-slate-50/50 p-4 dark:border-border/60 dark:bg-muted/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Tunai (Cash)</span>
                <span className="text-muted-foreground">
                  {metrics.paymentCounts.cash.count} transaksi
                </span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-foreground">
                {formatRupiah(metrics.paymentCounts.cash.total)}
              </div>
            </div>

            {/* Transfer Bank */}
            <div className="rounded-xl border border-border/80 bg-slate-50/50 p-4 dark:border-border/60 dark:bg-muted/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Transfer Bank</span>
                <span className="font-medium text-primary">
                  {metrics.paymentCounts.transfer.count} transaksi
                </span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-foreground">
                {formatRupiah(metrics.paymentCounts.transfer.total)}
              </div>
            </div>

            {/* QRIS / Online */}
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  QRIS / Online
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {metrics.paymentCounts.online.count} transaksi
                </span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                {formatRupiah(metrics.paymentCounts.online.total)}
              </div>
            </div>
          </div>
        </div>

        {/* Section Riwayat Penjualan per Hari */}
        <div className="bg-card overflow-hidden rounded-2xl border border-border/80 shadow-xs">
          <div className="flex flex-col gap-3 border-b border-border/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Riwayat Penjualan per Hari
                </h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary dark:bg-primary/20">
                  {dailySales.length} Hari Tercatat
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Rekapitulasi omzet kotor, modal barang (HPP), dan laba bersih harian toko tanpa diskon.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportDailyCSV}
              className="cursor-pointer inline-flex items-center gap-1.5 self-start rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted/50 sm:self-auto"
            >
              <LuDownload className="size-3.5 text-muted-foreground" />
              <span>Preview CSV Harian</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/20 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-4 pl-6 pr-4">Tanggal Transaksi</th>
                  <th className="px-4 py-4 text-center">Jumlah Transaksi</th>
                  <th className="px-4 py-4 text-right">Total Omzet</th>
                  <th className="px-4 py-4 text-right">Modal Barang (HPP)</th>
                  <th className="px-4 py-4 text-right">Laba Bersih</th>
                  <th className="py-4 pr-6 pl-4 text-right">Margin Laba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {dailySales.map((day) => (
                  <tr
                    key={day.date}
                    className={cn(
                      "transition-colors hover:bg-muted/20",
                      day.isToday && "bg-primary/5 dark:bg-primary/10",
                    )}
                  >
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {day.dateLabel}
                        </span>
                        {day.isToday && (
                          <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                            Hari Ini
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {day.date}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {day.transactionsCount} Transaksi
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-foreground">
                      {formatRupiah(day.grossSales)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-muted-foreground">
                      {formatRupiah(day.totalCost)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(day.grossProfit)}
                    </td>
                    <td className="py-4 pr-6 pl-4 text-right">
                      <span className="inline-block rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {day.profitMargin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border/80 bg-muted/30 font-bold text-foreground">
                <tr>
                  <td className="py-4 pl-6 pr-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Total Rekapitulasi ({dailySales.length} Hari)
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-foreground">
                    {dailySalesTotal.transactionsCount} Transaksi
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-extrabold text-foreground">
                    {formatRupiah(dailySalesTotal.grossSales)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-muted-foreground">
                    {formatRupiah(dailySalesTotal.totalCost)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(dailySalesTotal.grossProfit)}
                  </td>
                  <td className="py-4 pr-6 pl-4 text-right">
                    <span className="inline-block rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      {dailySalesTotal.profitMargin}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Peringkat Penjualan & Laba per Produk (Tabel Gambar 2) */}
        <div className="bg-card overflow-hidden rounded-2xl border border-border/80 shadow-xs">
          <div className="flex flex-col gap-3 border-b border-border/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Peringkat Penjualan & Laba per Produk
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Daftar produk yang paling berkontribusi terhadap omzet dan keuntungan toko.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportProductCSV}
              className="cursor-pointer inline-flex items-center gap-1.5 self-start rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted/50 sm:self-auto"
            >
              <LuDownload className="size-3.5 text-muted-foreground" />
              <span>Preview CSV Produk</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-border/80 bg-muted/20 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-4 pl-6 pr-2 w-14">No</th>
                  <th className="px-4 py-4">Nama Produk / SKU</th>
                  <th className="px-4 py-4 text-center">Jumlah Terjual</th>
                  <th className="px-4 py-4 text-right">Total Omzet</th>
                  <th className="py-4 pr-6 pl-4 text-right">Laba Bersih Produk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {metrics.rankedProducts.map((p) => (
                  <tr
                    key={`${p.sku}-${p.no}`}
                    className="transition-colors hover:bg-muted/20"
                  >
                    <td className="py-4 pl-6 pr-2 font-medium text-muted-foreground">
                      {p.no}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-foreground">{p.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground uppercase">
                        {p.sku}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-foreground">
                      {p.qty} {p.unit}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-foreground">
                      {formatRupiah(p.revenue)}
                    </td>
                    <td className="py-4 pr-6 pl-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {csvPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white dark:bg-slate-900 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-bold text-foreground">Preview Laporan CSV</h3>
              <button
                type="button"
                onClick={() => setCsvPreview(null)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Tutup
              </button>
            </div>
            <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-5 text-xs leading-relaxed text-foreground">
              {csvPreview.replace(/^\uFEFF/, "")}
            </pre>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setCsvPreview(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDownloadPreview}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
              >
                Unduh CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
