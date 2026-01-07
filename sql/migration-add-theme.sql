-- Migration: Add theme column to forms table
-- Date: 2025-01-07

-- Add theme column with default value 'default'
ALTER TABLE forms
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'default';

-- Update existing rows to have 'default' theme if null
UPDATE forms SET theme = 'default' WHERE theme IS NULL;
