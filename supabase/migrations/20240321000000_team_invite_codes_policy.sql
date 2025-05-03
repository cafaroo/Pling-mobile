-- Enable RLS
ALTER TABLE team_invite_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can create invite codes"
ON team_invite_codes
FOR INSERT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_invite_codes.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.status = 'active'
    AND team_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Team members can read invite codes"
ON team_invite_codes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_invite_codes.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.status = 'active'
  )
);

-- Add expires_at index for performance
CREATE INDEX IF NOT EXISTS idx_team_invite_codes_expires_at 
ON team_invite_codes(expires_at);

-- Add team_id index for joins
CREATE INDEX IF NOT EXISTS idx_team_invite_codes_team_id 
ON team_invite_codes(team_id); 