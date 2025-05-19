import { UseCase } from '@/application/shared/UseCase';
import { Result } from '@/shared/core/Result';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';

/**
 * DTO för att uppdatera en organisation
 */
export interface UpdateOrganizationDTO {
  organizationId: string;
  name?: string;
  description?: string;
}

/**
 * Användningsfall för att uppdatera en organisation
 */
export class UpdateOrganizationUseCase implements UseCase<UpdateOrganizationDTO, Result<Organization, string>> {
  private organizationRepository: OrganizationRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  /**
   * Uppdaterar en organisation
   * 
   * @param dto UpdateOrganizationDTO med organizations-ID och data att uppdatera
   * @returns Result med den uppdaterade organisationen eller ett felmeddelande
   */
  async execute(dto: UpdateOrganizationDTO): Promise<Result<Organization, string>> {
    try {
      const { organizationId, name, description } = dto;
      
      // Validera att organizationId finns
      if (!organizationId) {
        return Result.fail('Organizations-ID saknas');
      }
      
      // Hämta organisationen
      const organizationResult = await this.organizationRepository.findById(organizationId);
      
      if (organizationResult.isErr()) {
        return Result.fail(`Organisation med ID ${organizationId} hittades inte`);
      }
      
      const organization = organizationResult.value;
      
      // Uppdatera namn om det finns
      if (name) {
        const updateNameResult = organization.updateName(name);
        if (updateNameResult.isErr()) {
          return Result.fail(`Kunde inte uppdatera namn: ${updateNameResult.error}`);
        }
      }
      
      // Uppdatera beskrivning om den finns
      if (description !== undefined) {
        const updateDescriptionResult = organization.updateDescription(description);
        if (updateDescriptionResult.isErr()) {
          return Result.fail(`Kunde inte uppdatera beskrivning: ${updateDescriptionResult.error}`);
        }
      }
      
      // Spara uppdaterad organisation
      await this.organizationRepository.save(organization);
      
      return Result.ok(organization);
    } catch (error) {
      return Result.fail(`Fel vid uppdatering av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 