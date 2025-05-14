-- Migration: resource_limits_table
-- Tabellen som lagrar begränsningarna för olika resurser per prenumerationsnivå

-- Skapa enum för plan-typer
CREATE TYPE subscription_plan_type AS ENUM ('basic', 'pro', 'enterprise');

-- Skapa enum för resurstyper
CREATE TYPE resource_type AS ENUM (
  'team', 
  'team_member', 
  'goal', 
  'competition', 
  'report', 
  'dashboard', 
  'media'
);

-- Huvudtabell för resursbegränsningar
CREATE TABLE resource_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_plan_type NOT NULL,
  resource_type resource_type NOT NULL,
  limit_value INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_type, resource_type)
);

-- Triggers för automatisk uppdatering av updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON resource_limits
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Populera med standardvärden
INSERT INTO resource_limits (plan_type, resource_type, limit_value, display_name, description)
VALUES
  -- Basic plan
  ('basic', 'team', 3, 'Team', 'Antal team i organisationen'),
  ('basic', 'team_member', 5, 'Teammedlemmar', 'Antal medlemmar per team'),
  ('basic', 'goal', 10, 'Mål', 'Antal mål som kan skapas'),
  ('basic', 'competition', 3, 'Tävlingar', 'Antal tävlingar som kan skapas'),
  ('basic', 'report', 5, 'Rapporter', 'Antal rapporter som kan genereras'),
  ('basic', 'dashboard', 1, 'Dashboards', 'Antal dashboards'),
  ('basic', 'media', 100, 'Medialagring (MB)', 'Total medialagring i MB'),
  
  -- Pro plan
  ('pro', 'team', 10, 'Team', 'Antal team i organisationen'),
  ('pro', 'team_member', 25, 'Teammedlemmar', 'Antal medlemmar per team'),
  ('pro', 'goal', 50, 'Mål', 'Antal mål som kan skapas'),
  ('pro', 'competition', 15, 'Tävlingar', 'Antal tävlingar som kan skapas'),
  ('pro', 'report', 30, 'Rapporter', 'Antal rapporter som kan genereras'),
  ('pro', 'dashboard', 5, 'Dashboards', 'Antal dashboards'),
  ('pro', 'media', 1000, 'Medialagring (MB)', 'Total medialagring i MB'),
  
  -- Enterprise plan
  ('enterprise', 'team', 50, 'Team', 'Antal team i organisationen'),
  ('enterprise', 'team_member', 100, 'Teammedlemmar', 'Antal medlemmar per team'),
  ('enterprise', 'goal', 200, 'Mål', 'Antal mål som kan skapas'),
  ('enterprise', 'competition', 50, 'Tävlingar', 'Antal tävlingar som kan skapas'),
  ('enterprise', 'report', 100, 'Rapporter', 'Antal rapporter som kan genereras'),
  ('enterprise', 'dashboard', 20, 'Dashboards', 'Antal dashboards'),
  ('enterprise', 'media', 5000, 'Medialagring (MB)', 'Total medialagring i MB');

-- RLS-policyer
ALTER TABLE resource_limits ENABLE ROW LEVEL SECURITY;

-- Läsrättigheter för alla autentiserade användare
CREATE POLICY "Alla autentiserade användare kan se resursbegränsningar"
  ON resource_limits
  FOR SELECT
  TO authenticated
  USING (true);

-- Bara administratörer kan ändra på begränsningar - ändrad för att inte använda user_roles
CREATE POLICY "Bara administratörer kan ändra resursbegränsningar"
  ON resource_limits
  FOR ALL
  TO service_role
  USING (true);

-- För att tillåta API-anrop genom funktioner
GRANT SELECT ON resource_limits TO authenticated;
GRANT ALL ON resource_limits TO service_role; 