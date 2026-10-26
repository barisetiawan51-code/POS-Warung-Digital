-- Add owner profile image reference.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
