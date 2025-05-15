import { TeamMessageCreated } from '@/domain/team/events/TeamMessageCreated';
import { BaseEventHandler } from './BaseEventHandler';
import { Result } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

/**
 * Hanterar TeamMessageCreated events
 * 
 * När ett nytt meddelande skapas i ett team utför denna handler:
 * 1. Uppdaterar teamets senaste aktivitet
 * 2. Hanterar omnämnanden (mentions) i meddelandet
 * 3. Uppdaterar statistik för teamkommunikation
 */
export class TeamMessageCreatedHandler extends BaseEventHandler<TeamMessageCreated> {
  constructor(
    private teamRepository: TeamRepository
  ) {
    super();
  }
  
  /**
   * Returnerar eventtypen för TeamMessageCreated
   */
  protected get eventType(): string {
    return 'TeamMessageCreated';
  }
  
  /**
   * Hanterar ett TeamMessageCreated event
   * @param event TeamMessageCreated event att hantera
   */
  protected async processEvent(event: TeamMessageCreated): Promise<Result<void>> {
    try {
      // 1. Hämta information om teamet
      const teamResult = await this.teamRepository.findById(event.teamId);
      if (teamResult.isFailure) {
        return Result.fail(`Kunde inte hitta teamet: ${teamResult.error}`);
      }
      
      const team = teamResult.getValue();
      
      // 2. Uppdatera teamets senaste aktivitetstid
      team.updateLastActivity(event.createdAt);
      
      // 3. Uppdatera teamets statistik
      const stats = team.getStatistics();
      if (stats) {
        stats.incrementMessageCount();
        
        // Om meddelandet har bilagor, uppdatera bilagestatistik
        if (event.attachments && event.attachments.length > 0) {
          stats.incrementAttachmentCount(event.attachments.length);
        }
        
        team.updateStatistics(stats);
      }
      
      // 4. Spara uppdaterat team
      await this.teamRepository.save(team);
      
      // 5. Hantera eventuella omnämnanden
      if (event.mentions && event.mentions.length > 0) {
        // Här skulle vi kunna skicka notifikationer eller göra andra åtgärder
        // för de användare som nämnts i meddelandet
        
        // Exempel på loggning av mentions
        event.mentions.forEach(mention => {
          console.log(`TeamMessageCreatedHandler: Användare ${mention.userId} omnämndes i meddelande ${event.messageId}`);
        });
      }
      
      // Loggning för att visualisera att handlern körs
      console.log(`TeamMessageCreatedHandler: Nytt meddelande ${event.messageId} skapades i team ${event.teamId} av användare ${event.senderId}`);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Fel vid hantering av TeamMessageCreated event: ${error}`);
    }
  }
} 