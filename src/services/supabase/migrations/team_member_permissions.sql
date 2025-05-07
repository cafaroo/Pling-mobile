-- Skapa permissions-tabell för team-medlemmar
CREATE TABLE IF NOT EXISTS team_member_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Kombinera team_id och user_id och permission_name som en unik begränsning
  UNIQUE(team_id, user_id, permission_name)
);

-- Lägg till index för snabbare sökningar
CREATE INDEX IF NOT EXISTS idx_team_member_permissions_team_id ON team_member_permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_member_permissions_user_id ON team_member_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_team_member_permissions_combined ON team_member_permissions(team_id, user_id);

-- Lägg till RLS-regler (Row Level Security)
ALTER TABLE team_member_permissions ENABLE ROW LEVEL SECURITY;

-- Skapa en policy för att bara visa behörigheter för team som användaren är medlem i
CREATE POLICY "Medlemmar kan se alla teambehörigheter"
  ON team_member_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_member_permissions.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Skapa en policy så att bara ägare/administratörer kan redigera behörigheter
CREATE POLICY "Bara ägare/admin kan hantera behörigheter"
  ON team_member_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_member_permissions.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Skapa en trigger-funktion för att uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION update_team_member_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Skapa en trigger som anropar funktionen när en permission uppdateras
CREATE TRIGGER update_team_member_permissions_timestamp
BEFORE UPDATE ON team_member_permissions
FOR EACH ROW
EXECUTE FUNCTION update_team_member_permissions_updated_at(); 