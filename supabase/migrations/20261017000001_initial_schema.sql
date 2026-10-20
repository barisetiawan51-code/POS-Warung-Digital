-- ============================================================================
-- WARUNGKU POS & MANAGEMENT - INITIAL DATABASE SCHEMA
-- Migration: 20261017000001_initial_schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Store Owner Profile)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL DEFAULT 'Warung Barokah Rezeki',
  owner_name TEXT NOT NULL DEFAULT 'Bari Setiawan',
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'cashier', 'admin')),
  phone TEXT DEFAULT '081234567890',
  address TEXT DEFAULT 'Jl. Raya Warung No. 12',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_categories_owner_name UNIQUE (owner_id, name)
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
  selling_price NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
  stock NUMERIC(14,3) NOT NULL DEFAULT 0.000 CHECK (stock >= 0),
  minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 5.000 CHECK (minimum_stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_products_owner_sku UNIQUE (owner_id, sku)
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  idempotency_key TEXT,
  subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  total NUMERIC(14,2) NOT NULL CHECK (total >= 0),
  transaction_status TEXT NOT NULL DEFAULT 'completed' CHECK (transaction_status IN ('completed', 'cancelled', 'refunded', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_orders_owner_invoice UNIQUE (owner_id, invoice_number),
  CONSTRAINT uq_orders_owner_idempotency UNIQUE (owner_id, idempotency_key)
);

-- 5. ORDER ITEMS (Immutable Snapshot)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
  line_subtotal NUMERIC(14,2) NOT NULL CHECK (line_subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'online')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  cash_received NUMERIC(14,2) CHECK (cash_received >= 0),
  cash_change NUMERIC(14,2) DEFAULT 0.00 CHECK (cash_change >= 0),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed', 'refunded')),
  provider_reference TEXT,
  verification_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_timestamp TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. STOCK MOVEMENTS (Auditable Ledger)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_change NUMERIC(14,3) NOT NULL, -- positive for restock/refund, negative for sale
  balance_after NUMERIC(14,3) NOT NULL DEFAULT 0.000,
  reason TEXT NOT NULL CHECK (reason IN ('sale', 'restock', 'adjustment', 'refund', 'damage', 'loss')),
  reference_id TEXT, -- e.g. order invoice_number
  acting_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name TEXT DEFAULT 'Bank BCA',
  bank_account_number TEXT DEFAULT '1234567890',
  bank_account_holder TEXT DEFAULT 'Bari Setiawan',
  default_minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 5.000,
  is_online_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_owner_category ON public.products(owner_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_active ON public.products(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_owner_date ON public.orders(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_owner_product ON public.stock_movements(owner_id, product_id, created_at DESC);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- ROW LEVEL SECURITY POLICIES
-- Profiles
CREATE POLICY "Users can view and update their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Categories
CREATE POLICY "Owner can manage own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Products
CREATE POLICY "Owner can manage own products"
  ON public.products FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Orders
CREATE POLICY "Owner can manage own orders"
  ON public.orders FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Order Items
CREATE POLICY "Owner can view own order items"
  ON public.order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.owner_id = auth.uid()));

-- Payments
CREATE POLICY "Owner can view and update own payments"
  ON public.payments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.owner_id = auth.uid()));

-- Stock Movements
CREATE POLICY "Owner can view and insert own stock movements"
  ON public.stock_movements FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Audit Logs
CREATE POLICY "Owner can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = actor_id);

-- Store Settings
CREATE POLICY "Owner can manage own store settings"
  ON public.store_settings FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
