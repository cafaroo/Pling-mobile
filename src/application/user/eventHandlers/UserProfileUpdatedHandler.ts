import { UserProfileUpdated } from '@/domain/user/events/UserEvent';
import { BaseEventHandler } from './BaseEventHandler';
import { Result } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

/**
 * Hanterar UserProfileUpdated events
 * 
 * När en användares profil uppdateras utför denna handler:
 * 1. Uppdaterar relaterade team-medlemskap med den nya profilinformationen
 * 2. Synkroniserar profilinformation över alla användarens sammanhang
 */
export class UserProfileUpdatedHandler extends BaseEventHandler<UserProfileUpdated> {
  constructor(
    private userRepository: UserRepository,
    private teamRepository: TeamRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för UserProfileUpdated
   */
  protected get eventType(): string {
    return 'UserProfileUpdated';
  }
  
  /**
   * Hanterar ett UserProfileUpdated event
   * @param event UserProfileUpdated event att processa
   */
  protected async processEvent(event: UserProfileUpdated): Promise<Result<void>> {
    try {
      // 1. Hämta användaren
      const userResult = await this.userRepository.findById(event.userId);
      if (userResult.isErr()) {
        return Result.fail(`Kunde inte hitta användaren: ${userResult.error}`);
      }
      
      const user = userResult.value;
      
      // 2. Hämta användarens team
      const teamsResult = await this.teamRepository.findByMemberId(event.userId);
      if (teamsResult.isErr()) {
        // Fel vid hämtning av team är inte kritiskt, så vi fortsätter
        console.warn(`Kunde inte hämta användarens team: ${teamsResult.error}`);
      } else {
        // 3. Uppdatera användarprofilen i team om det behövs
        const teams = teamsResult.value;
        // Detta skulle kunna vara en batch-operation i en verklig implementation
        for (const team of teams) {
          if (team.shouldUpdateMemberProfile(event.userId)) {
            const relevantProfileData = {
              displayName: event.profileData.displayName,
              avatarUrl: event.profileData.avatarUrl,
              title: event.profileData.title
            };
            
            team.updateMemberProfile(event.userId, relevantProfileData);
            await this.teamRepository.save(team);
          }
        }
      }
      
      // Loggning för att visualisera att handlern körs
      console.log(`UserProfileUpdatedHandler: Profil uppdaterad för användare ${event.userId}`);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Fel vid hantering av UserProfileUpdated event: ${error}`);
    }
  }
} 