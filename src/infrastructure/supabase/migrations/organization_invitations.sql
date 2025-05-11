-- Skapa enum typ för inbjudningsstatus
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Skapa inbjudningstabell för organisationer
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  email TEXT,
  status invitation_status_enum NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id, status)
);

-- Skapa index för effektiv sökning
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_user_id ON organization_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_status ON organization_invitations(status);

-- Säkerhetspolicyer för RLS (Row Level Security)
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Alla kan se inbjudningar de har fått
CREATE POLICY "Users can see own invitations" 
  ON organization_invitations FOR SELECT 
  USING (
    auth.uid() = user_id
  );

-- Organisationsmedlemmar kan se inbjudningar till sin organisation
CREATE POLICY "Organization members can see sent invitations" 
  ON organization_invitations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id 
      AND om.user_id = auth.uid()
    )
  );

-- Endast organisationsägare och admins kan skapa inbjudningar
CREATE POLICY "Organization owners and admins can create invitations" 
  ON organization_invitations FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Endast organisationsägare, admins och den inbjudna användaren kan uppdatera inbjudningar
CREATE POLICY "Organization owners, admins and invited users can update invitations" 
  ON organization_invitations FOR UPDATE 
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Endast organisationsägare och admins kan ta bort inbjudningar
CREATE POLICY "Organization owners and admins can delete invitations" 
  ON organization_invitations FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Funktion för att automatiskt markera utgångna inbjudningar
CREATE OR REPLACE FUNCTION handle_expired_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Om vi försöker uppdatera en inbjudan men den har gått ut, markera den som utgången
  IF OLD.status = 'pending' AND NEW.status = 'pending' AND NEW.expires_at < NOW() THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger för att kontrollera utgångsdatum vid uppdatering
CREATE TRIGGER check_invitation_expiration
BEFORE UPDATE ON organization_invitations
FOR EACH ROW
EXECUTE FUNCTION handle_expired_invitations();

-- Funktion för att markera utgångna inbjudningar vid läsning
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'SELECT' AND OLD.status = 'pending' AND OLD.expires_at < NOW() THEN
    UPDATE organization_invitations
    SET status = 'expired'
    WHERE id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Funktion för att räkna aktiva inbjudningar till en organisation
CREATE OR REPLACE FUNCTION get_pending_invitations_count(org_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM organization_invitations
  WHERE organization_id = org_id
  AND status = 'pending'
  AND expires_at > NOW();
$$; 