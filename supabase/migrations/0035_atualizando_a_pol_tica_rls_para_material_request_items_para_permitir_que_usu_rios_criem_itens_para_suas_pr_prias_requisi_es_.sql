-- Remover a política existente para evitar conflitos ou ambiguidades
DROP POLICY IF EXISTS "Itens podem ser criados por gestores/admins" ON public.material_request_items;

-- Criar uma nova política que permite a usuários autenticados inserir itens
-- APENAS SE o 'request_id' do item corresponder a uma requisição que eles mesmos iniciaram.
CREATE POLICY "Users can insert their own material request items" ON public.material_request_items
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.material_requests mr
        WHERE mr.id = material_request_items.request_id
        AND mr.requested_by_id = auth.uid()
    )
);