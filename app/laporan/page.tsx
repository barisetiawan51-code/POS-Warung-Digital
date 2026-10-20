import type { Metadata } from "next";
import { getOrders } from "@/lib/data/store";
import { fetchStoreSettingsServer } from "@/lib/data/settings-server";
import { ReportsView } from "@/components/pages/reports/reports-view";

export const metadata: Metadata = {
  title: "Laporan Penjualan",
  description: "Laporan analitik penjualan, transaksi, dan ekspor CSV.",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const orders = await getOrders();
  let storeName = "Warung";

  try {
    const settings = await fetchStoreSettingsServer();
    storeName = settings.store_name || storeName;
  } catch {
    // Keep reports available when auth or settings data is unavailable.
  }

  return <ReportsView orders={orders} storeName={storeName} />;
}
