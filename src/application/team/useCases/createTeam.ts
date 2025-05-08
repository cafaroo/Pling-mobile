import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamName } from '@/domain/team/value-objects/TeamName';
import { TeamDescription } from '@/domain/team/value-objects/TeamDescription';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamError } from '@/domain/team/errors/TeamError';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';

export interface CreateTeamDTO {
  name: string;
  description?: string;
  ownerId: string;
}

type CreateTeamError = 
  | TeamError 
  | { message: string; name: 'UNEXPECTED_ERROR' };

interface Dependencies {
  teamRepo: TeamRepository;
}

export const createTeam = ({ teamRepo }: Dependencies) => {
  return async (dto: CreateTeamDTO): Promise<Result<Team, CreateTeamError>> => {
    try {
      // Validera och skapa värde-objekt
      const nameOrError = TeamName.create(dto.name);
      if (nameOrError.isErr()) {
        return err(nameOrError.error);
      }

      const descriptionOrError = dto.description 
        ? TeamDescription.create(dto.description)
        : ok(undefined);

      if (descriptionOrError.isErr()) {
        return err(descriptionOrError.error);
      }

      const ownerId = new UniqueId(dto.ownerId);
      
      // Skapa owner som första medlem
      const ownerMember = TeamMember.create({
        userId: ownerId,
        role: TeamRole.OWNER,
        joinedAt: new Date()
      });

      if (ownerMember.isErr()) {
        return err(ownerMember.error);
      }

      // Skapa team
      const teamOrError = Team.create({
        name: nameOrError.value,
        description: descriptionOrError.value,
        ownerId,
        members: [ownerMember.value]
      });

      if (teamOrError.isErr()) {
        return err(teamOrError.error);
      }

      const team = teamOrError.value;

      // Spara i databasen
      await teamRepo.save(team);

      return ok(team);
    } catch (error) {
      return err({
        message: 'Ett oväntat fel inträffade vid skapande av team',
        name: 'UNEXPECTED_ERROR'
      });
    }
  };
};

export class CreateTeamUseCase {
  constructor(private teamRepository: TeamRepository) {}

  async execute(dto: CreateTeamDTO): Promise<Result<string, string>> {
    try {
      // Validera indata
      if (!dto.name) {
        return err('Teamnamn är obligatoriskt');
      }

      if (!dto.ownerId) {
        return err('Ägar-ID är obligatoriskt');
      }

      // Skapa team-entitet
      const ownerId = new UniqueId(dto.ownerId);
      const teamResult = Team.create({
        name: dto.name,
        description: dto.description,
        ownerId
      });

      if (teamResult.isErr()) {
        return err(teamResult.error);
      }

      const team = teamResult.getValue();

      // Spara team
      const saveResult = await this.teamRepository.save(team);
      if (saveResult.isErr()) {
        return err(`Kunde inte spara team: ${saveResult.error}`);
      }

      // Returnera team-ID
      return ok(team.id.toString());
    } catch (error) {
      return err(`Ett fel uppstod vid skapande av team: ${error.message}`);
    }
  }
} 