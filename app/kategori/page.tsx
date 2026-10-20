import type { Metadata } from "next";
import { CategoryManager } from "@/components/pages/categories/category-manager";

export const metadata: Metadata = {
  title: "Kategori",
  description: "Kelola kategori produk toko warung.",
};

export default function CategoriesPage() {
  return <CategoryManager />;
}
