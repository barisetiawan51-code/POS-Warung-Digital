import type { Metadata } from "next";
import { CashierView } from "@/components/pages/cashier/cashier-view";

export const metadata: Metadata = {
  title: "Kasir (POS)",
  description: "Sistem kasir digital point of sale untuk transaksi cepat warung.",
};

export default function CashierPage() {
  return <CashierView />;
}
