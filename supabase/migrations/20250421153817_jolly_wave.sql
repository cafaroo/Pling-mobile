/*
  # Add competition images storage bucket
  
  1. Storage
    - Create a new public bucket called 'competition-images'
    - Set up RLS policies for team leaders to upload images
    - Allow public read access for competition images
*/

-- Create the competition-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('competition-images', 'competition-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to competition images
CREATE POLICY "Public can read competition images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'competition-images');

-- Allow team leaders to upload competition images
CREATE POLICY "Team leaders can upload competition images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'competition-images'
  AND (auth.uid() IN (
    SELECT tm.user_id
    FROM team_members tm
    WHERE tm.role = 'leader'
  ))
);

-- Allow team leaders to delete their competition images
CREATE POLICY "Team leaders can delete competition images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'competition-images'
  AND (auth.uid() IN (
    SELECT tm.user_id
    FROM team_members tm
    WHERE tm.role = 'leader'
  ))
);