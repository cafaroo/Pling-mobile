/*
  # Fix profiles table RLS policies

  1. Changes
    - Add RLS policy to allow public access for creating new profiles
    - This is needed because new users need to be able to create their profile when signing up

  2. Security
    - Enable RLS on profiles table (already enabled)
    - Add policy for public profile creation
    - Maintain existing policies for authenticated users
*/

-- Allow public to create profiles (needed for new user registration)
CREATE POLICY "Public profiles are insertable by everyone"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Keep existing policies:
-- "Users can delete own profile"
-- "Users can insert own profile"
-- "Users can read own profile"
-- "Users can update own profile"