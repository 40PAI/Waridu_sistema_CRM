-- Habilitar RLS (se não estiver habilitado)
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_request_items ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Gestores de material podem ver todas as requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Admins podem ver todas as requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Usuários podem criar requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Gestores de material podem atualizar requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Admins podem atualizar requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Itens de requisições visíveis via requisição" ON public.material_request_items;
DROP POLICY IF EXISTS "Itens podem ser criados por gestores/admins" ON public.material_request_items;

-- Criar políticas para material_requests
CREATE POLICY "Usuários podem ver suas próprias requisições" ON public.material_requests 
FOR SELECT TO authenticated USING (requested_by_id = auth.uid());

CREATE POLICY "Gestores de material podem ver todas as requisições" ON public.material_requests 
FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'Gestor de Material'
    )
);

CREATE POLICY "Admins podem ver todas as requisições" ON public.material_requests 
FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'Admin'
    )
);

CREATE POLICY "Usuários podem criar requisições" ON public.material_requests 
FOR INSERT TO authenticated WITH CHECK (requested_by_id = auth.uid());

CREATE POLICY "Gestores de material podem atualizar requisições" ON public.material_requests 
FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'Gestor de Material'
    )
);

CREATE POLICY "Admins podem atualizar requisições" ON public.material_requests 
FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'Admin'
    )
);

-- Criar políticas para material_request_items
CREATE POLICY "Itens de requisições visíveis via requisição" ON public.material_request_items 
FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.material_requests 
        WHERE public.material_requests.id = public.material_request_items.request_id
        AND (
            public.material_requests.requested_by_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('Gestor de Material', 'Admin')
            )
        )
    )
);

CREATE POLICY "Itens podem ser criados por gestores/admins" ON public.material_request_items 
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.material_requests 
        WHERE public.material_requests.id = public.material_request_items.request_id
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Gestor de Material', 'Admin')
        )
    )
);