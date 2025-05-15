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
      // Kontrollera att eventet är av rätt typ genom att jämföra eventType
      if (event.eventType === this.eventType) {
        // Cast eventet till rätt typ och anropa processEvent
        const result = await this.processEvent(event as T);
        
        if (result.isFailure) {
          console.error(`Fel vid hantering av ${this.eventType}:`, result.error);
        }
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