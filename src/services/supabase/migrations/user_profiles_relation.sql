-- Lägg till relationen mellan 'users' och 'user_profiles' tabellerna

-- Skapa extension för uuid om det saknas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Skapa user_profiles-tabellen om den saknas
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    role TEXT,
    team_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lägg till foreign key om det går
DO $$
BEGIN
    -- Försök lägga till främmande nyckel
    BEGIN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN
            -- Ignorera om constraint redan finns
            NULL;
    END;
END
$$;

-- Skapa en RLS policy för user_profiles-tabellen om tabellen finns
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Användare kan se sina egna profiler" ON public.user_profiles;
        
        CREATE POLICY "Användare kan se sina egna profiler"
        ON public.user_profiles
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    EXCEPTION
        WHEN undefined_table THEN
            -- Ignorera om tabellen inte finns
            NULL;
    END;
END
$$;

-- Aktivera RLS på tabellen om den finns
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Ge publicrollen behörighet att använda tabellen
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Uppdatera triggers för användar-hantering om de behövs
DO $$
BEGIN
    BEGIN
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.user_profiles (user_id, full_name, avatar_url)
            VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Skapa trigger om den inte redan finns
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    EXCEPTION
        WHEN undefined_table THEN
            -- Ignorera om tabellen eller triggern saknas
            NULL;
    END;
END
$$; 