import type { Metadata } from "next";
import { ProductList } from "@/components/pages/products/product-list";

export const metadata: Metadata = {
  title: "Produk",
  description: "Daftar dan manajemen produk warung.",
};

export default function ProductsPage() {
  return <ProductList />;
}
