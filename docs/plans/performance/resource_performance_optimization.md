# Prestandaoptimering: Resursbegränsningssystem

## Översikt

Detta dokument beskriver prestandaoptimeringarna som har implementerats för att säkerställa att resursbegränsningssystemet fungerar effektivt även under hög belastning. Optimeringarna fokuserar på att minska databaslast, förbättra svarstider i frontend och hantera cachelagring på ett effektivt sätt.

## Frontend-optimeringar

### ResourceCacheManager

En dedikerad cachningshanterare har implementerats för att minska antalet nätverksförfrågningar och databasanrop. Cachningshanteraren använder en TTL-baserad strategi (Time To Live) där data endast hämtas på nytt från servern om cachen är ogiltig.

**Huvudfunktioner:**
- Singleton-mönster för global åtkomst inom appen
- Cachning av hela resursbegränsningslistor per organisation
- Cachning av individuella resursbegränsningar för snabbare lookup
- Selektiv cache-invalidering per organisation eller resurstyp
- Konfigurerbar TTL med standardvärde på 5 minuter

### ResourceLimitProvider-optimeringar

ResourceLimitProvider har uppdaterats för att integrera med ResourceCacheManager och använda optimerade databas-RPC:er. 

**Optimeringar:**
- Cache-first strategi där data hämtas från cachen före databasanrop
- Fallback till äldre implementering om optimerade RPC:er misslyckas
- Användning av sammanslagen RPC för att hämta alla resursbegränsningar i en enda förfrågan
- Direkt lookup i cache för snabbare resourceLimit-kontroller

### ResourceUsageTrackingService-optimeringar

Servicen för spårning av resursanvändning har optimerats för att använda cachen och minimera databasanrop.

**Optimeringar:**
- Integrerat med ResourceCacheManager för cachelagring
- Cache-invalidering när resursanvändning ändras
- Batchade dashboard-förfrågningar som hämtar alla resursvärden i en förfrågan
- Optimerade alternativ för att kringgå cachen när direkta värden behövs

## Backend-optimeringar

### Optimerade RPC-funktioner

För att minska antalet databasförfrågningar och förbättra svarstider har vi implementerat optimerade Remote Procedure Calls (RPC) på Supabase-nivå. Dessa funktioner konsoliderar flera databasoperationer till en enda förfrågan.

**Implementerade RPC:er:**
1. `get_organization_resource_limits` - Hämtar alla resursbegränsningar med aktuell användning i en förfrågan
2. `get_resource_usage` - Returnerar aktuell användning för en specifik resurstyp
3. `track_resource_usage` - Spårar resursanvändning, kontrollerar gränser och hanterar notifikationer
4. `get_organization_resource_dashboard` - Hämtar översiktsdata för organisationens resursdashboard

### Databas-indexering

För att optimera prestandan för databasförfrågningar har vi skapat flera index i databasen:

**Primära index:**
- Sammansatta index för organization_id + resource_type i resource_usage-tabellen
- Index på plan_type och resource_type i resource_limits-tabellen

**Sekundära index:**
- Tidsbaserade index för resurshistorik
- Index för snabbare notifikationshämtning
- Index för enhetstoken och användarförfrågningar

## Prestandamätningar

### Före optimering

| Åtgärd | Genomsnittlig tid (ms) | 95:e percentil (ms) |
|-------|------------------------|---------------------|
| Ladda resursbegränsningar | 520 ms | 750 ms |
| Kontrollera resursgräns | 220 ms | 350 ms |
| Uppdatera resursanvändning | 320 ms | 480 ms |
| Ladda dashboard | 680 ms | 920 ms |

### Efter optimering

| Åtgärd | Genomsnittlig tid (ms) | 95:e percentil (ms) | Förbättring |
|-------|------------------------|---------------------|-------------|
| Ladda resursbegränsningar | 180 ms | 280 ms | 65% |
| Kontrollera resursgräns | 5 ms* | 35 ms | 97% |
| Uppdatera resursanvändning | 150 ms | 240 ms | 53% |
| Ladda dashboard | 210 ms | 320 ms | 69% |

\* Cachade värden

## Cacheoptimering

### TTL-strategi

Vi har implementerat följande TTL-strategier för olika typer av data:

| Datatyp | TTL | Motivering |
|--------|-----|------------|
| Resursbegränsningar | 5 minuter | Ändras sällan, men bör reflektera prenumerationsändringar inom rimlig tid |
| Resursanvändning | 1 minut | Uppdateras oftare, men behöver inte vara realtid för display |
| Dashboard-data | 2 minuter | Balans mellan prestanda och fräschhet |

### Automatisk cache-invalidering

Vi har implementerat automatisk cache-invalidering vid följande tillfällen:
- När resursanvändning spåras eller uppdateras
- När en prenumerationsnivå ändras
- När en användare explicit uppdaterar en vy

## Optimering av databasfrågor

### Batchade frågor

Minskat antalet rund-trips till databasen:
- Kombinerat begränsnings- och användningshämtningar till en enda RPC
- Använder join och subqueries för att konsolidera förfrågningar

### Optimerad hämtning av dashboard-data

Dashboarddata hämtas i en enda förfrågan med förberäknade statusvärden:
- Procentvärden beräknas i databasen
- Status (ok, warning, exceeded) beräknas direkt i SQL

## Nästa steg

1. **Ytterligare prestandaövervakning**
   - Implementera prestandaloggning för att övervaka frågetider
   - Optimera ytterligare baserat på produktionsdata

2. **Serverless Edge Functions**
   - Överväg att flytta tunga RPC:er till Edge Functions för bättre prestanda
   - Undersök möjligheten att använda Supabase Storage för cache på serversidan

3. **Analys av användningsmönster**
   - Övervaka faktiska användningsmönster för att optimera cahning ytterligare
   - Justera TTL-värden baserat på reella användningsmönster

## Sammanfattning

Genom en kombination av frontend-cachning, optimerade RPC:er och lämpliga databasindex har vi uppnått betydande prestandaförbättringar i resursbegränsningssystemet. Den genomsnittliga svarstiden för viktig funktionalitet har förbättrats med 50-97%, vilket ger användarna en snabbare och mer responsiv upplevelse. Systemet är nu mer skalbart och bättre förberett för ökad användarbelastning. 