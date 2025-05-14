/*
  # Fix team policies with security definer functions
  
  1. Changes
    - Create security definer functions to safely check team membership and leadership
    - Update team and team_members policies to use these functions
    - Remove recursive policy checks
  
  2. Security
    - Maintain RLS enabled on all tables
    - Use security definer functions to safely check permissions
    - Preserve existing access control rules
*/

-- Create function to check team membership
CREATE OR REPLACE FUNCTION check_team_member(team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM team_members 
    WHERE team_id = $1 
    AND user_id = auth.uid()
  );
$$;

-- Create function to check team leadership
CREATE OR REPLACE FUNCTION check_team_leader(team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM team_members 
    WHERE team_id = $1 
    AND user_id = auth.uid()
    AND role = 'leader'
  );
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
DROP POLICY IF EXISTS "Team leaders can update team" ON teams;

-- Create new policies for team_members using security definer functions
CREATE POLICY "Team leaders can manage members"
ON team_members
FOR ALL
TO authenticated
USING (check_team_leader(team_id))
WITH CHECK (check_team_leader(team_id));

CREATE POLICY "Users can view team members"
ON team_members
FOR SELECT
TO authenticated
USING (check_team_member(team_id));

-- Create new policies for teams using security definer functions
CREATE POLICY "Team members can view their team"
ON teams
FOR SELECT
TO authenticated
USING (check_team_member(id));

CREATE POLICY "Team leaders can update team"
ON teams
FOR UPDATE
TO authenticated
USING (check_team_leader(id))
WITH CHECK (check_team_leader(id));