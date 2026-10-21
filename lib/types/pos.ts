// ==============================================================================
// WARUNGKU - POS & STORE MANAGEMENT DATA TYPES
// ==============================================================================

export type UserRole = "owner" | "cashier" | "admin";

export type Profile = {
  id: string;
  store_name: string;
  owner_name: string;
  role: UserRole;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  owner_id: string;
  name: string;
  prefix?: string;
  product_count?: number;
  created_at: string;
  updated_at?: string;
};

export type Product = {
  id: string;
  owner_id: string;
  category_id: string | null;
  category_name?: string;
  sku: string;
  name: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  minimum_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type PaymentMethod = "cash" | "transfer" | "online";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type TransactionStatus =
  "completed" | "cancelled" | "refunded" | "pending";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  sku: string;
  unit: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  line_subtotal: number;
  created_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  amount: number;
  cash_received?: number | null;
  cash_change?: number | null;
  payment_status: PaymentStatus;
  provider_reference?: string | null;
  verification_user?: string | null;
  verification_timestamp?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
};

export type Order = {
  id: string;
  owner_id: string;
  invoice_number: string;
  idempotency_key?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  transaction_status: TransactionStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  payment?: Payment | null;
};

export type StockMovementReason =
  "sale" | "restock" | "adjustment" | "refund" | "damage" | "loss";

export type StockMovement = {
  id: string;
  owner_id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity_change: number;
  balance_after: number;
  reason: StockMovementReason;
  reference_id?: string | null;
  acting_user?: string | null;
  notes?: string | null;
  created_at: string;
};

export type StoreSettings = {
  id: string;
  store_name: string;
  owner_name: string;
  phone: string;
  address: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  default_minimum_stock: number;
  is_online_payment_enabled: boolean;
  qris_image_url?: string;
  qris_nmid?: string;
  email?: string;
  password?: string;
};

export type CheckoutPayload = {
  items: {
    product_id: string;
    quantity: number;
  }[];
  discount: number;
  payment_method: PaymentMethod;
  cash_received?: number;
  notes?: string;
  idempotency_key?: string;
};

export type CheckoutResult = {
  success: boolean;
  order_id: string;
  invoice_number: string;
  subtotal: number;
  discount: number;
  total: number;
  cash_change: number;
  payment_status: PaymentStatus;
  message?: string;
};

export type DashboardStats = {
  todaySales: number;
  yesterdaySales: number;
  salesGrowthPercent: number;
  todayTransactions: number;
  yesterdayTransactions: number;
  transactionGrowthPercent: number;
  totalProducts: number;
  lowStockCount: number;
  chartData: {
    date: string;
    label: string;
    sales: number;
  }[];
  topSellingProducts: {
    id: string;
    name: string;
    sku: string;
    quantitySold: number;
    revenue: number;
  }[];
  lowStockItems?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    stock: number;
    minimum_stock: number;
  }[];
  recentOrders?: Order[];
};
