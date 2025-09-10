-- 1. Criar a tabela para o inventário de materiais
CREATE TABLE public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'Disponível',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança
-- Permite que usuários autenticados leiam a lista de materiais
CREATE POLICY "allow_authenticated_read_for_materials" ON public.materials
FOR SELECT TO authenticated USING (true);

-- Permite que Admins e Gestores de Material gerenciem os materiais
CREATE POLICY "allow_managers_to_manage_materials" ON public.materials
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gestor de Material'))
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gestor de Material'));