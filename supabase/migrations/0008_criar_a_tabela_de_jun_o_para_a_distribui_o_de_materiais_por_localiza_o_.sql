-- 1. Criar a tabela para rastrear a quantidade de cada material em cada localização
CREATE TABLE public.material_locations (
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (material_id, location_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.material_locations ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança
-- Permite que usuários autenticados leiam a distribuição dos materiais
CREATE POLICY "allow_authenticated_read_for_material_locations" ON public.material_locations
FOR SELECT TO authenticated USING (true);

-- Permite que Admins e Gestores de Material gerenciem a distribuição
CREATE POLICY "allow_managers_to_manage_material_locations" ON public.material_locations
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gestor de Material'))
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Gestor de Material'));