/*
  # Fix profiles table policies for user signup
  
  1. Changes
    - Add policy for anonymous users to insert profiles during signup
    - Set default value for profiles.id to auth.uid()
    - Ensure authenticated users can insert their own profiles
    
  2. Security
    - Maintains RLS on profiles table
    - Allows both anon and authenticated users to create profiles
    - Preserves existing policies for profile management
*/

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow insert during signup" ON public.profiles;
  DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
END $$;

-- Create policy for anonymous users (signup flow)
CREATE POLICY "Allow insert during signup"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (true);

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Set default value for id column
ALTER TABLE public.profiles
ALTER COLUMN id SET DEFAULT auth.uid();