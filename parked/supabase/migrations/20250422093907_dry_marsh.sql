/*
  # Fix organization_members RLS policies to prevent infinite recursion
  
  1. Changes
    - Drop existing policies that are causing recursion
    - Create security definer functions for permission checks
    - Create new policies using these functions
    - Add index for better performance
    
  2. Security
    - Maintain same access control rules
    - Prevent infinite recursion in policy evaluation
    - Improve query performance with index
*/

-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members CASCADE;
DROP POLICY IF EXISTS "Organization members can view members in same organization" ON organization_members CASCADE;

-- Create security definer function to check organization membership
CREATE OR REPLACE FUNCTION user_has_org_access(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = org_id
  );
$$;

-- Create security definer function to check organization admin status
CREATE OR REPLACE FUNCTION user_is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND role = 'admin'
  );
$$;

-- Create new policies using the security definer functions
CREATE POLICY "Organization admins can manage members"
ON organization_members
FOR ALL
TO authenticated
USING (user_is_org_admin(organization_id))
WITH CHECK (user_is_org_admin(organization_id));

CREATE POLICY "Organization members can view members in same organization"
ON organization_members
FOR SELECT
TO authenticated
USING (user_has_org_access(organization_id));

-- Add index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_role 
ON organization_members(organization_id, user_id, role);