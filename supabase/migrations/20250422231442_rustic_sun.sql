/*
  # Fix team join notification message
  
  1. Changes
    - Update handle_notification_events function to provide default message for team_join notifications
    - Ensure notification message is never null
    - Fix join_team_with_code function to include team name in notification
    
  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Update handle_notification_events function to ensure message is never null
CREATE OR REPLACE FUNCTION handle_notification_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  team_name text;
  user_name text;
BEGIN
    -- Handle different event types
    CASE TG_TABLE_NAME
        -- Team invitations
        WHEN 'team_invitations' THEN
            IF TG_OP = 'INSERT' THEN
                -- Get user profile if it exists
                SELECT id INTO user_name FROM profiles WHERE email = NEW.email;
                
                -- Only create notification if user exists
                IF user_name IS NOT NULL THEN
                    -- Get team name
                    SELECT name INTO team_name FROM teams WHERE id = NEW.team_id;
                    
                    -- Notify user about team invitation
                    PERFORM create_notification(
                        user_name,
                        'team_invite',
                        'Team Invitation',
                        'You have been invited to join ' || COALESCE(team_name, 'a team'),
                        jsonb_build_object(
                            'team_id', NEW.team_id,
                            'role', NEW.role,
                            'token', NEW.token
                        ),
                        'normal',
                        '/accept-invite?token=' || NEW.token,
                        'Accept Invitation'
                    );
                END IF;
            END IF;

        -- Team members
        WHEN 'team_members' THEN
            IF TG_OP = 'INSERT' THEN
                -- Get user name
                SELECT name INTO user_name FROM profiles WHERE id = NEW.user_id;
                
                -- Get team name
                SELECT name INTO team_name FROM teams WHERE id = NEW.team_id;
                
                -- Notify team leaders about new member
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    message,
                    data
                )
                SELECT
                    tm.user_id,
                    'team_join',
                    'New Team Member',
                    COALESCE(user_name, 'A new user') || ' has joined ' || COALESCE(team_name, 'the team'),
                    jsonb_build_object(
                        'team_id', NEW.team_id,
                        'user_id', NEW.user_id
                    )
                FROM team_members tm
                WHERE tm.team_id = NEW.team_id
                AND tm.role = 'leader'
                AND tm.user_id != NEW.user_id;
            END IF;

        -- Competition participants
        WHEN 'competition_participants' THEN
            IF TG_OP = 'INSERT' THEN
                -- Get competition name
                SELECT title INTO team_name FROM competitions WHERE id = NEW.competition_id;
                
                -- Notify about competition start
                PERFORM create_notification(
                    CASE 
                        WHEN NEW.user_id IS NOT NULL THEN NEW.user_id
                        ELSE tm.user_id
                    END,
                    'competition_start',
                    'Competition Started',
                    'You have joined ' || COALESCE(team_name, 'a new competition'),
                    jsonb_build_object(
                        'competition_id', NEW.competition_id
                    ),
                    'normal',
                    '/competitions/' || NEW.competition_id,
                    'View Competition'
                )
                FROM team_members tm
                WHERE NEW.team_id IS NULL OR tm.team_id = NEW.team_id;
            END IF;
    END CASE;

    RETURN NULL;
END;
$$;

-- Update join_team_with_code function to include team name in notification
CREATE OR REPLACE FUNCTION join_team_with_code(invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record record;
    team_name text;
BEGIN
    -- Get and validate code
    SELECT tic.*, t.name INTO code_record
    FROM team_invite_codes tic
    JOIN teams t ON t.id = tic.team_id
    WHERE tic.code = upper(invite_code)
    AND tic.used_at IS NULL
    AND tic.expires_at > now();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid or expired invite code'
        );
    END IF;
    
    -- Store team name for notification
    team_name := code_record.name;
    
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
    
    -- Create notification for the user who joined
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        auth.uid(),
        'team_join',
        'Team Joined',
        'You have successfully joined ' || COALESCE(team_name, 'a new team'),
        jsonb_build_object(
            'team_id', code_record.team_id
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Successfully joined team',
        'team_id', code_record.team_id,
        'team_name', team_name
    );
END;
$$;