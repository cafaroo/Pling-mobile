-- Skapa profiles-tabellen om den inte finns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lägg till RLS-policies för profiles-tabellen
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy för användare att se sin egen profil
CREATE POLICY IF NOT EXISTS "Användare kan se sin egen profil" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Policy för användare att uppdatera sin egen profil
CREATE POLICY IF NOT EXISTS "Användare kan uppdatera sin egen profil" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Skapa tabellen för användarbehörigheter
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission_name)
);

-- Lägg till index för optimala sökningar
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_name ON user_permissions(permission_name);

-- Lägg till RLS-policies
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Administratörer kan hantera alla permissions
CREATE POLICY "Administratörer har full åtkomst till user_permissions"
  ON user_permissions
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Användare kan se sina egna permissions
CREATE POLICY "Användare kan se sina egna behörigheter"
  ON user_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Lägg till roll-fält i profiles-tabellen om det inte redan finns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'; 