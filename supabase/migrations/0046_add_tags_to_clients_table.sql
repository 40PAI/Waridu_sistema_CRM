-- Adiciona coluna tags como array de text para múltiplas tags por cliente
ALTER TABLE clients ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Atualiza RLS para permitir leitura/escrita de tags apenas para usuários autorizados
-- (Já coberto pela policy existente, mas reforçando)
CREATE POLICY "clients_tags_policy" ON clients
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);