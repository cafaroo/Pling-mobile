import { MemberJoined } from '@/domain/team/events/TeamEvents';
import { BaseEventHandler } from './BaseEventHandler';
import { Result } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';

/**
 * Hanterar MemberJoined events
 * 
 * När en användare går med i ett team utför denna handler följande sidoeffekter:
 * 1. Uppdaterar användaren med information om teammedlemskapet
 * 2. Uppdaterar teamets statistik
 * 3. Skapar en aktivitet i teamet om den nya medlemmen
 */
export class MemberJoinedHandler extends BaseEventHandler<MemberJoined> {
  constructor(
    private teamRepository: TeamRepository,
    private userRepository: UserRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för MemberJoined
   */
  protected get eventType(): string {
    return 'MemberJoined';
  }
  
  /**
   * Hanterar ett MemberJoined event
   * @param event MemberJoined event att processa
   */
  protected async processEvent(event: MemberJoined): Promise<Result<void>> {
    try {
      // 1. Uppdatera användarens information om teammedlemskap
      const userResult = await this.userRepository.findById(event.userId);
      if (userResult.isErr()) {
        return Result.fail(`Kunde inte hitta användaren: ${userResult.error}`);
      }
      
      const user = userResult.value;
      user.addTeamMembership(event.teamId);
      await this.userRepository.save(user);
      
      // 2. Uppdatera teamets statistik
      const teamResult = await this.teamRepository.findById(event.teamId);
      if (teamResult.isErr()) {
        return Result.fail(`Kunde inte hitta teamet: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      // 3. Skapa en aktivitetspost för teamet om den nya medlemmen
      // Detta kan vara att lägga till en aktivitetspost om att en ny medlem gått med
      team.addTeamActivity({
        type: 'member_joined',
        userId: event.userId.toString(),
        teamId: event.teamId.toString(),
        timestamp: new Date(),
        data: {
          role: event.role.value
        }
      });
      
      await this.teamRepository.save(team);
      
      // Loggning för att visualisera att handlern körs
      console.log(`MemberJoinedHandler: Användare ${event.userId} gick med i team ${event.teamId} med rollen ${event.role.value}`);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Fel vid hantering av MemberJoined event: ${error}`);
    }
  }
} 