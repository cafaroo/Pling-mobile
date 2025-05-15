import { BaseTeamEvent } from './BaseTeamEvent';
import { Team } from '../entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRole } from '../value-objects/TeamRole';

/**
 * TeamMemberRoleChangedEvent
 * 
 * Domänhändelse som publiceras när en medlems roll i ett team har ändrats.
 * Innehåller information om teamet, medlemmen, och rollförändringen.
 */
export class TeamMemberRoleChangedEvent extends BaseTeamEvent {
  /**
   * Skapar en ny TeamMemberRoleChangedEvent
   * 
   * @param team - Team-objekt eller ID för teamet
   * @param userId - ID för användaren vars roll ändrats
   * @param oldRole - Användarens tidigare roll
   * @param newRole - Användarens nya roll
   */
  constructor(
    team: Team | UniqueId,
    userId: UniqueId,
    oldRole: TeamRole,
    newRole: TeamRole
  ) {
    super('TeamMemberRoleChangedEvent', team, {
      userId: userId.toString(),
      oldRole: oldRole,
      newRole: newRole
    });
  }
} 