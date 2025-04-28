/*
  # Update competitions table RLS policies

  1. Changes
    - Add INSERT policy for authenticated users to create competitions
    - Ensure users can only create competitions for teams they lead

  2. Security
    - Maintains existing RLS policies
    - Adds new policy for competition creation
    - Validates team leadership before allowing competition creation
*/

CREATE POLICY "Users can create competitions for their teams"
  ON competitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if team_id is NULL (public competition)
    team_id IS NULL
    OR
    -- Or if user is a team leader for the specified team
    team_id IN (
      SELECT tm.team_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
  );