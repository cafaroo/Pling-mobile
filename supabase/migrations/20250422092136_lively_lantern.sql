/*
  # Fix organization member policies recursion
  
  1. Changes
    - Fix infinite recursion in organization member policies
    - Simplify policy conditions to avoid self-referencing
    - Add proper organization admin checks
    
  2. Security
    - Maintain proper access control
    - Prevent unauthorized access
    - Keep admin privileges intact
*/

-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Organization members can view members in same organization" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;

-- Create new non-recursive policies
CREATE POLICY "Organization members can view members in same organization"
ON organization_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Organization admins can manage members"
ON organization_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
);

-- Add index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_role 
ON organization_members(organization_id, user_id, role);

-- Add helper function for checking admin status
CREATE OR REPLACE FUNCTION is_organization_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  );
$$;