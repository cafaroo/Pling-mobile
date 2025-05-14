/*
  # Fix competition type constraints
  
  1. Changes
    - Normalize type values first to prevent constraint violations
    - Add participant_type column
    - Set up proper constraints
    
  2. Security
    - Maintain data integrity during migration
    - Handle existing data safely
*/

-- First normalize all type values to prevent constraint violations
UPDATE competitions 
SET type = 'sales_amount'
WHERE type NOT IN ('sales_amount', 'sales_count');

-- Then drop and recreate type constraint
ALTER TABLE competitions 
DROP CONSTRAINT IF EXISTS competitions_type_check;

ALTER TABLE competitions 
ADD CONSTRAINT competitions_type_check 
CHECK (type IN ('sales_amount', 'sales_count'));

-- Add participant_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'competitions' 
    AND column_name = 'participant_type'
  ) THEN
    ALTER TABLE competitions 
    ADD COLUMN participant_type text;
  END IF;
END $$;

-- Set default participant_type values
UPDATE competitions 
SET participant_type = 'individual'
WHERE participant_type IS NULL;

-- Make participant_type NOT NULL
ALTER TABLE competitions 
ALTER COLUMN participant_type SET NOT NULL;

-- Drop existing participant_type constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'competitions_participant_type_check' 
    AND table_name = 'competitions'
  ) THEN
    ALTER TABLE competitions 
    DROP CONSTRAINT competitions_participant_type_check;
  END IF;
END $$;

-- Add participant_type constraint
ALTER TABLE competitions 
ADD CONSTRAINT competitions_participant_type_check 
CHECK (participant_type IN ('individual', 'team'));