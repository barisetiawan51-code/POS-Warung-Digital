-- 4. CATEGORIES PREFIX (for SKU auto-generation)
-- Adds an optional prefix column so products can auto-generate SKUs like
-- "SEM-001", "MIE-001" based on the parent category.
ALTER TABLE IF EXISTS public.categories
  ADD COLUMN IF NOT EXISTS prefix TEXT;

-- Index for quick lookup of existing prefixes
CREATE INDEX IF NOT EXISTS idx_categories_prefix ON public.categories (prefix);
