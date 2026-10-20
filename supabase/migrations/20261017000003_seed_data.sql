-- ============================================================================
-- WARUNGKU POS & MANAGEMENT - SEED DATA FOR DEMO & TESTING
-- Migration: 20261017000003_seed_data.sql
-- ============================================================================

-- Function to seed sample data for a given user/owner
CREATE OR REPLACE FUNCTION public.seed_warungku_demo_data(p_owner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cat_sembako UUID;
  v_cat_minuman UUID;
  v_cat_sabun UUID;
  v_cat_snack UUID;
  v_p1 UUID;
  v_p2 UUID;
  v_p3 UUID;
  v_p4 UUID;
  v_p5 UUID;
BEGIN
  -- Insert categories
  INSERT INTO public.categories (owner_id, name)
  VALUES (p_owner_id, 'Sembako')
  ON CONFLICT (owner_id, name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_cat_sembako;

  INSERT INTO public.categories (owner_id, name)
  VALUES (p_owner_id, 'Minuman')
  ON CONFLICT (owner_id, name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_cat_minuman;

  INSERT INTO public.categories (owner_id, name)
  VALUES (p_owner_id, 'Sabun & Kebersihan')
  ON CONFLICT (owner_id, name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_cat_sabun;

  INSERT INTO public.categories (owner_id, name)
  VALUES (p_owner_id, 'Makanan Ringan')
  ON CONFLICT (owner_id, name) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_cat_snack;

  -- Insert products from the dashboard reference
  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sembako, 'SEM-002', 'Minyak Goreng Bimoli 1L', 'pouch', 16500.00, 19500.00, 4.000, 5.000, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p1;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sembako, 'TEL-001', 'Telur Ayam Negeri 1kg', 'kg', 25000.00, 29000.00, 2.000, 5.000, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p2;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_minuman, 'MIN-001', 'Aqua Botol 600ml', 'botol', 3000.00, 4000.00, 35.000, 10.000, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p3;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sabun, 'SAB-001', 'Sabun Lifebuoy Total 10 110g', 'pcs', 3800.00, 5000.00, 3.000, 5.000, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p4;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_minuman, 'KOP-001', 'Kopi Kapal Api Spesial Mix', 'sachet', 1800.00, 2500.00, 50.000, 10.000, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p5;

  -- Additional grocery items
  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sembako, 'SEM-001', 'Beras Ramos Super 5kg', 'karung', 65000.00, 72000.00, 12.000, 5.000, true)
  ON CONFLICT (owner_id, sku) DO NOTHING;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sembako, 'SEM-003', 'Gula Pasir Gulaku 1kg', 'pack', 14500.00, 17000.00, 18.000, 5.000, true)
  ON CONFLICT (owner_id, sku) DO NOTHING;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_snack, 'SNK-001', 'Indomie Goreng Original', 'bungkus', 2600.00, 3100.00, 80.000, 20.000, true)
  ON CONFLICT (owner_id, sku) DO NOTHING;
END;
$$;
