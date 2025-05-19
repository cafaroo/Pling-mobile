import { UseCase } from '@/application/shared/UseCase';
import { Result } from '@/shared/core/Result';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * DTO för att ta bort en medlem från en organisation
 */
export interface RemoveOrganizationMemberDTO {
  organizationId: string;
  userId: string;
}

/**
 * Användningsfall för att ta bort en medlem från en organisation
 */
export class RemoveOrganizationMemberUseCase implements UseCase<RemoveOrganizationMemberDTO, Result<boolean, string>> {
  private organizationRepository: OrganizationRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  /**
   * Tar bort en medlem från en organisation
   * 
   * @param dto RemoveOrganizationMemberDTO med organizations-ID och användar-ID
   * @returns Result med true om det lyckades, annars ett felmeddelande
   */
  async execute(dto: RemoveOrganizationMemberDTO): Promise<Result<boolean, string>> {
    try {
      const { organizationId, userId } = dto;
      
      // Validera att IDs finns
      if (!organizationId) {
        return Result.fail('Organizations-ID saknas');
      }
      
      if (!userId) {
        return Result.fail('Användar-ID saknas');
      }
      
      // Hämta organisationen
      const organizationResult = await this.organizationRepository.findById(organizationId);
      
      if (organizationResult.isErr()) {
        return Result.fail(`Organisation med ID ${organizationId} hittades inte`);
      }
      
      const organization = organizationResult.value;
      
      // Ta bort medlemmen från organisationen
      const removeMemberResult = organization.removeMember(new UniqueId(userId));
      
      if (removeMemberResult.isErr()) {
        return Result.fail(`Kunde inte ta bort medlem: ${removeMemberResult.error}`);
      }
      
      // Spara uppdaterad organisation
      await this.organizationRepository.save(organization);
      
      return Result.ok(true);
    } catch (error) {
      return Result.fail(`Fel vid borttagning av medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 