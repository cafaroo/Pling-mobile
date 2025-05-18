/**
 * TeamMemberJoinedEvent: Domänhändelse som utlöses när en medlem går med i ett team
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/domain/UniqueId';

export interface TeamMemberJoinedEventProps {
  teamId: UniqueId;
  userId: UniqueId;
  role: string;
  joinedAt: Date;
}

export class TeamMemberJoinedEvent implements IDomainEvent {
  public readonly eventType: string = 'TeamMemberJoinedEvent';
  public readonly aggregateId: string;
  public readonly data: {
    teamId: string;
    userId: string;
    role: string;
    joinedAt: string;
  };
  public readonly dateTimeOccurred: Date;

  constructor(props: TeamMemberJoinedEventProps) {
    this.dateTimeOccurred = new Date();
    this.aggregateId = props.teamId.toString();
    this.data = {
      teamId: props.teamId.toString(),
      userId: props.userId.toString(),
      role: props.role,
      joinedAt: props.joinedAt.toISOString()
    };
  }
  
  /**
   * Returnerar event-data
   */
  public getEventData(): {
    teamId: string;
    userId: string;
    role: string;
    joinedAt: string;
  } {
    return this.data;
  }
}

export default TeamMemberJoinedEvent; 