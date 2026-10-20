import type { Metadata } from "next";
import { fetchStoreSettingsServer } from "@/lib/data/settings-server";
import { SettingsView } from "@/components/pages/settings/settings-view";

export const metadata: Metadata = {
  title: "Pengaturan Warung",
  description:
    "Pengaturan profil toko, rekening bank, dan konfigurasi pembayaran.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await fetchStoreSettingsServer();

  return <SettingsView initialSettings={settings} />;
}
