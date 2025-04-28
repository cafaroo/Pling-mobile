/*
  # Add team chat functionality
  
  1. New Tables
    - `team_messages`
      - Store team chat messages
      - Track message history
      - Link messages to users and teams
  
  2. Security
    - Enable RLS on messages table
    - Add policies for team member access
    - Ensure proper message ordering
*/

-- Create team messages table
CREATE TABLE IF NOT EXISTS public.team_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view messages"
ON team_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_messages.team_id
        AND tm.user_id = auth.uid()
    )
);

CREATE POLICY "Team members can send messages"
ON team_messages
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_messages.team_id
        AND tm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

-- Create index for faster message retrieval
CREATE INDEX team_messages_team_id_created_at_idx 
ON team_messages(team_id, created_at DESC);

-- Create function to get team messages
CREATE OR REPLACE FUNCTION get_team_messages(
    team_id uuid,
    limit_count integer DEFAULT 50,
    before_timestamp timestamptz DEFAULT now()
)
RETURNS TABLE (
    id uuid,
    content text,
    created_at timestamptz,
    user_id uuid,
    user_name text,
    user_avatar text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        m.id,
        m.content,
        m.created_at,
        m.user_id,
        p.name as user_name,
        p.avatar_url as user_avatar
    FROM team_messages m
    JOIN profiles p ON p.id = m.user_id
    WHERE m.team_id = get_team_messages.team_id
    AND m.created_at < before_timestamp
    ORDER BY m.created_at DESC
    LIMIT limit_count;
$$;