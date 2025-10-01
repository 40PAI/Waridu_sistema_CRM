-- Add foreign key to pipeline_stages in events table
ALTER TABLE public.events ADD COLUMN pipeline_stage_id UUID REFERENCES public.pipeline_stages(id);

-- Update existing events to link to default stages based on pipeline_status
UPDATE public.events 
SET pipeline_stage_id = (
  SELECT id FROM public.pipeline_stages 
  WHERE name = CASE 
    WHEN events.pipeline_status = '1º Contato' THEN 'Lead Identificado'
    WHEN events.pipeline_status = 'Orçamento' THEN 'Proposta Enviada'
    WHEN events.pipeline_status = 'Negociação' THEN 'Negociação'
    WHEN events.pipeline_status = 'Confirmado' THEN 'Fechado – Ganhou'
    WHEN events.pipeline_status = 'Cancelado' THEN 'Fechado – Perdido'
    ELSE 'Lead Identificado'
  END
  LIMIT 1
)
WHERE pipeline_status IS NOT NULL;