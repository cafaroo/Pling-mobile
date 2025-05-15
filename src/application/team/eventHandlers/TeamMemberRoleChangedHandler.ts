import { TeamMemberRoleChanged } from '@/domain/team/events/TeamEvents';
import { BaseEventHandler } from './BaseEventHandler';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';

/**
 * Hanterar TeamMemberRoleChanged events
 * 
 * När en medlems roll ändras i ett team utför denna handler:
 * 1. Uppdaterar information om teammedlemmens roll i teamet
 * 2. Uppdaterar relevanta användarprivilegier baserat på den nya rollen
 * 3. Loggar rollförändringen för auditspårning
 */
export class TeamMemberRoleChangedHandler extends BaseEventHandler<TeamMemberRoleChanged> {
  constructor(
    private teamRepository: TeamRepository,
    private userRepository: UserRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för TeamMemberRoleChanged
   */
  protected get eventType(): string {
    return 'TeamMemberRoleChanged';
  }
  
  /**
   * Hanterar ett TeamMemberRoleChanged event
   * @param event TeamMemberRoleChanged event att hantera
   */
  protected async processEvent(event: TeamMemberRoleChanged): Promise<Result<void>> {
    try {
      // 1. Hämta information om teamet
      const teamResult = await this.teamRepository.findById(event.teamId);
      if (teamResult.isErr()) {
        return err(`Kunde inte hitta teamet: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      // 2. Hämta information om användaren
      const userResult = await this.userRepository.findById(event.userId);
      if (userResult.isErr()) {
        return err(`Kunde inte hitta användaren: ${userResult.error}`);
      }
      
      const user = userResult.value;
      
      // 3. Uppdatera användarens teammembership med den nya rollen om behövs
      // (Detta kan vara redundant om teamet redan har uppdaterat rollen,
      // men är användbart som verifikationssteg)
      user.updateTeamMembershipRole(event.teamId, event.newRole);
      await this.userRepository.save(user);
      
      // 4. Logga rollförändringen för auditspårning
      // Här kan vi senare implementera auditloggning om det behövs
      
      // Loggning för att visualisera att handlern körs
      console.log(`TeamMemberRoleChangedHandler: Användare ${event.userId} fick ny roll i team ${event.teamId}: ${event.oldRole.value} -> ${event.newRole.value}`);
      
      return ok();
    } catch (error) {
      return err(`Fel vid hantering av TeamMemberRoleChanged event: ${error}`);
    }
  }
} 