-- Migration: resource_usage_table
-- Tabellen för att spåra resursanvändning per organisation

-- Huvudtabell för resursanvändning
CREATE TABLE resource_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  current_usage INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, resource_type)
);

-- Historiktabell för resursanvändning, behåller historiken
CREATE TABLE resource_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  usage_value INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index för förbättrad prestanda
CREATE INDEX resource_usage_org_idx ON resource_usage(organization_id);
CREATE INDEX resource_usage_history_org_idx ON resource_usage_history(organization_id);
CREATE INDEX resource_usage_history_recorded_idx ON resource_usage_history(recorded_at);

-- RLS-policyer för resource_usage
ALTER TABLE resource_usage ENABLE ROW LEVEL SECURITY;

-- Organisationsmedlemmar kan se sin egen organisations användning
CREATE POLICY "Organisationsmedlemmar kan se sin egen organisations resursanvändning"
  ON resource_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND organization_id = resource_usage.organization_id
    )
  );

-- Bara administratörer kan uppdatera användningen
CREATE POLICY "Bara administratörer kan uppdatera resursanvändning"
  ON resource_usage
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND organization_id = resource_usage.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- Systemkontot (service-account) kan uppdatera användningen automatiskt
CREATE POLICY "Systemkontot kan uppdatera resursanvändning"
  ON resource_usage
  FOR ALL
  TO service_role
  USING (true);

-- RLS-policyer för resource_usage_history
ALTER TABLE resource_usage_history ENABLE ROW LEVEL SECURITY;

-- Administratörer kan se historik för sin egen organisation
CREATE POLICY "Administratörer kan se sin organisations resursanvändningshistorik"
  ON resource_usage_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND organization_id = resource_usage_history.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- Systemkontot kan lägga till och läsa all historik
CREATE POLICY "Systemkontot kan hantera all resursanvändningshistorik"
  ON resource_usage_history
  FOR ALL
  TO service_role
  USING (true);

-- Funktion för att uppdatera användning och lägga till historikpost
CREATE OR REPLACE FUNCTION update_resource_usage(
  org_id UUID,
  res_type resource_type,
  usage_val INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Uppdatera nuvarande användning
  INSERT INTO resource_usage (organization_id, resource_type, current_usage, last_updated)
  VALUES (org_id, res_type, usage_val, NOW())
  ON CONFLICT (organization_id, resource_type) 
  DO UPDATE SET 
    current_usage = usage_val,
    last_updated = NOW();
    
  -- Lägg till historikrad
  INSERT INTO resource_usage_history (organization_id, resource_type, usage_value)
  VALUES (org_id, res_type, usage_val);
END;
$$; 