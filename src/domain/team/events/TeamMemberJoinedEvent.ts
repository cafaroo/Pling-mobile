/**
 * TeamMemberJoinedEvent: Domänhändelse som utlöses när en medlem går med i ett team
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

export interface TeamMemberJoinedEventProps {
  teamId: string | UniqueId;
  userId: string | UniqueId;
  role: string;
  joinedAt: Date;
}

export class TeamMemberJoinedEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly eventType: string = 'TeamMemberJoinedEvent';
  public readonly aggregateId: string;
  public readonly occurredAt: Date;
  public readonly data: {
    teamId: string;
    userId: string;
    role: string;
    joinedAt: string;
  };

  // Direkta properties för testkompatibilitet
  public readonly teamId: string;
  public readonly userId: string;
  public readonly role: string;
  public readonly joinedAt: string;

  constructor(props: TeamMemberJoinedEventProps) {
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
      role: props.role,
      joinedAt: props.joinedAt ? props.joinedAt.toISOString() : new Date().toISOString()
    };

    // Direkta properties för testkompatibilitet
    this.teamId = this.data.teamId;
    this.userId = this.data.userId;
    this.role = this.data.role;
    this.joinedAt = this.data.joinedAt;
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
      console.error('Error i TeamMemberJoinedEvent.safeToString:', error);
      return '';
    }
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