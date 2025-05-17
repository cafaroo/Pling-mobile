/**
 * TeamMemberLeftEvent: Domänhändelse som utlöses när en medlem lämnar ett team
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface TeamMemberLeftEventData {
  teamId: string;
  userId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export class TeamMemberLeftEvent implements IDomainEvent {
  public readonly eventName: string = 'TeamMemberLeftEvent';
  public readonly name: string = 'TeamMemberLeftEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: string;
  public readonly userId: string;
  public readonly reason?: string;
  public readonly metadata?: Record<string, any>;

  constructor(data: TeamMemberLeftEventData) {
    this.dateTimeOccurred = new Date();
    this.teamId = data.teamId;
    this.userId = data.userId;
    this.reason = data.reason;
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
      reason: this.reason,
      metadata: this.metadata
    };
  }
}

export default TeamMemberLeftEvent; 