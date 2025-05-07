import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamError } from '@/domain/team/errors/TeamError';

interface RemoveTeamMemberDTO {
  teamId: string;
  userId: string;
  removedByUserId: string;
}

type RemoveTeamMemberError = 
  | TeamError 
  | { message: string; name: 'UNAUTHORIZED' | 'UNEXPECTED_ERROR' };

interface Dependencies {
  teamRepo: TeamRepository;
}

export const removeTeamMember = ({ teamRepo }: Dependencies) => {
  return async (dto: RemoveTeamMemberDTO): Promise<Result<void, RemoveTeamMemberError>> => {
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
      const removedByUserId = new UniqueId(dto.removedByUserId);
      if (!team.canManageMembers(removedByUserId)) {
        return err({
          message: 'Du har inte behörighet att ta bort medlemmar',
          name: 'UNAUTHORIZED'
        });
      }

      // Ta bort medlem
      const result = team.removeMember(new UniqueId(dto.userId));
      if (result.isErr()) {
        return err(result.error);
      }

      // Spara uppdaterat team
      await teamRepo.save(team);

      return ok(undefined);
    } catch (error) {
      return err({
        message: 'Ett oväntat fel inträffade vid borttagning av medlem',
        name: 'UNEXPECTED_ERROR'
      });
    }
  };
}; 