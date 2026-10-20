// ==============================================================================
// WARUNGKU - CART, CASH & STOCK MATHEMATICAL UTILITIES
// ==============================================================================

import type { CartItem } from "@/lib/types/pos";

export type CartSummary = {
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
};

/**
 * Calculate totals for cart items
 */
export function calculateCartTotals(
  items: CartItem[],
  discount: number = 0,
): CartSummary {
  const safeDiscount = Math.max(0, discount || 0);

  let subtotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const qty = Math.max(0, item.quantity);
    const price = Math.max(0, item.product.selling_price);
    subtotal += qty * price;
    itemCount += qty;
  }

  const finalDiscount = Math.min(subtotal, safeDiscount);
  const total = Math.max(0, subtotal - finalDiscount);

  return {
    itemCount,
    subtotal,
    discount: finalDiscount,
    total,
  };
}

/**
 * Calculate cash change and validate sufficiency
 */
export function calculateCashChange(
  total: number,
  received: number,
): {
  isSufficient: boolean;
  change: number;
  deficit: number;
} {
  const safeTotal = Math.max(0, total);
  const safeReceived = Math.max(0, received);

  if (safeReceived >= safeTotal) {
    return {
      isSufficient: true,
      change: safeReceived - safeTotal,
      deficit: 0,
    };
  }

  return {
    isSufficient: false,
    change: 0,
    deficit: safeTotal - safeReceived,
  };
}

/**
 * Check if a product has low stock
 */
export function isLowStock(stock: number, minimumStock: number): boolean {
  return stock <= minimumStock;
}

/**
 * Calculate growth percentage safely
 */
export function calculateGrowthPercent(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}
