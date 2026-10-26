-- PRODUCT IMAGES
-- Metadata gambar produk. File aktual dapat disimpan di Supabase Storage.

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT,
  public_url TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_images_file_reference CHECK (storage_path IS NOT NULL OR public_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_product_images_owner_product
  ON public.product_images(owner_id, product_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_primary
  ON public.product_images(product_id)
  WHERE is_primary = TRUE;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own product images"
  ON public.product_images FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
