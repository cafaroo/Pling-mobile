import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamError } from '@/domain/team/errors/TeamError';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';

interface AddTeamMemberDTO {
  teamId: string;
  userId: string;
  role: string;
  addedByUserId: string;
}

type AddTeamMemberError = 
  | TeamError 
  | { message: string; name: 'UNAUTHORIZED' | 'UNEXPECTED_ERROR' };

interface Dependencies {
  teamRepo: TeamRepository;
}

export const addTeamMember = ({ teamRepo }: Dependencies) => {
  return async (dto: AddTeamMemberDTO): Promise<Result<void, AddTeamMemberError>> => {
    try {
      // Hämta team
      const team = await teamRepo.findById(new UniqueId(dto.teamId));
      if (!team) {
        return err({
          message: 'Team hittades inte',
          name: 'UNEXPECTED_ERROR'
        });
      }

      // Kontrollera behörighet
      if (!team.canManageMembers(new UniqueId(dto.addedByUserId))) {
        return err({
          message: 'Du har inte behörighet att lägga till medlemmar',
          name: 'UNAUTHORIZED'
        });
      }

      // Skapa ny medlem
      const memberOrError = TeamMember.create({
        userId: new UniqueId(dto.userId),
        role: dto.role,
        joinedAt: new Date()
      });

      if (memberOrError.isErr()) {
        return err(memberOrError.error);
      }

      // Lägg till medlem i team
      const result = team.addMember(memberOrError.value);
      if (result.isErr()) {
        return err(result.error);
      }

      // Spara uppdaterat team
      await teamRepo.save(team);

      return ok(undefined);
    } catch (error) {
      return err({
        message: 'Ett oväntat fel inträffade vid tillägg av medlem',
        name: 'UNEXPECTED_ERROR'
      });
    }
  };
}; 