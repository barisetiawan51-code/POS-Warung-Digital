import type { Metadata } from "next";
import { fetchStoreSettingsServer } from "@/lib/data/settings-server";
import { InventoryView } from "@/components/pages/inventory/inventory-view";

export const metadata: Metadata = {
  title: "Inventaris & Pergerakan Stok",
  description: "Monitor stok produk dan catatan mutasi buku besar.",
};

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  let storeName = "Warung";

  try {
    const settings = await fetchStoreSettingsServer();
    storeName = settings.store_name || storeName;
  } catch {
    // Keep inventory available when auth or settings data is unavailable.
  }

  return <InventoryView storeName={storeName} />;
}
