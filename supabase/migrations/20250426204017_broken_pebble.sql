/*
  # Fix approve_team_member function ambiguous column reference
  
  1. Changes
    - Fix ambiguous column reference in approve_team_member function
    - Explicitly qualify team_id and user_id references with table names
    - Maintain same functionality with corrected implementation
    
  2. Security
    - Keep SECURITY DEFINER attribute
    - Maintain permission checks for team leaders
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS approve_team_member;

-- Recreate function with explicit column references
CREATE OR REPLACE FUNCTION approve_team_member(
  p_team_id uuid,
  p_user_id uuid,
  approve boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is team leader or owner
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = p_team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('leader', 'owner')
  ) THEN
    RAISE EXCEPTION 'Only team leaders can approve members';
  END IF;
  
  -- Update member status
  UPDATE team_members
  SET approval_status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END
  WHERE team_members.team_id = p_team_id
  AND team_members.user_id = p_user_id
  AND team_members.approval_status = 'pending';
  
  -- If rejected, remove the member
  IF NOT approve THEN
    DELETE FROM team_members
    WHERE team_members.team_id = p_team_id
    AND team_members.user_id = p_user_id
    AND team_members.approval_status = 'rejected';
  END IF;
  
  RETURN FOUND;
END;
$$;