/*
  # Fix competition type constraints

  1. Changes
    - Add participant_type column to competitions table
    - Update type constraints to match application requirements
    - Migrate existing type values

  2. Security
    - No changes to RLS policies
*/

-- Add participant_type column
ALTER TABLE competitions ADD COLUMN participant_type text;

-- Update type constraints
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_type_check;
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_type_check1;

-- Add new constraints
ALTER TABLE competitions 
  ADD CONSTRAINT competitions_type_check 
  CHECK (type = ANY (ARRAY['sales_amount'::text, 'sales_count'::text]));

ALTER TABLE competitions 
  ADD CONSTRAINT competitions_participant_type_check 
  CHECK (participant_type = ANY (ARRAY['individual'::text, 'team'::text]));

-- Set default for participant_type based on existing type values
UPDATE competitions 
SET participant_type = type 
WHERE type IN ('individual', 'team');

-- Make participant_type NOT NULL after migration
ALTER TABLE competitions ALTER COLUMN participant_type SET NOT NULL;