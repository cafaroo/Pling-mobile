/*
  # Fix team invite code function ambiguous column reference
  
  1. Changes
    - Fix the ambiguous team_id reference in create_team_invite_code function
    - Explicitly qualify the team_id reference in the function body
    - Maintain the same function signature and return type
    
  2. Security
    - Keep SECURITY DEFINER attribute
    - Maintain permission checks for team leaders
*/

-- Drop the existing function to recreate it with fixed column references
DROP FUNCTION IF EXISTS create_team_invite_code(uuid);

-- Recreate the function with explicit column references
CREATE OR REPLACE FUNCTION create_team_invite_code(team_id_param uuid)
RETURNS TABLE (code text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_code text;
  v_expires_at timestamptz;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is a team leader
  IF NOT EXISTS (
    SELECT 1
    FROM team_members
    WHERE team_members.team_id = team_id_param
      AND team_members.user_id = v_user_id
      AND team_members.role IN ('leader', 'owner')
  ) THEN
    RAISE EXCEPTION 'User is not authorized to create invite codes for this team';
  END IF;

  -- Generate a random 6-character code
  v_code := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 6));
  v_expires_at := now() + interval '24 hours';

  -- Insert new invite code with explicit column references
  INSERT INTO team_invite_codes (
    team_id,
    code,
    created_by,
    expires_at
  )
  VALUES (
    team_id_param,  -- Use the parameter name to avoid ambiguity
    v_code,
    v_user_id,
    v_expires_at
  );

  RETURN QUERY SELECT v_code, v_expires_at;
END;
$$;