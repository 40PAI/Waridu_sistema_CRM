-- 1. Criar a tabela para armazenar as funções
CREATE TABLE public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar a Segurança em Nível de Linha (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança
-- Permite que todos os usuários autenticados leiam as funções (necessário para preencher seletores na UI)
CREATE POLICY "allow_authenticated_read_for_roles" ON public.roles
FOR SELECT TO authenticated USING (true);

-- Permite que apenas Admins criem, atualizem ou apaguem funções
CREATE POLICY "allow_admins_to_manage_roles" ON public.roles
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin');