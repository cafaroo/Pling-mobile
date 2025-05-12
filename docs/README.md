# Team-modul dokumentation

## Översikt

Detta är dokumentationssamlingen för Team-modulen i Pling-applikationen. Här hittar du detaljerad information om modulens struktur, datamodeller, komponenter, arbetsflöden, implementationsguider och testförfaranden.

## Dokumentationsstruktur

- [**team-module.md**](./team-module.md) - Fullständig dokumentation av modulen och dess komponenter
- [**team-data-flow.md**](./team-data-flow.md) - Detaljerad beskrivning av dataflöden i team-modulen
- [**team-implementation-guide.md**](./team-implementation-guide.md) - Guide för utvecklare som implementerar nya funktioner
- [**team-testing-guide.md**](./team-testing-guide.md) - Guide för testning av team-modulens olika komponenter
- [**frontend-design-guide.md**](./frontend-design-guide.md) - Generell designguide för frontendimplementation
- [**brand_guide_pling.md**](./brand_guide_pling.md) - Varumärkesguide för Pling

## Målgrupper

Dokumentationen är strukturerad för att tillgodose behoven hos olika målgrupper:

1. **Nya utvecklare**
   - Börja med `team-implementation-guide.md` och sedan `team-module.md`

2. **Testare och QA**
   - Se `team-testing-guide.md` för testrutiner och procedurer

3. **Arkitekter och tech leads**
   - Se `team-data-flow.md` för att förstå datamodeller och flöden

4. **UI/UX utvecklare**
   - Använd `frontend-design-guide.md` tillsammans med `brand_guide_pling.md`

## Hur du bidrar till dokumentationen

För att uppdatera eller utöka dokumentationen, följ dessa steg:

1. Skapa eller uppdatera relevanta markdownfiler
2. Följ den befintliga formateringen och strukturen
3. Inkludera kodexempel när möjligt
4. Uppdatera denna README om du lägger till nya dokumentfiler

## Att tänka på

- All dokumentation ska vara på svenska för att följa projektets språkval
- Använd konsekvent terminologi genom all dokumentation
- Dokumentera både implementation och användning av komponenter och funktioner
- Inkludera illustrativa diagram när det är möjligt
- Håll dokumentationen uppdaterad när koden ändras

# Pling Dokumentation

Detta repository innehåller all dokumentation för Pling-applikationen.

## Innehåll

* **[plans/](plans/)** - Planer för framtida utveckling
  * [domains/](plans/domains/) - Domain-Driven Design domänspecifikationer
    * [subscription_model.md](plans/domains/subscription_model.md) - Beskrivning av prenumerationsmodellen ✅
    * [organization_tasks.md](plans/domains/organization_tasks.md) - Uppgifter för organisationsdomänen ✅
  * [team_implementation.md](plans/team_implementation.md) - Plan för teammodulimplementation
  * [user-team-integration-guide.md](plans/user-team-integration-guide.md) - Guide för integration av användare och team

* **[updates/](updates/)** - Senaste uppdateringar och förändringar
  * [infrastructure.md](updates/infrastructure.md) - Infrastrukturuppdateringar

* **[tests/](tests/)** - Testdokumentation
  * [test-status.md](tests/test-status.md) - Status för tester
  * [testing-guide.md](tests/testing-guide.md) - Guide för testning

## Senaste uppdateringar

### Resursmodell och prenumerationer ✅

Vi har implementerat en omfattande lösning för resursbegränsningar baserad på Domain-Driven Design:

1. **ResourceLimitStrategy** - Strategimönster för att hantera resursbegränsningar
2. **Automatiserad resursspårning** - System för att automatiskt spåra och uppdatera resursanvändning
3. **Notifikationssystem** - Integrerad notifiering när resursgränser närmar sig
4. **Användarinterface** - Komponenter för att visualisera och hantera resursbegränsningar

Se [subscription_model.md](plans/domains/subscription_model.md) för fullständig dokumentation.

### Team- och organisationsuppdateringar

För information om senaste teammoduluppdateringar, se [team_implementation.md](plans/team_implementation.md).

## Hur man använder denna dokumentation

1. Börja med att läsa relevanta domändokument för att förstå den övergripande arkitekturen
2. Läs implementationsplaner för specifika funktioner
3. Referera till testdokumentationen för att förstå teststrategin

## Bidra till dokumentationen

För att bidra till dokumentationen, följ dessa riktlinjer:

1. Använd Markdown-format
2. Följ den befintliga strukturen
3. Inkludera kodexempel när det är relevant
4. Håll dokumentationen uppdaterad när koden förändras

## Resursbegränsningssystem

- [Subscription Model](plans/domains/subscription_model.md) - Dokumentation av prenumerationsmodellen och resursbegränsningar
- [Migration Summary](migrations/migration_summary.md) - Sammanfattning av migreringar för resursbegränsningssystemet
- [Resource Performance Optimization](plans/resource_performance_optimization.md) - Plan för prestandaoptimering av resursbegränsningssystemet
- [Resource Limits Test Plan](tests/resource_limits_test_plan.md) - Testplan för resursbegränsningssystemet
- [Integration Tests Setup](plans/integration_tests_setup.md) - Guide för konfiguration av integrationstester 