/*
  # Add process_team_invitation function
  
  1. New Functions
    - process_team_invitation: Process a team invitation token
    
  2. Security
    - Function uses SECURITY DEFINER to run with elevated privileges
    - Validates token before processing
    - Handles both new and existing users
*/

CREATE OR REPLACE FUNCTION public.process_team_invitation(
  token text,
  user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_actual_user_id uuid;
  v_team_name text;
BEGIN
  -- Get and validate invitation
  SELECT ti.*, t.name as team_name INTO v_invitation
  FROM team_invitations ti
  JOIN teams t ON t.id = ti.team_id
  WHERE ti.token = token
  AND ti.accepted_at IS NULL
  AND ti.expires_at > now();
  
  IF v_invitation IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid or expired invitation'
    );
  END IF;
  
  -- Determine user ID (either provided or current user)
  v_actual_user_id := COALESCE(user_id, auth.uid());
  
  IF v_actual_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No user ID provided or available'
    );
  END IF;
  
  -- Check if user is already a team member
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_invitation.team_id
    AND user_id = v_actual_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User is already a member of this team'
    );
  END IF;
  
  -- Store team name for notification
  v_team_name := COALESCE(v_invitation.team_name, 'a team');
  
  -- Begin transaction
  BEGIN
    -- Add user to team
    INSERT INTO team_members (
      team_id,
      user_id,
      role,
      approval_status
    ) VALUES (
      v_invitation.team_id,
      v_actual_user_id,
      v_invitation.role,
      'approved'  -- Direct invites are pre-approved
    );
    
    -- Mark invitation as accepted
    UPDATE team_invitations
    SET 
      accepted_at = now()
    WHERE id = v_invitation.id;
    
    -- Create notification for the user who joined
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      v_actual_user_id,
      'team_join',
      'Team Joined',
      'You have successfully joined ' || v_team_name,
      jsonb_build_object(
        'team_id', v_invitation.team_id
      )
    );
    
    RETURN json_build_object(
      'success', true,
      'message', 'Successfully joined team',
      'team_id', v_invitation.team_id,
      'team_name', v_team_name
    );
  EXCEPTION
    WHEN others THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Error processing invitation: ' || SQLERRM
      );
  END;
END;
$$;