-- Add color column to pipeline_stages
ALTER TABLE public.pipeline_stages
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#e5e7eb';

-- Seed/update default colors for known stages (idempotent)
UPDATE public.pipeline_stages SET color = '#3b82f6' WHERE name = 'Lead Identificado' AND (color IS NULL OR color = '#e5e7eb');
UPDATE public.pipeline_stages SET color = '#10b981' WHERE name = 'Contato Iniciado' AND (color IS NULL OR color = '#e5e7eb');
UPDATE public.pipeline_stages SET color = '#f59e0b' WHERE name = 'Proposta Enviada' AND (color IS NULL OR color = '#e5e7eb');
UPDATE public.pipeline_stages SET color = '#ef4444' WHERE name = 'Negociação' AND (color IS NULL OR color = '#e5e7eb');
UPDATE public.pipeline_stages SET color = '#8b5cf6' WHERE name = 'Em Produção/Execução' AND (color IS NULL OR color = '#e5e7eb');
UPDATE public.pipeline_stages SET color = '#6b7280' WHERE name = 'Pausado/Em Espera' AND (color IS NULL OR color = '#e5e7eb');
UPDATE public.pipeline_stages SET color = '#059669' WHERE name = 'Fechado – Ganhou' AND (color IS NULL OR color = '#e5e7eb');
UPDATE public.pipeline_stages SET color = '#dc2626' WHERE name = 'Fechado – Perdido' AND (color IS NULL OR color = '#e5e7eb');