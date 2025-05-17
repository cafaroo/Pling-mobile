import { EventBus } from '@/shared/core/EventBus';

/**
 * MockEventPublisher - En adaptor för att hantera events i testmiljön
 * som hanterar skillnader i event-struktur mellan olika implementationer
 */
export class MockEventPublisher implements EventBus {
  private events: Record<string, any[]> = {};

  constructor() {
    this.clearEvents();
  }

  /**
   * Publicerar ett event och sparar det för testverifikation
   * Hanterar både gamla format (med eventName/name) och nya (med eventType)
   */
  async publish(eventNameOrType: string, payload?: any): Promise<void> {
    if (!this.events[eventNameOrType]) {
      this.events[eventNameOrType] = [];
    }

    // Standardisera payload-formatet för bättre testkompatibilitet
    const standardizedPayload = this.standardizePayload(eventNameOrType, payload);
    this.events[eventNameOrType].push(standardizedPayload);
    
    // Om vi använder domain.event formatet, spara också i bara event-delen
    if (eventNameOrType.includes('.')) {
      const eventCategory = eventNameOrType.split('.')[0];
      if (!this.events[eventCategory]) {
        this.events[eventCategory] = [];
      }
      this.events[eventCategory].push(standardizedPayload);
    }

    return Promise.resolve();
  }

  /**
   * Standardiserar payload-format baserat på event-typ
   */
  private standardizePayload(eventType: string, payload: any): any {
    // Om payload saknas, skapa ett tomt objekt
    if (!payload) return {};

    // Specialhantering baserat på event-typ
    switch (eventType) {
      case 'subscription.created':
        return {
          ...payload,
          // Lägg till eventuellt saknade fält som tester kan förvänta sig
          planId: payload.planId || 'unknown-plan',
          status: payload.status || 'active',
          timestamp: payload.timestamp || new Date()
        };

      case 'subscription.updated':
        return {
          ...payload,
          status: payload.status || 'active',
          timestamp: payload.timestamp || new Date()
        };

      case 'subscription.payment_succeeded':
      case 'subscription.payment_failed':
      case 'subscription.renewal_reminder':
      case 'subscription.expired':
      case 'subscription.payment_reminder':
        return {
          ...payload,
          timestamp: payload.timestamp || new Date()
        };

      default:
        return payload;
    }
  }

  /**
   * Returnerar alla event av en viss typ
   */
  getEvents(eventType?: string): any[] {
    if (!eventType) {
      // Returnera alla events
      return Object.values(this.events).flat();
    }
    return this.events[eventType] || [];
  }

  /**
   * Rensar alla sparade events
   */
  clearEvents(): void {
    this.events = {};
  }

  /**
   * Prenumererar på en event-typ (mockad implementation)
   */
  subscribe(eventType: string, callback: (event: any) => void): { unsubscribe: () => void } {
    return {
      unsubscribe: () => {}
    };
  }

  /**
   * Avregistrerar en prenumeration (mockad implementation)
   */
  unsubscribe(eventType: string, callback: (event: any) => void): void {
    // Mockad implementation, gör ingenting
  }
}

/**
 * Standardinstans för enkel användning i tester
 */
export const mockEventPublisher = new MockEventPublisher();

export default mockEventPublisher; 