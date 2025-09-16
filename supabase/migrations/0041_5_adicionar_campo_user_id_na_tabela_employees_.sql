-- Adicionar coluna user_id na tabela employees, se não existir
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;