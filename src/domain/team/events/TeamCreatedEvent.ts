import { BaseTeamEvent } from './BaseTeamEvent';
import { Team } from '../entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * TeamCreatedEvent
 * 
 * Domänhändelse som publiceras när ett nytt team har skapats.
 * Innehåller information om det nya teamet och dess ägare.
 */
export class TeamCreatedEvent extends BaseTeamEvent {
  /**
   * Skapar en ny TeamCreatedEvent
   * 
   * @param team - Team-objekt eller ID för det nya teamet
   * @param ownerId - ID för användaren som äger teamet
   * @param name - Teamets namn (om bara ID skickades in)
   */
  constructor(
    team: Team | UniqueId,
    ownerId: UniqueId,
    name?: string
  ) {
    const additionalData: Record<string, any> = {
      ownerId: ownerId.toString(),
    };
    
    // Om name angetts explicit (och team är ett ID), lägg till det i eventdata
    if (name) {
      additionalData.teamName = name;
    }
    
    super('TeamCreatedEvent', team, additionalData);
  }
} 