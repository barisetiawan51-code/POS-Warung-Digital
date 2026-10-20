import type { Metadata } from "next";
import { fetchCategoriesServer } from "@/lib/data/category-server";
import { ProductForm } from "@/components/pages/products/product-form";

export const metadata: Metadata = {
  title: "Tambah Produk Baru",
  description: "Form penambahan data produk warung.",
};

export default async function AddProductPage() {
  const categories = (await fetchCategoriesServer()) ?? [];

  return <ProductForm categories={categories} />;
}
