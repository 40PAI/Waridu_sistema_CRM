-- 1.1 Colunas novas
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT TRUE, -- Alterado para TRUE como padrão
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL; -- opcional (soft delete)

-- 1.2 Função de updated_at (se ainda não existir no schema público)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.3 Trigger de updated_at (services)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_services'
  ) THEN
    CREATE TRIGGER handle_updated_at_services
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;

-- 1.4 Índices úteis
CREATE INDEX IF NOT EXISTS idx_services_is_active_created
  ON public.services (is_active, created_at DESC);

-- 1.5 RLS (ajuste conforme seu modelo de perfis/roles)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- SELECT para autenticados (ou público, se desejar)
DROP POLICY IF EXISTS services_select_authenticated ON public.services;
CREATE POLICY services_select_authenticated
  ON public.services FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- INSERT apenas Admin e Coordenador (Gestor Comercial)
DROP POLICY IF EXISTS services_insert_admin_coordenador ON public.services;
CREATE POLICY services_insert_admin_coordenador
  ON public.services FOR INSERT TO authenticated
  WITH CHECK ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) IN ('Admin', 'Coordenador'));

-- UPDATE apenas Admin e Coordenador (Gestor Comercial)
DROP POLICY IF EXISTS services_update_admin_coordenador ON public.services;
CREATE POLICY services_update_admin_coordenador
  ON public.services FOR UPDATE TO authenticated
  USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) IN ('Admin', 'Coordenador'));

-- DELETE apenas Admin (soft delete)
DROP POLICY IF EXISTS services_delete_admin ON public.services;
CREATE POLICY services_delete_admin
  ON public.services FOR DELETE TO authenticated
  USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'Admin');

-- Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';