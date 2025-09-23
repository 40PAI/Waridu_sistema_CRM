ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS pipeline_stage_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND constraint_name = 'events_pipeline_stage_id_fkey'
  ) THEN
    ALTER TABLE public.events
    ADD CONSTRAINT events_pipeline_stage_id_fkey
      FOREIGN KEY (pipeline_stage_id)
      REFERENCES public.pipeline_stages (id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_events_pipeline_stage_id
  ON public.events (pipeline_stage_id);

NOTIFY pgrst, 'reload schema';