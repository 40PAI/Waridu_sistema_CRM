-- Criar tabela services
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "services_select_policy" ON public.services 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "services_insert_policy" ON public.services 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "services_update_policy" ON public.services 
FOR UPDATE TO authenticated WITH CHECK (true);

CREATE POLICY "services_delete_policy" ON public.services 
FOR DELETE TO authenticated USING (true);