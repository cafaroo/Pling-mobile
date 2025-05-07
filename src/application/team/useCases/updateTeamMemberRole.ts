import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamError } from '@/domain/team/errors/TeamError';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';

interface UpdateTeamMemberRoleDTO {
  teamId: string;
  userId: string;
  newRole: string;
  updatedByUserId: string;
}

type UpdateTeamMemberRoleError = 
  | TeamError 
  | { message: string; name: 'UNAUTHORIZED' | 'UNEXPECTED_ERROR' };

interface Dependencies {
  teamRepo: TeamRepository;
}

export const updateTeamMemberRole = ({ teamRepo }: Dependencies) => {
  return async (dto: UpdateTeamMemberRoleDTO): Promise<Result<void, UpdateTeamMemberRoleError>> => {
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
      const updatedByUserId = new UniqueId(dto.updatedByUserId);
      if (!team.canManageMembers(updatedByUserId)) {
        return err({
          message: 'Du har inte behörighet att ändra roller',
          name: 'UNAUTHORIZED'
        });
      }

      // Validera ny roll
      try {
        TeamRole.create(dto.newRole);
      } catch (error) {
        return err({
          message: 'Ogiltig roll',
          name: 'UNEXPECTED_ERROR'
        });
      }

      // Uppdatera roll
      const result = team.updateMemberRole(
        new UniqueId(dto.userId),
        dto.newRole as typeof TeamRole.ADMIN | typeof TeamRole.MEMBER
      );

      if (result.isErr()) {
        return err(result.error);
      }

      // Spara uppdaterat team
      await teamRepo.save(team);

      return ok(undefined);
    } catch (error) {
      return err({
        message: 'Ett oväntat fel inträffade vid uppdatering av roll',
        name: 'UNEXPECTED_ERROR'
      });
    }
  };
}; 