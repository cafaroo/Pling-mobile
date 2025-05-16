# Riktlinjer för namngivning av domänevents

Detta dokument definierar standarder för namngivning och struktur av domänevents i Pling-mobile, för att säkerställa konsekvent implementering enligt DDD-principer.

## Namngivningsriktlinjer

### Grundläggande principer

1. **Använd perfekt form (preteritum)** - Alla events representerar något som redan har hänt:
   - ✅ `UserCreated`, `TeamMemberRoleChanged`, `MessageSent`
   - ❌ `CreateUser`, `ChangeTeamMemberRole`, `SendMessage`

2. **Namnge alltid events efter aggregatroten** - För tydlighet om vilken domän eventet tillhör:
   - ✅ `TeamMemberAdded`, `UserProfileUpdated`, `OrganizationSettingsChanged`
   - ❌ `MemberAdded`, `ProfileUpdated`, `SettingsChanged`

3. **Använd substantiv för tillstånd och adjektiv för egenskaper** - För konsekvent beskrivning:
   - ✅ `UserStatusChanged`, `TeamActivated`, `MessageDelivered`
   - ❌ `UserChangeStatus`, `TeamActive`, `MessageDelivery`

### Standardiserad namngivningsstruktur

Följ detta mönster för namngivning av events:

```
<AggregateRoot><Entity/ValueObject><Action>
```

Exempel:
- `TeamMemberRoleChanged` (Team-aggregatet, TeamMember-entiteten, Role-egenskapen har ändrats)
- `UserProfileUpdated` (User-aggregatet, Profile-värdesobjektet har uppdaterats)
- `OrganizationSubscriptionRenewed` (Organization-aggregatet, Subscription-komponenten har förnyats)

## Struktur för domänevents

### Basklasser

Varje aggregat ska ha en egen basklass för sina domänevents:

```typescript
abstract class BaseTeamEvent implements IDomainEvent {
  // Implementationsdetaljer...
}

abstract class BaseUserEvent implements IDomainEvent {
  // Implementationsdetaljer...
}
```

### Standardegenskaper

Alla domänevents ska innehålla följande egenskaper:

1. **eventId**: Unikt ID för eventet
2. **eventType**: Strängkonstant som identifierar eventtypen
3. **occurredAt**: Tidpunkt när eventet inträffade
4. **aggregateId**: ID för den aggregatrot som publicerade eventet
5. **version**: Versionsnummer för eventet (för eventuell event sourcing)

### Eventinnehåll

1. **Minimalt innehåll** - Inkludera bara nödvändig information:
   - ✅ Inkludera: IDs, väsentliga förändringar, primära värden
   - ❌ Exkludera: Fullständiga entiteter, deriverad information, redundanta data

2. **Värde vs. Referens** - För att underlätta serialisering:
   - ✅ Skicka primitiva värden och värden från värde-objekt
   - ❌ Undvik referenser till entiteter och komplexa objekt

## Migrering av befintliga events

### Steg för att standardisera befintliga events

1. **Analysera** - Identifiera events som inte följer dessa riktlinjer
2. **Planera** - Skapa migreringsplan med gamla och nya eventnamn
3. **Uppdatera** - Implementera nya eventstrukturer parallellt med gamla
4. **Migrera** - Stegvis ersätt gamla events med nya i alla aggregat
5. **Testa** - Säkerställ att alla event handlers fungerar med nya events

### Exempel på namngivningsändringar

| Nuvarande event | Standardiserat event | Motivering |
|-----------------|----------------------|------------|
| MemberJoined | TeamMemberJoined | Förtydligar att eventet tillhör Team-aggregatet |
| TeamMessage | TeamMessageCreated | Använder perfekt form för att visa att det är en händelse |

## Validering av efterlevnad

För att säkerställa efterlevnad av dessa riktlinjer:

1. **Kodgranskning** - Kontrollera event namngivning vid PR-granskningar
2. **Automatiserade tester** - Verifiera eventstruktur med dedikerade tester
3. **Dokumentation** - Håll en uppdaterad lista över alla domänevents
4. **Refaktorering** - Schemalägga regelbundna granskningar av eventmodellen

## Nästa steg

Alla nya domänevents ska följa dessa riktlinjer omedelbart. För befintliga events, börja med att standardisera event-innehållet, sedan successivt uppdatera namngivning enligt riktlinjerna. 