/*
  # Fix ambiguous team_id reference in create_team_invite_code function

  1. Changes
    - Update create_team_invite_code function to explicitly reference table names for team_id columns
    - Add proper error handling for invalid team access
    - Ensure proper type casting and validation

  2. Security
    - Maintains existing security checks for team leader access
    - Validates user has proper permissions before creating invite code
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_team_invite_code;

-- Recreate function with fixed column references
CREATE OR REPLACE FUNCTION create_team_invite_code(team_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code_id uuid;
  user_id uuid;
BEGIN
  -- Get the authenticated user's ID
  user_id := auth.uid();

  -- Verify user is a team leader
  IF NOT EXISTS (
    SELECT 1 
    FROM team_members 
    WHERE team_members.team_id = team_id_param 
    AND team_members.user_id = user_id 
    AND team_members.role = 'leader'
  ) THEN
    RAISE EXCEPTION 'User is not a team leader';
  END IF;

  -- Insert new invite code
  INSERT INTO team_invite_codes (
    team_id,
    code,
    created_by,
    expires_at
  ) 
  VALUES (
    team_id_param,
    encode(gen_random_bytes(6), 'hex'),
    user_id,
    now() + interval '7 days'
  )
  RETURNING id INTO new_code_id;

  RETURN new_code_id;
END;
$$;