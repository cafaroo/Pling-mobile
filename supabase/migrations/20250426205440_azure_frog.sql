/*
  # Fix approve_team_member function parameter names
  
  1. Changes
    - Update approve_team_member function to use parameter names that match client code
    - Keep the same functionality but with correct parameter naming
    - Maintain table aliases to prevent ambiguous column references
    
  2. Security
    - Maintain SECURITY DEFINER attribute
    - Keep same permission checks for team leaders and owners
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS approve_team_member;

-- Recreate function with parameter names matching client code
CREATE OR REPLACE FUNCTION approve_team_member(
  team_id uuid,
  user_id uuid,
  approve boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is team leader or owner
  IF NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = approve_team_member.team_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('leader', 'owner')
  ) THEN
    RAISE EXCEPTION 'Only team leaders can approve members';
  END IF;
  
  -- Update member status
  UPDATE team_members tm
  SET approval_status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END
  WHERE tm.team_id = approve_team_member.team_id
  AND tm.user_id = approve_team_member.user_id
  AND tm.approval_status = 'pending';
  
  -- If rejected, remove the member
  IF NOT approve THEN
    DELETE FROM team_members tm
    WHERE tm.team_id = approve_team_member.team_id
    AND tm.user_id = approve_team_member.user_id
    AND tm.approval_status = 'rejected';
  END IF;
  
  RETURN FOUND;
END;
$$;