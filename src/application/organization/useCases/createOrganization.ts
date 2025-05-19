import { UseCase } from '@/application/shared/UseCase';
import { Result } from '@/shared/core/Result';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * DTO för att skapa en ny organisation
 */
export interface CreateOrganizationDTO {
  name: string;
  description?: string;
  ownerId: string;
}

/**
 * Användningsfall för att skapa en ny organisation
 */
export class CreateOrganizationUseCase implements UseCase<CreateOrganizationDTO, Result<Organization, string>> {
  private organizationRepository: OrganizationRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  /**
   * Skapar en ny organisation
   * 
   * @param dto CreateOrganizationDTO med organisation-detaljer
   * @returns Result med den skapade organisationen eller ett felmeddelande
   */
  async execute(dto: CreateOrganizationDTO): Promise<Result<Organization, string>> {
    try {
      const { name, description, ownerId } = dto;
      
      // Validera indata
      if (!name) {
        return Result.fail('Organisationsnamn saknas');
      }
      
      if (!ownerId) {
        return Result.fail('Ägar-ID saknas');
      }
      
      // Skapa organisation
      const createResult = Organization.create({
        name,
        description,
        ownerId: new UniqueId(ownerId)
      });
      
      if (createResult.isErr()) {
        return Result.fail(`Kunde inte skapa organisation: ${createResult.error}`);
      }
      
      const organization = createResult.value;
      
      // Spara till repository
      await this.organizationRepository.save(organization);
      
      return Result.ok(organization);
    } catch (error) {
      return Result.fail(`Fel vid skapande av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 