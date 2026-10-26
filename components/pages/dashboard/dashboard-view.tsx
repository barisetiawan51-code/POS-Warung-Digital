"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LuTrendingUp,
  LuTrendingDown,
  LuBanknote,
  LuPackage,
  LuTriangleAlert,
  LuArrowRight,
  LuExternalLink,
  LuRotateCw,
} from "react-icons/lu";
import type { DashboardStats, Order } from "@/lib/types/pos";
import { formatRupiah } from "@/lib/format";

function formatCompactRupiah(amount: number): string {
  if (amount >= 1000) return `Rp ${Math.round(amount / 1000)}k`;
  return formatRupiah(amount);
}
import { useStoreSettings } from "@/lib/hooks/useRealtime";
import { AppShell } from "@/components/layouts/app-shell";

interface DashboardViewProps {
  stats: DashboardStats;
}

// Helper untuk format waktu transaksi di dashboard
function formatRecentTime(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const datePart = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${datePart}, ${hours}.${minutes}`;
  } catch {
    return "-";
  }
}

// Helper untuk format ringkasan item belanjaan
function formatItemSummary(order: Order): string {
  const itemsCount = order.items?.length || 1;
  const totalPcs =
    order.items?.reduce((sum, it) => sum + it.quantity, 0) || 1;
  return `${itemsCount} macam (${totalPcs} pcs)`;
}

// Helper untuk format metode pembayaran kapital
function formatMethodUpper(method?: string): string {
  if (method === "online") return "QRIS";
  if (method === "transfer") return "TRANSFER";
  return "TUNAI";
}

export function DashboardView({ stats }: DashboardViewProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const { data: liveSettings } = useStoreSettings();
  const settings = liveSettings ?? { store_name: "" };

  const points = stats.chartData;
  const maxVal = 1500000; // 1.5jt
  const minVal = 0;
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 20;
  const firstDaySales = points[0]?.sales ?? 0;
  const lastDaySales = points.at(-1)?.sales ?? 0;
  const trendDifference = lastDaySales - firstDaySales;
  const trendPercent = firstDaySales > 0
    ? Math.round((trendDifference / firstDaySales) * 100)
    : lastDaySales > 0 ? 100 : 0;
  const isTrendUp = trendDifference >= 0;

  const getX = (index: number) => {
    return paddingX + (index / (points.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const ratio = (clamped - minVal) / (maxVal - minVal);
    return svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
  };

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.sales)}`)
    .join(" ");

  const areaPath = `${linePath} L ${getX(points.length - 1)} ${
    svgHeight - paddingY
  } L ${getX(0)} ${svgHeight - paddingY} Z`;

  const lowStockList = stats.lowStockItems ?? [];

  const recentOrdersList = stats.recentOrders ?? [];

  return (
    <AppShell
      pageTitle="Dashboard"
      breadcrumb={`${settings.store_name || ""} / Dashboard`}
      lowStockCount={stats.lowStockCount}
    >
      <div className="space-y-6">
        {/* Welcome Banner Card */}
        <div className="flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Halo, Juragan! 👋
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Berikut ringkasan aktivitas warung Anda hari ini.
            </p>
          </div>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Penjualan Hari Ini */}
          <div className="bg-card bg-primary-foreground dark:bg-background relative min-w-0 overflow-hidden rounded-2xl border border-border p-4 shadow-xs transition-shadow hover:shadow-md sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <LuTrendingUp className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="block truncate text-[10px] font-bold tracking-wide text-muted-foreground uppercase sm:text-xs">
                  Penjualan Hari Ini
                </span>
                <div className="mt-1 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {formatRupiah(stats.todaySales)}
                </div>
                <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-600 sm:text-xs">
                  {stats.salesGrowthPercent >= 0 ? <LuTrendingUp className="size-3.5 shrink-0" /> : <LuTrendingDown className="size-3.5 shrink-0" />}
                  <span>{Math.abs(stats.salesGrowthPercent)}%</span>{" "}
                  <span className="font-normal text-emerald-600 dark:text-emerald-600">dari kemarin</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Jumlah Transaksi */}
          <div className="bg-card bg-primary-foreground dark:bg-background relative min-w-0 overflow-hidden rounded-2xl border border-border p-4 shadow-xs transition-shadow hover:shadow-md sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
                <LuBanknote className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="block truncate text-[10px] font-bold tracking-wide text-muted-foreground uppercase sm:text-xs">Jumlah Transaksi</span>
                <div className="mt-1 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">{stats.todayTransactions} Transaksi</div>
                <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-600 sm:text-xs">
                  {stats.transactionGrowthPercent >= 0 ? <LuTrendingUp className="size-3.5 shrink-0" /> : <LuTrendingDown className="size-3.5 shrink-0" />}
                  <span>{Math.abs(stats.transactionGrowthPercent)}%</span>{" "}
                  <span className="font-normal text-emerald-600 dark:text-emerald-600">dari kemarin</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Total Produk */}
          <div className="bg-card bg-primary-foreground dark:bg-background relative min-w-0 overflow-hidden rounded-2xl border border-border p-4 shadow-xs transition-shadow hover:shadow-md sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white">
                <LuPackage className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="block truncate text-[10px] font-bold tracking-wide text-muted-foreground uppercase sm:text-xs">Total Produk</span>
                <div className="mt-1 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">{stats.totalProducts} Produk</div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">Terdaftar di inventaris</p>
              </div>
            </div>
          </div>

          {/* Card 4: Stok Menipis */}
          <div className="bg-card bg-primary-foreground dark:bg-background relative min-w-0 overflow-hidden rounded-2xl border border-border p-4 shadow-xs transition-shadow hover:shadow-md sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                <LuTriangleAlert className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-bold tracking-wide text-muted-foreground uppercase sm:text-xs">Stok Menipis</span>
                <div className="mt-1 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">{stats.lowStockCount} Produk</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <Link href="/stok" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:text-foreground">Lihat Detail <LuArrowRight className="size-3.5" /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Chart & Peringatan Stok (Sesuai Gambar) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 7-Day Sales Trend Line Chart (2/3 width) */}
          <div className="bg-card bg-primary-foreground dark:bg-background rounded-2xl border border-border/80 p-6 shadow-xs lg:col-span-2">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Tren Penjualan 7 Hari Terakhir
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className={isTrendUp
                    ? "inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-primary-foreground dark:text-primary-foreground"
                    : "inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-600"}>
                    {isTrendUp ? <LuTrendingUp className="size-3.5" /> : <LuTrendingDown className="size-3.5" />}
                    <span>{isTrendUp ? "Naik" : "Turun"} {Math.abs(trendPercent)}%</span>
                  </div>
                  <Link
                    href="/laporan"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-foreground"
                  >
                    <span>Lihat Laporan Lengkap</span>
                    <LuArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

            {/* SVG Chart */}
            <div className="scrollbar-thin mt-6 w-full overflow-x-auto pb-5">
              <div className="relative min-w-125">
                {/* Y-axis guidelines */}
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-45 flex-col justify-between pl-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-1">
                    <span className="w-12">1.5 jt</span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-border/40 pb-1">
                    <span className="w-12">1 jt</span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-border/40 pb-1">
                    <span className="w-12">500 rb</span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-border/40 pb-1">
                    <span className="w-12">Rp 0</span>
                  </div>
                </div>

                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="h-56 w-full overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="chartGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#2563eb"
                        stopOpacity="0.25"
                      />
                      <stop
                        offset="100%"
                        stopColor="#2563eb"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  <path d={areaPath} fill="url(#chartGradient)" />

                  {/* Main Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {points.map((p, i) => {
                    const cx = getX(i);
                    const cy = getY(p.sales);
                    return (
                      <g key={p.date} className="group cursor-pointer" onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} onFocus={() => setHoveredPoint(i)} onBlur={() => setHoveredPoint(null)} tabIndex={0}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="5"
                          className="fill-card group-hover:r-7 stroke-primary stroke-2 transition-transform duration-150"
                        />
                        <title>{`${p.label}: ${formatRupiah(p.sales)}`}</title>
                      </g>
                    );
                  })}
                </svg>

                {hoveredPoint !== null && (
                  <div
                    className="pointer-events-none absolute z-10 -mt-8 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-card bg-foreground px-3 py-2 text-xs shadow-lg"
                    style={{
                      left: `${(getX(hoveredPoint) / svgWidth) * 100}%`,
                      top: `${(getY(points[hoveredPoint].sales) / svgHeight) * 100}%`,
                    }}
                  >
                    <p className="font-semibold text-muted">{points[hoveredPoint].label}</p>
                    <p className="mt-0.5 whitespace-nowrap text-muted">
                      Total: <span className="font-bold text-muted">{formatRupiah(points[hoveredPoint].sales)}</span>
                    </p>
                  </div>
                )}

                {/* X-axis labels */}
                <div className="mt-2 flex justify-between px-8 text-xs font-medium text-muted-foreground">
                  {points.map((p) => (
                    <span key={p.date}>{p.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section Peringatan Stok (1/3 width - Sesuai Gambar) */}
          <div className="bg-card bg-primary-foreground dark:bg-background flex flex-col justify-between rounded-2xl border border-border/80 p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <LuTriangleAlert className="size-4 text-red-600" />
                  <h3 className="text-sm font-bold text-foreground">
                    Peringatan Stok
                  </h3>
                </div>
                <Link
                  href="/stok"
                  className="text-xs font-semibold text-blue-600 transition-colors hover:text-foreground dark:text-blue-400"
                >
                  Semua ({stats.lowStockCount})
                </Link>
              </div>

              <div className="divide-y divide-border/60">
                {lowStockList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3.5 first:pt-3 last:pb-0"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {item.name}
                      </h4>
                      <p className="mt-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                        Sisa: {item.stock} {item.unit} (Min: {item.minimum_stock})
                      </p>
                    </div>

                    <Link
                      href="/stok"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/70"
                    >
                      <LuRotateCw className="size-3" />
                      <span>Restock</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-border/60 pt-3">
              <Link
                href="/stok"
                className="flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <span>Kelola Inventaris Lengkap</span>
                <LuArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Row 3: Transaksi Terakhir (Full Width - Sesuai Gambar) */}
        <div className="bg-card bg-primary-foreground dark:bg-background overflow-hidden rounded-2xl border border-border/80 shadow-xs">
          <div className="flex flex-col gap-2 border-b border-border/80 px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Transaksi Terakhir
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Riwayat penjualan kasir terbaru
              </p>
            </div>

            <Link
              href="/transaksi"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-foreground dark:text-blue-400"
            >
              <span>Lihat Semua Transaksi</span>
              <LuExternalLink className="size-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-xs">
              <thead className="border-b border-border/80 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3.5 pl-6 pr-4">No. Invoice</th>
                  <th className="px-4 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5">Item</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Metode</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="py-3.5 pr-6 pl-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentOrdersList.map((trx) => (
                  <tr
                    key={trx.id}
                    className="transition-colors hover:bg-muted/20"
                  >
                    <td className="py-3.5 pl-6 pr-4 font-medium text-blue-600 dark:text-blue-400">
                      {trx.invoice_number}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {formatRecentTime(trx.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {formatItemSummary(trx)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="px-4 py-3.5 font-medium uppercase text-muted-foreground">
                      {formatMethodUpper(trx.payment?.payment_method)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-emerald-600 dark:text-emerald-400">
                      Lunas
                    </td>
                    <td className="py-3.5 pr-6 pl-4 text-right">
                      <Link
                        href={`/transaksi/${trx.id}`}
                        className="text-xs font-semibold text-blue-600 transition-colors hover:text-foreground dark:text-blue-400"
                      >
                        Lihat Struk
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
