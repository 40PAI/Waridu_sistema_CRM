-- Remove service_ids column from clients table as it's no longer needed
-- This field was used for services of interest but has been removed from the client requirements

ALTER TABLE public.clients DROP COLUMN IF EXISTS service_ids;