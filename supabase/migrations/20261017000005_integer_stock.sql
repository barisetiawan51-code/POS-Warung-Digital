-- ============================================================================
-- WARUNGKU POS & MANAGEMENT - STOK SEBAGAI BILANGAN BULAT
-- Migration: 20261017000005_integer_stock.sql
--
-- Sebelumnya kolom stok memakai NUMERIC(14,3) sehingga tersimpan/dibaca sebagai
-- "10.000". Warung menghitung stok dalam satuan utuh, jadi tipe diubah ke INTEGER.
-- Nilai lama dibulatkan (round) agar tidak kehilangan data.
-- ============================================================================

-- 1. PRODUCTS: stok & ambang minimum
ALTER TABLE public.products
  ALTER COLUMN stock TYPE INTEGER USING round(stock)::INTEGER,
  ALTER COLUMN stock SET DEFAULT 0,
  ALTER COLUMN minimum_stock TYPE INTEGER USING round(minimum_stock)::INTEGER,
  ALTER COLUMN minimum_stock SET DEFAULT 5;

-- 2. ORDER ITEMS: kuantitas jual
ALTER TABLE public.order_items
  ALTER COLUMN quantity TYPE INTEGER USING round(quantity)::INTEGER;

-- 3. STOCK MOVEMENTS: ledger masuk/keluar
ALTER TABLE public.stock_movements
  ALTER COLUMN quantity_change TYPE INTEGER USING round(quantity_change)::INTEGER,
  ALTER COLUMN balance_after TYPE INTEGER USING round(balance_after)::INTEGER,
  ALTER COLUMN balance_after SET DEFAULT 0;

-- 4. STORE SETTINGS: ambang minimum default
ALTER TABLE public.store_settings
  ALTER COLUMN default_minimum_stock TYPE INTEGER USING round(default_minimum_stock)::INTEGER,
  ALTER COLUMN default_minimum_stock SET DEFAULT 5;

-- 5. RPC checkout & refund: variabel stok ikut INTEGER (hindari pembulatan diam-diam
--    saat UPDATE products.stock). Body sama seperti migrasi 20261017000002.
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_owner_id UUID,
  p_invoice_number TEXT,
  p_idempotency_key TEXT,
  p_items JSONB, -- Array of objects: { product_id, quantity }
  p_discount NUMERIC,
  p_payment_method TEXT,
  p_cash_received NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
  v_subtotal NUMERIC(14,2) := 0.00;
  v_discount NUMERIC(14,2) := COALESCE(p_discount, 0.00);
  v_total NUMERIC(14,2) := 0.00;
  v_cash_change NUMERIC(14,2) := 0.00;
  v_order_id UUID;
  v_payment_id UUID;
  v_payment_status TEXT;
  v_new_stock INTEGER;
  v_existing_order_id UUID;
