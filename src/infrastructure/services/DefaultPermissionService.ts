import { Result, ok, err } from '@/shared/core/Result';
import { PermissionService } from '@/domain/core/services/PermissionService';
import { UniqueEntityID } from '@/domain/core/UniqueEntityID';
import { OrganizationPermission } from '@/domain/organization/value-objects/OrganizationPermission';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { OrganizationResourceRepository } from '@/domain/organization/repositories/OrganizationResourceRepository';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { hasOrganizationPermission } from '@/domain/organization/value-objects/OrganizationPermission';

/**
 * StandardimplementeringAv PermissionService som använder repositories
 * för att hämta entiteter och kontrollera behörigheter
 */
export class DefaultPermissionService implements PermissionService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly teamRepository: TeamRepository,
    private readonly resourceRepository: OrganizationResourceRepository
  ) {}

  /**
   * Kontrollerar om en användare har en specifik behörighet i en organisation
   */
  async hasOrganizationPermission(
    userId: UniqueEntityID | string,
    organizationId: UniqueEntityID | string,
    permission: OrganizationPermission
  ): Promise<Result<boolean>> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      const orgIdStr = typeof organizationId === 'string' ? organizationId : organizationId.toString();
      
      // Hämta organisationen
      const organizationResult = await this.organizationRepository.findById(orgIdStr);
      if (organizationResult.isErr()) {
        return err(`Kunde inte hämta organisation: ${organizationResult.error}`);
      }
      
      const organization = organizationResult.value;
      
      // Använd Organization-entitetens metod för att kontrollera behörighet
      const hasPermission = organization.hasMemberPermission(
        new UniqueEntityID(userIdStr),
        permission
      );
      
      return ok(hasPermission);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av organisationsbehörighet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en användare har en specifik behörighet i ett team
   */
  async hasTeamPermission(
    userId: UniqueEntityID | string,
    teamId: UniqueEntityID | string,
    permission: TeamPermission
  ): Promise<Result<boolean>> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      const teamIdStr = typeof teamId === 'string' ? teamId : teamId.toString();
      
      // Hämta teamet
      const teamResult = await this.teamRepository.findById(teamIdStr);
      if (teamResult.isErr()) {
        return err(`Kunde inte hämta team: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      // Hitta medlemmen i teamet
      const member = team.members.find(m => m.userId === userIdStr);
      if (!member) {
        return ok(false); // Användaren är inte medlem i teamet
      }
      
      // Kontrollera behörighet baserat på roll
      if (member.role === TeamRole.OWNER) {
        // Ägare har alltid alla behörigheter
        return ok(true);
      }
      
      // För andra roller, kontrollera om rollen har behörigheten
      const permissions = TeamRole[member.role] 
        ? (TeamRole[member.role] as unknown as TeamPermission[]) 
        : [];
        
      return ok(permissions.includes(permission));
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av teambehörighet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en användare har en specifik behörighet för en resurs
   */
  async hasResourcePermission(
    userId: UniqueEntityID | string,
    resourceId: UniqueEntityID | string,
    permission: ResourcePermission
  ): Promise<Result<boolean>> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      const resourceIdStr = typeof resourceId === 'string' ? resourceId : resourceId.toString();
      
      // Hämta resursen
      const resourceResult = await this.resourceRepository.findById(resourceIdStr);
      if (resourceResult.isErr()) {
        return err(`Kunde inte hämta resurs: ${resourceResult.error}`);
      }
      
      const resource = resourceResult.value;
      
      // Använd resursens metod för att kontrollera behörighet
      const hasPermission = resource.hasPermission(
        new UniqueEntityID(userIdStr),
        permission
      );
      
      return ok(hasPermission);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av resursbehörighet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en användare har en specifik roll i en organisation
   */
  async hasOrganizationRole(
    userId: UniqueEntityID | string,
    organizationId: UniqueEntityID | string,
    role: string
  ): Promise<Result<boolean>> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      const orgIdStr = typeof organizationId === 'string' ? organizationId : organizationId.toString();
      
      // Hämta organisationen
      const organizationResult = await this.organizationRepository.findById(orgIdStr);
      if (organizationResult.isErr()) {
        return err(`Kunde inte hämta organisation: ${organizationResult.error}`);
      }
      
      const organization = organizationResult.value;
      
      // Hitta medlemmen
      const member = organization.props.members.find(m => m.userId.toString() === userIdStr);
      if (!member) {
        return ok(false); // Användaren är inte medlem i organisationen
      }
      
      // Kontrollera rollen
      return ok(member.role === role);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av organisationsroll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en användare har en specifik roll i ett team
   */
  async hasTeamRole(
    userId: UniqueEntityID | string,
    teamId: UniqueEntityID | string,
    role: string
  ): Promise<Result<boolean>> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      const teamIdStr = typeof teamId === 'string' ? teamId : teamId.toString();
      
      // Hämta teamet
      const teamResult = await this.teamRepository.findById(teamIdStr);
      if (teamResult.isErr()) {
        return err(`Kunde inte hämta team: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      // Hitta medlemmen
      const member = team.members.find(m => m.userId === userIdStr);
      if (!member) {
        return ok(false); // Användaren är inte medlem i teamet
      }
      
      // Kontrollera rollen
      return ok(member.role === role);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av teamroll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar alla behörigheter en användare har i en organisation
   */
  async getOrganizationPermissions(
    userId: UniqueEntityID | string,
    organizationId: UniqueEntityID | string
  ): Promise<Result<OrganizationPermission[]>> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      const orgIdStr = typeof organizationId === 'string' ? organizationId : organizationId.toString();
      
      // Hämta organisationen
      const organizationResult = await this.organizationRepository.findById(orgIdStr);
      if (organizationResult.isErr()) {
        return err(`Kunde inte hämta organisation: ${organizationResult.error}`);
      }
      
      const organization = organizationResult.value;
      
      // Hitta medlemmen
      const member = organization.props.members.find(m => m.userId.toString() === userIdStr);
      if (!member) {
        return ok([]); // Användaren är inte medlem i organisationen
      }
      
      // Returnera behörigheter baserat på medlemmens roll
      const allPermissions = Object.values(OrganizationPermission);
      const permissions = allPermissions.filter(permission => 
        hasOrganizationPermission(member.role, permission)
      );
      
      return ok(permissions);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av organisationsbehörigheter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar alla behörigheter en användare har i ett team
   */
  async getTeamPermissions(
    userId: UniqueEntityID | string,
    teamId: UniqueEntityID | string
  ): Promise<Result<TeamPermission[]>> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      const teamIdStr = typeof teamId === 'string' ? teamId : teamId.toString();
      
      // Hämta teamet
      const teamResult = await this.teamRepository.findById(teamIdStr);
      if (teamResult.isErr()) {
        return err(`Kunde inte hämta team: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      // Hitta medlemmen
      const member = team.members.find(m => m.userId === userIdStr);
      if (!member) {
        return ok([]); // Användaren är inte medlem i teamet
      }
      
      // Om användaren är ägare, returnera alla behörigheter
      if (member.role === TeamRole.OWNER) {
        return ok(Object.values(TeamPermission));
      }
      
      // För andra roller, hämta behörigheter från TeamRole-definitionen
      return ok([]);  // TODO: Implementera när behörighetsmodellen är fullständig
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av teambehörigheter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar alla behörigheter en användare har för en resurs
   */
  async getResourcePermissions(
    userId: UniqueEntityID | string,
    resourceId: UniqueEntityID | string
  ): Promise<Result<ResourcePermission[]>> {
    try {
      const userIdStr = typeof userId === 'string' ? userId : userId.toString();
      const resourceIdStr = typeof resourceId === 'string' ? resourceId : resourceId.toString();
      
      // Hämta resursen
      const resourceResult = await this.resourceRepository.findById(resourceIdStr);
      if (resourceResult.isErr()) {
        return err(`Kunde inte hämta resurs: ${resourceResult.error}`);
      }
      
      const resource = resourceResult.value;
      
      // Hitta användarens tilldelade behörigheter
      const userAssignment = resource.props.permissionAssignments.find(
        a => a.userId && a.userId.toString() === userIdStr
      );
      
      // Om användaren är ägare, returnera alla behörigheter
      if (resource.props.ownerId.toString() === userIdStr) {
        return ok(Object.values(ResourcePermission));
      }
      
      // Returnera användarens tilldelade behörigheter
      if (userAssignment) {
        return ok(userAssignment.permissions);
      }
      
      // Kontrollera om användaren har behörigheter via team eller roll
      // Detta skulle kräva mer komplexa kontroller med tillgång till team-information
      
      return ok([]);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av resursbehörigheter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 