/*
  # Fix update_updated_at_column trigger function
  
  1. Changes
    - Re-add SECURITY DEFINER to the update_updated_at_column function
    - Ensure the function has proper permissions to update timestamps
    
  2. Security
    - Using SECURITY DEFINER allows the function to bypass RLS
    - This is necessary for automatic timestamp updates
*/

-- Drop the existing trigger function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Recreate the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql'
SECURITY DEFINER;

-- Recreate the trigger on profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;