/*
  # Fix RLS recursion with proper dependency handling

  1. Changes
    - Drop existing policies that depend on the view first
    - Drop the view that's causing recursion
    - Create security definer functions for access control
    - Create new policies using the functions
    
  2. Security
    - Maintain existing access control but prevent infinite recursion
    - Users can still only access their own organization data
    - Organization admins can still manage members
*/

-- First drop the policies that depend on the view
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view members in same organization" ON organization_members;

-- Now we can safely drop the view
DROP VIEW IF EXISTS user_org_access;

-- Create a security definer function to check organization membership
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

-- Create a security definer function to check organization admin status
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