import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamName } from '@/domain/team/value-objects/TeamName';
import { TeamDescription } from '@/domain/team/value-objects/TeamDescription';

/**
 * DTO för att uppdatera ett Team
 */
export interface UpdateTeamDTO {
  teamId: string;
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}

/**
 * Use case för att uppdatera ett team
 */
export class UpdateTeamUseCase {
  constructor(private teamRepository: TeamRepository) {}

  /**
   * Uppdatera ett team med nya egenskaper
   * 
   * @param dto Data för uppdateringen
   * @returns Ett Result med det uppdaterade teamet eller ett felmeddelande
   */
  async execute(dto: UpdateTeamDTO): Promise<Result<Team, string>> {
    try {
      const { teamId, name, description, settings } = dto;
      
      // Validera ID
      if (!teamId) {
        return err('Team ID krävs för att uppdatera ett team');
      }
      
      // Hämta team från repository
      const teamResult = await this.teamRepository.findById(teamId);
      if (teamResult.isErr()) {
        return err(`Kunde inte hitta team med ID ${teamId}: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      // Uppdatera namn om angivet
      if (name !== undefined) {
        const nameResult = TeamName.create(name);
        if (nameResult.isErr()) {
          return err(`Ogiltigt teamnamn: ${nameResult.error}`);
        }
        team.updateName(nameResult.value);
      }
      
      // Uppdatera beskrivning om angiven
      if (description !== undefined) {
        if (description === '') {
          team.updateDescription(undefined);
        } else {
          const descriptionResult = TeamDescription.create(description);
          if (descriptionResult.isErr()) {
            return err(`Ogiltig teambeskrivning: ${descriptionResult.error}`);
          }
          team.updateDescription(descriptionResult.value);
        }
      }
      
      // Uppdatera inställningar om angivna
      if (settings) {
        team.updateSettings(settings);
      }
      
      // Spara uppdaterade teamet
      const saveResult = await this.teamRepository.save(team);
      if (saveResult.isErr()) {
        return err(`Kunde inte spara uppdaterat team: ${saveResult.error}`);
      }
      
      return ok(team);
    } catch (error) {
      return err(`Fel vid uppdatering av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 