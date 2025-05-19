import { UseCase } from '@/application/shared/UseCase';
import { Result } from '@/shared/core/Result';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';

/**
 * DTO för att hämta en organisation
 */
export interface GetOrganizationDTO {
  organizationId: string;
}

/**
 * Användningsfall för att hämta en specifik organisation via ID
 */
export class GetOrganizationUseCase implements UseCase<GetOrganizationDTO, Result<Organization, string>> {
  private organizationRepository: OrganizationRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  /**
   * Hämtar en organisation baserat på ID
   * 
   * @param dto GetOrganizationDTO med organizationId
   * @returns Result med organisationen eller ett felmeddelande
   */
  async execute(dto: GetOrganizationDTO): Promise<Result<Organization, string>> {
    try {
      const { organizationId } = dto;
      
      // Validera att organizationId finns
      if (!organizationId) {
        return Result.fail('Organizations-ID saknas');
      }
      
      // Hämta organisationen från repository
      const organizationResult = await this.organizationRepository.findById(organizationId);
      
      if (organizationResult.isErr()) {
        return Result.fail(`Organisation med ID ${organizationId} hittades inte`);
      }
      
      return Result.ok(organizationResult.value);
    } catch (error) {
      return Result.fail(`Fel vid hämtning av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 