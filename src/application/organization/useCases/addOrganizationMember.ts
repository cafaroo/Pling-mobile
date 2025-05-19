import { UseCase } from '@/application/shared/UseCase';
import { Result } from '@/shared/core/Result';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';

/**
 * DTO för att lägga till en medlem i en organisation
 */
export interface AddOrganizationMemberDTO {
  organizationId: string;
  userId: string;
  role?: string;
}

/**
 * Användningsfall för att lägga till en medlem i en organisation
 */
export class AddOrganizationMemberUseCase implements UseCase<AddOrganizationMemberDTO, Result<boolean, string>> {
  private organizationRepository: OrganizationRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.organizationRepository = organizationRepository;
  }

  /**
   * Lägger till en medlem i en organisation
   * 
   * @param dto AddOrganizationMemberDTO med organizations-ID, användar-ID och roll
   * @returns Result med true om det lyckades, annars ett felmeddelande
   */
  async execute(dto: AddOrganizationMemberDTO): Promise<Result<boolean, string>> {
    try {
      const { organizationId, userId, role = 'member' } = dto;
      
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
      
      // Skapa roll
      const roleResult = OrganizationRole.create(role);
      if (roleResult.isErr()) {
        return Result.fail(`Ogiltig roll: ${roleResult.error}`);
      }
      
      // Lägg till medlemmen i organisationen
      const addMemberResult = organization.addMember(new UniqueId(userId), roleResult.value);
      
      if (addMemberResult.isErr()) {
        return Result.fail(`Kunde inte lägga till medlem: ${addMemberResult.error}`);
      }
      
      // Spara uppdaterad organisation
      await this.organizationRepository.save(organization);
      
      return Result.ok(true);
    } catch (error) {
      return Result.fail(`Fel vid tillägg av medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 