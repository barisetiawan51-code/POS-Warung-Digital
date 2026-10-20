import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/data/store";
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
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return <TransactionDetail order={order} />;
}
