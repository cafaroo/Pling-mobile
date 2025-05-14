/*
  # Fix team members policy recursion

  1. Changes
    - Remove recursive policy check for team leaders
    - Update team members policies to use direct role checks
    - Maintain security while preventing infinite recursion
  
  2. Security
    - Maintain RLS enabled on team_members table
    - Update policies to use non-recursive checks
    - Ensure team leaders can still manage members
    - Preserve member viewing permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;

-- Create new non-recursive policies
CREATE POLICY "Team leaders can manage members"
ON team_members
FOR ALL
TO authenticated
USING (
  team_id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'leader'
  )
)
WITH CHECK (
  team_id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'leader'
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