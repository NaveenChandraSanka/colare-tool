-- Add interest_options column to events table
-- Stores the available interest checkbox options for the registration form
ALTER TABLE events ADD COLUMN IF NOT EXISTS interest_options TEXT[] DEFAULT '{}';
