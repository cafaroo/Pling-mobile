/**
 * TeamMemberRoleChangedEvent: Domänhändelse som utlöses när en medlems roll ändras i ett team
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

export interface TeamMemberRoleChangedEventProps {
  teamId: string | UniqueId;
  userId: string | UniqueId;
  oldRole: string;
  newRole: string;
  changedAt: Date;
}

export class TeamMemberRoleChangedEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly eventType: string = 'TeamMemberRoleChangedEvent';
  public readonly aggregateId: string;
  public readonly occurredAt: Date;
  public readonly data: {
    teamId: string;
    userId: string;
    oldRole: string;
    newRole: string;
    changedAt: string;
  };

  // Direkta properties för testkompatibilitet
  public readonly teamId: string;
  public readonly userId: string;
  public readonly oldRole: string;
  public readonly newRole: string;
  public readonly changedAt: string;

  constructor(props: TeamMemberRoleChangedEventProps) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    
    // Säkerställ att aggregateId alltid är en sträng
    this.aggregateId = props.teamId && typeof props.teamId === 'object' && 'toString' in props.teamId
      ? props.teamId.toString()
      : String(props.teamId);
    
    this.data = {
      teamId: props.teamId && typeof props.teamId === 'object' && 'toString' in props.teamId
        ? props.teamId.toString()
        : String(props.teamId),
      userId: props.userId && typeof props.userId === 'object' && 'toString' in props.userId
        ? props.userId.toString()
        : String(props.userId),
      oldRole: props.oldRole || '',
      newRole: props.newRole || '',
      changedAt: props.changedAt ? props.changedAt.toISOString() : new Date().toISOString()
    };
    
    // Direkta properties för testkompatibilitet
    this.teamId = this.data.teamId;
    this.userId = this.data.userId;
    this.oldRole = this.data.oldRole;
    this.newRole = this.data.newRole;
    this.changedAt = this.data.changedAt;
  }
  
  /**
   * Hjälpfunktion för säker toString-konvertering
   */
  private safeToString(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    
    try {
      if (typeof value === 'string') {
        return value;
      } else if (typeof value === 'object' && value !== null) {
        if (typeof value.toString === 'function') {
          return value.toString();
        }
      }
      return String(value);
    } catch (error) {
      console.error('Error i TeamMemberRoleChangedEvent.safeToString:', error);
      return '';
    }
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