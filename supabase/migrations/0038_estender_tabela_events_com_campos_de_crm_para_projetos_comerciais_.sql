-- Adicionar colunas de CRM à tabela events
ALTER TABLE public.events 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN pipeline_status TEXT DEFAULT '1º Contato' CHECK (pipeline_status IN ('1º Contato', 'Orçamento', 'Negociação', 'Confirmado')),
ADD COLUMN service_ids UUID[] DEFAULT '{}',
ADD COLUMN estimated_value NUMERIC,
ADD COLUMN notes TEXT;

-- Criar índice para performance
CREATE INDEX idx_events_client_id ON public.events(client_id);
CREATE INDEX idx_events_pipeline_status ON public.events(pipeline_status);

-- Atualizar política RLS para incluir campos de CRM
-- A política existente já permite acesso baseado no role, então não precisamos alterar