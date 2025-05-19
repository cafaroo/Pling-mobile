import { UseCase } from '@/application/shared/UseCase';
import { Result } from '@/shared/core/Result';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * DTO för att lägga till ett team i en organisation
 */
export interface AddTeamToOrganizationDTO {
  organizationId: string;
  teamId: string;
}

/**
 * Användningsfall för att lägga till ett team i en organisation
 */
export class AddTeamToOrganizationUseCase implements UseCase<AddTeamToOrganizationDTO, Result<boolean, string>> {
  private organizationRepository: OrganizationRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  /**
   * Lägger till ett team i en organisation
   * 
   * @param dto AddTeamToOrganizationDTO med organizations-ID och team-ID
   * @returns Result med true om det lyckades, annars ett felmeddelande
   */
  async execute(dto: AddTeamToOrganizationDTO): Promise<Result<boolean, string>> {
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
      
      // Lägg till teamet i organisationen
      const addTeamResult = organization.addTeam(new UniqueId(teamId));
      
      if (addTeamResult.isErr()) {
        return Result.fail(`Kunde inte lägga till team: ${addTeamResult.error}`);
      }
      
      // Spara uppdaterad organisation
      await this.organizationRepository.save(organization);
      
      return Result.ok(true);
    } catch (error) {
      return Result.fail(`Fel vid tillägg av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 