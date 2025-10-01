-- Criar tabela clients
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nif TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "clients_select_policy" ON public.clients 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "clients_insert_policy" ON public.clients 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "clients_update_policy" ON public.clients 
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "clients_delete_policy" ON public.clients 
FOR DELETE TO authenticated USING (true);