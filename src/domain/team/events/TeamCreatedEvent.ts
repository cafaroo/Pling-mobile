/**
 * TeamCreatedEvent
 * 
 * Domänhändelse som representerar att ett team har skapats
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/domain/UniqueId';

export interface TeamCreatedEventProps {
  teamId: UniqueId;
  name: string;
  ownerId: UniqueId;
  createdAt: Date;
}

export class TeamCreatedEvent implements IDomainEvent {
  public readonly eventType: string = 'TeamCreatedEvent';
  public readonly aggregateId: string;
  public readonly data: {
    teamId: string;
    name: string;
    ownerId: string;
    createdAt: string;
  };
  public readonly dateTimeOccurred: Date;

  constructor(props: TeamCreatedEventProps) {
    this.dateTimeOccurred = new Date();
    this.aggregateId = props.teamId.toString();
    this.data = {
      teamId: props.teamId.toString(),
      name: props.name,
      ownerId: props.ownerId.toString(),
      createdAt: props.createdAt.toISOString()
    };
  }
  
  /**
   * Returnerar event-data
   */
  public getEventData(): {
    teamId: string;
    name: string;
    ownerId: string;
    createdAt: string;
  } {
    return this.data;
  }
} 