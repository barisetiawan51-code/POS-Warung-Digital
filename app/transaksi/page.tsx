import type { Metadata } from "next";
import { getOrders } from "@/lib/data/store";
import { TransactionList } from "@/components/pages/transactions/transaction-list";

export const metadata: Metadata = {
  title: "Riwayat Transaksi",
  description: "Daftar histori transaksi penjualan kasir.",
};

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const orders = await getOrders();

  return <TransactionList initialOrders={orders} />;
}
