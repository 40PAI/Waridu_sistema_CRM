-- Adicionar campos next_action_time e responsible_id à tabela events
-- UI Próxima Ação - Hora => BD next_action_time (TIME)
-- UI Responsável Comercial => BD responsible_id (UUID - FK para employees/profiles)

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS next_action_time TIME,
ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES profiles(id);

-- Criar índice para melhor performance de queries por responsável
CREATE INDEX IF NOT EXISTS idx_events_responsible_id ON events(responsible_id);

-- Comentários para documentação
COMMENT ON COLUMN events.next_action_time IS 'Hora da próxima ação planeada para este evento/projeto';
COMMENT ON COLUMN events.responsible_id IS 'ID do funcionário comercial responsável por este evento/projeto';