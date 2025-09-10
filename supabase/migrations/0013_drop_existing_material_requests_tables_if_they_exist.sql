-- Drop existing policies first
DROP POLICY IF EXISTS "Usuários podem ver suas próprias requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Gestores de material podem ver todas as requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Admins podem ver todas as requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Usuários podem criar requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Gestores de material podem atualizar requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Admins podem atualizar requisições" ON public.material_requests;
DROP POLICY IF EXISTS "Itens de requisições visíveis via requisição" ON public.material_request_items;
DROP POLICY IF EXISTS "Itens podem ser criados por gestores/admins" ON public.material_request_items;

-- Drop tables if they exist
DROP TABLE IF EXISTS public.material_request_items;
DROP TABLE IF EXISTS public.material_requests;