-- Migration: Add before and after popup timing fields
-- Created: 2026-04-06

-- Add columns to timetable_entries
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS before_popup_minutes INTEGER DEFAULT 0;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS after_popup_minutes INTEGER DEFAULT 0;

-- Add columns to professional_tasks
ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS before_popup_minutes INTEGER DEFAULT 0;
ALTER TABLE professional_tasks ADD COLUMN IF NOT EXISTS after_popup_minutes INTEGER DEFAULT 0;
