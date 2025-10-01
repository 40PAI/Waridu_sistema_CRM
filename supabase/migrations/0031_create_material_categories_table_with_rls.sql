-- Create material_categories table
CREATE TABLE public.material_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow read material categories" ON public.material_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert material categories" ON public.material_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update material categories" ON public.material_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete material categories" ON public.material_categories FOR DELETE TO authenticated USING (true);