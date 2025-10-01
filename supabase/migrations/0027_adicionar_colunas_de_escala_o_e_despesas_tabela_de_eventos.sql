-- Adicionar colunas para armazenar dados de escalação e despesas como JSON
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS roster JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS expenses JSONB;

-- Adicionar políticas de segurança para as novas colunas
-- Permitir que Admins e Coordenadores atualizem a escalação e as despesas
CREATE POLICY "allow_roster_expenses_update_for_managers"
ON public.events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Coordenador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Coordenador')
  )
);