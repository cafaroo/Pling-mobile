/*
  # Update team system with enhanced roles
  
  1. Changes
    - Add 'owner' role to team_members table
    - Add organization table for multi-team ownership
    - Add organization_members table for organization membership
    - Update team_members constraints for new roles
    
  2. Security
    - Enable RLS on new tables
    - Add policies for organization access
    - Update team member policies for new roles
*/

-- Update team_members role constraint to include 'owner'
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check 
  CHECK (role IN ('member', 'leader', 'owner'));

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('member', 'admin')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- Add organization_id to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create policies for organizations
CREATE POLICY "Organization admins can manage organizations"
ON organizations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
);

CREATE POLICY "Organization members can view organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
    )
);

-- Create policies for organization_members
CREATE POLICY "Organization admins can manage members"
ON organization_members
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
);

CREATE POLICY "Organization members can view other members"
ON organization_members
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
    )
);

-- Update team policies to include organization context
CREATE POLICY "Organization admins can manage teams"
ON teams
FOR ALL
TO authenticated
USING (
    teams.organization_id IN (
        SELECT om.organization_id
        FROM organization_members om
        WHERE om.user_id = auth.uid()
        AND om.role = 'admin'
    )
)
WITH CHECK (
    teams.organization_id IN (
        SELECT om.organization_id
        FROM organization_members om
        WHERE om.user_id = auth.uid()
        AND om.role = 'admin'
    )
);

-- Create function to check if user is team owner
CREATE OR REPLACE FUNCTION check_team_owner(team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM team_members 
    WHERE team_id = $1 
    AND user_id = auth.uid()
    AND role = 'owner'
  );
$$;

-- Create function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  team_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    o.id,
    o.name,
    om.role,
    o.created_at,
    o.updated_at,
    COUNT(t.id) as team_count
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  LEFT JOIN teams t ON t.organization_id = o.id
  WHERE om.user_id = get_user_organizations.user_id
  GROUP BY o.id, o.name, om.role, o.created_at, o.updated_at;
$$;

-- Create function to get organization teams
CREATE OR REPLACE FUNCTION get_organization_teams(organization_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  created_at timestamptz,
  updated_at timestamptz,
  member_count bigint,
  owner_id uuid,
  owner_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    t.id,
    t.name,
    t.created_at,
    t.updated_at,
    COUNT(tm.id) as member_count,
    owner.user_id as owner_id,
    p.name as owner_name
  FROM teams t
  LEFT JOIN team_members tm ON tm.team_id = t.id
  LEFT JOIN team_members owner ON owner.team_id = t.id AND owner.role = 'owner'
  LEFT JOIN profiles p ON p.id = owner.user_id
  WHERE t.organization_id = get_organization_teams.organization_id
  GROUP BY t.id, t.name, t.created_at, t.updated_at, owner.user_id, p.name;
$$;

-- Create function to create organization
CREATE OR REPLACE FUNCTION create_organization(name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create organization
  INSERT INTO organizations (name)
  VALUES (name)
  RETURNING id INTO new_org_id;
  
  -- Add creator as admin
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'admin');
  
  RETURN new_org_id;
END;
$$;

-- Create function to add team to organization
CREATE OR REPLACE FUNCTION add_team_to_organization(team_id uuid, organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is team owner
  IF NOT check_team_owner(team_id) THEN
    RETURN false;
  END IF;
  
  -- Check if user is organization admin
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = add_team_to_organization.organization_id
    AND user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  -- Update team
  UPDATE teams
  SET organization_id = add_team_to_organization.organization_id
  WHERE id = team_id;
  
  RETURN true;
END;
$$;

-- Create function to promote team member to owner
CREATE OR REPLACE FUNCTION promote_to_team_owner(team_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is team owner
  IF NOT check_team_owner(team_id) THEN
    RETURN false;
  END IF;
  
  -- Update member role
  UPDATE team_members
  SET role = 'owner'
  WHERE team_id = promote_to_team_owner.team_id
  AND user_id = promote_to_team_owner.user_id;
  
  -- Demote current owner to leader
  UPDATE team_members
  SET role = 'leader'
  WHERE team_id = promote_to_team_owner.team_id
  AND user_id = auth.uid();
  
  RETURN true;
END;
$$;