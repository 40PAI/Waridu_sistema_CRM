-- 1. Enable RLS (idempotent)
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

-- 2. SELECT policy: Allow all authenticated users to read
DROP POLICY IF EXISTS "allow_authenticated_read_for_material_categories" ON material_categories;
CREATE POLICY "allow_authenticated_read_for_material_categories" ON material_categories 
FOR SELECT TO authenticated USING (true);

-- 3. INSERT policy: Allow only Admin and Gestor de Material
DROP POLICY IF EXISTS "allow_admins_to_manage_material_categories_insert" ON material_categories;
CREATE POLICY "allow_admins_to_manage_material_categories_insert" ON material_categories 
FOR INSERT TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['Admin'::text, 'Gestor de Material'::text])
));

-- 4. UPDATE policy: Allow only Admin and Gestor de Material
DROP POLICY IF EXISTS "allow_admins_to_manage_material_categories_update" ON material_categories;
CREATE POLICY "allow_admins_to_manage_material_categories_update" ON material_categories 
FOR UPDATE TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['Admin'::text, 'Gestor de Material'::text])
));

-- 5. DELETE policy: Allow only Admin and Gestor de Material
DROP POLICY IF EXISTS "allow_admins_to_manage_material_categories_delete" ON material_categories;
CREATE POLICY "allow_admins_to_manage_material_categories_delete" ON material_categories 
FOR DELETE TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['Admin'::text, 'Gestor de Material'::text])
));

-- 6. Verification: List all policies to confirm (fixed column names)
SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'material_categories';