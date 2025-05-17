/**
 * TeamMemberJoinedEvent: Domänhändelse som utlöses när en medlem går med i ett team
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface TeamMemberJoinedEventData {
  teamId: string;
  userId: string;
  roles: string[];
  metadata?: Record<string, any>;
}

export class TeamMemberJoinedEvent implements IDomainEvent {
  public readonly eventName: string = 'TeamMemberJoinedEvent';
  public readonly name: string = 'TeamMemberJoinedEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: string;
  public readonly userId: string;
  public readonly roles: string[];
  public readonly metadata?: Record<string, any>;

  constructor(data: TeamMemberJoinedEventData) {
    this.dateTimeOccurred = new Date();
    this.teamId = data.teamId;
    this.userId = data.userId;
    this.roles = data.roles;
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
      userId: this.userId,
      roles: this.roles,
      metadata: this.metadata
    };
  }
}

export default TeamMemberJoinedEvent; 