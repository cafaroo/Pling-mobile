-- Fix för relationsproblem mellan users och user_profiles

-- 1. Se till att user_profiles-tabellen har rätt relation till auth.users
DO $$ 
BEGIN
  -- Kontrollera om relationen finns och lägg till den om den saknas
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
    
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Se till att phone_number används korrekt
DO $$ 
BEGIN
  -- Kontrollera om phone-kolumnen finns i users-tabellen och ta bort den
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
  END IF;
  
  -- Se till att phone_number finns i user_profiles
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN phone_number TEXT;
  END IF;
END $$;

-- 3. Uppdatera trigger för ny användarregistrering
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Återskapa triggern
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Uppdatera behörighetsregler
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Uppdatera eller skapa RLS-policyer
DROP POLICY IF EXISTS "Användare kan hantera sina egna profiler" ON public.user_profiles;

CREATE POLICY "Användare kan hantera sina egna profiler"
ON public.user_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ge roller behörigheter
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- 5. Uppdatera schema-cache
NOTIFY pgrst, 'reload schema'; 