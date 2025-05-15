import { Result, err, ok } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamInvitation } from '@/domain/team/value-objects/TeamInvitation';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';

export interface InviteTeamMemberDTO {
  teamId: string;
  invitedById: string;
  userId?: string;
  email?: string;
  expiresInDays?: number;
}

export interface InviteTeamMemberResponse {
  success: boolean;
  invitationId: string;
  userId?: string;
  email?: string;
}

type InviteTeamMemberError = { 
  message: string; 
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'ALREADY_EXISTS' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR' 
};

export class InviteTeamMemberUseCase {
  constructor(
    private teamRepository: TeamRepository,
    private userRepository: UserRepository,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(dto: InviteTeamMemberDTO): Promise<Result<InviteTeamMemberResponse, InviteTeamMemberError>> {
    try {
      // Validera indata
      if (!dto.teamId || !dto.invitedById) {
        return err({
          message: 'Team-ID och inbjudar-ID är obligatoriska',
          code: 'VALIDATION_ERROR'
        });
      }

      if (!dto.userId && !dto.email) {
        return err({
          message: 'Antingen användar-ID eller e-post måste anges',
          code: 'VALIDATION_ERROR'
        });
      }

      // Hitta teamet
      const teamId = new UniqueId(dto.teamId);
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err({
          message: `Kunde inte hämta team: ${teamResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }
      
      const team = teamResult.value;
      
      if (!team) {
        return err({
          message: 'Team hittades inte',
          code: 'NOT_FOUND'
        });
      }

      // Kontrollera om inbjudaren har behörighet att bjuda in
      const invitedById = new UniqueId(dto.invitedById);
      if (!team.hasMemberPermission(invitedById, TeamPermission.INVITE)) {
        return err({
          message: 'Du har inte behörighet att bjuda in medlemmar till detta team',
          code: 'UNAUTHORIZED'
        });
      }

      // Om vi har en e-post men inget användar-ID, försök hitta användaren
      let userId = dto.userId ? new UniqueId(dto.userId) : undefined;
      
      if (!userId && dto.email) {
        const userResult = await this.userRepository.findByEmail(dto.email);
        
        if (userResult.isErr()) {
          return err({
            message: `Kunde inte hitta användare med e-post ${dto.email}`,
            code: 'NOT_FOUND'
          });
        }
        
        const user = userResult.value;
        if (user) {
          userId = user.id;
        } else {
          return err({
            message: `Användare med e-post ${dto.email} hittades inte`,
            code: 'NOT_FOUND'
          });
        }
      }

      if (!userId) {
        return err({
          message: 'Kunde inte identifiera användaren som ska bjudas in',
          code: 'VALIDATION_ERROR'
        });
      }

      // Kontrollera om användaren redan är medlem
      const isMemberResult = await this.teamRepository.isMember(teamId, userId);
      
      if (isMemberResult.isErr()) {
        return err({
          message: `Kunde inte kontrollera medlemskap: ${isMemberResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }

      if (isMemberResult.value) {
        return err({
          message: 'Användaren är redan medlem i teamet',
          code: 'ALREADY_EXISTS'
        });
      }

      // Kontrollera om användaren redan har en inbjudan
      const hasActiveInvitation = team.invitations.some(
        inv => inv.userId.equals(userId as UniqueId) && inv.status === 'pending'
      );

      if (hasActiveInvitation) {
        return err({
          message: 'Användaren har redan en aktiv inbjudan',
          code: 'ALREADY_EXISTS'
        });
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
        return err({
          message: `Kunde inte skapa inbjudan: ${invitationResult.error}`,
          code: 'VALIDATION_ERROR'
        });
      }

      const invitation = invitationResult.value;

      // Lägg till inbjudan i teamet
      const addInvitationResult = team.addInvitation(invitation);
      
      if (addInvitationResult.isErr()) {
        return err({
          message: `Kunde inte lägga till inbjudan i team: ${addInvitationResult.error}`,
          code: 'VALIDATION_ERROR'
        });
      }

      // Spara teamet med den nya inbjudan
      const saveResult = await this.teamRepository.save(team);
      
      if (saveResult.isErr()) {
        return err({
          message: `Kunde inte spara team: ${saveResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }

      // Publicera domänevents
      const domainEvents = team.getDomainEvents();
      await this.eventPublisher.publishAll(domainEvents);
      
      // Rensa händelser efter publicering
      team.clearEvents();

      return ok({
        success: true,
        invitationId: invitation.id.toString(),
        userId: userId.toString(),
        email: dto.email
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 