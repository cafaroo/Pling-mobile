-- Uppdatera schema-cache relationen mellan 'users' och 'user_profiles'

-- Töm alla caches
DO $$
BEGIN
    -- Sätt sökvägar
    SET LOCAL search_path TO "$user", public;
    
    -- Utför en dummy-fråga som berör båda tabellerna för att uppdatera cachen
    PERFORM u.id, p.id 
    FROM auth.users u
    LEFT JOIN public.user_profiles p ON u.id = p.user_id
    WHERE FALSE;
    
    -- Utför en dummy uppdatering för att tvinga fram en revalidering
    UPDATE public.user_profiles 
    SET updated_at = updated_at
    WHERE FALSE;
END
$$;

-- Verifiera att relationen finns
DO $$
DECLARE
    relation_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc 
        JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name 
        WHERE tc.table_name = 'user_profiles' 
        AND tc.constraint_schema = 'public'
        AND ccu.column_name = 'user_id' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
    ) INTO relation_exists;
    
    IF NOT relation_exists THEN
        RAISE NOTICE 'Relation mellan users och user_profiles saknas fortfarande.';
    ELSE
        RAISE NOTICE 'Relation mellan users och user_profiles finns.';
    END IF;
END
$$; 