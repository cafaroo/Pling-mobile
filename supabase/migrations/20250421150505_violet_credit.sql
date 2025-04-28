/*
  # Add team message read tracking
  
  1. New Tables
    - `team_message_reads`
      - Track when users last read team messages
      - Used for unread message counts
      
  2. Security
    - Enable RLS
    - Allow users to manage their own read status
*/

-- Create team message reads table
CREATE TABLE IF NOT EXISTS public.team_message_reads (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    last_read_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, team_id)
);

-- Enable RLS
ALTER TABLE public.team_message_reads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their read status"
ON team_message_reads
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(
    user_id uuid,
    team_id uuid
)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    WITH last_read AS (
        SELECT last_read_at
        FROM team_message_reads
        WHERE user_id = get_unread_message_count.user_id
        AND team_id = get_unread_message_count.team_id
    )
    SELECT COUNT(*)
    FROM team_messages m
    LEFT JOIN last_read lr ON true
    WHERE m.team_id = get_unread_message_count.team_id
    AND m.user_id != get_unread_message_count.user_id
    AND (
        lr.last_read_at IS NULL
        OR m.created_at > lr.last_read_at
    );
$$;