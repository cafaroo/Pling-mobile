# Standardisering av Subscription-domänen

## Bakgrund

Standardiseringen av Subscription-domänen följer samma mönster som tidigare använts för Team- och User-domänerna. Målet är att skapa enhetliga event-strukturer som använder konsekvent parameterobjekt-konstruktion, stöd för both UniqueId och strängbaserade ID:n, samt säker och deterministisk hantering av eventpublicering.

## Slutförda åtgärder

Följande arbete har redan utförts:

1. **Event-standardisering:**
   - Implementerat åtta standardiserade event-klasser
   - Skapat en index-fil för export av event-klasserna
   - Säkerställt att alla event har parameterobjekt-konstruktorer

2. **Subscription-entitet:**
   - Uppdaterat för att använda standardiserade events
   - Behållit bakåtkompatibilitet med tidigare event-format
   - Förbättrat felhantering med Result-API:et

3. **Bastester:**
   - Verifierat att alla event skapas korrekt
   - Testat hantering av olika ID-typer (UniqueId/string)
   - Säkerställt korrekt eventpublicering

## Återstående arbete

Följande åtgärder behöver slutföras för att fullständigt standardisera Subscription-domänen:

1. **Fixa integrationstester:**
   - Lösa testfel i `subscription-domain-integration.test.ts`
   - Fixa mock-implementationerna för Subscription-entiteten som saknar metoder som `setEventPublisher` och `save`
   - Uppdatera `MockDomainEventPublisher` med rätt metoder (`subscribe` m.m.)

2. **Uppdatera Organization-Subscription-integration:**
   - Implementera metoden `updatePlan` i Organization-entiteten
   - Säkerställa att `SubscriptionEventHandler` hanterar alla event-typer korrekt

3. **Team-Subscription-begränsningar:**
   - Implementera rätt metoder i Team-entiteten för att hantera prenumerationsbegränsningar
   - Fixa team-prenumerations-testerna

4. **Feature Flag-service:**
   - Slutföra integrationen mellan Subscription- och Feature Flag-services
   - Fixa tester för feature flag-funktionalitet

## Felsökningsåtgärder

För att åtgärda de vanligaste testfelen behöver följande problem lösas:

1. **Event Publisher-integration:**
   ```typescript
   // Implementera subscribe-metod i MockDomainEventPublisher
   class MockDomainEventPublisher implements DomainEventPublisher {
     private handlers: Map<string, Function[]> = new Map();
     
     subscribe(eventName: string, handler: Function): void {
       if (!this.handlers.has(eventName)) {
         this.handlers.set(eventName, []);
       }
       this.handlers.get(eventName)?.push(handler);
     }
     
     // Implementera övriga metoder...
   }
   ```

2. **Entity Event-publicering:**
   ```typescript
   // Säkerställ att Subscription-entiteten har dessa metoder
   class Subscription extends AggregateRoot<SubscriptionProps> {
     // Existerande kod...
     
     setEventPublisher(publisher: DomainEventPublisher): void {
       this._publisher = publisher;
     }
     
     async save(): Promise<void> {
       // Publicera endast events om en publisher finns
       if (this._publisher) {
         this.domainEvents.forEach(event => {
           this._publisher.publish(event);
         });
       }
       
       this.clearEvents();
     }
   }
   ```

3. **Organization-updatePlan:**
   ```typescript
   // Implementera i Organization-entiteten
   class Organization extends AggregateRoot<OrganizationProps> {
     // Existerande kod...
     
     updatePlan(newPlanId: string): Result<void> {
       // Implementera planuppdatering...
       this.props.planId = newPlanId;
       
       // Publicera event
       this.addDomainEvent(new OrganizationPlanUpdatedEvent({
         organizationId: this.id.toString(),
         oldPlanId: this.props.planId,
         newPlanId: newPlanId
       }));
       
       return Result.ok<void>();
     }
   }
   ```

## Teststrategier

För att förbättra testningen av Subscription-domänen rekommenderas följande strategier:

1. **Isolera tester:**
   - Testa en sak i taget (event-generering, event-hantering, etc.)
   - Använd spioner (jest.spyOn) för att verifiera metoder utan sidoeffekter

2. **Mock-förbättringar:**
   - Säkerställ att alla mocks implementerar hela gränssnittet
   - Använd factory-funktioner för att skapa konsistenta testdata

3. **Integrationsnivåer:**
   - Testa först interaktioner mellan domänentiteter
   - Testa sedan interaktioner mellan domänen och application layer
   - Slutligen testa interaktioner över domängränser

## Slutmål

När arbetet är slutfört kommer Subscription-domänen vara:

1. Fullt standardiserad med konsekvent typning
2. Integrerad med andra domäner genom väldefinerade event-gränssnitt
3. Komplett testad på unit-, domain- och cross-domain-nivå
4. Bakåtkompatibel med tidigare implementationer

## Framtida förbättringar

Efter standardiseringen av Subscription-domänen rekommenderas följande förbättringar:

1. Utökad eventhantering för interdomän-kommunikation
2. Förfinad feature flag-service för mer granulär funktionskontroll
3. Förbättrad användningsrapportering och -analys
4. Prestationsoptimering av prenumerationshantering 