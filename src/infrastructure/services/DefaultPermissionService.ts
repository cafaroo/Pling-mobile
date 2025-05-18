import { Result, ok, err } from '@/shared/core/Result';
import { PermissionService } from '@/domain/core/services/PermissionService';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationPermission, hasOrganizationPermission } from '@/domain/organization/value-objects/OrganizationPermission';
import { TeamPermission, equalsTeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { ResourcePermission, equalsResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { OrganizationResourceRepository } from '@/domain/organization/repositories/OrganizationResourceRepository';
import { TeamRole, TeamRoleEnum } from '@/domain/team/value-objects/TeamRole';
import { OrganizationRole, OrganizationRoleEnum } from '@/domain/organization/value-objects/OrganizationRole';

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
    userId: UniqueId | string,
    organizationId: UniqueId | string,
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
      
      // Använd Organisation-entitetens metod för att kontrollera behörighet
      // Vi använder hasPermission eller hasMemberPermission beroende på vad som finns tillgängligt
      let hasPermission = false;
      if (typeof organization.hasPermission === 'function') {
        hasPermission = organization.hasPermission(userIdStr, permission);
      } else if (typeof organization.hasMemberPermission === 'function') {
        hasPermission = organization.hasMemberPermission(userIdStr, permission);
      } else {
        console.warn('Organization entity har inte en standardiserad hasPermission-metod');
        // Fallback: Kontrollera medlemsrollen manuellt
        const member = organization.getMember?.(userIdStr) || 
                      organization.props?.members?.find(m => 
                        (m.userId?.toString() === userIdStr) || (m.userId === userIdStr)
                      );
        
        if (!member) return ok(false);
        
        // Hantera medlemsrollen och kontrollera behörighet
        return ok(hasOrganizationPermission(member.role, permission));
      }
      
      return ok(hasPermission);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av organisationsbehörighet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en användare har en specifik behörighet i ett team
   */
  async hasTeamPermission(
    userId: UniqueId | string,
    teamId: UniqueId | string,
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
      
      // Använd team-entitetens hasPermission-metod om den finns
      if (typeof team.hasPermission === 'function') {
        const hasPermission = team.hasPermission(userIdStr, permission);
        return ok(hasPermission);
      }
      
      // Fallback-implementering om hasPermission inte finns
      // Först kolla om användaren är ägare
      if (team.isOwner && team.isOwner(userIdStr)) {
        return ok(true);
      }
      
      // Hitta medlemmen i teamet
      const member = team.getMember?.(userIdStr) || 
                    team.props?.members?.find(m => 
                      (m.userId?.toString() === userIdStr) || (m.userId === userIdStr)
                    );
      
      if (!member) {
        return ok(false); // Användaren är inte medlem i teamet
      }
      
      // Kontrollera behörighet baserat på roll med equalsValue
      if (member.role instanceof TeamRole) {
        if (member.role.equalsValue(TeamRoleEnum.OWNER)) {
          return ok(true); // Ägare har alltid alla behörigheter
        }
        
        if (member.role.equalsValue(TeamRoleEnum.ADMIN)) {
          return ok(!equalsTeamPermission(permission, TeamPermission.DELETE_TEAM)); // Alla utom DELETE_TEAM
        }
        
        if (member.role.equalsValue(TeamRoleEnum.MEMBER)) {
          const memberPermissions = [
            TeamPermission.VIEW_TEAM,
            TeamPermission.VIEW_MEMBERS
          ];
          return ok(memberPermissions.some(p => equalsTeamPermission(p, permission)));
        }
        
        if (member.role.equalsValue(TeamRoleEnum.GUEST)) {
          return ok(equalsTeamPermission(permission, TeamPermission.VIEW_TEAM));
        }
      } else {
        // Stöd för äldre rollformat som strängar
        const roleStr = member.role?.toString();
        
        if (roleStr === TeamRoleEnum.OWNER) {
          return ok(true);
        }
        
        if (roleStr === TeamRoleEnum.ADMIN) {
          return ok(permission !== TeamPermission.DELETE_TEAM);
        }
        
        if (roleStr === TeamRoleEnum.MEMBER) {
          const memberPermissions = [
            TeamPermission.VIEW_TEAM,
            TeamPermission.VIEW_MEMBERS
          ];
          return ok(memberPermissions.includes(permission));
        }
        
        if (roleStr === TeamRoleEnum.GUEST) {
          return ok(permission === TeamPermission.VIEW_TEAM);
        }
      }
      
      return ok(false);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av teambehörighet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en användare har en specifik behörighet för en resurs
   */
  async hasResourcePermission(
    userId: UniqueId | string,
    resourceId: UniqueId | string,
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
      if (typeof resource.hasPermission === 'function') {
        const hasPermission = resource.hasPermission(userIdStr, permission);
        return ok(hasPermission);
      }
      
      // Fallback: Kolla om användaren är ägare
      const resourceOwnerId = resource.props?.ownerId?.toString();
      if (resourceOwnerId === userIdStr) {
        return ok(true);
      }
      
      // Kolla användarens tilldelade behörigheter
      const permissionAssignment = resource.props?.permissionAssignments?.find(
        a => {
          const assignmentUserId = a.userId instanceof UniqueId 
            ? a.userId.toString() 
            : a.userId;
            
          return assignmentUserId === userIdStr;
        }
      );
      
      if (permissionAssignment?.permissions?.some(p => equalsResourcePermission(p, permission))) {
        return ok(true);
      }
      
      return ok(false);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av resursbehörighet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en användare har en specifik roll i en organisation
   */
  async hasOrganizationRole(
    userId: UniqueId | string,
    organizationId: UniqueId | string,
    role: OrganizationRole | OrganizationRoleEnum | string
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
      
      // Använd hasRole-metoden om den finns
      if (typeof organization.hasRole === 'function') {
        return ok(organization.hasRole(userIdStr, role));
      }
      
      // Hitta medlemmen
      const member = organization.getMember?.(userIdStr) || 
                    organization.props?.members?.find(m => 
                      (m.userId?.toString() === userIdStr) || 
                      (m.userId === userIdStr)
                    );
      
      if (!member) {
        return ok(false);
      }
      
      // Kontrollera rollen
      const memberRole = member.role;
      
      // Jämför med equalsValue om det är ett värde-objekt
      if (memberRole instanceof OrganizationRole) {
        return ok(memberRole.equalsValue(role));
      }
      
      // För bakåtkompatibilitet
      const roleToCheck = role instanceof OrganizationRole ? role.toString() : role;
      const memberRoleStr = memberRole?.toString();
      
      return ok(memberRoleStr === roleToCheck);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av organisationsroll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Kontrollerar om en användare har en specifik roll i ett team
   */
  async hasTeamRole(
    userId: UniqueId | string,
    teamId: UniqueId | string,
    role: TeamRole | TeamRoleEnum | string
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
      const member = team.getMember?.(userIdStr) || 
                    team.props?.members?.find(m => 
                      (m.userId?.toString() === userIdStr) || 
                      (m.userId === userIdStr)
                    );
      
      if (!member) {
        return ok(false);
      }
      
      // Om team har en hasRole-metod, använd den
      if (typeof team.hasRole === 'function') {
        return ok(team.hasRole(userIdStr, role));
      }
      
      // Kontrollera rollen
      const memberRole = member.role;
      
      // Använd equalsValue om det är ett värde-objekt
      if (memberRole instanceof TeamRole) {
        return ok(memberRole.equalsValue(role));
      }
      
      // För bakåtkompatibilitet
      const roleToCheck = role instanceof TeamRole ? role.toString() : role;
      const memberRoleStr = memberRole?.toString();
      
      return ok(memberRoleStr === roleToCheck);
    } catch (error) {
      return err(`Ett fel uppstod vid kontroll av teamroll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar alla behörigheter en användare har i en organisation
   */
  async getOrganizationPermissions(
    userId: UniqueId | string,
    organizationId: UniqueId | string
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
      const member = organization.getMember?.(userIdStr) || 
                    organization.props?.members?.find(m => 
                      (m.userId?.toString() === userIdStr) || (m.userId === userIdStr)
                    );
      
      if (!member) {
        return ok([]); // Användaren är inte medlem i organisationen
      }
      
      // Returnera behörigheter baserat på medlemmens roll
      const allPermissions = Object.values(OrganizationPermission);
      
      // För admin, alla behörigheter
      if (member.role === OrganizationRole.ADMIN || 
          member.role?.toString() === OrganizationRole.ADMIN) {
        return ok(allPermissions);
      }
      
      // För medlemmar, begränsade behörigheter
      if (member.role === OrganizationRole.MEMBER || 
          member.role?.toString() === OrganizationRole.MEMBER) {
        return ok([
          OrganizationPermission.VIEW_TEAMS,
          OrganizationPermission.JOIN_TEAM
        ]);
      }
      
      return ok([]);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av organisationsbehörigheter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar alla behörigheter en användare har i ett team
   */
  async getTeamPermissions(
    userId: UniqueId | string,
    teamId: UniqueId | string
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
      
      // Kolla om ägare
      if (team.isOwner && team.isOwner(userIdStr)) {
        return ok(Object.values(TeamPermission));
      }
      
      // Hitta medlemmen
      const member = team.getMember?.(userIdStr) || 
                    team.props?.members?.find(m => 
                      (m.userId?.toString() === userIdStr) || (m.userId === userIdStr)
                    );
      
      if (!member) {
        return ok([]); // Användaren är inte medlem i teamet
      }
      
      // Om användaren är ägare, returnera alla behörigheter
      if (member.role === TeamRole.OWNER || 
          member.role?.toString() === TeamRole.OWNER) {
        return ok(Object.values(TeamPermission));
      }
      
      // För admin, alla utom DELETE_TEAM
      if (member.role === TeamRole.ADMIN || 
          member.role?.toString() === TeamRole.ADMIN) {
        return ok(
          Object.values(TeamPermission).filter(
            p => p !== TeamPermission.DELETE_TEAM
          )
        );
      }
      
      // För medlemmar, begränsade behörigheter
      if (member.role === TeamRole.MEMBER || 
          member.role?.toString() === TeamRole.MEMBER) {
        return ok([
          TeamPermission.VIEW_TEAM,
          TeamPermission.VIEW_MEMBERS
        ]);
      }
      
      // För gäster, minimal behörighet
      if (member.role === TeamRole.GUEST || 
          member.role?.toString() === TeamRole.GUEST) {
        return ok([TeamPermission.VIEW_TEAM]);
      }
      
      return ok([]);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av teambehörigheter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar alla behörigheter en användare har för en resurs
   */
  async getResourcePermissions(
    userId: UniqueId | string,
    resourceId: UniqueId | string
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
      
      // Om användaren är ägare, returnera alla behörigheter
      const resourceOwnerId = resource.props?.ownerId?.toString();
      if (resourceOwnerId === userIdStr) {
        return ok(Object.values(ResourcePermission));
      }
      
      // Hitta användarens tilldelade behörigheter
      const userAssignment = resource.props?.permissionAssignments?.find(
        a => {
          const assignmentUserId = a.userId instanceof UniqueId 
            ? a.userId.toString() 
            : a.userId;
            
          return assignmentUserId === userIdStr;
        }
      );
      
      // Returnera användarens tilldelade behörigheter
      if (userAssignment?.permissions) {
        return ok(userAssignment.permissions);
      }
      
      return ok([]);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av resursbehörigheter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 