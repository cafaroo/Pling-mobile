/*
  # Fix Teams RLS Policies

  1. Changes
    - Update RLS policies for the teams table to allow:
      - Authenticated users to create teams
      - Team members to view their teams
      - Team leaders to update team details

  2. Security
    - Maintains existing RLS policies for team member management
    - Ensures proper access control for team operations
*/

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