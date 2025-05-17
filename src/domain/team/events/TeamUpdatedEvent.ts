/**
 * TeamUpdatedEvent: Domänhändelse som utlöses när ett team uppdateras
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface TeamUpdatedEventData {
  teamId: string;
  updatedFields: string[];
  metadata?: Record<string, any>;
}

export class TeamUpdatedEvent implements IDomainEvent {
  public readonly eventName: string = 'TeamUpdatedEvent';
  public readonly name: string = 'TeamUpdatedEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: string;
  public readonly updatedFields: string[];
  public readonly metadata?: Record<string, any>;

  constructor(data: TeamUpdatedEventData) {
    this.dateTimeOccurred = new Date();
    this.teamId = data.teamId;
    this.updatedFields = data.updatedFields;
    this.metadata = data.metadata;
  }

  /**
   * Hämta aggregatets ID
   */
  get aggregateId(): string {
    return this.teamId;
  }

  /**
   * Konvertera till ett enkelt objekt
   */
  toPlainObject(): Record<string, any> {
    return {
      eventName: this.eventName,
      name: this.name,
      dateTimeOccurred: this.dateTimeOccurred,
      teamId: this.teamId,
      updatedFields: this.updatedFields,
      metadata: this.metadata
    };
  }
}

export default TeamUpdatedEvent; 