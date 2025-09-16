-- Adicionar coluna banned_until na tabela profiles, se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE;