import { BaseTeamEvent } from './BaseTeamEvent';
import { Team } from '../entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * TeamMemberLeftEvent
 * 
 * Domänhändelse som publiceras när en medlem lämnar ett team.
 * Innehåller information om teamet och medlemmen som lämnat.
 */
export class TeamMemberLeftEvent extends BaseTeamEvent {
  /**
   * Skapar en ny TeamMemberLeftEvent
   * 
   * @param team - Team-objekt eller ID för teamet
   * @param userId - ID för användaren som lämnat teamet
   */
  constructor(
    team: Team | UniqueId,
    userId: UniqueId
  ) {
    super('TeamMemberLeftEvent', team, {
      userId: userId.toString()
    });
  }
} 