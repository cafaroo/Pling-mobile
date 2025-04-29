/*
  # Fix team owner permissions
  
  1. Changes
    - Update all policies that only reference 'leader' to include 'owner'
    - Ensure team owners have at least the same permissions as leaders
    - Fix any inconsistencies in role checks
    
  2. Security
    - Maintain existing security model
    - Just extend leader permissions to owners
    - No reduction in security, only proper permission extension
*/

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Team leaders can update team" ON teams;
DROP POLICY IF EXISTS "Team leaders can manage subscription" ON subscriptions;

-- Recreate policies to include both leader and owner roles
CREATE POLICY "Team leaders and owners can manage members"
ON team_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('leader', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('leader', 'owner')
  )
);

CREATE POLICY "Team leaders and owners can update team"
ON teams
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('leader', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('leader', 'owner')
  )
);

CREATE POLICY "Team leaders and owners can manage subscription"
ON subscriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = subscriptions.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('leader', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = subscriptions.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('leader', 'owner')
  )
);

-- Update helper functions to include owner role
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

-- Add new function specifically for checking owner status
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

-- Update competition related policies
DROP POLICY IF EXISTS "Team leaders can join team competitions" ON competition_participants;
CREATE POLICY "Team leaders and owners can join team competitions"
ON competition_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM competitions c
    WHERE c.id = competition_id
    AND c.participant_type = 'team'
    AND team_id IN (
      SELECT tm.team_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('leader', 'owner')
    )
    AND user_id IS NULL
  )
);

-- Update goal related policies if they only reference leader
DROP POLICY IF EXISTS "Team leaders can manage team goals" ON goals;
CREATE POLICY "Team leaders and owners can manage team goals"
ON goals
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  (team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
    AND role IN ('leader', 'owner')
  ))
)
WITH CHECK (
  user_id = auth.uid() OR
  (team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
    AND role IN ('leader', 'owner')
  ))
); 