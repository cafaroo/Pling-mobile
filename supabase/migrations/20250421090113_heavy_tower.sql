/*
  # Add RLS policies for competition participants

  1. Changes
    - Add RLS policies to allow users to join competitions
    - Add policy for inserting new competition participants
    - Add policy for managing own participation

  2. Security
    - Enable RLS on competition_participants table
    - Add policies to control who can join competitions:
      - Users can join individual competitions
      - Team leaders can join team competitions for their team
    - Add policies to manage participation:
      - Users can manage their own individual participation
      - Team leaders can manage their team's participation
*/

-- Policy for joining individual competitions
CREATE POLICY "Users can join individual competitions"
ON competition_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM competitions c
    WHERE c.id = competition_id
    AND c.participant_type = 'individual'
    AND user_id = auth.uid()
    AND team_id IS NULL
  )
);

-- Policy for team leaders joining team competitions
CREATE POLICY "Team leaders can join team competitions"
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
      AND tm.role = 'leader'
    )
    AND user_id IS NULL
  )
);

-- Policy for managing individual participation
CREATE POLICY "Users can manage their individual participation"
ON competition_participants
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Policy for team leaders managing team participation
CREATE POLICY "Team leaders can manage team participation"
ON competition_participants
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