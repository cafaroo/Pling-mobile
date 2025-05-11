import React, { ReactNode, createContext, useContext, useEffect } from 'react';
import { EventBus } from './EventBus';
import { DomainEvent } from '@/shared/core/DomainEvent';

// Skapa context för EventBus
const EventBusContext = createContext<EventBus | null>(null);

// Hook för att använda EventBus
export function useEventBus(): EventBus {
  const eventBus = useContext(EventBusContext);
  if (!eventBus) {
    throw new Error('useEventBus måste användas inom en EventBusProvider');
  }
  return eventBus;
}

interface EventBusProviderProps {
  eventBus: EventBus;
  children: ReactNode;
}

/**
 * Konfigurerar kopplingen mellan DomainEvent.dispatch och EventBus
 * Detta anropas en gång när EventBusProvider monteras
 */
export function setupDomainEventDispatcher(eventBus: EventBus): () => void {
  // Spara en referens till originalmetoden
  const originalDispatch = DomainEvent.prototype.dispatch;
  
  // Ersätt dispatch-metoden med en version som publicerar händelser till EventBus
  DomainEvent.prototype.dispatch = function() {
    // Anropa ursprunglig metod
    const result = originalDispatch.call(this);
    
    // Publicera händelsen till EventBus
    eventBus.publish(this);
    
    return result;
  };
  
  // Returnera en cleanup-funktion som återställer originalmetoden
  return () => {
    DomainEvent.prototype.dispatch = originalDispatch;
  };
}

/**
 * Provider-komponent som ger tillgång till EventBus i applikationen
 * och konfigurerar kopplingen mellan domänhändelser och EventBus
 */
export function EventBusProvider({ eventBus, children }: EventBusProviderProps) {
  // Konfigurera kopplingen mellan DomainEvent och EventBus vid mount
  // Återställ vid unmount
  useEffect(() => {
    const cleanup = setupDomainEventDispatcher(eventBus);
    return cleanup;
  }, [eventBus]);
  
  return (
    <EventBusContext.Provider value={eventBus}>
      {children}
    </EventBusContext.Provider>
  );
}

/**
 * Skapar en EventBusProvider med den angivna EventBus-instansen
 */
export function createEventBusProvider(eventBus: EventBus) {
  return function CustomEventBusProvider({ children }: { children: ReactNode }) {
    return (
      <EventBusProvider eventBus={eventBus}>
        {children}
      </EventBusProvider>
    );
  };
} 