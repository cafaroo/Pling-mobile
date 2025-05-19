import { UseCase } from '@/application/shared/UseCase';
import { Result } from '@/shared/core/Result';
import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

/**
 * DTO för att hämta ett team
 */
export interface GetTeamDTO {
  teamId: string;
}

/**
 * Användningsfall för att hämta ett specifikt team via ID
 */
export class GetTeamUseCase implements UseCase<GetTeamDTO, Result<Team, string>> {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  /**
   * Hämtar ett team baserat på ID
   * 
   * @param dto GetTeamDTO med teamId
   * @returns Result med teamet eller ett felmeddelande
   */
  async execute(dto: GetTeamDTO): Promise<Result<Team, string>> {
    try {
      const { teamId } = dto;
      
      // Validera att teamId finns
      if (!teamId) {
        return Result.fail('Team-ID saknas');
      }
      
      // Hämta teamet från repository
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return Result.fail(`Team med ID ${teamId} hittades inte i teamRepository`);
      }
      
      return Result.ok(teamResult.value);
    } catch (error) {
      return Result.fail(`Fel vid hämtning av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Exportera även en default-export för att stödja import från '../useCases/getTeam'
export default GetTeamUseCase; 