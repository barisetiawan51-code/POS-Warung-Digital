import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/data/store";
import { PaymentDetail } from "@/components/pages/payments/payment-detail";

export const metadata: Metadata = {
  title: "Verifikasi Pembayaran",
  description: "Status dan verifikasi pembayaran pesanan warung.",
};

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({
  params,
}: PaymentDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return <PaymentDetail order={order} />;
}
