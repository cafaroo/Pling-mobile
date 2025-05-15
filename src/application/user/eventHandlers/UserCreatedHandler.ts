import { UserCreated } from '@/domain/user/events/UserEvent';
import { BaseEventHandler } from './BaseEventHandler';
import { Result } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';

/**
 * Hanterar UserCreated events
 * 
 * När en användare skapas utför denna handler nödvändiga sidoeffekter:
 * 1. Initierar användarens statistik och grundläggande inställningar
 * 2. Uppdaterar organisationsmedlemskap om användaren tillhör en organisation
 */
export class UserCreatedHandler extends BaseEventHandler<UserCreated> {
  constructor(
    private userRepository: UserRepository,
    private teamRepository: TeamRepository,
    private organizationRepository: OrganizationRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för UserCreated
   */
  protected get eventType(): string {
    return 'UserCreated';
  }
  
  /**
   * Hanterar ett UserCreated event
   * @param event UserCreated event att processa
   */
  protected async processEvent(event: UserCreated): Promise<Result<void>> {
    try {
      // 1. Hämta den skapade användaren
      const userResult = await this.userRepository.findById(event.userId);
      if (userResult.isFailure) {
        return Result.fail(`Kunde inte hitta den skapade användaren: ${userResult.error}`);
      }
      
      const user = userResult.getValue();
      
      // 2. Initiera användarstatistik om inte redan gjorts
      if (!user.hasStatistics()) {
        user.initializeStatistics({
          totalLogins: 1,
          lastLogin: new Date(),
          createdTeams: 0,
          joinedTeams: 0,
          completedTasks: 0
        });
      }
      
      // 3. Uppdatera användarens privata inställningar med standardvärden om de saknas
      if (!user.hasPrivacySettings()) {
        user.updatePrivacySettings({
          shareProfile: false,
          allowDataCollection: true,
          visibleToTeamMembers: true
        });
      }
      
      // 4. Spara uppdateringar till användaren
      await this.userRepository.save(user);
      
      // Loggning för att visualisera att handlern körs
      console.log(`UserCreatedHandler: Användare "${event.name}" (${event.userId}) skapades med email ${event.email}`);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Fel vid hantering av UserCreated event: ${error}`);
    }
  }
} 