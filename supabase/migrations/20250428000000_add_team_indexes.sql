-- Lägg till index för team_members för prestandaförbättring vid vanliga sökfrågor
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- Lägg till index för team_messages för prestandaförbättring
CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON team_messages(team_id);

-- Lägg till kolumner till team_messages för att stödja funktioner som används i frontend
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- Säkerställ att settings i teams-tabellen är ett objekt med förväntade nycklar
ALTER TABLE teams ADD CONSTRAINT IF NOT EXISTS settings_json_schema 
CHECK (
  jsonb_typeof(settings) = 'object' AND 
  settings ? 'allowInvites' AND 
  settings ? 'maxMembers' AND
  settings ? 'requireAdminApproval' AND
  settings ? 'notificationPreferences' AND
  settings ? 'privacy'
); 