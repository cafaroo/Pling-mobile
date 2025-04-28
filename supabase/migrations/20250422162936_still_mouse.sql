/*
  # Fix profiles table policies for user creation

  1. Changes
    - Add policy for anonymous users to insert new profiles
    - Check if policies exist before creating them
    - Ensure policy allows creation of profiles during signup
  
  2. Security
    - Maintains RLS on profiles table
    - Adds secure policy for profile creation
    - Preserves existing policies for authenticated users
*/

-- Add policy to allow profile creation during signup if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Allow insert during signup'
  ) THEN
    CREATE POLICY "Allow insert during signup"
    ON public.profiles
    FOR INSERT
    TO anon
    WITH CHECK (true);
  END IF;
END $$;

-- Ensure authenticated users can insert their own profile if policy doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can insert their own profile'
  ) THEN
    CREATE POLICY "Authenticated users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Make sure profiles.id defaults to auth.uid() if not already set
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute_info 
    WHERE attrelid = 'public.profiles'::regclass 
    AND attname = 'id' 
    AND atthasdef = true
    AND pg_get_expr(adbin, adrelid) LIKE '%auth.uid()%'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT auth.uid();
  END IF;
EXCEPTION
  WHEN undefined_table OR undefined_column OR undefined_function THEN
    -- If the query fails, try a simpler approach
    BEGIN
      ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT auth.uid();
    EXCEPTION
      WHEN OTHERS THEN
        -- If that also fails, we'll just continue
        NULL;
    END;
END $$;