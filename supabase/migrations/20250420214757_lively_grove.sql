/*
  # Fix Teams RLS Policies

  1. Changes
    - Drop and recreate teams table policies with proper permissions
    - Fix INSERT policy to only use WITH CHECK clause
    - Ensure RLS is enabled on teams table
    - Maintain existing view and update policies

  2. Security
    - Allow authenticated users to create teams
    - Maintain team member view access
    - Preserve team leader update permissions
*/

-- Enable RLS on teams table (in case it's not enabled)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
DROP POLICY IF EXISTS "Team leaders can update team" ON teams;

-- Create new policies with proper permissions
CREATE POLICY "Users can create teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Team members can view their team"
ON teams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team leaders can update team"
ON teams
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'leader'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'leader'
  )
);