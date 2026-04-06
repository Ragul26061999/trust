-- Migration: Add task feedback and duration fields
-- Created: 2026-04-06

-- Add columns to timetable_entries
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS completion_feedback TEXT;

-- Add columns to professional_tasks
ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS completion_feedback TEXT;
ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
