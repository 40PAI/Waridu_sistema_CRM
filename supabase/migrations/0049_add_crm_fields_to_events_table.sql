-- Migration: 0049_add_crm_fields_to_events_table.sql
-- Adds follow_ups, responsible_id, next_action, and next_action_date to the events table
-- These fields support CRM/project management features like follow-up tracking and responsible assignment

-- Add follow_ups column (JSONB array to store follow-up objects: { action: string, date: timestamp, notes?: string })
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS follow_ups jsonb[] DEFAULT '{}';

-- Add responsible_id (UUID referencing profiles.id for the responsible user)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS responsible_id uuid 
REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add next_action column (text for the next scheduled action)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS next_action text DEFAULT '';

-- Add next_action_date column (timestamp for when the next action is due)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS next_action_date timestamp with time zone DEFAULT null;

-- Update RLS policies to allow updates on new columns for authorized roles
-- (Assuming existing policies allow UPDATE for Admin/Coordenador/Comercial)
-- Add explicit permissions if needed; new columns inherit by default

-- Enable RLS on new columns if not already (safety)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;