BEGIN
  -- 1. Check idempotency: if an order with this key already exists for this owner, return it safely
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_order_id
    FROM public.orders
    WHERE owner_id = p_owner_id AND idempotency_key = p_idempotency_key;

    IF v_existing_order_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_existing_order_id,
        'invoice_number', p_invoice_number,
        'message', 'Transaksi sudah diproses sebelumnya (idempotent)'
      );
    END IF;
  END IF;

  -- 2. Validate payment method
  IF p_payment_method NOT IN ('cash', 'transfer', 'online') THEN
    RAISE EXCEPTION 'Metode pembayaran tidak valid: %', p_payment_method;
  END IF;

  IF p_payment_method IN ('cash', 'online') THEN
    v_payment_status := 'paid';
  ELSE
    v_payment_status := 'pending';
  END IF;

  -- 3. Calculate subtotal and check product validity and stock
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER)
  LOOP
    -- Lock row FOR UPDATE to prevent concurrency race conditions
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_item.product_id AND owner_id = p_owner_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk tidak ditemukan atau tidak aktif: %', v_item.product_id;
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Stok tidak mencukupi untuk % (Tersedia: %, Diminta: %)',
        v_product.name, v_product.stock, v_item.quantity;
    END IF;

    v_subtotal := v_subtotal + (v_product.selling_price * v_item.quantity);
  END LOOP;

  -- Calculate final total
  v_total := GREATEST(v_subtotal - v_discount, 0.00);

  -- For cash payment, validate sufficient payment
  IF p_payment_method = 'cash' THEN
    IF COALESCE(p_cash_received, 0.00) < v_total THEN
      RAISE EXCEPTION 'Uang tunai yang diterima (Rp %) kurang dari total belanja (Rp %)',
        p_cash_received, v_total;
    END IF;
    v_cash_change := p_cash_received - v_total;
  END IF;

  -- 4. Create Order
  INSERT INTO public.orders (
    owner_id,
    invoice_number,
    idempotency_key,
    subtotal,
    discount,
    total,
    transaction_status,
    notes
  ) VALUES (
    p_owner_id,
    p_invoice_number,
    p_idempotency_key,
    v_subtotal,
    v_discount,
    v_total,
    CASE WHEN v_payment_status = 'paid' THEN 'completed' ELSE 'pending' END,
    p_notes
  ) RETURNING id INTO v_order_id;

  -- 5. Insert Order Items & Deduct Stock & Record Stock Movements
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER)
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id;

    -- Insert snapshot
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      sku,
      unit,
      quantity,
      unit_price,
      cost_price,
      line_subtotal
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_product.unit,
      v_item.quantity,
      v_product.selling_price,
      v_product.cost_price,
      (v_product.selling_price * v_item.quantity)
    );

    -- Deduct stock
    v_new_stock := v_product.stock - v_item.quantity;
    UPDATE public.products
    SET stock = v_new_stock, updated_at = now()
    WHERE id = v_product.id;

    -- Record stock movement ledger
    INSERT INTO public.stock_movements (
      owner_id,
      product_id,
      quantity_change,
      balance_after,
      reason,
      reference_id,
      acting_user,
      notes
    ) VALUES (
      p_owner_id,
      v_product.id,
      -v_item.quantity,
      v_new_stock,
      'sale',
      p_invoice_number,
      auth.uid(),
      'Penjualan kasir via ' || p_payment_method
    );
  END LOOP;

  -- 6. Insert Payment Record
  INSERT INTO public.payments (
    order_id,
    payment_method,
    amount,
    cash_received,
    cash_change,
    payment_status,
    verification_user,
    verification_timestamp
  ) VALUES (
    v_order_id,
    p_payment_method,
    v_total,
    p_cash_received,
    v_cash_change,
    v_payment_status,
    CASE WHEN v_payment_status = 'paid' THEN auth.uid() ELSE NULL END,
    CASE WHEN v_payment_status = 'paid' THEN now() ELSE NULL END
  ) RETURNING id INTO v_payment_id;

  -- Return successful result object
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'invoice_number', p_invoice_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_total,
    'cash_change', v_cash_change,
    'payment_status', v_payment_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_refund(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Pembatalan transaksi oleh pemilik warung'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_new_stock INTEGER;
BEGIN
  -- 1. Fetch and lock order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND owner_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan atau akses tidak diizinkan';
  END IF;

  IF v_order.transaction_status IN ('cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Transaksi sudah dibatalkan atau dikembalikan sebelumnya';
  END IF;

  -- 2. Restore stock for each item in order
  FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = stock + v_item.quantity, updated_at = now()
      WHERE id = v_item.product_id
      RETURNING stock INTO v_new_stock;

      INSERT INTO public.stock_movements (
        owner_id,
        product_id,
        quantity_change,
        balance_after,
        reason,
        reference_id,
        acting_user,
        notes
      ) VALUES (
        v_order.owner_id,
        v_item.product_id,
        v_item.quantity,
        v_new_stock,
        'refund',
        v_order.invoice_number,
        auth.uid(),
        p_reason
      );
    END IF;
  END LOOP;

  -- 3. Update order and payment status
  --      Cancellation: unpaid/pending transfer order → cancelled + failed
  --      Refund:       already-paid order              → refunded + refunded
  UPDATE public.orders
  SET transaction_status =
        CASE
          WHEN (SELECT payment_status FROM public.payments WHERE order_id = p_order_id) = 'pending'
          THEN 'cancelled'
          ELSE 'refunded'
        END,
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.payments
  SET payment_status =
        CASE
          WHEN payment_status = 'pending' THEN 'failed'
          ELSE 'refunded'
        END,
      updated_at = now()
  WHERE order_id = p_order_id;

  -- 4. Audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    auth.uid(),
    'refund_order',
    'orders',
    p_order_id::text,
    jsonb_build_object('invoice_number', v_order.invoice_number, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transaksi berhasil dibatalkan dan stok telah dikembalikan ke inventaris'
  );
END;
$$;

-- 6. Seed demo: literals desimal dibulatkan agar sesuai tipe INTEGER
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

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sembako, 'SEM-002', 'Minyak Goreng Bimoli 1L', 'pouch', 16500.00, 19500.00, 4, 5, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p1;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sembako, 'TEL-001', 'Telur Ayam Negeri 1kg', 'kg', 25000.00, 29000.00, 2, 5, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p2;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_minuman, 'MIN-001', 'Aqua Botol 600ml', 'botol', 3000.00, 4000.00, 35, 10, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p3;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sabun, 'SAB-001', 'Sabun Lifebuoy Total 10 110g', 'pcs', 3800.00, 5000.00, 3, 5, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p4;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_minuman, 'KOP-001', 'Kopi Kapal Api Spesial Mix', 'sachet', 1800.00, 2500.00, 50, 10, true)
  ON CONFLICT (owner_id, sku) DO NOTHING
  RETURNING id INTO v_p5;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sembako, 'SEM-001', 'Beras Ramos Super 5kg', 'karung', 65000.00, 72000.00, 12, 5, true)
  ON CONFLICT (owner_id, sku) DO NOTHING;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_sembako, 'SEM-003', 'Gula Pasir Gulaku 1kg', 'pack', 14500.00, 17000.00, 18, 5, true)
  ON CONFLICT (owner_id, sku) DO NOTHING;

  INSERT INTO public.products (owner_id, category_id, sku, name, unit, cost_price, selling_price, stock, minimum_stock, is_active)
  VALUES (p_owner_id, v_cat_snack, 'SNK-001', 'Indomie Goreng Original', 'bungkus', 2600.00, 3100.00, 80, 20, true)
  ON CONFLICT (owner_id, sku) DO NOTHING;
END;
$$;
