/*
  # Fix team join notifications to prevent null message constraint violation
  
  1. Changes
    - Add explicit filter for non-null user_id in notifications insert
    - Ensure message column is never null
    - Add additional error handling for notification creation
    
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
  v_error_step text;
  v_notification_message text;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  v_error_step := 'auth_check';
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User must be authenticated'
    );
  END IF;

  -- Find and validate the invite code
  BEGIN
    v_error_step := 'code_validation';
    
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
  EXCEPTION
    WHEN others THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Error validating invite code: ' || SQLERRM
      );
  END;

  -- Check if user is already a member
  BEGIN
    v_error_step := 'member_check';
    
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
  EXCEPTION
    WHEN others THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Error checking team membership: ' || SQLERRM
      );
  END;

  -- Get user name for notification
  BEGIN
    v_error_step := 'get_user_name';
    
    SELECT name INTO v_user_name FROM profiles WHERE id = v_user_id;
    -- Default to 'New user' if name is null
    v_user_name := COALESCE(v_user_name, 'New user');
  EXCEPTION
    WHEN others THEN
      v_user_name := 'New user'; -- Fallback on error
  END;
  
  -- Explicitly set team name with fallback to prevent null
  BEGIN
    v_error_step := 'set_team_name';
    
    -- Make sure we have a team name, even if it's a default value
    v_team_name := COALESCE(v_code_record.name, 'the team');
  EXCEPTION
    WHEN others THEN
      v_team_name := 'the team'; -- Fallback on error
  END;

  -- Create notification message with guaranteed non-null value
  v_notification_message := v_user_name || ' has requested to join ' || v_team_name;

  -- Begin transaction
  BEGIN
    v_error_step := 'add_team_member';
    
    -- Add user to team
    INSERT INTO team_members (team_id, user_id, role, approval_status)
    VALUES (v_code_record.team_id, v_user_id, 'member', 'pending');

    v_error_step := 'update_invite_code';
    
    -- Mark invite code as used
    UPDATE team_invite_codes
    SET used_at = now(),
        used_by = v_user_id
    WHERE id = v_code_record.id;

    v_error_step := 'create_notifications';
    
    -- Create notification for team leaders with guaranteed non-null message
    -- Use a fixed message format to avoid any potential null concatenation
    -- CRITICAL: Filter out any NULL user_ids to prevent constraint violation
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
      v_notification_message,
      jsonb_build_object(
        'team_id', v_code_record.team_id,
        'user_id', v_user_id
      ),
      'high'
    FROM team_members tm
    WHERE tm.team_id = v_code_record.team_id
      AND tm.role IN ('leader', 'owner')
      AND tm.user_id IS NOT NULL;  -- CRITICAL: Ensure user_id is not null

    RETURN json_build_object(
      'success', true,
      'message', 'Successfully joined team. Awaiting approval.',
      'team_id', v_code_record.team_id,
      'team_name', v_team_name
    );
  EXCEPTION
    WHEN others THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Error in step ' || v_error_step || ': ' || SQLERRM
      );
  END;
END;
$$;