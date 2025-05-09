import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { UseCase } from '@/application/core/UseCase';
import { TeamMessage, CreateTeamMessageProps } from '@/domain/team/entities/TeamMessage';
import { TeamMessageRepository } from '@/domain/team/repositories/TeamMessageRepository';
// Importera eventuella nödvändiga domänhändelser om de ska publiceras härifrån,
// t.ex. en specifik ThreadReplyCreatedEvent om den skiljer sig från TeamMessageCreated.

export interface CreateThreadReplyUseCaseProps {
  parentId: string; // ID för meddelandet som det svaras på
  teamId: string;   // Team-ID där svaret skapas
  senderId: string; // ID för användaren som skickar svaret
  content: string;
  // attachments och mentions kan läggas till här om de ska stödjas direkt i use caset
}

export class CreateThreadReplyUseCase implements UseCase<CreateThreadReplyUseCaseProps, Result<TeamMessage, string>> {
  constructor(
    private readonly teamMessageRepository: TeamMessageRepository
    // private readonly eventBus: EventBus // Om händelser publiceras här
  ) {}

  async execute(props: CreateThreadReplyUseCaseProps): Promise<Result<TeamMessage, string>> {
    try {
      // 1. Validera input
      if (!props.parentId) {
        return err('Parent ID (meddelandet som svaras på) måste anges.');
      }
      if (!props.content || props.content.trim().length === 0) {
        return err('Svarets innehåll kan inte vara tomt.');
      }
      // Ytterligare valideringar (t.ex. längd på innehåll) kan läggas till här eller hanteras av TeamMessage.create

      const parentIdResult = UniqueId.createExisting(props.parentId);
      if (parentIdResult.isErr()) {
        return err(parentIdResult.error);
      }
      const parentId = parentIdResult.value;

      // 2. Hämta och validera föräldrameddelandet
      const parentMessageResult = await this.teamMessageRepository.findById(parentId);
      if (parentMessageResult.isErr()) {
        return err(parentMessageResult.error);
      }
      const parentMessage = parentMessageResult.value;

      if (parentMessage.isDeleted) {
        return err('Kan inte svara på ett raderat meddelande.');
      }
      // Man kan också lägga till en begränsning på hur djupt trådar kan gå, om önskvärt.
      // t.ex. if (parentMessage.parentId) { return err('Kan inte svara på ett svar i en tråd (endast ett nivå djup tillåtet)'); }


      // 3. Skapa det nya svarsmeddelandet
      const replyMessageResult = TeamMessage.create({
        teamId: props.teamId,
        senderId: props.senderId,
        content: props.content,
        parentId: parentId.toString(), // Skickar med parentId här
        // attachments: ..., // Hantera om det ska stödjas
        // mentions: ...,    // Hantera om det ska stödjas
      });

      if (replyMessageResult.isErr()) {
        return err(replyMessageResult.error);
      }
      const newReplyMessage = replyMessageResult.value;

      // 4. Spara det nya svarsmeddelandet
      const saveReplyResult = await this.teamMessageRepository.save(newReplyMessage);
      if (saveReplyResult.isErr()) {
        return err(saveReplyResult.error);
      }
      const savedReply = saveReplyResult.value; // Använd det sparade meddelandet som kan ha uppdaterad `updatedAt` etc.

      // 5. Uppdatera föräldrameddelandets trådinformation
      parentMessage.incrementReplyCount(savedReply.createdAt); // Använd svarets createdAt
      
      const updateParentResult = await this.teamMessageRepository.save(parentMessage); // eller .update()
      if (updateParentResult.isErr()) {
        // Logga felet, men överväg om detta ska få hela operationen att misslyckas.
        // Kanske är det acceptabelt att svaret skapades även om föräldern inte kunde uppdateras direkt?
        // För nu, låt oss säga att det är ett fel som bör rapporteras men svaret är ändå skapat.
        console.error(`Kunde inte uppdatera trådinfo på föräldrameddelande ${parentId.toString()}: ${updateParentResult.error}`);
        // Eventuellt returnera ett partiellt framgångsresultat eller en varning.
      }
      
      // TODO: Publicera domänhändelser, t.ex. en specifik ThreadReplyCreatedEvent
      // newReplyMessage.domainEvents.forEach(event => this.eventBus.publish(event));
      // newReplyMessage.clearEvents();
      // if (updateParentResult.isOk()) {
      //   const updatedParent = updateParentResult.value;
      //   updatedParent.domainEvents.forEach(event => this.eventBus.publish(event));
      //   updatedParent.clearEvents();
      // }


      return ok(savedReply);
    } catch (error) {
      console.error('Oväntat fel i CreateThreadReplyUseCase:', error);
      return err('Ett oväntat internt fel inträffade när svaret skulle skapas.');
    }
  }
} 