import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

/**
 * DTO för att hämta teams för en användare
 */
export interface GetTeamsForUserDTO {
  userId: string;
}

/**
 * Use case för att hämta alla team som en användare är medlem i
 */
export class GetTeamsForUserUseCase {
  constructor(private teamRepository: TeamRepository) {}

  /**
   * Hämta alla team som en användare är medlem i
   * 
   * @param dto Data för att identifiera användaren
   * @returns Ett Result med en lista av team eller ett felmeddelande
   */
  async execute(dto: GetTeamsForUserDTO): Promise<Result<Team[], string>> {
    try {
      const { userId } = dto;
      
      // Validera ID
      if (!userId) {
        return err('Användar-ID saknas');
      }
      
      // Hämta teams från repository
      const teamsResult = await this.teamRepository.findByUserId(userId);
      
      if (teamsResult.isErr()) {
        return err(`Kunde inte hitta teams för användaren: ${teamsResult.error}`);
      }
      
      return ok(teamsResult.value);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av användarens teams: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 