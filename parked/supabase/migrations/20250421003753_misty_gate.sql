/*
  # Add team invitations system
  
  1. New Tables
    - `team_invitations`
      - Stores pending team invitations
      - Tracks invitation tokens and expiry
      
  2. Functions
    - handle_team_invitation: Creates invitations and handles direct adds
    - generate_invitation_token: Creates secure random tokens
    - process_team_invitation: Processes invitation acceptance
    
  3. Security
    - Enable RLS on team_invitations table
    - Add policies for team leader access
*/

-- Create team invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('member', 'leader')),
    token text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    accepted_at timestamptz,
    UNIQUE(team_id, email),
    UNIQUE(token)
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Team leaders can manage invitations" ON team_invitations;

-- Create policy for team leaders to manage invitations
CREATE POLICY "Team leaders can manage invitations"
ON team_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_invitations.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'leader'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_invitations.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'leader'
  )
);

-- Function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token text;
BEGIN
  -- Generate a random token using gen_random_uuid()
  token := replace(gen_random_uuid()::text, '-', '');
  RETURN token;
END;
$$;

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
      'type', 'direct_add',
      'user_id', existing_user_id
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

-- Function to process invitation acceptance
CREATE OR REPLACE FUNCTION process_team_invitation(
  token text,
  user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record record;
BEGIN
  -- Get and validate invitation
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE team_invitations.token = process_team_invitation.token
  AND accepted_at IS NULL
  AND expires_at > now();
  
  -- Check if invitation exists and is valid
  IF invitation_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid or expired invitation'
    );
  END IF;
  
  -- Add user to team
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (invitation_record.team_id, user_id, invitation_record.role);
  
  -- Mark invitation as accepted
  UPDATE team_invitations
  SET accepted_at = now()
  WHERE id = invitation_record.id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully joined team',
    'team_id', invitation_record.team_id
  );
END;
$$;