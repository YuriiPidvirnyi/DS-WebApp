-- Materials system enhancement: images, audit, atomic inventory functions.

-- 1. Add image_url to materials
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Add approval tracking to material_orders
ALTER TABLE public.material_orders
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.admin_users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Supabase Storage bucket for material images
INSERT INTO storage.buckets (id, name, public)
VALUES ('material-images', 'material-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read, admin write
CREATE POLICY "material_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'material-images');
CREATE POLICY "material_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'material-images' AND public.is_admin_actor());
CREATE POLICY "material_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'material-images' AND public.is_admin_actor());
CREATE POLICY "material_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'material-images' AND public.is_admin_actor());

-- 4. Atomic inventory deduction (prevents race conditions)
CREATE OR REPLACE FUNCTION public.deduct_inventory(
  p_material_id UUID, p_qty NUMERIC, p_location TEXT DEFAULT ''
) RETURNS NUMERIC LANGUAGE SQL AS $$
  UPDATE public.material_inventory
  SET current_quantity = GREATEST(0, current_quantity - p_qty),
      last_restocked_at = CURRENT_DATE
  WHERE material_id = p_material_id AND storage_location = p_location
  RETURNING current_quantity;
$$;

-- 5. Atomic inventory addition
CREATE OR REPLACE FUNCTION public.add_inventory(
  p_material_id UUID, p_qty NUMERIC, p_location TEXT DEFAULT ''
) RETURNS NUMERIC LANGUAGE SQL AS $$
  UPDATE public.material_inventory
  SET current_quantity = current_quantity + p_qty,
      last_restocked_at = CURRENT_DATE
  WHERE material_id = p_material_id AND storage_location = p_location
  RETURNING current_quantity;
$$;
