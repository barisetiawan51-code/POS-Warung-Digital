import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getCategories } from "@/lib/data/store";
import { ProductForm } from "@/components/pages/products/product-form";

export const metadata: Metadata = {
  title: "Edit Produk",
  description: "Form perubahan data produk warung.",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductForm product={product} categories={categories} />;
}
