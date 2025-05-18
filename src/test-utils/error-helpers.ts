/**
 * Hjälpfunktioner för att underlätta testning av Result-objekt och domänevent
 */
import { Result } from '@/shared/core/Result';
import { AggregateRoot } from '@/shared/core/AggregateRoot';
import { DomainEvent } from '@/shared/core/DomainEvent';
import { DomainEventTestHelper } from './DomainEventTestHelper';

/**
 * Verifierar att ett Result-objekt är i OK-tillstånd och returnerar dess värde eller boolean
 * @param result Result-objektet att kontrollera
 * @param message Anpassat felmeddelande vid fel
 * @returns Om value är en boolean, returneras den. Annars returneras true.
 */
export function expectResultOk<T, E = string>(result: Result<T, E>, message?: string): boolean | T {
  expect(result.isOk()).toBe(true, message || 'Förväntade OK-resultat men fick error');
  expect(result.isErr()).toBe(false, message || 'Förväntade OK-resultat men fick error');
  
  // Om värdet är en boolean, returnera det direkt
  if (typeof result.value === 'boolean') {
    return result.value;
  }
  
  // Annars returnera true eftersom testet passerade
  return true;
}

/**
 * Verifierar att ett Result-objekt är i Error-tillstånd
 * @param result Result-objektet att kontrollera
 * @param message Anpassat felmeddelande vid fel
 * @returns false eftersom testet förväntade sig ett error
 */
export function expectResultErr<T, E = string>(result: Result<T, E>, message?: string): boolean | E {
  expect(result.isErr()).toBe(true, message || 'Förväntade error-resultat men fick OK');
  expect(result.isOk()).toBe(false, message || 'Förväntade error-resultat men fick OK');
  
  // Returnera false eftersom testet förväntar ett error
  return false;
}

/**
 * Verifierar att ett aggregat har publicerat ett visst event
 * @param aggregate Aggregat att kontrollera
 * @param eventType Event-typ att söka efter
 * @param message Anpassat felmeddelande
 */
export function expectEventPublished<T extends DomainEvent>(
  aggregate: AggregateRoot<any>,
  eventType: new (...args: any[]) => T,
  message?: string
): T {
  const events = DomainEventTestHelper.getPublishedEvents(aggregate, eventType);
  expect(events.length).toBeGreaterThan(0, message || `Hittade inga event av typen ${eventType.name}`);
  return events[events.length - 1];
}

/**
 * Verifierar att ett aggregat har publicerat exakt en instans av ett visst event
 * @param aggregate Aggregat att kontrollera
 * @param eventType Event-typ att söka efter
 * @param message Anpassat felmeddelande
 */
export function expectExactlyOneEventPublished<T extends DomainEvent>(
  aggregate: AggregateRoot<any>,
  eventType: new (...args: any[]) => T,
  message?: string
): T {
  const events = DomainEventTestHelper.getPublishedEvents(aggregate, eventType);
  expect(events.length).toBe(1, message || `Förväntade exakt ett event av typen ${eventType.name} men hittade ${events.length}`);
  return events[0];
}

/**
 * Verifierar att ett aggregat inte har publicerat ett visst event
 * @param aggregate Aggregat att kontrollera
 * @param eventType Event-typ att söka efter
 * @param message Anpassat felmeddelande
 */
export function expectNoEventPublished<T extends DomainEvent>(
  aggregate: AggregateRoot<any>,
  eventType: new (...args: any[]) => T,
  message?: string
): void {
  const events = DomainEventTestHelper.getPublishedEvents(aggregate, eventType);
  expect(events.length).toBe(0, message || `Förväntade inga event av typen ${eventType.name} men hittade ${events.length}`);
}

/**
 * Testar om en asynkron funktion kastar ett specificerat fel
 * 
 * @param fn Funktion att testa
 * @param errorMessage Förväntat felmeddelande (exakt strängmatchning)
 */
export async function testAsyncError(fn: () => Promise<any>, errorMessage?: string): Promise<void> {
  let error: Error | null = null;
  
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).not.toBeNull();
  
  if (errorMessage) {
    expect(error?.message).toBe(errorMessage);
  }
} 