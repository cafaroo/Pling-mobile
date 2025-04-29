-- Enable storage for chat media
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

-- Create policy to allow authenticated users to upload media
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public access to chat media
CREATE POLICY "Public can view chat media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-media');

-- Add media support to messages
ALTER TABLE messages
ADD COLUMN attachments JSONB[] DEFAULT '{}' NOT NULL,
ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text'
  CHECK (message_type IN ('text', 'image', 'file', 'mixed'));

COMMENT ON COLUMN messages.attachments IS 'Array of attachments with format: {type: "image"|"file", url: string, filename?: string, size?: number, mime_type?: string}';
COMMENT ON COLUMN messages.message_type IS 'Type of message: text, image, file, or mixed';

-- Function to handle message with attachments
CREATE OR REPLACE FUNCTION handle_message_with_attachments(
  p_team_id UUID,
  p_content TEXT,
  p_attachments JSONB[] DEFAULT '{}'::JSONB[]
) RETURNS TABLE (
  success BOOLEAN,
  message_id UUID,
  error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
  v_message_type TEXT := 'text';
  v_is_member BOOLEAN;
BEGIN
  -- Check if user is team member
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN QUERY SELECT false, NULL::UUID, 'User is not a team member'::TEXT;
    RETURN;
  END IF;

  -- Determine message type
  IF array_length(p_attachments, 1) > 0 THEN
    IF p_content IS NULL OR p_content = '' THEN
      -- Only attachments
      SELECT CASE 
        WHEN bool_and(att->>'type' = 'image') THEN 'image'
        WHEN bool_and(att->>'type' = 'file') THEN 'file'
        ELSE 'mixed'
      END INTO v_message_type
      FROM unnest(p_attachments) att;
    ELSE
      -- Both text and attachments
      v_message_type := 'mixed';
    END IF;
  END IF;

  -- Insert message
  INSERT INTO messages (
    team_id,
    user_id,
    content,
    attachments,
    message_type
  )
  VALUES (
    p_team_id,
    auth.uid(),
    p_content,
    p_attachments,
    v_message_type
  )
  RETURNING id INTO v_message_id;

  RETURN QUERY SELECT true, v_message_id, NULL::TEXT;
END;
$$; 