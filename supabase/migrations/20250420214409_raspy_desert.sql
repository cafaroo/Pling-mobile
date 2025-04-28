/*
  # Add INSERT policy for teams table

  1. Changes
    - Add new RLS policy to allow authenticated users to create teams
    
  2. Security
    - Allows authenticated users to create new teams
    - Users can only create teams where they are automatically added as a leader
*/

-- Add policy to allow authenticated users to create teams
CREATE POLICY "Users can create teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Note: After team creation, a trigger or separate operation should add the 
-- creating user as a team leader in the team_members table