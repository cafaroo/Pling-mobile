# Supabase RLS Migration: Fixing Profiles Table Permissions

## Översikt

Vi har upptäckt ett problem med Row Level Security (RLS) i profiles-tabellen som hindrar användare från att skapa profiler. Detta dokument beskriver hur du kör migrationen som åtgärdar detta.

## Problemet

Följande felmeddelande uppstår när användare försöker registrera sig eller när systemet försöker skapa profiler:

```
new row violates row-level security policy for table "profiles"
```

Detta beror på att tabellen har RLS aktiverat men saknar rätt policyer för INSERT-operationer.

## Lösningen

Vi har skapat en SQL-migrering (`fix_profiles_rls.sql`) som lägger till nödvändiga RLS-policyer.

## Körinstruktioner

### Alternativ 1: Via Supabase Dashboard

1. Logga in på [Supabase Dashboard](https://app.supabase.io)
2. Välj ditt projekt
3. Gå till "SQL Editor"
4. Kopiera innehållet från `supabase/migrations/fix_profiles_rls.sql`
5. Kör SQL-koden
6. Kontrollera att inga fel uppstår

### Alternativ 2: Via Supabase CLI

Om du har Supabase CLI installerat:

```bash
# Navigera till projektmappen
cd path/to/your/project

# Kör migrationen direkt
supabase db push --db-url=<YOUR_DB_URL> --password=<YOUR_DB_PASSWORD>

# ELLER kör bara en specifik migrationsfil
cat supabase/migrations/fix_profiles_rls.sql | supabase db execute --db-url=<YOUR_DB_URL> --password=<YOUR_DB_PASSWORD>
```

### Alternativ 3: Manuellt via psql

```bash
# Anslut till databasen
psql -h <DB_HOST> -d postgres -U postgres -p 5432

# Ange lösenord när du uppmanas

# Kör SQL-kommandon från fix_profiles_rls.sql
```

## Verifiering

Efter att ha kört migrationen, testa applikationen genom att:

1. Logga ut från appen (om du är inloggad)
2. Skapa ett nytt konto
3. Bekräfta att registreringen slutförs utan fel
4. Bekräfta att profilen skapas korrekt

## Felsökning

Om problem kvarstår, kontrollera:

1. SQL-migreringen kördes utan fel
2. RLS är fortfarande aktiverat på tabellen (`SELECT rls_enabled FROM pg_tables WHERE tablename = 'profiles';`)
3. RLS-policyer har skapats (`SELECT * FROM pg_policies WHERE tablename = 'profiles';`)

## Kontakt

Vid problem eller frågor, kontakta utvecklingsteamet. 