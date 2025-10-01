-- Add missing columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS pipeline_rank integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Ensure the trigger exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS handle_updated_at_events ON public.events;
CREATE TRIGGER handle_updated_at_events
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Recreate RPC functions with correct types
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
      -- Rebalance if needed
      UPDATE public.events SET pipeline_rank = pipeline_rank + STEP WHERE pipeline_status = v_target_status;
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

CREATE OR REPLACE FUNCTION public.rpc_move_event_json(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id bigint;
  v_before_id bigint;
  v_after_id bigint;
  v_new_status text;
BEGIN
  v_event_id := (payload->>'event_id')::bigint;
  v_new_status := payload->>'new_status';
  v_before_id := NULLIF(payload->>'before_id', '')::bigint;
  v_after_id := NULLIF(payload->>'after_id', '')::bigint;

  PERFORM public.rpc_move_event(v_event_id, v_new_status, v_before_id, v_after_id);
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_move_event(bigint, text, bigint, bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_move_event_json(jsonb) TO anon, authenticated;