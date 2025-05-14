/*
  # Add teams policy with existence check

  1. Changes
    - Safely add INSERT policy for teams table if it doesn't exist
    
  2. Security
    - Allows authenticated users to create teams
    - Prevents duplicate policy error
*/

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teams' 
        AND policyname = 'Users can create teams'
    ) THEN
        CREATE POLICY "Users can create teams"
        ON teams
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;
END $$;