-- Migração: Implementar movimentação persistente do Kanban com RPC
-- Data: [Insira data atual]
-- Descrição: Adiciona RPC para movimentação de eventos no Kanban com cálculo de rank no servidor
--           Garante que movimentações sejam persistidas e reflitam após reload

-- 1.1 Colunas necessárias
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS pipeline_phase_id uuid,
  ADD COLUMN IF NOT EXISTS pipeline_rank bigint NOT NULL DEFAULT 0;

-- 1.2 Chave estrangeira para phases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='events'
      AND constraint_name='events_pipeline_phase_id_fkey'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_pipeline_phase_id_fkey
      FOREIGN KEY (pipeline_phase_id)
      REFERENCES public.pipeline_phases(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END$$;

-- 1.3 Índices para leitura/ordenação no board
CREATE INDEX IF NOT EXISTS idx_events_pipeline_phase_id
  ON public.events (pipeline_phase_id);

CREATE INDEX IF NOT EXISTS idx_events_phase_rank
  ON public.events (pipeline_phase_id, pipeline_rank, updated_at DESC);

-- 1.4 Trigger de updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='handle_updated_at_events') THEN
    CREATE TRIGGER handle_updated_at_events
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;

-- 1.5 RPC de movimentação (servidor calcula rank)
CREATE OR REPLACE FUNCTION public.rpc_move_event(
  p_event_id    integer,
  p_new_phase   uuid,
  p_before_id   integer DEFAULT NULL,
  p_after_id    integer DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_left_rank  bigint;
  v_right_rank bigint;
  v_new_rank   bigint;
  v_step       bigint := 1000000; -- passo grande para facilitar inserções
BEGIN
  -- Obter ranks dos vizinhos, se existirem, dentro da mesma fase destino
  IF p_before_id IS NOT NULL THEN
    SELECT e.pipeline_rank INTO v_left_rank
    FROM public.events e
    WHERE e.id = p_before_id AND e.pipeline_phase_id = p_new_phase;
  ELSE
    v_left_rank := NULL;
  END IF;

  IF p_after_id IS NOT NULL THEN
    SELECT e.pipeline_rank INTO v_right_rank
    FROM public.events e
    WHERE e.id = p_after_id AND e.pipeline_phase_id = p_new_phase;
  ELSE
    v_right_rank := NULL;
  END IF;

  -- Calcular novo rank
  IF v_left_rank IS NULL AND v_right_rank IS NULL THEN
    -- primeira inserção na fase
    v_new_rank := v_step;
  ELSIF v_left_rank IS NULL THEN
    v_new_rank := v_right_rank - v_step;
  ELSIF v_right_rank IS NULL THEN
    v_new_rank := v_left_rank + v_step;
  ELSE
    v_new_rank := (v_left_rank + v_right_rank) / 2; -- média
    
    -- Se a média resulta em um valor igual a um dos vizinhos, rebalancear
    IF v_new_rank = v_left_rank OR v_new_rank = v_right_rank THEN
      -- Rebalancear todos os itens da fase adicionando STEP
      UPDATE public.events 
      SET pipeline_rank = pipeline_rank + v_step 
      WHERE pipeline_phase_id = p_new_phase;
      
      -- Recalcular ranks dos vizinhos após rebalanceamento
      IF p_before_id IS NOT NULL THEN
        SELECT e.pipeline_rank INTO v_left_rank
        FROM public.events e
        WHERE e.id = p_before_id;
      END IF;
      
      IF p_after_id IS NOT NULL THEN
        SELECT e.pipeline_rank INTO v_right_rank
        FROM public.events e
        WHERE e.id = p_after_id;
      END IF;
      
      -- Recalcular nova posição
      IF v_left_rank IS NULL AND v_right_rank IS NULL THEN
        v_new_rank := v_step;
      ELSIF v_left_rank IS NULL THEN
        v_new_rank := v_right_rank - v_step;
      ELSIF v_right_rank IS NULL THEN
        v_new_rank := v_left_rank + v_step;
      ELSE
        v_new_rank := (v_left_rank + v_right_rank) / 2;
      END IF;
    END IF;
  END IF;

  -- Atualizar evento com nova fase e rank
  UPDATE public.events
  SET pipeline_phase_id = p_new_phase,
      pipeline_rank     = v_new_rank,
      updated_at        = timezone('utc', now())
  WHERE id = p_event_id;
END;
$$;

-- 1.6 Wrapper RPC para aceitar JSON (para facilitar chamadas do frontend)
CREATE OR REPLACE FUNCTION public.rpc_move_event_json(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_event_id integer;
  v_new_phase uuid;
  v_before_id integer;
  v_after_id integer;
BEGIN
  v_event_id := (payload->>'event_id')::integer;
  v_new_phase := (payload->>'new_phase')::uuid;
  v_before_id := NULLIF(payload->>'before_id', '')::integer;
  v_after_id := NULLIF(payload->>'after_id', '')::integer;

  PERFORM public.rpc_move_event(v_event_id, v_new_phase, v_before_id, v_after_id);
END $$;

-- 1.7 (Opcional) Inicializar ranks para itens existentes sem rank
-- Descomente se quiser normalizar dados existentes
/*
UPDATE public.events e
SET pipeline_rank = t.base_rank
FROM (
  SELECT id,
         (ROW_NUMBER() OVER(PARTITION BY pipeline_phase_id ORDER BY updated_at DESC)) * 1000000 AS base_rank
  FROM public.events
  WHERE pipeline_phase_id IS NOT NULL
) AS t
WHERE e.id = t.id AND (e.pipeline_rank IS NULL OR e.pipeline_rank = 0);
*/

-- 1.8 Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';