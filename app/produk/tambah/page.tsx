import type { Metadata } from "next";
import { getCategories } from "@/lib/data/store";
import { fetchCategoriesServer } from "@/lib/data/category-server";
import { ProductForm } from "@/components/pages/products/product-form";

export const metadata: Metadata = {
  title: "Tambah Produk Baru",
  description: "Form penambahan data produk warung.",
};

export default async function AddProductPage() {
  const categories = (await fetchCategoriesServer()) ?? (await getCategories());

  return <ProductForm categories={categories} />;
}
