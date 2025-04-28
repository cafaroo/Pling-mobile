/*
  # Fix team invite code function
  
  1. Changes
    - Drop existing function first to avoid return type error
    - Recreate function with proper return type
    - Maintain same functionality for generating team invite codes
    
  2. Security
    - Keep SECURITY DEFINER attribute
    - Maintain permission checks for team leaders
*/

-- First drop the existing function to avoid return type error
DROP FUNCTION IF EXISTS public.create_team_invite_code(uuid);

-- Then recreate the function with the proper return type
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
    WHERE team_id = team_id_param
      AND user_id = v_user_id
      AND role IN ('leader', 'owner')
  ) THEN
    RAISE EXCEPTION 'User is not authorized to create invite codes for this team';
  END IF;

  -- Generate a random 6-character code
  v_code := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 6));
  v_expires_at := now() + interval '7 days';

  -- Insert new invite code
  INSERT INTO team_invite_codes (
    team_id,
    code,
    created_by,
    expires_at
  )
  VALUES (
    team_id_param,
    v_code,
    v_user_id,
    v_expires_at
  );

  RETURN QUERY SELECT v_code, v_expires_at;
END;
$$;