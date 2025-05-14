-- Skapa team_activities tabell
CREATE TABLE IF NOT EXISTS team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_team_activities_team_id ON team_activities(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_performed_by ON team_activities(performed_by);
CREATE INDEX IF NOT EXISTS idx_team_activities_target_id ON team_activities(target_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_activity_type ON team_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_team_activities_timestamp ON team_activities(timestamp);

-- Skapa GIN-index för JSON-filtrering av metadata
CREATE INDEX IF NOT EXISTS idx_team_activities_metadata ON team_activities USING GIN (metadata jsonb_path_ops);

-- Row Level Security (RLS)
ALTER TABLE team_activities ENABLE ROW LEVEL SECURITY;

-- Policy för att endast läsa aktiviteter från team som användaren är medlem i
CREATE POLICY team_activities_read_policy
  ON team_activities 
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM team_members 
      WHERE team_members.team_id = team_activities.team_id
    )
  );

-- Policy för att endast teamägare, admin och moderatorer kan skapa aktiviteter
CREATE POLICY team_activities_insert_policy
  ON team_activities 
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM team_members 
      WHERE team_members.team_id = team_activities.team_id
        AND team_members.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Policy för att endast teamägare och admin kan uppdatera eller ta bort aktiviteter
CREATE POLICY team_activities_update_policy
  ON team_activities 
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM team_members 
      WHERE team_members.team_id = team_activities.team_id
        AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY team_activities_delete_policy
  ON team_activities 
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM team_members 
      WHERE team_members.team_id = team_activities.team_id
        AND team_members.role IN ('owner', 'admin')
    )
  );

-- Funktion för att automatiskt skapa aktivitetslogg vid vissa team-operationer
CREATE OR REPLACE FUNCTION create_team_activity()
RETURNS TRIGGER AS $$
DECLARE
  activity_data jsonb;
BEGIN
  -- Sätt standard aktivitetsdata
  activity_data := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP
  );
  
  -- Skapa olika aktiviteter baserat på händelsen
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'team_members' THEN
    -- Ny medlem har lagts till
    INSERT INTO team_activities (
      team_id, 
      performed_by, 
      target_id,
      activity_type, 
      metadata
    ) 
    VALUES (
      NEW.team_id,
      auth.uid(),
      NEW.user_id,
      'member_joined',
      activity_data || jsonb_build_object('role', NEW.role)
    );
  ELSIF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'team_members' THEN
    -- Medlem har tagits bort
    INSERT INTO team_activities (
      team_id, 
      performed_by, 
      target_id,
      activity_type, 
      metadata
    ) 
    VALUES (
      OLD.team_id,
      auth.uid(),
      OLD.user_id,
      'member_left',
      activity_data
    );
  ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'team_members' AND OLD.role <> NEW.role THEN
    -- Roll har ändrats
    INSERT INTO team_activities (
      team_id, 
      performed_by, 
      target_id,
      activity_type, 
      metadata
    ) 
    VALUES (
      NEW.team_id,
      auth.uid(),
      NEW.user_id,
      'role_changed',
      activity_data || jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'teams' THEN
    -- Team har uppdaterats
    INSERT INTO team_activities (
      team_id, 
      performed_by, 
      activity_type, 
      metadata
    ) 
    VALUES (
      NEW.id,
      auth.uid(),
      'team_updated',
      activity_data || jsonb_build_object(
        'fields_updated', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE key != 'id' AND key != 'created_at'
            AND to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
        )
      )
    );
  ELSIF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'team_invitations' THEN
    -- Inbjudan har skickats
    INSERT INTO team_activities (
      team_id, 
      performed_by, 
      target_id,
      activity_type, 
      metadata
    ) 
    VALUES (
      NEW.team_id,
      auth.uid(),
      NEW.user_id,
      'invitation_sent',
      activity_data || jsonb_build_object('email', NEW.email)
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers för automatisk aktivitetsloggning
DROP TRIGGER IF EXISTS team_members_activity_trigger ON team_members;
CREATE TRIGGER team_members_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION create_team_activity();

DROP TRIGGER IF EXISTS teams_activity_trigger ON teams;
CREATE TRIGGER teams_activity_trigger
  AFTER UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION create_team_activity();

DROP TRIGGER IF EXISTS team_invitations_activity_trigger ON team_invitations;
CREATE TRIGGER team_invitations_activity_trigger
  AFTER INSERT ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION create_team_activity(); 