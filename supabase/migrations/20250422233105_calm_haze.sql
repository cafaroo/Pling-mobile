/*
  # Fix team join notification message
  
  1. Changes
    - Update join_team_with_code function to handle null team names
    - Use COALESCE to provide a default value for team name in notification message
    - Ensure notification message is never null
    
  2. Security
    - Maintain SECURITY DEFINER attribute
    - Keep same permission checks and transaction handling
*/

CREATE OR REPLACE FUNCTION public.join_team_with_code(invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team_id uuid;
  v_user_id uuid;
  v_code_record RECORD;
  v_team_name text;
  v_user_name text;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User must be authenticated'
    );
  END IF;

  -- Find and validate the invite code
  SELECT ic.*, t.name INTO v_code_record
  FROM team_invite_codes ic
  JOIN teams t ON t.id = ic.team_id
  WHERE ic.code = upper(invite_code)
    AND ic.used_at IS NULL
    AND ic.expires_at > now();

  IF v_code_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid or expired invite code'
    );
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_code_record.team_id
    AND user_id = v_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'You are already a member of this team'
    );
  END IF;

  -- Get user name for notification
  SELECT name INTO v_user_name FROM profiles WHERE id = v_user_id;
  
  -- Store team name with fallback
  v_team_name := COALESCE(v_code_record.name, 'your team');

  -- Begin transaction
  BEGIN
    -- Add user to team
    INSERT INTO team_members (team_id, user_id, role, approval_status)
    VALUES (v_code_record.team_id, v_user_id, 'member', 'pending');

    -- Mark invite code as used
    UPDATE team_invite_codes
    SET used_at = now(),
        used_by = v_user_id
    WHERE id = v_code_record.id;

    -- Create notification for team leaders
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
      COALESCE(v_user_name, 'A new member') || ' has requested to join ' || v_team_name,
      json_build_object(
        'team_id', v_code_record.team_id,
        'user_id', v_user_id
      ),
      'high'
    FROM team_members tm
    WHERE tm.team_id = v_code_record.team_id
    AND tm.role IN ('leader', 'owner');

    RETURN json_build_object(
      'success', true,
      'message', 'Successfully joined team. Awaiting approval.'
    );
  EXCEPTION
    WHEN others THEN
      RETURN json_build_object(
        'success', false,
        'message', 'An error occurred while joining the team: ' || SQLERRM
      );
  END;
END;
$$;