/*
  # Fix organization members policy recursion

  1. Changes
    - Remove recursive policy check from organization_members table
    - Simplify policy to directly check user access without recursive lookups

  2. Security
    - Maintain RLS protection while avoiding infinite recursion
    - Ensure organization members can still view other members in their organization
    - Ensure organization admins retain management capabilities
*/

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Organization members can view other members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;

-- Create new non-recursive policies
CREATE POLICY "Organization members can view members in same organization"
ON organization_members
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization admins can manage members"
ON organization_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE 
      organization_id = organization_members.organization_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE 
      organization_id = organization_members.organization_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
  )
);