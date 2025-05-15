import { MemberLeft } from '@/domain/team/events/TeamEvents';
import { BaseEventHandler } from './BaseEventHandler';
import { Result } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';

/**
 * Hanterar MemberLeft events
 * 
 * När en medlem lämnar ett team utför denna handler följande:
 * 1. Uppdaterar användarens information om teammedlemskap
 * 2. Uppdaterar teamets statistik med information om att en medlem har lämnat
 */
export class MemberLeftHandler extends BaseEventHandler<MemberLeft> {
  constructor(
    private teamRepository: TeamRepository,
    private userRepository: UserRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för MemberLeft
   */
  protected get eventType(): string {
    return 'MemberLeft';
  }
  
  /**
   * Hanterar ett MemberLeft event
   * @param event MemberLeft event att hantera
   */
  protected async processEvent(event: MemberLeft): Promise<Result<void>> {
    try {
      // 1. Uppdatera användarens information om teammedlemskap
      const userResult = await this.userRepository.findById(event.userId);
      if (userResult.isFailure) {
        return Result.fail(`Kunde inte hitta användaren: ${userResult.error}`);
      }
      
      const user = userResult.getValue();
      user.removeTeamMembership(event.teamId);
      await this.userRepository.save(user);
      
      // 2. Uppdatera teamets statistik
      const teamResult = await this.teamRepository.findById(event.teamId);
      if (teamResult.isFailure) {
        return Result.fail(`Kunde inte hitta teamet: ${teamResult.error}`);
      }
      
      const team = teamResult.getValue();
      // Uppdatera teamets statistik med information om att en medlem har lämnat
      const stats = team.getStatistics();
      if (stats) {
        stats.decrementMemberCount();
        team.updateStatistics(stats);
        await this.teamRepository.save(team);
      }
      
      // Loggning för att visualisera att handlern körs
      console.log(`MemberLeftHandler: Användare ${event.userId} lämnade team ${event.teamId}`);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Fel vid hantering av MemberLeft event: ${error}`);
    }
  }
} 