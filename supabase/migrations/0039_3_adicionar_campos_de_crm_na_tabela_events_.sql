-- Adicionar colunas de CRM na tabela events, se não existirem
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT '1º Contato',
ADD COLUMN IF NOT EXISTS service_ids UUID[],
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC,
ADD COLUMN IF NOT EXISTS notes TEXT;