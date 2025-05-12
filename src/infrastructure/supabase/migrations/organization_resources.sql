-- Skapa enum för resurstyper
CREATE TYPE resource_type_enum AS ENUM (
  'document', 'project', 'goal', 'template', 'file', 'report', 'dashboard', 'config', 'other'
);

-- Skapa huvudtabell för organisationsresurser
CREATE TABLE organization_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type resource_type_enum NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT resource_name_org_unique UNIQUE(organization_id, name, type)
);

-- Skapa enum för resursbehörigheter
CREATE TYPE resource_permission_enum AS ENUM (
  'view', 'edit', 'delete', 'share', 'manage_permissions', 'change_owner'
);

-- Skapa tabell för resursbehörigheter
CREATE TABLE resource_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES organization_resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES v2_teams(id),
  role TEXT,
  permissions resource_permission_enum[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- En behörighetstilldelning måste ha antingen användar-ID, team-ID eller roll
  CONSTRAINT permission_target_check CHECK (
    (user_id IS NOT NULL)::integer + 
    (team_id IS NOT NULL)::integer + 
    (role IS NOT NULL)::integer = 1
  )
);

-- Skapa index för snabbare sökning
CREATE INDEX idx_org_resources_organization_id ON organization_resources(organization_id);
CREATE INDEX idx_org_resources_owner_id ON organization_resources(owner_id);
CREATE INDEX idx_org_resources_type ON organization_resources(type);
CREATE INDEX idx_resource_permissions_resource_id ON resource_permissions(resource_id);
CREATE INDEX idx_resource_permissions_user_id ON resource_permissions(user_id);
CREATE INDEX idx_resource_permissions_team_id ON resource_permissions(team_id);
CREATE INDEX idx_resource_permissions_role ON resource_permissions(role);

-- Skapa RLS-policy (Row Level Security) för resurser
ALTER TABLE organization_resources ENABLE ROW LEVEL SECURITY;

-- Skapa policyn som tillåter läsning av resurser
CREATE POLICY "Användare kan se resurser i sina organisationer" ON organization_resources
FOR SELECT
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_resources.organization_id
    AND om.user_id = auth.uid()
  )
);

-- Skapa policyn som tillåter skapande av resurser
CREATE POLICY "Användare kan skapa resurser i sina organisationer" ON organization_resources
FOR INSERT
WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_resources.organization_id
    AND om.user_id = auth.uid()
  )
);

-- Skapa policyn som tillåter uppdatering av resurser
CREATE POLICY "Användare kan uppdatera resurser de äger" ON organization_resources
FOR UPDATE
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM resource_permissions rp
    WHERE rp.resource_id = organization_resources.id
    AND rp.user_id = auth.uid()
    AND 'edit' = ANY(rp.permissions)
  )
);

-- Skapa policyn som tillåter borttagning av resurser
CREATE POLICY "Användare kan ta bort resurser de äger" ON organization_resources
FOR DELETE
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM resource_permissions rp
    WHERE rp.resource_id = organization_resources.id
    AND rp.user_id = auth.uid()
    AND 'delete' = ANY(rp.permissions)
  )
);

-- RLS för resursbehörigheter
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;

-- Skapa policyn som tillåter läsning av resursbehörigheter
CREATE POLICY "Användare kan se resursbehörigheter för sina resurser" ON resource_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_resources res
    WHERE res.id = resource_permissions.resource_id
    AND (
      res.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM resource_permissions rp
        WHERE rp.resource_id = res.id
        AND rp.user_id = auth.uid()
        AND 'manage_permissions' = ANY(rp.permissions)
      )
    )
  )
);

-- Skapa policyn som tillåter hantering av resursbehörigheter
CREATE POLICY "Användare kan hantera resursbehörigheter för sina resurser" ON resource_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_resources res
    WHERE res.id = resource_permissions.resource_id
    AND (
      res.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM resource_permissions rp
        WHERE rp.resource_id = res.id
        AND rp.user_id = auth.uid()
        AND 'manage_permissions' = ANY(rp.permissions)
      )
    )
  )
); 