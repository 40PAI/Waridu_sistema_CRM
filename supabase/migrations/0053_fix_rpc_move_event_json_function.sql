-- Migration: 0053_fix_rpc_move_event_json_function.sql
-- Description: Fix the missing rpc_move_event_json function by creating it with proper parameter handling.

-- Ensure pipeline_rank column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'pipeline_rank') THEN
    ALTER TABLE public.events ADD COLUMN pipeline_rank BIGINT DEFAULT 0;
  END IF;
END $$;

-- Helper function to rebalance ranks
CREATE OR REPLACE FUNCTION public.rebalance_events_column(target_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  rank_val BIGINT := 1000000;
BEGIN
  FOR rec IN SELECT id FROM public.events WHERE pipeline_status = target_status ORDER BY updated_at DESC LOOP
    UPDATE public.events SET pipeline_rank = rank_val WHERE id = rec.id;
    rank_val := rank_val + 1000000;
  END LOOP;
END $$;

-- Main RPC function for UUID (assuming events.id is uuid)
CREATE OR REPLACE FUNCTION public.rpc_move_event(
  p_event_id uuid,
  p_new_status text,
  p_before_id uuid DEFAULT NULL,
  p_after_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  STEP BIGINT := 1000000;
  v_target_status text;
  v_left_rank BIGINT;
  v_right_rank BIGINT;
  v_new_rank BIGINT;
BEGIN
  SELECT COALESCE(p_new_status, pipeline_status) INTO v_target_status
  FROM public.events WHERE id = p_event_id FOR UPDATE;

  IF p_before_id IS NOT NULL THEN
    SELECT pipeline_rank INTO v_left_rank FROM public.events WHERE id = p_before_id FOR UPDATE;
  ELSE
    v_left_rank := NULL;
  END IF;

  IF p_after_id IS NOT NULL THEN
    SELECT pipeline_rank INTO v_right_rank FROM public.events WHERE id = p_after_id FOR UPDATE;
  ELSE
    v_right_rank := NULL;
  END IF;

  IF v_left_rank IS NULL AND v_right_rank IS NULL THEN
    v_new_rank := STEP;
  ELSIF v_left_rank IS NULL THEN
    v_new_rank := v_right_rank - STEP;
  ELSIF v_right_rank IS NULL THEN
    v_new_rank := v_left_rank + STEP;
  ELSE
    v_new_rank := (v_left_rank + v_right_rank) / 2;
    IF v_new_rank = v_left_rank OR v_new_rank = v_right_rank THEN
      PERFORM public.rebalance_events_column(v_target_status);
      IF p_before_id IS NOT NULL THEN
        SELECT pipeline_rank INTO v_left_rank FROM public.events WHERE id = p_before_id;
      END IF;
      IF p_after_id IS NOT NULL THEN
        SELECT pipeline_rank INTO v_right_rank FROM public.events WHERE id = p_after_id;
      END IF;
      IF v_left_rank IS NULL AND v_right_rank IS NULL THEN
        v_new_rank := STEP;
      ELSIF v_left_rank IS NULL THEN
        v_new_rank := v_right_rank - STEP;
      ELSIF v_right_rank IS NULL THEN
        v_new_rank := v_left_rank + STEP;
      ELSE
        v_new_rank := (v_left_rank + v_right_rank) / 2;
      END IF;
    END IF;
  END IF;

  UPDATE public.events
  SET pipeline_status = v_target_status,
      pipeline_rank = v_new_rank,
      updated_at = timezone('utc', now())
  WHERE id = p_event_id;
END $$;

-- Main RPC function for BIGINT (if events.id is bigint)
CREATE OR REPLACE FUNCTION public.rpc_move_event(
  p_event_id bigint,
  p_new_status text,
  p_before_id bigint DEFAULT NULL,
  p_after_id bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  STEP BIGINT := 1000000;
  v_target_status text;
  v_left_rank BIGINT;
  v_right_rank BIGINT;
  v_new_rank BIGINT;
BEGIN
  SELECT COALESCE(p_new_status, pipeline_status) INTO v_target_status
  FROM public.events WHERE id = p_event_id FOR UPDATE;

  IF p_before_id IS NOT NULL THEN
    SELECT pipeline_rank INTO v_left_rank FROM public.events WHERE id = p_before_id FOR UPDATE;
  ELSE
    v_left_rank := NULL;
  END IF;

  IF p_after_id IS NOT NULL THEN
    SELECT pipeline_rank INTO v_right_rank FROM public.events WHERE id = p_after_id FOR UPDATE;
  ELSE
    v_right_rank := NULL;
  END IF;

  IF v_left_rank IS NULL AND v_right_rank IS NULL THEN
    v_new_rank := STEP;
  ELSIF v_left_rank IS NULL THEN
    v_new_rank := v_right_rank - STEP;
  ELSIF v_right_rank IS NULL THEN
    v_new_rank := v_left_rank + STEP;
  ELSE
    v_new_rank := (v_left_rank + v_right_rank) / 2;
    IF v_new_rank = v_left_rank OR v_new_rank = v_right_rank THEN
      PERFORM public.rebalance_events_column(v_target_status);
      IF p_before_id IS NOT NULL THEN
        SELECT pipeline_rank INTO v_left_rank FROM public.events WHERE id = p_before_id;
      END IF;
      IF p_after_id IS NOT NULL THEN
        SELECT pipeline_rank INTO v_right_rank FROM public.events WHERE id = p_after_id;
      END IF;
      IF v_left_rank IS NULL AND v_right_rank IS NULL THEN
        v_new_rank := STEP;
      ELSIF v_left_rank IS NULL THEN
        v_new_rank := v_right_rank - STEP;
      ELSIF v_right_rank IS NULL THEN
        v_new_rank := v_left_rank + STEP;
      ELSE
        v_new_rank := (v_left_rank + v_right_rank) / 2;
      END IF;
    END IF;
  END IF;

  UPDATE public.events
  SET pipeline_status = v_target_status,
      pipeline_rank = v_new_rank,
      updated_at = timezone('utc', now())
  WHERE id = p_event_id;
END $$;

-- JSON wrapper function (the one causing the error)
CREATE OR REPLACE FUNCTION public.rpc_move_event_json(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id_text text := (payload->>'event_id');
  v_before_id_text text := (payload->>'before_id');
  v_after_id_text text := (payload->>'after_id');
  v_new_status text := (payload->>'new_status');
BEGIN
  -- Try UUID first
  BEGIN
    PERFORM public.rpc_move_event(
      (v_event_id_text)::uuid,
      v_new_status,
      NULLIF(v_before_id_text, '')::uuid,
      NULLIF(v_after_id_text, '')::uuid
    );
  EXCEPTION WHEN others THEN
    -- Fallback to BIGINT
    PERFORM public.rpc_move_event(
      (v_event_id_text)::bigint,
      v_new_status,
      NULLIF(v_before_id_text, '')::bigint,
      NULLIF(v_after_id_text, '')::bigint
    );
  END;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_move_event(uuid, text, uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_move_event(bigint, text, bigint, bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_move_event_json(jsonb) TO anon, authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';