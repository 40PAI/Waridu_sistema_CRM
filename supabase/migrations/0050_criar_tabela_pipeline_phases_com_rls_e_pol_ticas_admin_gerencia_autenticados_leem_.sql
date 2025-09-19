CREATE TABLE IF NOT EXISTS public.pipeline_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#e5e7eb', -- cinza claro por padrão
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pipeline_phases ENABLE ROW LEVEL SECURITY;

-- Leitura para usuários autenticados
CREATE POLICY pipeline_phases_select_authenticated
ON public.pipeline_phases
FOR SELECT
TO authenticated
USING (true);

-- Admin pode inserir/atualizar/apagar
CREATE POLICY pipeline_phases_modify_admin
ON public.pipeline_phases
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
);