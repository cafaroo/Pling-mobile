/*
  # Lägg till profilbild och beskrivning för team

  1. Tabelländring
    - Lägg till profile_image (text)
    - Lägg till description (text)

  2. Storage
    - Skapa bucket 'team-profile-images'
    - Sätt RLS policies för uppladdning och läsning
*/

-- Lägg till kolumner i teams-tabellen
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS profile_image text,
  ADD COLUMN IF NOT EXISTS description text;

-- Skapa bucket för teamprofilbilder
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-profile-images', 'team-profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Tillåt publikt läsande av teamprofilbilder
CREATE POLICY "Public can read team profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'team-profile-images');

-- Tillåt autentiserade användare att ladda upp bilder
CREATE POLICY "Authenticated can upload team profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'team-profile-images');

-- Tillåt ägaren av objektet att ta bort sin bild
CREATE POLICY "Uploader can delete own team profile image"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'team-profile-images' AND auth.uid() = owner); 