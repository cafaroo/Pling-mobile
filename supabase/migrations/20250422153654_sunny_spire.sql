/*
  # Add pending approval system for team invites
  
  1. Changes
    - Add approval_status column to team_members table
    - Update team_members constraints to include approval status
    - Update join_team_with_code function to set pending status
    - Add function to approve team members
    
  2. Security
    - Only team leaders and owners can approve members
    - Maintain existing RLS policies
*/

-- Add approval_status column to team_members
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update join_team_with_code function to set pending status
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
  
  -- Add user to team with pending status
  INSERT INTO team_members (
    team_id,
    user_id,
    role,
    approval_status
  ) VALUES (
    code_record.team_id,
    auth.uid(),
    'member',
    'pending'
  );
  
  -- Mark code as used
  UPDATE team_invite_codes
  SET 
    used_at = now(),
    used_by = auth.uid()
  WHERE id = code_record.id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully requested to join team. Awaiting approval.',
    'team_id', code_record.team_id,
    'team_name', team_record.name,
    'status', 'pending'
  );
END;
$$;

-- Function to approve or reject team member
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
    SELECT 1 FROM team_members
    WHERE team_id = approve_team_member.team_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'owner')
  ) THEN
    RAISE EXCEPTION 'Only team leaders can approve members';
  END IF;
  
  -- Update member status
  UPDATE team_members
  SET approval_status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END
  WHERE team_id = approve_team_member.team_id
  AND user_id = approve_team_member.user_id
  AND approval_status = 'pending';
  
  -- If rejected, remove the member
  IF NOT approve THEN
    DELETE FROM team_members
    WHERE team_id = approve_team_member.team_id
    AND user_id = approve_team_member.user_id
    AND approval_status = 'rejected';
  END IF;
  
  RETURN FOUND;
END;
$$;

-- Function to get pending team members
CREATE OR REPLACE FUNCTION get_pending_team_members(team_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  user_name text,
  user_email text,
  user_avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    tm.id,
    tm.user_id,
    tm.role,
    tm.created_at,
    p.name as user_name,
    p.email as user_email,
    p.avatar_url as user_avatar_url
  FROM team_members tm
  JOIN profiles p ON p.id = tm.user_id
  WHERE tm.team_id = get_pending_team_members.team_id
  AND tm.approval_status = 'pending'
  ORDER BY tm.created_at DESC;
$$;

-- Update handle_team_invitation function to set pending status
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
    
    -- Add existing user directly to team with pending status
    INSERT INTO team_members (team_id, user_id, role, approval_status)
    VALUES (team_id, existing_user_id, role, 'pending');
    
    RETURN json_build_object(
      'success', true,
      'message', 'User added to team pending approval',
      'type', 'direct_add',
      'user_id', existing_user_id,
      'status', 'pending'
    );
  END IF;
  
  -- Generate invitation for new user
  token := replace(gen_random_uuid()::text, '-', '');
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

-- Update accept_team_invitation function to set pending status
CREATE OR REPLACE FUNCTION accept_team_invitation(
  invitation_token text,
  user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record record;
  actual_user_id uuid;
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
  
  -- Determine user ID (either provided or current user)
  actual_user_id := COALESCE(user_id, auth.uid());
  
  -- Add user to team with pending status
  INSERT INTO team_members (
    team_id,
    user_id,
    role,
    approval_status
  ) VALUES (
    invitation_record.team_id,
    actual_user_id,
    invitation_record.role,
    'pending'
  );
  
  -- Mark invitation as accepted
  UPDATE team_invitations
  SET 
    accepted_at = now()
  WHERE id = invitation_record.id;
  
  RETURN true;
END;
$$;

-- Create notification for pending approvals
CREATE OR REPLACE FUNCTION notify_team_leaders_of_pending_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the new member has pending status
  IF NEW.approval_status = 'pending' THEN
    -- Notify team leaders and owners
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority
    )
    SELECT
      tm.user_id,
      'team_join',
      'New Team Member Request',
      (SELECT name FROM profiles WHERE id = NEW.user_id) || ' has requested to join your team',
      jsonb_build_object(
        'team_id', NEW.team_id,
        'user_id', NEW.user_id,
        'requires_approval', true
      ),
      'high'
    FROM team_members tm
    WHERE tm.team_id = NEW.team_id
    AND tm.role IN ('leader', 'owner')
    AND tm.user_id != NEW.user_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pending approval notifications
CREATE TRIGGER on_team_member_pending_approval
  AFTER INSERT ON team_members
  FOR EACH ROW
  WHEN (NEW.approval_status = 'pending')
  EXECUTE FUNCTION notify_team_leaders_of_pending_approval();