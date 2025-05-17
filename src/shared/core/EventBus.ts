import { DomainEvent } from './DomainEvent';

type EventHandler = (event: any) => void | Promise<void>;

/**
 * EventBus-gränssnitt
 * 
 * En meddelandebuss för att publicera och prenumerera på domänevents.
 */
export interface EventBus {
  /**
   * Publicerar ett event på bussen
   * @param eventType Typ eller namn på eventet
   * @param payload Data som ska skickas med eventet
   */
  publish(eventType: string, payload?: any): Promise<void>;
  
  /**
   * Prenumererar på en eventtyp
   * @param eventType Typ eller namn på event att lyssna på
   * @param callback Funktion som anropas när event inträffar
   * @returns Ett objekt med en unsubscribe-metod för att avbryta prenumerationen
   */
  subscribe(eventType: string, callback: (payload: any) => void): { unsubscribe: () => void };
  
  /**
   * Avregistrerar en prenumeration
   * @param eventType Typ eller namn på event
   * @param callback Callback-funktion som ska avregistreras
   */
  unsubscribe(eventType: string, callback: (payload: any) => void): void;
  
  /**
   * Rensar alla prenumerationer
   */
  clearListeners(): void;
}

/**
 * En klass som hanterar prenumerationer och publicering av händelser.
 * Används i både produktions- och testmiljö.
 */
export class EventBusImpl implements EventBus {
  private subscribers: Map<string, Set<(payload: any) => void>>;

  constructor() {
    this.subscribers = new Map();
  }

  /**
   * Publicerar ett event på bussen
   */
  async publish(eventType: string, payload?: any): Promise<void> {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      for (const callback of Array.from(subscribers)) {
        await callback(payload);
      }
    }
  }

  /**
   * Prenumererar på en eventtyp
   */
  subscribe(eventType: string, callback: (payload: any) => void): { unsubscribe: () => void } {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)!.add(callback);
    
    return {
      unsubscribe: () => this.unsubscribe(eventType, callback)
    };
  }

  /**
   * Avregistrerar en prenumeration
   */
  unsubscribe(eventType: string, callback: (payload: any) => void): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  /**
   * Rensar alla prenumerationer
   */
  clearListeners(): void {
    this.subscribers.clear();
  }
}

// Singleton-instans för användning i applikationen
export const eventBus = new EventBusImpl();

/**
 * Returnerar den globala EventBus-instansen
 */
export const getEventBus = (): EventBus => {
  return eventBus; // Returnera den globala singleton-instansen
};

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): () => void;
  clearListeners(): void;
} 