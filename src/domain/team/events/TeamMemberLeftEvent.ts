/**
 * TeamMemberLeftEvent: Domänhändelse som utlöses när en medlem lämnar ett team
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/domain/UniqueId';

export interface TeamMemberLeftEventProps {
  teamId: UniqueId;
  userId: UniqueId;
  removedAt: Date;
}

export class TeamMemberLeftEvent implements IDomainEvent {
  public readonly eventType: string = 'TeamMemberLeftEvent';
  public readonly aggregateId: string;
  public readonly data: {
    teamId: string;
    userId: string;
    removedAt: string;
  };
  public readonly dateTimeOccurred: Date;

  constructor(props: TeamMemberLeftEventProps) {
    this.dateTimeOccurred = new Date();
    this.aggregateId = props.teamId.toString();
    this.data = {
      teamId: props.teamId.toString(),
      userId: props.userId.toString(),
      removedAt: props.removedAt.toISOString()
    };
  }
  
  /**
   * Returnerar event-data
   */
  public getEventData(): {
    teamId: string;
    userId: string;
    removedAt: string;
  } {
    return this.data;
  }
}

export default TeamMemberLeftEvent; 