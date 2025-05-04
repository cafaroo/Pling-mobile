# Ändringar i klientkod för att åtgärda rekursionsproblem i team_members

## Problemet

Din applikation får följande fel när den försöker hämta team-medlemskap:

```
code: "42P17"
message: 'infinite recursion detected in policy for relation "team_members"'
```

Detta är orsakat av rekursiva RLS-policyer (Row Level Security) i databasen.

## Lösning

Vi har implementerat en säker API-funktion som kringgår RLS-problemen. För att använda denna behöver du uppdatera din klientkod enligt följande:

### 1. För getUserTeams-funktionen

**Aktuell kod (som inte fungerar):**

```javascript
// Hämtar teamID för en användare
const getUserTeams = async (userId) => {
  try {
    console.log("Anropar getUserTeams för userId:", userId);
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    return data.map(item => item.team_id);
  } catch (error) {
    console.error("Error in getUserTeams:", error);
    throw error;
  }
};
```

**Uppdaterad kod (använder den säkra API-funktionen):**

```javascript
// Hämtar teamID för en användare via säker RPC-funktion
const getUserTeams = async (userId) => {
  try {
    console.log("Anropar getUserTeams för userId:", userId);
    const { data, error } = await supabase
      .rpc('get_user_team_ids', { 
        user_id_param: userId, 
        status_param: 'active' 
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in getUserTeams:", error);
    throw error;
  }
};
```

### 2. För andra team_members-frågor

För andra ställen där du frågar team_members-tabellen:

**Original:**
```javascript
const { data, error } = await supabase
  .from('team_members')
  .select('*,team:teams(*)')
  .eq('user_id', userId);
```

**Uppdaterad:**
```javascript
const { data, error } = await supabase
  .rpc('get_user_team_memberships', { 
    user_id_param: userId 
  });

// Om du behöver team-detaljer också, gör en separat fråga:
if (data?.length > 0) {
  const teamIds = data.map(item => item.team_id);
  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .in('id', teamIds);
    
  // Kombinera resultaten om det behövs
}
```

## Fördelar med denna lösning

1. **Undviker rekursion:** Den nya koden kringgår RLS-rekursionen helt genom att använda SECURITY DEFINER-funktioner
2. **Bättre prestanda:** De nya funktionerna är optimerade och har mindre overhead
3. **Mer säker:** Klienter kan bara utföra de operationer som uttryckligen stöds av API-funktioner

## Testning

Verifiera att din app fungerar korrekt efter uppdateringen genom att:
1. Logga in och kontrollera att team-sidan laddar utan fel
2. Verifiera att alla team-relaterade funktioner fungerar som förväntat
3. Kontrollera att du kan se och interagera med dina team 