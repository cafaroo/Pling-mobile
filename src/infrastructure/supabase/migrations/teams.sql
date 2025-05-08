-- Skapa enums
CREATE TYPE team_role_enum AS ENUM ('owner', 'admin', 'member');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE team_visibility_enum AS ENUM ('public', 'private', 'unlisted');
CREATE TYPE join_policy_enum AS ENUM ('open', 'invite_only', 'approval');

-- Skapa teams-tabell
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settings JSONB NOT NULL DEFAULT '{
    "visibility": "private",
    "joinPolicy": "invite_only",
    "memberLimit": 50,
    "notificationPreferences": {
      "memberJoined": true,
      "memberLeft": true,
      "roleChanged": true,
      "activityCreated": true,
      "activityCompleted": true,
      "messageReceived": true
    },
    "customFields": {}
  }'::jsonb
);

-- Index för snabbare sökningar
CREATE INDEX IF NOT EXISTS teams_owner_id_idx ON teams (owner_id);
CREATE INDEX IF NOT EXISTS teams_name_idx ON teams (name);

-- Skapa team_members-tabell
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role_enum NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Index för snabbare sökningar
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members (user_id);

-- Skapa team_invitations-tabell
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  status invitation_status_enum NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Index för snabbare sökningar
CREATE INDEX IF NOT EXISTS team_invitations_team_id_idx ON team_invitations (team_id);
CREATE INDEX IF NOT EXISTS team_invitations_user_id_idx ON team_invitations (user_id);
CREATE INDEX IF NOT EXISTS team_invitations_status_idx ON team_invitations (status);

-- Skapa team_member_permissions-tabell
CREATE TABLE IF NOT EXISTS team_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id, permission_name)
);

-- Index för snabbare sökningar
CREATE INDEX IF NOT EXISTS team_member_permissions_team_id_idx ON team_member_permissions (team_id);
CREATE INDEX IF NOT EXISTS team_member_permissions_user_id_idx ON team_member_permissions (user_id);

-- Skapa team_activities-tabell för loggning
CREATE TABLE IF NOT EXISTS team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index för snabbare sökningar
CREATE INDEX IF NOT EXISTS team_activities_team_id_idx ON team_activities (team_id);
CREATE INDEX IF NOT EXISTS team_activities_created_at_idx ON team_activities (created_at);

-- Trigger som uppdaterar updated_at-fältet
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger för teams-tabellen
CREATE TRIGGER update_teams_timestamp
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Row Level Security (RLS) för teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policys för teams
CREATE POLICY "Teams är synliga för sina medlemmar" ON teams
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = id
    )
  );

CREATE POLICY "Ägare kan ändra team" ON teams
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Ägare kan ta bort team" ON teams
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Inloggade användare kan skapa team" ON teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policys för team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members är synliga för andra medlemmar" ON team_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = team_members.team_id
    )
  );

CREATE POLICY "Ägare och admin kan hantera medlemmar" ON team_members
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM team_members 
      WHERE team_id = team_members.team_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Policys för team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inbjudningar är synliga för teammedlemmar" ON team_invitations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = team_invitations.team_id
    )
  );

CREATE POLICY "Inbjudningar är synliga för inbjudna" ON team_invitations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Ägare och admin kan hantera inbjudningar" ON team_invitations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM team_members 
      WHERE team_id = team_invitations.team_id 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Inbjudna kan uppdatera sin inbjudan" ON team_invitations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policys för team_member_permissions
ALTER TABLE team_member_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Behörigheter är synliga för teammedlemmar" ON team_member_permissions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = team_member_permissions.team_id
    )
  );

CREATE POLICY "Ägare och admin kan hantera behörigheter" ON team_member_permissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM team_members 
      WHERE team_id = team_member_permissions.team_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Policys för team_activities
ALTER TABLE team_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aktiviteter är synliga för teammedlemmar" ON team_activities
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = team_activities.team_id
    )
  );

CREATE POLICY "Ägare och admin kan skapa aktivitetsloggar" ON team_activities
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM team_members 
      WHERE team_id = team_activities.team_id 
      AND role IN ('owner', 'admin')
    )
  ); 