-- Add team notification settings
ALTER TABLE teams
ADD COLUMN notification_settings JSONB NOT NULL DEFAULT jsonb_build_object(
  'new_member', true,
  'member_left', true,
  'goal_updates', true,
  'competition_updates', true
);

-- Add RLS policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view notification settings"
  ON teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Only owners and leaders can update notification settings"
  ON teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('owner', 'leader')
    )
  );

-- Function to update team notification settings
CREATE OR REPLACE FUNCTION update_team_notification_settings(
  team_id_param UUID,
  settings JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission to update settings
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_id_param
      AND user_id = auth.uid()
      AND role IN ('owner', 'leader')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Update the settings
  UPDATE teams
  SET notification_settings = settings
  WHERE id = team_id_param;

  RETURN FOUND;
END;
$$; 