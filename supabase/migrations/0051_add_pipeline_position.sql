-- 0051_add_pipeline_position.sql
-- Add pipeline_position column if missing and index to support ordering by pipeline_status + pipeline_position + updated_at

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'pipeline_position'
  ) THEN
    ALTER TABLE public.events
      ADD COLUMN pipeline_position integer NOT NULL DEFAULT 0;
  END IF;
END$$;

-- Index to speed up ordering queries (status + position + updated_at desc)
CREATE INDEX IF NOT EXISTS idx_events_pipeline_order
  ON public.events(pipeline_status, pipeline_position, updated_at DESC);

-- Optionally notify PostgREST to reload schema cache if needed
NOTIFY pgrst, 'reload schema';