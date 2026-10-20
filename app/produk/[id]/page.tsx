import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchCategoriesServer } from "@/lib/data/category-server";
import { fetchProductByIdServer } from "@/lib/data/product-server";
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
    fetchProductByIdServer(id),
    fetchCategoriesServer(),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductForm product={product} categories={categories ?? []} />;
}
