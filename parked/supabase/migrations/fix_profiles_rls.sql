-- Fixar RLS för att tillåta infogning av data i profiles-tabellen

-- Skapa en policy för att tillåta infogning i profiles-tabellen
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Skapa en policy för att hanterare kan infoga i profiles-tabellen
CREATE POLICY "Service role can insert profiles" 
  ON profiles FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Skapa policy som tillåter service_role att utföra alla operationer
CREATE POLICY "Admin role can do all operations" 
  ON profiles
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Logga att migrationen körts
DO $$
BEGIN
  RAISE NOTICE 'RLS-fix för profiles-tabellen slutförd: Lagt till INSERT-policyer';
END $$; 