import { UseCase } from '@/application/shared/UseCase';
import { Result } from '@/shared/core/Result';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * DTO för att ta bort ett team från en organisation
 */
export interface RemoveTeamFromOrganizationDTO {
  organizationId: string;
  teamId: string;
}

/**
 * Användningsfall för att ta bort ett team från en organisation
 */
export class RemoveTeamFromOrganizationUseCase implements UseCase<RemoveTeamFromOrganizationDTO, Result<boolean, string>> {
  private organizationRepository: OrganizationRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  /**
   * Tar bort ett team från en organisation
   * 
   * @param dto RemoveTeamFromOrganizationDTO med organizations-ID och team-ID
   * @returns Result med true om det lyckades, annars ett felmeddelande
   */
  async execute(dto: RemoveTeamFromOrganizationDTO): Promise<Result<boolean, string>> {
    try {
      const { organizationId, teamId } = dto;
      
      // Validera att IDs finns
      if (!organizationId) {
        return Result.fail('Organizations-ID saknas');
      }
      
      if (!teamId) {
        return Result.fail('Team-ID saknas');
      }
      
      // Hämta organisationen
      const organizationResult = await this.organizationRepository.findById(organizationId);
      
      if (organizationResult.isErr()) {
        return Result.fail(`Organisation med ID ${organizationId} hittades inte`);
      }
      
      const organization = organizationResult.value;
      
      // Ta bort teamet från organisationen
      const removeTeamResult = organization.removeTeam(new UniqueId(teamId));
      
      if (removeTeamResult.isErr()) {
        return Result.fail(`Kunde inte ta bort team: ${removeTeamResult.error}`);
      }
      
      // Spara uppdaterad organisation
      await this.organizationRepository.save(organization);
      
      return Result.ok(true);
    } catch (error) {
      return Result.fail(`Fel vid borttagning av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 