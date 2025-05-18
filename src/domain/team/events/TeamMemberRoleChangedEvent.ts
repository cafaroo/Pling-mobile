/**
 * TeamMemberRoleChangedEvent: Domänhändelse som utlöses när en medlems roll ändras i ett team
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/domain/UniqueId';

export interface TeamMemberRoleChangedEventProps {
  teamId: UniqueId;
  userId: UniqueId;
  oldRole: string;
  newRole: string;
  changedAt: Date;
}

export class TeamMemberRoleChangedEvent implements IDomainEvent {
  public readonly eventType: string = 'TeamMemberRoleChangedEvent';
  public readonly aggregateId: string;
  public readonly data: {
    teamId: string;
    userId: string;
    oldRole: string;
    newRole: string;
    changedAt: string;
  };
  public readonly dateTimeOccurred: Date;

  constructor(props: TeamMemberRoleChangedEventProps) {
    this.dateTimeOccurred = new Date();
    this.aggregateId = props.teamId.toString();
    this.data = {
      teamId: props.teamId.toString(),
      userId: props.userId.toString(),
      oldRole: props.oldRole,
      newRole: props.newRole,
      changedAt: props.changedAt.toISOString()
    };
  }
  
  /**
   * Returnerar event-data
   */
  public getEventData(): {
    teamId: string;
    userId: string;
    oldRole: string;
    newRole: string;
    changedAt: string;
  } {
    return this.data;
  }
}

export default TeamMemberRoleChangedEvent; 