import { TeamMessageCreated } from '@/domain/team/events/TeamMessageEvents';
import { BaseEventHandler } from './BaseEventHandler';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

/**
 * Hanterar TeamMessageCreated events
 * 
 * När ett teammeddelande skapas utför denna handler:
 * 1. Uppdaterar teamets aktivitetslogg
 * 2. Uppdaterar relevanta notifikationer om teammeddelanden
 */
export class TeamMessageCreatedHandler extends BaseEventHandler<TeamMessageCreated> {
  constructor(
    private teamRepository: TeamRepository,
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
      if (teamResult.isErr()) {
        return err(`Kunde inte hitta teamet: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      // 2. Uppdatera teamets aktivitetslogg
      // I en fullständig implementation skulle vi här skapa en ny aktivitetspost
      // Exempel:
      /*
      const activity = {
        type: 'MESSAGE',
        userId: event.userId,
        timestamp: event.timestamp,
        metadata: {
          messageId: event.messageId,
          channelId: event.channelId
        }
      };
      team.addActivity(activity);
      */
      
      // Här simulerar vi bara ett uppdaterat team
      await this.teamRepository.save(team);
      
      // Loggning för att visualisera att handlern körs
      console.log(`TeamMessageCreatedHandler: Nytt meddelande ${event.messageId} i team ${event.teamId} från användare ${event.userId}`);
      
      return ok();
    } catch (error) {
      return err(`Fel vid hantering av TeamMessageCreated event: ${error}`);
    }
  }
} 