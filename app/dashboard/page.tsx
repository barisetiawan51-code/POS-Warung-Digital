import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/data/store";
import { DashboardView } from "@/components/pages/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan penjualan, transaksi, dan stok warung.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return <DashboardView stats={stats} />;
}
