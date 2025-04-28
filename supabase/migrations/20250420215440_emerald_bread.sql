/*
  # Fix Teams RLS Policies

  1. Changes
    - Enable RLS on teams table
    - Fix INSERT policy to only use WITH CHECK clause
    - Maintain existing SELECT and UPDATE policies
    
  2. Security
    - Allow authenticated users to create teams
    - Allow team members to view their teams
    - Allow team leaders to update team details
*/

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
DROP POLICY IF EXISTS "Team leaders can update team" ON teams;

-- ✅ Correct INSERT policy
CREATE POLICY "Users can create teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (true);  -- ❗ no USING clause

-- SELECT policy
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

-- UPDATE policy
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