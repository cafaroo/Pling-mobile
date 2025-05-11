-- Skapa enum typ för organisationsroller
CREATE TYPE organization_role_enum AS ENUM ('owner', 'admin', 'member', 'invited');

-- Organisations-tabell
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skapa index för effektiv sökning
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Organisationsmedlemskap-tabell
CREATE TABLE IF NOT EXISTS organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role_enum NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Skapa index för effektiv sökning
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Koppling mellan team och organisationer
CREATE TABLE IF NOT EXISTS team_organizations (
  team_id UUID NOT NULL REFERENCES v2_teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, organization_id)
);

-- Skapa index för effektiv sökning
CREATE INDEX IF NOT EXISTS idx_team_organizations_org_id ON team_organizations(organization_id);

-- Säkerhetspolicyer för RLS (Row Level Security)

-- Standardpolicy: Endast ägare och medlemmar kan se organisationer
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by members" 
  ON organizations FOR SELECT 
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = id AND user_id = auth.uid()
    )
  );

-- Endast ägare kan uppdatera organisationen
CREATE POLICY "Organizations are updatable by owner" 
  ON organizations FOR UPDATE 
  USING (auth.uid() = owner_id);

-- Endast ägare kan ta bort organisationen
CREATE POLICY "Organizations are deletable by owner" 
  ON organizations FOR DELETE 
  USING (auth.uid() = owner_id);

-- Alla autentiserade användare kan skapa organisationer
CREATE POLICY "Any authenticated user can create organizations" 
  ON organizations FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Medlemskapsregler
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Medlemmar kan se andra medlemmar i organisationer de tillhör
CREATE POLICY "Members can see other members in their organizations" 
  ON organization_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members om 
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

-- Endast ägare och admins kan hantera medlemmar
CREATE POLICY "Owners and admins can manage members" 
  ON organization_members FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members om 
          WHERE om.organization_id = o.id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Teamkopplingsregler
ALTER TABLE team_organizations ENABLE ROW LEVEL SECURITY;

-- Endast organisationsägare och admins kan hantera teamkopplingar
CREATE POLICY "Owners and admins can manage team connections" 
  ON team_organizations FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members om 
          WHERE om.organization_id = o.id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Alla medlemmar kan se teamkopplingar
CREATE POLICY "Members can see team connections" 
  ON team_organizations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM organizations o 
      WHERE o.id = organization_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members om 
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

-- Funktioner för real-time uppdateringar
CREATE OR REPLACE FUNCTION public.handle_organization_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for att uppdatera updated_at när en organisation ändras
CREATE TRIGGER organization_updated
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION handle_organization_update(); 