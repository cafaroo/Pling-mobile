/**
 * TestKit
 * 
 * En samling hjälpfunktioner för standardiserade tester av domänentiteter,
 * särskilt med fokus på aggregatrotsenheter.
 */

import { InvariantTestHelper } from './helpers/invariantTestHelper';

/**
 * Hjälpfunktioner för att testa händelsesekvenser och event-publicering
 */
const AggregateTestHelper = {
  /**
   * Förbereder testmiljön för test av aggregat
   */
  setupTest: () => {
    // Rensa eventuella globala lyssnare från tidigare test
    // Detta är en tom implementation tills vi har ett globalt event-system
  },
  
  /**
   * Städar upp testmiljön efter test av aggregat
   */
  teardownTest: () => {
    // Städa upp efter test
  },
  
  /**
   * Verifierar att en viss typ av händelse publicerades av ett aggregat
   * 
   * @param aggregate Aggregatet att kontrollera
   * @param eventType Händelsetypen att leta efter
   * @returns Den hittade händelsen
   * @throws Error om händelsen inte hittades
   */
  expectEventPublished: (aggregate: any, eventType: any) => {
    const events = aggregate.domainEvents || aggregate.getDomainEvents?.() || [];
    const event = events.find((e: any) => e instanceof eventType);
    if (!event) {
      throw new Error(`Expected event of type ${eventType.name} was not published`);
    }
    return event;
  },
  
  /**
   * Verifierar att en viss typ av händelse INTE publicerades av ett aggregat
   * 
   * @param aggregate Aggregatet att kontrollera
   * @param eventType Händelsetypen att leta efter
   * @throws Error om händelsen hittades (då det inte var förväntat)
   */
  expectNoEventPublished: (aggregate: any, eventType: any) => {
    const events = aggregate.domainEvents || aggregate.getDomainEvents?.() || [];
    const event = events.find((e: any) => e instanceof eventType);
    if (event) {
      throw new Error(`Expected no event of type ${eventType.name} to be published, but one was found`);
    }
  },
  
  /**
   * Verifierar att en sekvens av händelser publicerades i rätt ordning
   * 
   * @param aggregate Aggregatet att kontrollera
   * @param eventTypes Lista med händelsetyper i förväntad ordning
   */
  verifyEventSequence: (aggregate: any, eventTypes: any[]) => {
    const events = aggregate.domainEvents || aggregate.getDomainEvents?.() || [];
    
    // Kontrollera att vi har tillräckligt många händelser
    if (events.length < eventTypes.length) {
      throw new Error(`Expected at least ${eventTypes.length} events but found ${events.length}`);
    }
    
    // Kontrollera att händelserna är i rätt ordning
    let foundEvents = 0;
    let lastFoundIndex = -1;
    
    for (const eventType of eventTypes) {
      // Leta efter händelse av denna typ som kommer efter den senast funna
      const index = events.findIndex((e: any, i: number) => 
        i > lastFoundIndex && e instanceof eventType
      );
      
      if (index === -1) {
        throw new Error(`Expected event of type ${eventType.name} was not found or not in expected order`);
      }
      
      lastFoundIndex = index;
      foundEvents++;
    }
    
    return true;
  }
};

/**
 * Exportera TestKit som ett objekt med olika hjälpfunktionssamlingar
 */
export const TestKit = {
  aggregate: AggregateTestHelper,
  invariant: InvariantTestHelper
};

export default TestKit; 