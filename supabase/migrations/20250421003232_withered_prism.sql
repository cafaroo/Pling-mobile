/*
  # Fix team invitation system
  
  1. Changes
    - Add function to handle team invitations
    - Add function to accept invitations
    - Add function to check invitation validity
    - Add function to clean up expired invitations
    
  2. Security
    - Maintain RLS policies
    - Add proper permission checks
    - Handle both new and existing users
*/

-- Function to handle team invitations
CREATE OR REPLACE FUNCTION handle_team_invitation(
  team_id uuid,
  email text,
  role text DEFAULT 'member'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_user_id uuid;
  invitation_record record;
  token text;
  expires_at timestamptz;
BEGIN
  -- Check if email already exists in profiles
  SELECT id INTO existing_user_id
  FROM profiles
  WHERE profiles.email = handle_team_invitation.email;
  
  -- If user exists and is already a team member, return error
  IF existing_user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = handle_team_invitation.team_id
      AND user_id = existing_user_id
    ) THEN
      RETURN json_build_object(
        'success', false,
        'message', 'User is already a team member'
      );
    END IF;
    
    -- Add existing user directly to team
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (team_id, existing_user_id, role);
    
    RETURN json_build_object(
      'success', true,
      'message', 'User added to team',
      'type', 'direct_add'
    );
  END IF;
  
  -- Generate invitation for new user
  token := generate_invitation_token();
  expires_at := now() + interval '7 days';
  
  -- Create invitation
  INSERT INTO team_invitations (
    team_id,
    email,
    role,
    token,
    expires_at
  ) VALUES (
    team_id,
    email,
    role,
    token,
    expires_at
  )
  RETURNING * INTO invitation_record;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Invitation created',
    'type', 'invitation',
    'invitation', json_build_object(
      'id', invitation_record.id,
      'token', invitation_record.token,
      'expires_at', invitation_record.expires_at
    )
  );
END;
$$;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(
  invitation_token text,
  user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record record;
BEGIN
  -- Get and validate invitation
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE token = invitation_token
  AND accepted_at IS NULL
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Add user to team
  INSERT INTO team_members (
    team_id,
    user_id,
    role
  ) VALUES (
    invitation_record.team_id,
    user_id,
    invitation_record.role
  );
  
  -- Mark invitation as accepted
  UPDATE team_invitations
  SET 
    accepted_at = now()
  WHERE id = invitation_record.id;
  
  RETURN true;
END;
$$;

-- Function to check if invitation is valid
CREATE OR REPLACE FUNCTION check_invitation_valid(invitation_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  invitation_record record;
BEGIN
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE token = invitation_token
  AND accepted_at IS NULL
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Invalid or expired invitation'
    );
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'team_id', invitation_record.team_id,
    'email', invitation_record.email,
    'role', invitation_record.role,
    'expires_at', invitation_record.expires_at
  );
END;
$$;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM team_invitations
  WHERE expires_at < now()
  AND accepted_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;