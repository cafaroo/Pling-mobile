/*
  # Add competition rewards and achievements
  
  1. New Tables
    - `competition_rewards`
      - Stores reward definitions for competitions
      - Tracks reward tiers and conditions
    - `competition_achievements`
      - Records participant achievements
      - Tracks progress milestones
    - `competition_notifications`
      - Stores competition-related notifications
      - Handles milestone and rank change alerts

  2. Functions
    - Functions for managing rewards and achievements
    - Notification generation and delivery
    - Achievement progress tracking
*/

-- Create competition rewards table
CREATE TABLE IF NOT EXISTS public.competition_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id uuid REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL CHECK (type IN ('milestone', 'rank', 'completion')),
    condition_type text NOT NULL CHECK (type IN ('value', 'percentage', 'rank')),
    condition_value numeric NOT NULL,
    reward_type text NOT NULL CHECK (type IN ('badge', 'points', 'custom')),
    reward_data jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Create competition achievements table
CREATE TABLE IF NOT EXISTS public.competition_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid REFERENCES competition_participants(id) ON DELETE CASCADE NOT NULL,
    reward_id uuid REFERENCES competition_rewards(id) ON DELETE CASCADE NOT NULL,
    achieved_at timestamptz NOT NULL DEFAULT now(),
    progress numeric NOT NULL DEFAULT 0,
    completed boolean NOT NULL DEFAULT false,
    metadata jsonb NOT NULL DEFAULT '{}'
);

-- Create competition notifications table
CREATE TABLE IF NOT EXISTS public.competition_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id uuid REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
    participant_id uuid REFERENCES competition_participants(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('milestone', 'rank_change', 'achievement', 'reminder')),
    title text NOT NULL,
    message text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}',
    read boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competition_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view competition rewards"
