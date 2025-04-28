/*
  # Fix authentication and profile policies

  1. Changes
    - Drop existing profile policies
    - Add new policies for authenticated users
    - Set default value for profile id to auth.uid()
    - Enable RLS on profiles table
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for authenticated users to:
      - Insert their own profile
      - Read their own profile
      - Update their own profile
      - Delete their own profile
    - Ensure profile id matches auth.uid()
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public profiles creation during signup" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Set default value for id
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT auth.uid();

-- Create new policies
CREATE POLICY "Authenticated users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

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