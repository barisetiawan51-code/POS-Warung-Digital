import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchOrderServer } from "@/lib/data/supabase-server-service";
import { TransactionDetail } from "@/components/pages/transactions/transaction-detail";

export const metadata: Metadata = {
  title: "Detail Transaksi",
  description: "Rincian detail invoice penjualan kasir.",
};

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const { id } = await params;
  const order = await fetchOrderServer(id);

  if (!order) {
    notFound();
  }

  return <TransactionDetail order={order} />;
}
