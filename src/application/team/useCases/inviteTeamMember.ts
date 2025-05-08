import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Result, err, ok } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamInvitation } from '@/domain/team/value-objects/TeamInvitation';
import { UserRepository } from '@/domain/user/repositories/UserRepository';

export interface InviteTeamMemberDTO {
  teamId: string;
  invitedById: string;
  userId?: string;
  email?: string;
  expiresInDays?: number;
}

export class InviteTeamMemberUseCase {
  constructor(
    private teamRepository: TeamRepository,
    private userRepository: UserRepository
  ) {}

  async execute(dto: InviteTeamMemberDTO): Promise<Result<string, string>> {
    try {
      // Validera indata
      if (!dto.teamId) {
        return err('Team-ID är obligatoriskt');
      }

      if (!dto.invitedById) {
        return err('Inbjudar-ID är obligatoriskt');
      }

      if (!dto.userId && !dto.email) {
        return err('Antingen användar-ID eller e-post måste anges');
      }

      // Hitta teamet
      const teamId = new UniqueId(dto.teamId);
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(`Team hittades inte: ${teamResult.error}`);
      }

      const team = teamResult.getValue();

      // Kontrollera om inbjudaren har behörighet att bjuda in
      const invitedById = new UniqueId(dto.invitedById);
      if (!team.hasMemberPermission(invitedById, 'invite_members' as any)) {
        return err('Du har inte behörighet att bjuda in medlemmar till detta team');
      }

      // Om vi har en e-post men inget användar-ID, försök hitta användaren
      let userId = dto.userId ? new UniqueId(dto.userId) : undefined;
      
      if (!userId && dto.email) {
        const userResult = await this.userRepository.findByEmail(dto.email);
        if (userResult.isOk()) {
          userId = userResult.getValue().id;
        } else {
          // Om användaren inte finns, kan vi hantera det på olika sätt
          // (t.ex. skapa en provisorisk inbjudan, eller returnera fel)
          return err(`Användare med e-post ${dto.email} hittades inte`);
        }
      }

      // Kontrollera om användaren redan är medlem
      const isMemberResult = await this.teamRepository.isMember(teamId, userId as UniqueId);
      if (isMemberResult.isErr()) {
        return err(`Kunde inte kontrollera medlemskap: ${isMemberResult.error}`);
      }

      if (isMemberResult.getValue()) {
        return err('Användaren är redan medlem i teamet');
      }

      // Kontrollera om användaren redan har en inbjudan
      const invitationsResult = await this.teamRepository.getInvitations(teamId);
      if (invitationsResult.isErr()) {
        return err(`Kunde inte kontrollera existerande inbjudningar: ${invitationsResult.error}`);
      }

      const existingInvitation = invitationsResult.getValue().find(
        inv => inv.userId.toString() === userId?.toString() && inv.status === 'pending'
      );

      if (existingInvitation) {
        return err('Användaren har redan en aktiv inbjudan');
      }

      // Skapa utgångsdatum om angivet
      const expiresAt = dto.expiresInDays 
        ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000) 
        : undefined;

      // Skapa inbjudan
      const invitationResult = TeamInvitation.create({
        teamId,
        userId: userId as UniqueId,
        invitedBy: invitedById,
        email: dto.email,
        status: 'pending',
        expiresAt,
        createdAt: new Date()
      });

      if (invitationResult.isErr()) {
        return err(`Kunde inte skapa inbjudan: ${invitationResult.error}`);
      }

      const invitation = invitationResult.getValue();

      // Spara inbjudan
      const saveResult = await this.teamRepository.createInvitation(invitation);
      if (saveResult.isErr()) {
        return err(`Kunde inte spara inbjudan: ${saveResult.error}`);
      }

      // Lägg till i teamets inbjudningar och uppdatera team
      const updatedTeam = team;
      const addInvitationResult = updatedTeam.addInvitation(invitation);
      
      if (addInvitationResult.isErr()) {
        return err(`Kunde inte lägga till inbjudan i team: ${addInvitationResult.error}`);
      }

      const updateTeamResult = await this.teamRepository.save(updatedTeam);
      if (updateTeamResult.isErr()) {
        return err(`Kunde inte uppdatera team: ${updateTeamResult.error}`);
      }

      return ok(invitation.id.toString());
    } catch (error) {
      return err(`Ett fel uppstod vid inbjudan: ${error.message}`);
    }
  }
} 