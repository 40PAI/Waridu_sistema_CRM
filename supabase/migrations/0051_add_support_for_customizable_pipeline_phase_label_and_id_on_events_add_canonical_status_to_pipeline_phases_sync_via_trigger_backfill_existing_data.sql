-- 1) Add new columns on events (if not exists)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS pipeline_phase_label TEXT;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS pipeline_phase_id UUID
  REFERENCES public.pipeline_phases(id) ON DELETE SET NULL;

-- 2) Add canonical_status on pipeline_phases (if not exists) and enforce allowed values via CHECK
ALTER TABLE public.pipeline_phases
ADD COLUMN IF NOT EXISTS canonical_status TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pipeline_phases_canonical_status_check'
  ) THEN
    ALTER TABLE public.pipeline_phases
      ADD CONSTRAINT pipeline_phases_canonical_status_check
      CHECK (
        canonical_status IS NULL OR canonical_status IN ('1º Contato','Orçamento','Negociação','Confirmado','Cancelado')
      );
  END IF;
END$$;

-- 3) Heuristically set canonical_status for existing phases if not set
UPDATE public.pipeline_phases
SET canonical_status =
  CASE
    WHEN lower(name) LIKE '%contat%' OR lower(name) LIKE '%lead%' THEN '1º Contato'
    WHEN lower(name) LIKE '%orçament%' OR lower(name) LIKE '%propost%' OR lower(name) LIKE '%budget%' THEN 'Orçamento'
    WHEN lower(name) LIKE '%negocia%' THEN 'Negociação'
    WHEN lower(name) LIKE '%produ%' OR lower(name) LIKE '%ganh%' OR lower(name) LIKE '%confirm%' THEN 'Confirmado'
    WHEN lower(name) LIKE '%paus%' OR lower(name) LIKE '%perdid%' OR lower(name) LIKE '%cancel%' THEN 'Cancelado'
    ELSE canonical_status
  END
WHERE canonical_status IS NULL;

-- 4) Create function to sync pipeline fields
CREATE OR REPLACE FUNCTION public.sync_pipeline_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ph RECORD;
  canonical TEXT;
BEGIN
  -- If pipeline_phase_id provided, derive label and canonical from phases table
  IF NEW.pipeline_phase_id IS NOT NULL THEN
    SELECT name, canonical_status INTO ph
    FROM public.pipeline_phases
    WHERE id = NEW.pipeline_phase_id;

    IF FOUND THEN
      NEW.pipeline_phase_label := ph.name;
      canonical := ph.canonical_status;
    END IF;
  END IF;

  -- If label provided but id not, try to match phase by name
  IF NEW.pipeline_phase_label IS NOT NULL AND NEW.pipeline_phase_id IS NULL THEN
    SELECT id, name, canonical_status INTO ph
    FROM public.pipeline_phases
    WHERE name = NEW.pipeline_phase_label
    LIMIT 1;

    IF FOUND THEN
      NEW.pipeline_phase_id := ph.id;
      canonical := COALESCE(canonical, ph.canonical_status);
    END IF;
  END IF;

  -- If canonical not set yet, derive from label via heuristics
  IF canonical IS NULL AND NEW.pipeline_phase_label IS NOT NULL THEN
    IF lower(NEW.pipeline_phase_label) LIKE '%contat%' OR lower(NEW.pipeline_phase_label) LIKE '%lead%' THEN
      canonical := '1º Contato';
    ELSIF lower(NEW.pipeline_phase_label) LIKE '%orçament%' OR lower(NEW.pipeline_phase_label) LIKE '%propost%' OR lower(NEW.pipeline_phase_label) LIKE '%budget%' THEN
      canonical := 'Orçamento';
    ELSIF lower(NEW.pipeline_phase_label) LIKE '%negocia%' THEN
      canonical := 'Negociação';
    ELSIF lower(NEW.pipeline_phase_label) LIKE '%produ%' OR lower(NEW.pipeline_phase_label) LIKE '%ganh%' OR lower(NEW.pipeline_phase_label) LIKE '%confirm%' THEN
      canonical := 'Confirmado';
    ELSIF lower(NEW.pipeline_phase_label) LIKE '%paus%' OR lower(NEW.pipeline_phase_label) LIKE '%perdid%' OR lower(NEW.pipeline_phase_label) LIKE '%cancel%' THEN
      canonical := 'Cancelado';
    END IF;
  END IF;

  -- Ensure pipeline_status respects DB CHECK
  IF canonical IS NOT NULL THEN
    NEW.pipeline_status := canonical;
  ELSIF NEW.pipeline_status IS NULL OR NEW.pipeline_status NOT IN ('1º Contato','Orçamento','Negociação','Confirmado','Cancelado') THEN
    NEW.pipeline_status := '1º Contato';
  END IF;

  -- If label is still null, try to use the first active phase that matches the canonical status
  IF NEW.pipeline_phase_label IS NULL THEN
    SELECT name, id
    INTO ph
    FROM public.pipeline_phases
    WHERE active = TRUE
      AND canonical_status = NEW.pipeline_status
    ORDER BY sort_order ASC
    LIMIT 1;

    IF FOUND THEN
      NEW.pipeline_phase_label := ph.name;
      NEW.pipeline_phase_id := ph.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) (Re)create trigger on events
DROP TRIGGER IF EXISTS sync_pipeline_fields_trg ON public.events;

CREATE TRIGGER sync_pipeline_fields_trg
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.sync_pipeline_fields();

-- 6) Backfill existing events: set label and phase_id where possible based on current pipeline_status
WITH first_phase AS (
  SELECT DISTINCT ON (canonical_status)
         canonical_status, id, name, sort_order
  FROM public.pipeline_phases
  WHERE active = TRUE AND canonical_status IS NOT NULL
  ORDER BY canonical_status, sort_order ASC
)
UPDATE public.events e
SET pipeline_phase_label = f.name,
    pipeline_phase_id = f.id
FROM first_phase f
WHERE e.pipeline_phase_label IS NULL
  AND f.canonical_status = e.pipeline_status;