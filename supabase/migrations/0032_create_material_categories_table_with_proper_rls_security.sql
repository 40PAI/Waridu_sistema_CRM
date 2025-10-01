-- Create material_categories table
CREATE TABLE public.material_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read categories (public read access)
CREATE POLICY "allow_authenticated_read_for_material_categories" ON public.material_categories 
FOR SELECT TO authenticated USING (true);

-- Allow admins to manage categories (CRUD operations)
CREATE POLICY "allow_admins_to_manage_material_categories" ON public.material_categories 
FOR ALL TO authenticated USING (
  (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'Admin'::text
);