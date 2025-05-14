/*
  # Create sound assets storage bucket

  1. Storage
    - Create a new public bucket called 'sounds'
    - Set up RLS policies for public read access
    - No write access needed (sounds are static assets)

  2. Default Files
    - Define paths for required sound files:
      - /sounds/pling.mp3
      - /sounds/success.mp3
      - /sounds/level-up.mp3
*/

-- Create the sounds bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('sounds', 'sounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to sound files
CREATE POLICY "Public can read sound files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'sounds' AND owner IS NOT NULL);