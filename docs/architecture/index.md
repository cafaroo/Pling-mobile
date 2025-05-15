# Arkitekturdokumentation för Pling Mobile

Denna sektion innehåller teknisk dokumentation över Pling Mobiles arkitektur och designbeslut.

## Domain-Driven Design

- [DDD Översikt](./ddd-overview.md) - Övergripande beskrivning av DDD-arkitekturen
- [Bounded Contexts](./bounded-contexts.md) - Beskrivning av systemets domängränser
- [Domänmodell](./domain-model.md) - Detaljer om entiteter, värde-objekt och aggregater

## Tekniska beskrivningar

- [Hooks Implementation](./hooks-implementation.md) - Användning av hooks för att standardisera UI-till-domän-kommunikation
- [Event System](./event-system.md) - Beskrivning av domäneventssystemet
- [Repository Implementation](./repository-implementation.md) - Detaljer om repository-mönstrets implementation
- [Error Handling Strategy](./error-handling.md) - Strategi för felhantering i hela applikationen

## Komponenter och flöden

- [Team-flöden](./team-flows.md) - Viktiga flöden för team-relaterade processer
- [User-flöden](./user-flows.md) - Viktiga flöden för användarprocesser
- [Organization-flöden](./organization-flows.md) - Viktiga flöden för organisationsprocesser

## Utvecklarreferenser

- [Kodningsriktlinjer](./coding-guidelines.md) - Riktlinjer för kodstil och konventioner
- [Testningsguide](./testing-guide.md) - Guide för testning i DDD-kontexten
- [Problemlösningsguide](./troubleshooting.md) - Vanliga problem och lösningar

## Övrigt

- [Terminologi och ordlista](./glossary.md) - Definitioner av domänspecifika termer
- [Refactoring-plan](./refactoring-plan.md) - Plan för fortsatt refaktorering av koden

## Snabbstartsguide

För nya utvecklare rekommenderar vi att gå igenom dokumenten i följande ordning:

1. [DDD Översikt](./ddd-overview.md)
2. [Terminologi och ordlista](./glossary.md)
3. [Kodningsriktlinjer](./coding-guidelines.md)
4. Specifika flöden beroende på arbetsområde

## Hur man bidrar till dokumentationen

För att uppdatera arkitekturdokumentationen:

1. Skapa en ny gren från main
2. Gör dina ändringar i relevanta markdown-filer
3. Om du lägger till nya dokument, uppdatera denna index-fil
4. Skapa en pull request för granskning

## Dokument som ska skapas

Följande dokument är planerade men ännu inte implementerade:

- [ ] Testing guide
- [ ] Glossary
- [ ] User flows
- [ ] Organization flows

## Relaterade resurser

- [Clean Architecture av Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design av Eric Evans](https://domainlanguage.com/ddd/)
- [Supabase Documentation](https://supabase.io/docs) 