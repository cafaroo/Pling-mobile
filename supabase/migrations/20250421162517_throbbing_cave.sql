/*
  # Add notifications system
  
  1. New Tables
    - `notifications`
      - Global notifications for users
      - Supports multiple notification types
      - Tracks read status
    
  2. Functions
    - Functions for managing notifications
    - Notification aggregation and delivery
    - Read status management
    
  3. Security
    - RLS policies for notification access
    - User-specific notification management
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN (
      'team_invite',
      'team_join',
      'competition_start',
      'competition_end',
      'achievement',
      'rank_change',
      'milestone',
      'team_message',
      'system'
    )),
    title text NOT NULL,
    message text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}',
    read boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    priority text NOT NULL DEFAULT 'normal'
      CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url text,
    action_label text
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
ON notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX notifications_user_id_created_at_idx 
ON notifications(user_id, created_at DESC);

CREATE INDEX notifications_user_id_read_idx 
ON notifications(user_id, read);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    user_id uuid,
    type text,
    title text,
    message text,
    data jsonb DEFAULT '{}',
    priority text DEFAULT 'normal',
    action_url text DEFAULT NULL,
    action_label text DEFAULT NULL,
    expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        action_url,
        action_label,
        expires_at
    ) VALUES (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        action_url,
        action_label,
        COALESCE(expires_at, now() + interval '30 days')
    )
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
    notification_ids uuid[]
)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE notifications
    SET read = true
    WHERE id = ANY(notification_ids)
    AND user_id = auth.uid()
    RETURNING id;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = get_unread_notification_count.user_id
    AND read = false
    AND (expires_at IS NULL OR expires_at > now());
$$;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    user_id uuid,
    limit_count integer DEFAULT 20,
    include_read boolean DEFAULT false,
    before_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    type text,
    title text,
    message text,
    data jsonb,
    read boolean,
    created_at timestamptz,
    priority text,
    action_url text,
    action_label text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.read,
        n.created_at,
        n.priority,
        n.action_url,
        n.action_label
    FROM notifications n
    WHERE n.user_id = get_user_notifications.user_id
    AND (include_read OR NOT n.read)
    AND (expires_at IS NULL OR expires_at > now())
    AND (before_id IS NULL OR n.id < before_id)
    ORDER BY 
        CASE n.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
        END,
        n.created_at DESC
    LIMIT limit_count;
END;
$$;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    WITH deleted AS (
        DELETE FROM notifications
        WHERE expires_at < now()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count
    FROM deleted;

    RETURN deleted_count;
END;
$$;

-- Trigger function to create notifications for various events
CREATE OR REPLACE FUNCTION handle_notification_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Handle different event types
    CASE TG_TABLE_NAME
        -- Team invitations
        WHEN 'team_invitations' THEN
            IF TG_OP = 'INSERT' THEN
                -- Notify user about team invitation
                PERFORM create_notification(
                    (SELECT id FROM profiles WHERE email = NEW.email),
                    'team_invite',
                    'Team Invitation',
                    'You have been invited to join a team',
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

        -- Team members
        WHEN 'team_members' THEN
            IF TG_OP = 'INSERT' THEN
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
                    (SELECT name FROM profiles WHERE id = NEW.user_id) || ' has joined the team',
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
                -- Notify about competition start
                PERFORM create_notification(
                    CASE 
                        WHEN NEW.user_id IS NOT NULL THEN NEW.user_id
                        ELSE tm.user_id
                    END,
                    'competition_start',
                    'Competition Started',
                    'You have joined a new competition',
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

-- Create notification triggers
CREATE TRIGGER on_team_invitation
    AFTER INSERT ON team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION handle_notification_events();

CREATE TRIGGER on_team_member_added
    AFTER INSERT ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION handle_notification_events();

CREATE TRIGGER on_competition_participant_added
    AFTER INSERT ON competition_participants
    FOR EACH ROW
    EXECUTE FUNCTION handle_notification_events();