ON competition_rewards
FOR SELECT
TO authenticated
USING (
    competition_id IN (
        SELECT c.id 
        FROM competitions c
        WHERE c.team_id IS NULL OR
        c.team_id IN (
            SELECT tm.team_id 
            FROM team_members tm 
            WHERE tm.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can view own achievements"
ON competition_achievements
FOR SELECT
TO authenticated
USING (
    participant_id IN (
        SELECT cp.id
        FROM competition_participants cp
        WHERE cp.user_id = auth.uid() OR
        cp.team_id IN (
            SELECT tm.team_id 
            FROM team_members tm 
            WHERE tm.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can view own notifications"
ON competition_notifications
FOR SELECT
TO authenticated
USING (
    participant_id IN (
        SELECT cp.id
        FROM competition_participants cp
        WHERE cp.user_id = auth.uid() OR
        cp.team_id IN (
            SELECT tm.team_id 
            FROM team_members tm 
            WHERE tm.user_id = auth.uid()
        )
    )
);

-- Function to add competition reward
CREATE OR REPLACE FUNCTION add_competition_reward(
    competition_id uuid,
    title text,
    description text,
    type text,
    condition_type text,
    condition_value numeric,
    reward_type text,
    reward_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_reward_id uuid;
BEGIN
    -- Validate reward types
    IF type NOT IN ('milestone', 'rank', 'completion') THEN
        RAISE EXCEPTION 'Invalid reward type';
    END IF;

    IF condition_type NOT IN ('value', 'percentage', 'rank') THEN
        RAISE EXCEPTION 'Invalid condition type';
    END IF;

    IF reward_type NOT IN ('badge', 'points', 'custom') THEN
        RAISE EXCEPTION 'Invalid reward type';
    END IF;

    -- Insert reward
    INSERT INTO competition_rewards (
        competition_id,
        title,
        description,
        type,
        condition_type,
        condition_value,
        reward_type,
        reward_data
    ) VALUES (
        competition_id,
        title,
        description,
        type,
        condition_type,
        condition_value,
        reward_type,
        reward_data
    ) RETURNING id INTO new_reward_id;

    RETURN new_reward_id;
END;
$$;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_competition_achievements(
    participant_id uuid
)
RETURNS TABLE (
    reward_id uuid,
    achievement_id uuid,
    title text,
    description text,
    type text,
    progress numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    participant_record record;
    reward_record record;
    achievement_id uuid;
    progress numeric;
BEGIN
    -- Get participant details
    SELECT * INTO participant_record
    FROM competition_participants cp
    WHERE cp.id = participant_id;

    -- Check each reward
    FOR reward_record IN
        SELECT *
        FROM competition_rewards cr
        WHERE cr.competition_id = participant_record.competition_id
    LOOP
        -- Calculate progress based on condition type
        progress := CASE reward_record.condition_type
            WHEN 'value' THEN
                participant_record.current_value / reward_record.condition_value * 100
            WHEN 'percentage' THEN
                participant_record.current_value / 
                (SELECT target_value FROM competitions WHERE id = participant_record.competition_id) * 100
            WHEN 'rank' THEN
                CASE WHEN participant_record.rank <= reward_record.condition_value THEN 100 ELSE
                    ((reward_record.condition_value::numeric / participant_record.rank::numeric) * 100)
                END
            ELSE 0
        END;

        -- Check if achievement should be awarded
        IF progress >= 100 THEN
            -- Insert or update achievement
            INSERT INTO competition_achievements (
                participant_id,
                reward_id,
                progress,
                completed
            ) VALUES (
                participant_id,
                reward_record.id,
                100,
                true
            )
            ON CONFLICT (participant_id, reward_id) DO UPDATE
            SET 
                progress = 100,
                completed = true
            RETURNING id INTO achievement_id;

            -- Create notification
            IF achievement_id IS NOT NULL THEN
                INSERT INTO competition_notifications (
                    competition_id,
                    participant_id,
                    type,
                    title,
                    message,
                    data
                ) VALUES (
                    participant_record.competition_id,
                    participant_id,
                    'achievement',
                    reward_record.title,
                    'Congratulations! You''ve earned a new achievement: ' || reward_record.title,
                    jsonb_build_object(
                        'reward_type', reward_record.reward_type,
                        'reward_data', reward_record.reward_data
                    )
                );
            END IF;
        ELSE
            -- Update progress
            INSERT INTO competition_achievements (
                participant_id,
                reward_id,
                progress,
                completed
            ) VALUES (
                participant_id,
                reward_record.id,
                progress,
                false
            )
            ON CONFLICT (participant_id, reward_id) DO UPDATE
            SET progress = EXCLUDED.progress;
        END IF;

        -- Return achievement status
        RETURN QUERY
        SELECT 
            reward_record.id,
            achievement_id,
            reward_record.title,
            reward_record.description,
            reward_record.type,
            progress;
    END LOOP;
END;
$$;

-- Function to get participant achievements
CREATE OR REPLACE FUNCTION get_participant_achievements(
    participant_id uuid
)
RETURNS TABLE (
    achievement_id uuid,
    reward_id uuid,
    title text,
    description text,
    type text,
    progress numeric,
    completed boolean,
    achieved_at timestamptz,
    reward_type text,
    reward_data jsonb
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        ca.id as achievement_id,
        cr.id as reward_id,
        cr.title,
        cr.description,
        cr.type,
        ca.progress,
        ca.completed,
        ca.achieved_at,
        cr.reward_type,
        cr.reward_data
    FROM competition_achievements ca
    JOIN competition_rewards cr ON cr.id = ca.reward_id
    WHERE ca.participant_id = participant_id
    ORDER BY ca.achieved_at DESC;
$$;

-- Function to get participant notifications
CREATE OR REPLACE FUNCTION get_participant_notifications(
    participant_id uuid,
    unread_only boolean DEFAULT false
)
RETURNS TABLE (
    notification_id uuid,
    type text,
    title text,
    message text,
    data jsonb,
    read boolean,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        id as notification_id,
        type,
        title,
        message,
        data,
        read,
        created_at
    FROM competition_notifications
    WHERE participant_id = participant_id
    AND (NOT unread_only OR NOT read)
    ORDER BY created_at DESC;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    notification_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE competition_notifications
    SET read = true
    WHERE id = notification_id
    AND participant_id IN (
        SELECT cp.id
        FROM competition_participants cp
        WHERE cp.user_id = auth.uid() OR
        cp.team_id IN (
            SELECT tm.team_id 
            FROM team_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

    RETURN FOUND;
END;
$$;