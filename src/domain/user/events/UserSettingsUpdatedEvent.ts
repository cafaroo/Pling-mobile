import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UserSettings } from '../entities/UserSettings';

export interface UserSettingsUpdatedEventProps {
  userId: string | UniqueId;
  settings: UserSettings | Record<string, any>;
  updatedAt?: Date;
}

/**
 * UserSettingsUpdatedEvent
 * 
 * Domänhändelse som publiceras när en användares inställningar har uppdaterats.
 * Innehåller information om de nya inställningarna.
 */
export class UserSettingsUpdatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly userId: UniqueId;
  public readonly settings: Record<string, any>;
  public readonly updatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'UserSettingsUpdatedEvent';

  /**
   * Skapar en ny UserSettingsUpdatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: UserSettingsUpdatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const userId = UniqueId.from(props.userId);
    const updatedAt = props.updatedAt || new Date();
    
    // Konvertera settings till ett JSON-objekt om det behövs
    const settingsObj = props.settings instanceof UserSettings
      ? props.settings.toJSON()
      : props.settings;
    
    // Skapa event med payload
    super({
      name: 'UserSettingsUpdatedEvent',
      payload: {
        userId: userId.toString(),
        settings: settingsObj,
        updatedAt: updatedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = userId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.userId = userId;
    this.settings = settingsObj;
    this.updatedAt = updatedAt;
  }
} 