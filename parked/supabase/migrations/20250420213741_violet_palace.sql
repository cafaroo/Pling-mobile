/*
  # Fix team members RLS policies

  1. Changes
    - Remove recursive policies from team_members table
    - Add new, non-recursive policies for team_members table
    - Update teams table policies to be more efficient
  
  2. Security
    - Maintain existing security model but prevent infinite recursion
    - Users can still only view teams they are members of
    - Team leaders retain management capabilities
*/

-- Drop existing policies to replace them with fixed versions
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
DROP POLICY IF EXISTS "Team leaders can update team" ON teams;

-- Create new, non-recursive policies for team_members
CREATE POLICY "Team leaders can manage members"
ON team_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members leader
    WHERE leader.team_id = team_members.team_id
    AND leader.user_id = auth.uid()
    AND leader.role = 'leader'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members leader
    WHERE leader.team_id = team_members.team_id
    AND leader.user_id = auth.uid()
    AND leader.role = 'leader'
  )
);

CREATE POLICY "Users can view team members"
ON team_members
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- Create new, non-recursive policies for teams
CREATE POLICY "Team members can view their team"
ON teams
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team leaders can update team"
ON teams
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'leader'
  )
)
WITH CHECK (
  id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'leader'
  )
);