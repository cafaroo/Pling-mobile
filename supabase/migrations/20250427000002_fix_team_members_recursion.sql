/*
  # Fix team_members recursion issue
  
  1. Changes
    - Drop existing recursive policies
    - Create new optimized policies using security definer functions
    - Ensure proper role-based access control
    
  2. Security
    - Maintain existing security model
    - Prevent infinite recursion
    - Keep proper access control for team members, leaders and owners
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Team leaders and owners can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;

-- Create optimized policies using security definer functions
CREATE POLICY "Team leaders and owners can manage members"
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

-- Update helper functions to be more efficient
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
    AND role IN ('leader', 'owner')
  );
$$;

CREATE OR REPLACE FUNCTION check_team_owner(team_id uuid)
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
    AND role = 'owner'
  );
$$; 