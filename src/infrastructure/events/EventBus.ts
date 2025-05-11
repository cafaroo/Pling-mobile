import { DomainEvent } from '@/shared/core/DomainEvent';

/**
 * Interface för EventBus
 * 
 * EventBus är ansvarigt för att publicera och prenumerera på domänhändelser
 */
export interface EventBus {
  /**
   * Publicerar en händelse till alla prenumeranter
   * 
   * @param event Händelsen som ska publiceras
   */
  publish(event: DomainEvent): Promise<void>;
  
  /**
   * Prenumererar på en specifik händelsetyp
   * 
   * @param eventType Händelsetypen att prenumerera på
   * @param callback Funktion som anropas när en händelse av denna typ publiceras
   * @returns Ett objekt med en metod för att avsluta prenumerationen
   */
  subscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    callback: (event: T) => void
  ): { unsubscribe: () => void };
  
  /**
   * Rensar alla prenumerationer
   */
  clear(): void;
}

type EventCallback = (event: DomainEvent) => void;
type Subscription = {
  eventType: new (...args: any[]) => DomainEvent;
  callback: EventCallback;
};

/**
 * Standard implementering av EventBus
 */
export class StandardEventBus implements EventBus {
  private subscriptions: Subscription[] = [];
  
  async publish(event: DomainEvent): Promise<void> {
    // Hitta alla relevanta prenumerationer
    const matchingSubscriptions = this.subscriptions.filter(sub => 
      event instanceof sub.eventType
    );
    
    // Anropa alla matchande callbacks
    // Kör dessa asynkront men vänta inte på dem
    matchingSubscriptions.forEach(sub => {
      // Wrappa i en try-catch för att inte bryta flödet vid fel
      try {
        sub.callback(event);
      } catch (error) {
        console.error(`Fel vid hantering av händelse ${event.name}:`, error);
      }
    });
  }
  
  subscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    callback: (event: T) => void
  ): { unsubscribe: () => void } {
    // Skapa en typspecifik callback som castar händelsen korrekt
    const typedCallback = (event: DomainEvent) => {
      if (event instanceof eventType) {
        callback(event as T);
      }
    };
    
    // Lagra prenumerationen
    const subscription: Subscription = {
      eventType,
      callback: typedCallback
    };
    
    this.subscriptions.push(subscription);
    
    // Returnera en unsubscribe-funktion
    return {
      unsubscribe: () => {
        this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);
      }
    };
  }
  
  clear(): void {
    this.subscriptions = [];
  }
}

// Singleton-instans som kan användas om inget annat konfigureras
let _instance: EventBus | null = null;

/**
 * Hämtar en singleton-instans av EventBus
 */
export function getEventBus(): EventBus {
  if (!_instance) {
    _instance = new StandardEventBus();
  }
  return _instance;
}

/**
 * Sätter en anpassad EventBus-implementation som global instans
 */
export function setEventBus(eventBus: EventBus): void {
  _instance = eventBus;
} 