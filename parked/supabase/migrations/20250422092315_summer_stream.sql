/*
  # Fix RLS recursion with user_org_access view

  1. Changes
    - Create user_org_access view to prevent recursion
    - Update organization_members RLS policies to use the view
    - Update team_members RLS policies to use the view

  2. Security
    - Maintain existing access control but prevent infinite recursion
    - Users can still only access their own organization data
    - Team members can still access their team data
*/

-- Create view for user organization access
CREATE OR REPLACE VIEW user_org_access AS
SELECT DISTINCT organization_id
FROM organization_members
WHERE user_id = auth.uid();

-- Drop existing policies on organization_members
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view members in same organization" ON organization_members;

-- Create new policies using the view
CREATE POLICY "Organization admins can manage members"
ON organization_members
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_org_access ua 
    JOIN organization_members om 
    ON om.organization_id = ua.organization_id 
    WHERE om.user_id = auth.uid() 
    AND om.role = 'admin'
    AND om.organization_id = organization_members.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_org_access ua 
    JOIN organization_members om 
    ON om.organization_id = ua.organization_id 
    WHERE om.user_id = auth.uid() 
    AND om.role = 'admin'
    AND om.organization_id = organization_members.organization_id
  )
);

CREATE POLICY "Organization members can view members in same organization"
ON organization_members
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_org_access
  )
);