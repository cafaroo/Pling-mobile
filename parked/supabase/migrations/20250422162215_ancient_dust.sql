/*
  # Fix profiles table RLS policies

  1. Changes
    - Update RLS policies for the profiles table to allow public signup
    - Add policy for public profile creation during signup
    - Ensure authenticated users can manage their own profiles

  2. Security
    - Enable RLS on profiles table (if not already enabled)
    - Add policies for:
      - Public signup
      - Authenticated user profile management
*/

-- First ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public profiles creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Create new policies with correct permissions
CREATE POLICY "Allow public profiles creation during signup"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);