/*
  # Fix authentication permissions and profile creation

  1. Changes
    - Add policy for anon users to select profiles after insert
    - Ensure handle_new_user function has proper permissions
    - Fix trigger creation syntax
    
  2. Security
    - Maintain RLS protection
    - Allow proper profile creation during signup
    - Fix permission denied errors
*/

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anon can select after insert" ON public.profiles;

-- Create policy to allow anon to select profiles after insert
CREATE POLICY "Anon can select after insert"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Recreate handle_new_user function with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ language 'plpgsql'
SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger with proper syntax
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();