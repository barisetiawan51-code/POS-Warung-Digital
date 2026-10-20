"use server";

import { createProductServer as createProductImpl,
   updateProductServer as updateProductImpl,
   deleteProductServer as deleteProductImpl,
   setProductActiveServer as setProductActiveImpl,
} from "@/lib/actions/product-server";
import type { Product } from "@/lib/types/pos";

export async function createProductAction(payload: {
   sku?: string;
   name: string;
   category_id?: string | null;
   unit: string;
   cost_price: number;
   selling_price: number;
   stock: number;
   minimum_stock: number;
}): Promise<{ success: boolean; product?: Product; error?: string }> {
   try {
     return await createProductImpl(payload);
   } catch (e: unknown) {
     const err = e as Error;
     return { success: false, error: err.message || "Gagal membuat produk." };
   }
}

export async function updateProductAction(id: string, payload: {
   sku?: string;
   name: string;
   category_id?: string | null;
   unit: string;
   cost_price: number;
   selling_price: number;
   stock: number;
   minimum_stock: number;
   is_active: boolean;
}): Promise<{ success: boolean; product?: Product; error?: string }> {
   try {
     return await updateProductImpl(id, payload);
   } catch (e: unknown) {
     const err = e as Error;
     return { success: false, error: err.message || "Gagal memperbarui produk." };
   }
}

export async function deleteProductAction(id: string): Promise<{ success: boolean; error?: string }> {
   try {
     return await deleteProductImpl(id);
   } catch (e: unknown) {
     const err = e as Error;
     return { success: false, error: err.message || "Gagal menghapus produk." };
   }
}

export async function setProductActiveAction(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
   try {
     return await setProductActiveImpl(id, isActive);
   } catch (e: unknown) {
     const err = e as Error;
     return { success: false, error: err.message || "Gagal memperbarui status produk." };
   }
}
