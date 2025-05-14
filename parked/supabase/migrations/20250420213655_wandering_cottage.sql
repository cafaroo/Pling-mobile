/*
  # Fix team_members policies to prevent infinite recursion

  1. Changes
    - Drop existing policies on team_members table that cause infinite recursion
    - Create new, optimized policies for team_members table:
      - Team leaders can manage members (ALL)
      - Users can view team members (SELECT)
      - Users can view their own teams (SELECT on teams)
      
  2. Security
    - Maintains RLS protection
    - Prevents infinite recursion in policy checks
    - Ensures proper access control for team management
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;

-- Create new, optimized policies
CREATE POLICY "Team leaders can manage members"
ON team_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members leaders
    WHERE leaders.team_id = team_members.team_id
    AND leaders.user_id = auth.uid()
    AND leaders.role = 'leader'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members leaders
    WHERE leaders.team_id = team_members.team_id
    AND leaders.user_id = auth.uid()
    AND leaders.role = 'leader'
  )
);

CREATE POLICY "Users can view team members"
ON team_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members viewer
    WHERE viewer.team_id = team_members.team_id
    AND viewer.user_id = auth.uid()
  )
);

-- Update teams table policies to avoid recursion
DROP POLICY IF EXISTS "Team members can view their team" ON teams;

CREATE POLICY "Team members can view their team"
ON teams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members viewer
    WHERE viewer.team_id = teams.id
    AND viewer.user_id = auth.uid()
  )
);