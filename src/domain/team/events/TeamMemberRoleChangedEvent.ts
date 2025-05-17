/**
 * TeamMemberRoleChangedEvent: Domänhändelse som utlöses när en medlems roll ändras i ett team
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface TeamMemberRoleChangedEventData {
  teamId: string;
  userId: string;
  oldRoles: string[];
  newRoles: string[];
  changedBy?: string;
  metadata?: Record<string, any>;
}

export class TeamMemberRoleChangedEvent implements IDomainEvent {
  public readonly eventName: string = 'TeamMemberRoleChangedEvent';
  public readonly name: string = 'TeamMemberRoleChangedEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: string;
  public readonly userId: string;
  public readonly oldRoles: string[];
  public readonly newRoles: string[];
  public readonly changedBy?: string;
  public readonly metadata?: Record<string, any>;

  constructor(data: TeamMemberRoleChangedEventData) {
    this.dateTimeOccurred = new Date();
    this.teamId = data.teamId;
    this.userId = data.userId;
    this.oldRoles = data.oldRoles;
    this.newRoles = data.newRoles;
    this.changedBy = data.changedBy;
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
      oldRoles: this.oldRoles,
      newRoles: this.newRoles,
      changedBy: this.changedBy,
      metadata: this.metadata
    };
  }
}

export default TeamMemberRoleChangedEvent; 