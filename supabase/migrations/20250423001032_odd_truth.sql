/*
  # Make team invite codes reusable during expiration period
  
  1. Changes
    - Update join_team_with_code function to allow code reuse
    - Remove the used_at check when validating invite codes
    - Keep the expiration check to ensure codes eventually expire
    - Don't mark codes as used when joining a team
    
  2. Security
    - Maintain approval workflow for new members
    - Keep expiration date to limit code validity
    - Ensure proper notification of team leaders
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

  -- Find and validate the invite code - REMOVED used_at check to allow reuse
  BEGIN
    v_error_step := 'code_validation';
    
    SELECT ic.*, t.name INTO v_code_record
    FROM team_invite_codes ic
    JOIN teams t ON t.id = ic.team_id
    WHERE ic.code = upper(invite_code)
      -- No longer checking if code was used
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

  -- Create notification message with double COALESCE protection
  -- First protect each part of the concatenation, then protect the entire expression
  v_notification_message := COALESCE(
    COALESCE(v_user_name, 'Someone') || ' has requested to join ' || COALESCE(v_team_name, 'a team'),
    'A new member wants to join your team'
  );

  -- Check if there are any team leaders to notify
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_code_record.team_id
      AND role IN ('leader', 'owner')
      AND user_id IS NOT NULL
  ) THEN
    -- Continue without notifications if no leaders exist
    RAISE NOTICE 'No team leaders found to notify';
  END IF;

  -- Begin transaction
  BEGIN
    v_error_step := 'add_team_member';
    
    -- Add user to team
    INSERT INTO team_members (team_id, user_id, role, approval_status)
    VALUES (v_code_record.team_id, v_user_id, 'member', 'pending');

    -- REMOVED: No longer mark code as used to allow reuse
    -- v_error_step := 'update_invite_code';
    -- UPDATE team_invite_codes
    -- SET used_at = now(),
    --     used_by = v_user_id
    -- WHERE id = v_code_record.id;

    v_error_step := 'create_notifications';
    
    -- Create notification for team leaders with guaranteed non-null message
    -- Use a hardcoded message as the ultimate fallback
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