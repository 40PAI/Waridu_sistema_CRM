-- Migration: 0054_add_pipeline_rank_to_events.sql
-- Add pipeline_rank column to events table for Kanban sorting

ALTER TABLE events ADD COLUMN IF NOT EXISTS pipeline_rank integer DEFAULT 0;