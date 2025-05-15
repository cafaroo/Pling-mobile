import { UserStatusChanged } from '@/domain/user/events/UserEvent';
import { BaseEventHandler } from './BaseEventHandler';
import { Result } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

/**
 * Hanterar UserStatusChanged events
 * 
 * När en användares status ändras utför denna handler:
 * 1. Uppdaterar relevanta team och sätter medlemsstatus
 * 2. Utför specifika åtgärder beroende på statusändringen
 */
export class UserStatusChangedHandler extends BaseEventHandler<UserStatusChanged> {
  constructor(
    private userRepository: UserRepository,
    private teamRepository: TeamRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för UserStatusChanged
   */
  protected get eventType(): string {
    return 'UserStatusChanged';
  }
  
  /**
   * Hanterar ett UserStatusChanged event
   * @param event UserStatusChanged event att processa
   */
  protected async processEvent(event: UserStatusChanged): Promise<Result<void>> {
    try {
      // 1. Hämta användaren
      const userResult = await this.userRepository.findById(event.userId);
      if (userResult.isErr()) {
        return Result.fail(`Kunde inte hitta användaren: ${userResult.error}`);
      }
      
      const user = userResult.value;
      
      // 2. Hantera specifika statusändringar
      if (event.newStatus === 'inactive' || event.newStatus === 'suspended') {
        // Om användaren blir inaktiv eller avstängd
        // 2.1 Hämta användarens team
        const teamsResult = await this.teamRepository.findByMemberId(event.userId);
        if (teamsResult.isOk()) {
          const teams = teamsResult.value;
          
          // 2.2 Uppdatera medlemsstatus i alla team
          for (const team of teams) {
            team.updateMemberStatus(event.userId, event.newStatus);
            await this.teamRepository.save(team);
          }
        }
        
        // 2.3 Logg för auditspårning
        console.log(`UserStatusChangedHandler: Användare ${event.userId} statusändring från ${event.oldStatus} till ${event.newStatus}. Team-medlemskap uppdaterade.`);
      }
      
      // 3. Om användaren återaktiveras
      if (event.oldStatus === 'inactive' && event.newStatus === 'active') {
        // Uppdatera senaste inloggningstid
        if (user.hasStatistics()) {
          const stats = user.getStatistics();
          if (stats) {
            stats.lastLogin = new Date();
            stats.totalLogins = (stats.totalLogins || 0) + 1;
            user.updateStatistics(stats);
            await this.userRepository.save(user);
          }
        }
        
        // 3.1 Logg för auditspårning
        console.log(`UserStatusChangedHandler: Användare ${event.userId} återaktiverad. Statistik uppdaterad.`);
      }
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Fel vid hantering av UserStatusChanged event: ${error}`);
    }
  }
} 