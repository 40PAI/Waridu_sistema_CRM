-- 0051_rpc_move_event_overloads_and_wrapper.sql
-- Idempotent migration: create rpc_move_event overloads (uuid & bigint),
-- a JSON wrapper rpc_move_event_json, grant execute and notify pgrst to reload schema.

-- 1) Create/replace UUID overload (order: p_event_id, p_new_status, p_before_id, p_after_id)
CREATE OR REPLACE FUNCTION public.rpc_move_event(
  p_event_id uuid,
  p_new_status text,
  p_before_id uuid DEFAULT NULL,
  p_after_id  uuid DEFAULT NULL
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
  -- Determine target status (keep current if NULL)
  SELECT COALESCE(p_new_status, pipeline_status) INTO v_target_status
  FROM public.events WHERE id = p_event_id FOR UPDATE;

  -- Read neighbor ranks if provided
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

  -- Compute new rank with midpoint heuristic, rebalance if needed
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
      ELSE
        v_left_rank := NULL;
      END IF;
      IF p_after_id IS NOT NULL THEN
        SELECT pipeline_rank INTO v_right_rank FROM public.events WHERE id = p_after_id;
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
      END IF;
    END IF;
  END IF;

  -- Persist change (update status, rank and server-side updated_at)
  UPDATE public.events
  SET pipeline_status = v_target_status,
      pipeline_rank   = v_new_rank,
      updated_at      = timezone('utc', now())
  WHERE id = p_event_id;
END
$$;


-- 2) Create/replace BIGINT overload (same parameter order)
CREATE OR REPLACE FUNCTION public.rpc_move_event(
  p_event_id bigint,
  p_new_status text,
  p_before_id bigint DEFAULT NULL,
  p_after_id  bigint DEFAULT NULL
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
  -- Determine target status (keep current if NULL)
  SELECT COALESCE(p_new_status, pipeline_status) INTO v_target_status
  FROM public.events WHERE id = p_event_id FOR UPDATE;

  -- Read neighbor ranks if provided
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

  -- Compute new rank with midpoint heuristic, rebalance if needed
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
      ELSE
        v_left_rank := NULL;
      END IF;
      IF p_after_id IS NOT NULL THEN
        SELECT pipeline_rank INTO v_right_rank FROM public.events WHERE id = p_after_id;
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
      END IF;
    END IF;
  END IF;

  -- Persist change (update status, rank and server-side updated_at)
  UPDATE public.events
  SET pipeline_status = v_target_status,
      pipeline_rank   = v_new_rank,
      updated_at      = timezone('utc', now())
  WHERE id = p_event_id;
END
$$;


-- 3) JSON wrapper: calls uuid-version first, falls back to bigint version
CREATE OR REPLACE FUNCTION public.rpc_move_event_json(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id_text text := (payload->>'event_id');
  v_before_id_text text := (payload->>'before_id');
  v_after_id_text  text := (payload->>'after_id');
  v_new_status text := (payload->>'new_status');
BEGIN
  -- Try UUID signature first; if conversion fails, fallback to bigint variant
  BEGIN
    PERFORM public.rpc_move_event(
      (v_event_id_text)::uuid,
      v_new_status,
      NULLIF(v_before_id_text, '')::uuid,
      NULLIF(v_after_id_text,  '')::uuid
    );
  EXCEPTION WHEN others THEN
    -- Fallback to bigint variant
    PERFORM public.rpc_move_event(
      (v_event_id_text)::bigint,
      v_new_status,
      NULLIF(v_before_id_text, '')::bigint,
      NULLIF(v_after_id_text,  '')::bigint
    );
  END;
END
$$;


-- 4) Grants so PostgREST anonymous/authenticated roles can execute (adjust roles as needed)
GRANT EXECUTE ON FUNCTION public.rpc_move_event(uuid, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_move_event(bigint, text, bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_move_event_json(jsonb) TO authenticated;

-- If you use anon role for REST requests, grant to anon too (use with caution)
GRANT EXECUTE ON FUNCTION public.rpc_move_event(uuid, text, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.rpc_move_event(bigint, text, bigint, bigint) TO anon;
GRANT EXECUTE ON FUNCTION public.rpc_move_event_json(jsonb) TO anon;


-- 5) Notify PostgREST to reload schema cache (helps avoid PGRST202 caused by stale schema cache)
-- Note: PostgREST listens to NOTIFY pgrst; Supabase's PostgREST should pick this up.
NOTIFY pgrst, 'reload schema';


-- 6) Optional: check that functions exist (returns rows when run in SQL console)
-- SELECT proname, proargnames, proargtypes::regtype[] FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname LIKE 'rpc_move_event%';

-- End of migration