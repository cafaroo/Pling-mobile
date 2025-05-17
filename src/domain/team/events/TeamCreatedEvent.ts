/**
 * TeamCreatedEvent
 * 
 * Domänhändelse som representerar att ett team har skapats
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface TeamCreatedEventData {
  teamId: string;
  name: string;
  ownerId: string;
  organizationId: string;
  metadata?: Record<string, any>;
}

export class TeamCreatedEvent implements IDomainEvent {
  public readonly eventName: string = 'TeamCreatedEvent';
  public readonly name: string = 'TeamCreatedEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: string;
  public readonly name: string;
  public readonly ownerId: string;
  public readonly organizationId: string;
  public readonly metadata?: Record<string, any>;

  constructor(data: TeamCreatedEventData) {
    this.dateTimeOccurred = new Date();
    this.teamId = data.teamId;
    this.name = data.name;
    this.ownerId = data.ownerId;
    this.organizationId = data.organizationId;
    this.metadata = data.metadata;
  }
} 