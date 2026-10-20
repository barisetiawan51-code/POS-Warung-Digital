// Re-export realtime functions for client usage
export {
  onSyncEvent,
  subscribeToCategories,
  subscribeToOrders,
  subscribeToProducts,
  subscribeToStockMovements,
  subscribeToStoreSettings,
} from "@/lib/data/supabase-service";

