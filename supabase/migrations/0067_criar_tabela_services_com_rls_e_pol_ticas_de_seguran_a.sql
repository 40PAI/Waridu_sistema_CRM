-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ativo' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies for each operation needed
-- Allow authenticated users to view services
CREATE POLICY "services_select_authenticated" ON public.services
FOR SELECT TO authenticated USING (true);

-- Allow Admin and Coordenador (Gestor Comercial) to insert services
CREATE POLICY "services_insert_admin_coordenador" ON public.services
FOR INSERT TO authenticated WITH CHECK (
  (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) IN ('Admin', 'Coordenador')
);

-- Allow Admin and Coordenador (Gestor Comercial) to update services
CREATE POLICY "services_update_admin_coordenador" ON public.services
FOR UPDATE TO authenticated USING (
  (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) IN ('Admin', 'Coordenador')
);

-- Allow Admin to delete services
CREATE POLICY "services_delete_admin" ON public.services
FOR DELETE TO authenticated USING (
  (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'Admin'
);

-- Create trigger to update 'updated_at' timestamp
CREATE TRIGGER handle_updated_at_services
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();