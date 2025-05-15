import { UserTeamJoined } from '@/domain/user/events/UserEvent';
import { BaseEventHandler } from './BaseEventHandler';
import { Result } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Hanterar UserTeamJoined events
 * 
 * När en användare ansluter till ett team utför denna handler:
 * 1. Uppdaterar användarens teamstatistik
 * 2. Synkroniserar permissions för teammedlemskap
 */
export class UserTeamJoinedHandler extends BaseEventHandler<UserTeamJoined> {
  constructor(
    private userRepository: UserRepository,
    private teamRepository: TeamRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för UserTeamJoined
   */
  protected get eventType(): string {
    return 'UserTeamJoined';
  }
  
  /**
   * Hanterar ett UserTeamJoined event
   * @param event UserTeamJoined event att processa
   */
  protected async processEvent(event: UserTeamJoined): Promise<Result<void>> {
    try {
      // 1. Hämta användaren
      const userResult = await this.userRepository.findById(event.userId);
      if (userResult.isErr()) {
        return Result.fail(`Kunde inte hitta användaren: ${userResult.error}`);
      }
      
      const user = userResult.value;
      
      // 2. Hämta teamet
      const teamId = new UniqueId(event.teamId);
      const teamResult = await this.teamRepository.findById(teamId);
      if (teamResult.isErr()) {
        return Result.fail(`Kunde inte hitta teamet: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      // 3. Uppdatera användarens statistik
      if (user.hasStatistics()) {
        const stats = user.getStatistics();
        if (stats) {
          stats.joinedTeams = (stats.joinedTeams || 0) + 1;
          user.updateStatistics(stats);
        }
      }
      
      // 4. Säkerställ att användaren har rätt teammedlemskap
      if (!user.isInTeam(teamId)) {
        // Lägg till teamet i användarens teammemberships om det inte redan finns
        user.addTeamMembership(teamId);
      }
      
      // 5. Spara uppdaterad användare
      await this.userRepository.save(user);
      
      // Loggning för att visualisera att handlern körs
      console.log(`UserTeamJoinedHandler: Användare ${event.userId} anslöt till team ${event.teamId}`);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Fel vid hantering av UserTeamJoined event: ${error}`);
    }
  }
} 