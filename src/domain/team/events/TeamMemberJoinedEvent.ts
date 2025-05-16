import { BaseTeamEvent } from './BaseTeamEvent';
import { Team } from '../entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRole } from '../value-objects/TeamRole';

/**
 * TeamMemberJoinedEvent
 * 
 * Domänhändelse som publiceras när en användare blir medlem i ett team.
 * Innehåller information om teamet, användaren och användarens roll.
 */
export class TeamMemberJoinedEvent extends BaseTeamEvent {
  /**
   * Skapar en ny TeamMemberJoinedEvent
   * 
   * @param team - Team-objekt eller ID för teamet
   * @param userId - ID för användaren som anslutit till teamet
   * @param role - Användarens roll i teamet
   */
  constructor(
    team: Team | UniqueId,
    userId: UniqueId,
    role: TeamRole
  ) {
    super('TeamMemberJoinedEvent', team, {
      userId: userId.toString(),
      role: role
    });
  }
} 