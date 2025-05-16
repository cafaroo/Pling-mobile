import { Result } from '@/shared/core/Result';
import { UniqueEntityID } from '../UniqueEntityID';
import { OrganizationPermission } from '../../organization/value-objects/OrganizationPermission';
import { TeamPermission } from '../../team/value-objects/TeamPermission';
import { ResourcePermission } from '../../organization/value-objects/ResourcePermission';

/**
 * PermissionService hanterar behörighetskontroller över domängränser
 * 
 * Tjänsten samlar all behörighetslogik på ett ställe för centraliserad åtkomstkontroll
 * och fungerar som en domäntjänst enligt DDD-principer.
 */
export interface PermissionService {
  /**
   * Kontrollerar om en användare har en specifik behörighet i en organisation
   * 
   * @param userId Användarens ID
   * @param organizationId Organisationens ID
   * @param permission Behörigheten som ska kontrolleras
   * @returns Result med boolean som indikerar om användaren har behörigheten
   */
  hasOrganizationPermission(
    userId: UniqueEntityID | string,
    organizationId: UniqueEntityID | string,
    permission: OrganizationPermission
  ): Promise<Result<boolean>>;

  /**
   * Kontrollerar om en användare har en specifik behörighet i ett team
   * 
   * @param userId Användarens ID
   * @param teamId Teamets ID
   * @param permission Behörigheten som ska kontrolleras
   * @returns Result med boolean som indikerar om användaren har behörigheten
   */
  hasTeamPermission(
    userId: UniqueEntityID | string,
    teamId: UniqueEntityID | string,
    permission: TeamPermission
  ): Promise<Result<boolean>>;

  /**
   * Kontrollerar om en användare har en specifik behörighet för en resurs
   * 
   * @param userId Användarens ID
   * @param resourceId Resursens ID
   * @param permission Behörigheten som ska kontrolleras
   * @returns Result med boolean som indikerar om användaren har behörigheten
   */
  hasResourcePermission(
    userId: UniqueEntityID | string,
    resourceId: UniqueEntityID | string,
    permission: ResourcePermission
  ): Promise<Result<boolean>>;

  /**
   * Kontrollerar om en användare har en specifik roll i en organisation
   * 
   * @param userId Användarens ID
   * @param organizationId Organisationens ID
   * @param role Rollen som ska kontrolleras
   * @returns Result med boolean som indikerar om användaren har rollen
   */
  hasOrganizationRole(
    userId: UniqueEntityID | string,
    organizationId: UniqueEntityID | string,
    role: string
  ): Promise<Result<boolean>>;

  /**
   * Kontrollerar om en användare har en specifik roll i ett team
   * 
   * @param userId Användarens ID
   * @param teamId Teamets ID
   * @param role Rollen som ska kontrolleras
   * @returns Result med boolean som indikerar om användaren har rollen
   */
  hasTeamRole(
    userId: UniqueEntityID | string,
    teamId: UniqueEntityID | string,
    role: string
  ): Promise<Result<boolean>>;

  /**
   * Hämtar alla behörigheter en användare har i en organisation
   * 
   * @param userId Användarens ID
   * @param organizationId Organisationens ID
   * @returns Result med array av behörigheter
   */
  getOrganizationPermissions(
    userId: UniqueEntityID | string,
    organizationId: UniqueEntityID | string
  ): Promise<Result<OrganizationPermission[]>>;

  /**
   * Hämtar alla behörigheter en användare har i ett team
   * 
   * @param userId Användarens ID
   * @param teamId Teamets ID
   * @returns Result med array av behörigheter
   */
  getTeamPermissions(
    userId: UniqueEntityID | string,
    teamId: UniqueEntityID | string
  ): Promise<Result<TeamPermission[]>>;

  /**
   * Hämtar alla behörigheter en användare har för en resurs
   * 
   * @param userId Användarens ID
   * @param resourceId Resursens ID
   * @returns Result med array av behörigheter
   */
  getResourcePermissions(
    userId: UniqueEntityID | string,
    resourceId: UniqueEntityID | string
  ): Promise<Result<ResourcePermission[]>>;
} 