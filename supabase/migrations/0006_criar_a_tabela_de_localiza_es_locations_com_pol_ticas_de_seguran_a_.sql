-- 1. Criar a tabela para armazenar as localizações de inventário
CREATE TABLE public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança
-- Permite que usuários autenticados leiam as localizações
CREATE POLICY "allow_authenticated_read_for_locations" ON public.locations
FOR SELECT TO authenticated USING (true);

-- Permite que apenas Admins gerenciem as localizações
CREATE POLICY "allow_admins_to_manage_locations" ON public.locations
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');