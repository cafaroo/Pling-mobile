import { TeamCreated } from '@/domain/team/events/TeamEvents';
import { BaseEventHandler } from './BaseEventHandler';
import { Result } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';

/**
 * Hanterar TeamCreated events
 * 
 * När ett team skapas utför denna handler nödvändiga sidoeffekter:
 * 1. Uppdaterar användaren med information om att de har skapat ett team
 * 2. Initierar teamets statistik och aktivitetslogg
 */
export class TeamCreatedHandler extends BaseEventHandler<TeamCreated> {
  constructor(
    private teamRepository: TeamRepository,
    private userRepository: UserRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för TeamCreated
   */
  protected get eventType(): string {
    return 'TeamCreated';
  }
  
  /**
   * Hanterar ett TeamCreated event
   * @param event TeamCreated event att processa
   */
  protected async processEvent(event: TeamCreated): Promise<Result<void>> {
    try {
      // 1. Uppdatera användarens information om teammedlemskap
      const userResult = await this.userRepository.findById(event.ownerId);
      if (userResult.isFailure) {
        return Result.fail(`Kunde inte hitta teamägaren: ${userResult.error}`);
      }
      
      const user = userResult.getValue();
      user.addTeamMembership(event.teamId);
      await this.userRepository.save(user);
      
      // 2. Initiera teamets statistik (om detta inte redan sker i TeamRepository)
      const teamResult = await this.teamRepository.findById(event.teamId);
      if (teamResult.isFailure) {
        return Result.fail(`Kunde inte hitta nyskapat team: ${teamResult.error}`);
      }
      
      const team = teamResult.getValue();
      // Initiera teamets statistik om det behövs
      // Detta kan vara specifikt för din applikation
      
      // Loggning för att visualisera att handlern körs
      console.log(`TeamCreatedHandler: Team "${event.name}" (${event.teamId}) skapades av användare ${event.ownerId}`);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Fel vid hantering av TeamCreated event: ${error}`);
    }
  }
} 