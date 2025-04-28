/*
  # Fix team invite code function parameter name
  
  1. Changes
    - Update create_team_invite_code function to use correct parameter name
    - Fix the parameter reference in the function body
    - Maintain same functionality with corrected implementation
    
  2. Security
    - Maintain SECURITY DEFINER attribute
    - Keep same permission checks for team leaders
*/

-- Drop existing function to recreate it with fixed parameter name
DROP FUNCTION IF EXISTS public.create_team_invite_code(uuid);

-- Recreate function with correct parameter name
CREATE OR REPLACE FUNCTION create_team_invite_code(team_id uuid)
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
    WHERE team_id = create_team_invite_code.team_id
      AND user_id = v_user_id
      AND role IN ('leader', 'owner')
  ) THEN
    RAISE EXCEPTION 'User is not authorized to create invite codes for this team';
  END IF;

  -- Generate a random 6-character code
  v_code := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 6));
  v_expires_at := now() + interval '24 hours';

  -- Insert new invite code
  INSERT INTO team_invite_codes (
    team_id,
    code,
    created_by,
    expires_at
  )
  VALUES (
    create_team_invite_code.team_id,
    v_code,
    v_user_id,
    v_expires_at
  );

  RETURN QUERY SELECT v_code, v_expires_at;
END;
$$;