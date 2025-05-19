import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { IDomainEventSubscriber } from '@/shared/domain/events/IDomainEventSubscriber';
import { Result } from '@/shared/core/Result';

/**
 * Abstrakt basklass för alla användar-eventhanterare
 * 
 * Implementerar IDomainEventSubscriber och tillhandahåller grundläggande
 * struktur och felhantering för alla eventhanterare.
 */
export abstract class BaseEventHandler<T extends IDomainEvent> implements IDomainEventSubscriber<IDomainEvent> {
  /**
   * Huvudmetod som anropas av eventpublisher
   * Konverterar event till rätt typ och anropar processEvent
   * Fångar och loggar eventuella fel
   */
  public async handleEvent(event: IDomainEvent): Promise<void> {
    try {
      // Loggning för felsökning
      console.log('BaseEventHandler.handleEvent:', {
        expectedEventType: this.eventType,
        actualEventType: event.eventType,
        actualName: (event as any).name, // för bakåtkompatibilitet med gamla test
        matchEventType: event.eventType === this.eventType,
        matchName: (event as any).name === this.eventType
      });
      
      // Kontrollera att eventet är av rätt typ genom att jämföra eventType
      // Vi kollar både eventType och name för bakåtkompatibilitet
      if (event.eventType === this.eventType || (event as any).name === this.eventType) {
        // Cast eventet till rätt typ och anropa processEvent
        const result = await this.processEvent(event as T);
        
        if (result.isFailure) {
          console.error(`Fel vid hantering av ${this.eventType}:`, result.error);
        }
      } else {
        console.warn(`Event skippat: ${event.eventType} matchar inte ${this.eventType}`);
      }
    } catch (error) {
      console.error(`Oväntat fel vid hantering av ${this.eventType}:`, error);
    }
  }
  
  /**
   * Abstrakt metod som hanterar den specifika eventtypen
   * Måste implementeras av alla konkreta eventhanterare
   */
  protected abstract processEvent(event: T): Promise<Result<void>>;
  
  /**
   * Typ av event som denna handler hanterar
   * Måste definieras av alla konkreta eventhanterare
   */
  protected abstract get eventType(): string;
} 