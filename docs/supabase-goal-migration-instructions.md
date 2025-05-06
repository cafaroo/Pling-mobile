# Instruktioner för att applicera Goal-migrationen till Supabase med MCP

Detta dokument beskriver steg för att applicera den nya databasmigrationen för mål till Supabase-projektet med hjälp av den inbyggda MCP-funktionaliteten.

## Migrera med MCP-verktyget

### 1. Säkerhetskopiera databasen (viktigt!)

Innan du fortsätter, se till att du har en säkerhetskopia av din databas genom att använda MCP-verktyget:

1. Öppna Claude i Cursor
2. Använd `mcp_supabase_apply_migration` med ett namn som indikerar att det är en backup

### 2. Applicera migrationen med MCP

Använd `mcp_supabase_apply_migration` för att applicera migrationen:

```
mcp_supabase_apply_migration(
  project_id: "<DITT_PROJEKT_ID>",
  name: "update_goals_schema",
  query: <INNEHÅLLET I MIGRATIONSFILEN>
)
```

Där innehållet i migrationsfilen finns i `supabase/migrations/20250605000000_update_goals_schema.sql`.

### 3. Verifiera migrationen med MCP

Efter att migrationen har applicerats, verifiera att allt fungerar som förväntat med MCP SQL-körning:

1. Kontrollera att tabellerna har skapats korrekt:
   ```
   mcp_supabase_execute_sql(
     project_id: "<DITT_PROJEKT_ID>",
     query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('goals', 'milestones', 'goal_tags', 'goal_tag_relations', 'goal_relations', 'goal_progress_logs');"
   )
   ```

2. Testa grundläggande operationer:
   ```
   mcp_supabase_execute_sql(
     project_id: "<DITT_PROJEKT_ID>",
     query: "INSERT INTO goals (title, description, type, scope, target, created_by) VALUES ('Test mål', 'Ett testmål för att verifiera migrationen', 'project', 'individual', 100, '<DIN_USER_ID>') RETURNING *;"
   )
   ```

## Om MCP-migrationen misslyckas

Om du stöter på problem vid användning av MCP, kan du använda dessa alternativa metoder:

### Alternativ 1: Supabase CLI (lokalt)

1. Installera Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Logga in på Supabase:
   ```bash
   supabase login
   ```

3. Applicera migrationen:
   ```bash
   supabase migration apply --project-ref <PROJEKT_REF>
   ```

### Alternativ 2: SQL Editor i Supabase Dashboard

1. Gå till projektet i Supabase Dashboard
2. Navigera till SQL Editor
3. Kopiera och klistra in innehållet i `supabase/migrations/20250605000000_update_goals_schema.sql`
4. Klicka på "Run"

## Felsökning

Om du stöter på problem under migrationen:

1. Kontrollera felmeddelanden från MCP-verktyget
2. Se om någon del av SQL-koden behöver justeras för din specifika Supabase-instans
3. Försök köra mindre delar av migrationen i taget för att identifiera problematiska sektioner

## Efter migrationen

När migrationen har slutförts framgångsrikt:

1. Uppdatera `docs/goal_tasks.md` för att markera databasuppdateringen som slutförd
2. Informera teamet att de kan börja använda de nya funktionerna
3. Övervaka systemet noga under de första dagarna för eventuella problem

## Tillhandahållna funktioner

Migrationen ger följande nya funktioner som kan testas med MCP:

1. Hämta användarstatistik:
   ```
   mcp_supabase_execute_sql(
     project_id: "<DITT_PROJEKT_ID>",
     query: "SELECT * FROM get_user_goal_stats('<ANVÄNDAR_ID>');"
   )
   ```

2. Hämta teamstatistik:
   ```
   mcp_supabase_execute_sql(
     project_id: "<DITT_PROJEKT_ID>",
     query: "SELECT * FROM get_team_goal_stats('<TEAM_ID>');"
   )
   ```

## Kontaktpersoner vid problem

Om du stöter på problem under migrationsprocessen, kontakta:
- Backend-teamet: backendteam@pling.com
- DevOps: devops@pling.com 