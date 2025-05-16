import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { Team } from '@/domain/team/entities/Team';
import { TeamDTOMapper, TeamDTO } from '../../dto/TeamDTOMapper';

export interface TeamsByOrganizationParams {
  organizationId: string;
  includeMembers?: boolean;
  includeInvitations?: boolean;
  sortBy?: 'name' | 'createdAt' | 'memberCount';
  sortDirection?: 'asc' | 'desc';
}

export interface TeamsByOrganizationResult {
  teams: TeamDTO[];
  total: number;
  organizationName: string;
}

/**
 * TeamsByOrganizationQuery
 * 
 * En specialiserad query för att hämta team som tillhör en specifik organisation.
 * Denna query kombinerar data från team- och organisationsrepositorier.
 */
export class TeamsByOrganizationQuery {
  constructor(
    private teamRepository: TeamRepository,
    private organizationRepository: OrganizationRepository
  ) {}

  /**
   * Utför hämtning av team för en organisation
   */
  async execute(params: TeamsByOrganizationParams): Promise<Result<TeamsByOrganizationResult, string>> {
    try {
      if (!params.organizationId) {
        return err('organizationId är obligatoriskt');
      }

      const organizationId = new UniqueId(params.organizationId);
      const sortBy = params.sortBy || 'name';
      const sortDirection = params.sortDirection || 'asc';
      
      // Hämta organisationen först för att få teamIds och namn
      const organizationResult = await this.organizationRepository.findById(organizationId);
      
      if (organizationResult.isErr()) {
        return err(`Kunde inte hämta organisationen: ${organizationResult.error}`);
      }
      
      const organization = organizationResult.value;
      
      if (!organization) {
        return err(`Organisationen hittades inte`);
      }
      
      const teamIds = organization.teamIds;
      
      if (!teamIds || teamIds.length === 0) {
        return ok({
          teams: [],
          total: 0,
          organizationName: organization.name
        });
      }
      
      // Hämta alla team som tillhör organisationen
      const teamsResult = await this.teamRepository.findByIds(teamIds);
      
      if (teamsResult.isErr()) {
        return err(`Kunde inte hämta team: ${teamsResult.error}`);
      }
      
      let teams = teamsResult.value;
      
      // Sortera resultat
      teams = this.sortTeams(teams, sortBy, sortDirection);
      
      // Konvertera till DTOs för presentation
      const teamDTOs = TeamDTOMapper.toDTOList(teams);
      
      return ok({
        teams: teamDTOs,
        total: teamDTOs.length,
        organizationName: organization.name
      });
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av team för organisationen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hjälpmetod för att sortera team baserat på angiven sorteringsmetod och riktning
   */
  private sortTeams(
    teams: Team[], 
    sortBy: 'name' | 'createdAt' | 'memberCount', 
    sortDirection: 'asc' | 'desc'
  ): Team[] {
    return [...teams].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'memberCount':
          comparison = a.members.length - b.members.length;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }
} 