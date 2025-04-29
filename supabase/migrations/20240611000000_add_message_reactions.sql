-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES team_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create reactions on messages they can see"
ON message_reactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_messages m
    JOIN team_members tm ON tm.team_id = m.team_id
    WHERE m.id = message_reactions.message_id
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view reactions on messages they can see"
ON message_reactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_messages m
    JOIN team_members tm ON tm.team_id = m.team_id
    WHERE m.id = message_reactions.message_id
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own reactions"
ON message_reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- Create function to get reactions for messages
CREATE OR REPLACE FUNCTION get_message_reactions(message_ids UUID[])
RETURNS TABLE (
  message_id UUID,
  reactions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.message_id,
    jsonb_agg(
      jsonb_build_object(
        'emoji', mr.emoji,
        'count', count(*),
        'users', jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'avatar_url', p.avatar_url
          )
        )
      )
    ) as reactions
  FROM message_reactions mr
  JOIN profiles p ON p.id = mr.user_id
  WHERE mr.message_id = ANY(message_ids)
  GROUP BY mr.message_id, mr.emoji;
END;
$$; 