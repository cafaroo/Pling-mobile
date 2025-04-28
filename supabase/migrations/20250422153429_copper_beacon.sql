/*
  # Add team invite code functions
  
  1. New Functions
    - create_team_invite_code: Creates a new invite code for a team
    - join_team_with_code: Allows users to join a team using an invite code
    
  2. Security
    - Only team leaders can create invite codes
    - Codes expire after 24 hours
    - Each code can only be used once
*/

-- Drop existing function first to avoid return type error
DROP FUNCTION IF EXISTS create_team_invite_code(uuid);

-- Function to create a team invite code
CREATE OR REPLACE FUNCTION create_team_invite_code(team_id uuid)
RETURNS TABLE (
  code text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  expiry_time timestamptz;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding similar looking characters
  i integer;
  code_exists boolean;
BEGIN
  -- Check if user is team leader or owner
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = create_team_invite_code.team_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'owner')
  ) THEN
    RAISE EXCEPTION 'Only team leaders can create invite codes';
  END IF;
  
  -- Generate 6-character code
  LOOP
    new_code := '';
    FOR i IN 1..6 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code exists
    SELECT EXISTS (
      SELECT 1 FROM team_invite_codes 
      WHERE code = new_code
      AND (used_at IS NULL AND expires_at > now())
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Set expiry time (24 hours from now)
  expiry_time := now() + interval '24 hours';
  
  -- Insert new code
  INSERT INTO team_invite_codes (
    team_id,
    code,
    created_by,
    expires_at
  ) VALUES (
    team_id,
    new_code,
    auth.uid(),
    expiry_time
  );
  
  -- Return code and expiry time
  RETURN QUERY
  SELECT new_code, expiry_time;
END;
$$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS join_team_with_code(text);

-- Function to join team with code
CREATE OR REPLACE FUNCTION join_team_with_code(invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_record record;
  team_record record;
BEGIN
  -- Get and validate code
  SELECT * INTO code_record
  FROM team_invite_codes
  WHERE code = upper(invite_code)
  AND used_at IS NULL
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid or expired invite code'
    );
  END IF;
  
  -- Get team info
  SELECT * INTO team_record
  FROM teams
  WHERE id = code_record.team_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Team not found'
    );
  END IF;
  
  -- Check if user is already in team
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = code_record.team_id
    AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'You are already a member of this team'
    );
  END IF;
  
  -- Add user to team
  INSERT INTO team_members (
    team_id,
    user_id,
    role
  ) VALUES (
    code_record.team_id,
    auth.uid(),
    'member'
  );
  
  -- Mark code as used
  UPDATE team_invite_codes
  SET 
    used_at = now(),
    used_by = auth.uid()
  WHERE id = code_record.id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully joined team',
    'team_id', code_record.team_id,
    'team_name', team_record.name
  );
END;
$$;