type EventHandler = (event: any) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler[]>;

  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }
    
    this.handlers = new Map();
    EventBus.instance = this;
  }

  subscribe(eventType: string, handler: EventHandler): () => void {
    const handlers = this.handlers.get(eventType) ?? [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);

    // Returnera en unsubscribe-funktion
    return () => {
      const handlers = this.handlers.get(eventType) ?? [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        this.handlers.set(eventType, handlers);
      }
    };
  }

  async publish(event: { constructor: { name: string } }): Promise<void> {
    const eventType = event.constructor.name;
    const handlers = this.handlers.get(eventType) ?? [];
    
    await Promise.all(
      handlers.map(handler => handler(event))
    );
  }
}

/**
 * Returnerar den globala EventBus-instansen
 */
export const getEventBus = (): EventBus => {
  return new EventBus(); // Detta kommer returnera den singleton-instans som finns tack vare konstruktorn
}; 