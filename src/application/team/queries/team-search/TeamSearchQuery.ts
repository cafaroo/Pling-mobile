import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Team } from '@/domain/team/entities/Team';
import { TeamDTOMapper, TeamDTO } from '../../dto/TeamDTOMapper';

export interface TeamSearchParams {
  query: string;
  limit?: number;
  includePublicOnly?: boolean;
  organizationId?: string;
  sortBy?: 'name' | 'createdAt' | 'memberCount';
  sortDirection?: 'asc' | 'desc';
}

export interface TeamSearchResult {
  teams: TeamDTO[];
  total: number;
  hasMore: boolean;
}

/**
 * TeamSearchQuery
 * 
 * En specialiserad query för att söka efter team baserat på olika kriterier.
 * Implementerar en mer avancerad sökfunktionalitet än vad som finns i repository-lagret.
 */
export class TeamSearchQuery {
  constructor(private teamRepository: TeamRepository) {}

  /**
   * Utför sökning efter team baserat på de angivna parametrarna
   */
  async execute(params: TeamSearchParams): Promise<Result<TeamSearchResult, string>> {
    try {
      // Standardvärden för parametrar
      const limit = params.limit || 10;
      const sortBy = params.sortBy || 'name';
      const sortDirection = params.sortDirection || 'asc';
      
      // Utför sökning via repository
      const searchResult = await this.teamRepository.search(params.query, limit * 2); // Hämta fler för att veta om det finns mer
      
      if (searchResult.isErr()) {
        return err(`Kunde inte utföra sökning: ${searchResult.error}`);
      }
      
      let teams = searchResult.value;
      
      // Filtrera baserat på parametrar
      if (params.includePublicOnly) {
        teams = teams.filter(team => team.settings?.isPrivate === false);
      }
      
      if (params.organizationId) {
        teams = teams.filter(team => team.organizationId?.toString() === params.organizationId);
      }
      
      // Sortera resultat
      teams = this.sortTeams(teams, sortBy, sortDirection);
      
      // Räkna totalt antal innan vi begränsar resultatet
      const total = teams.length;
      
      // Begränsa antal resultat
      const hasMore = teams.length > limit;
      teams = teams.slice(0, limit);
      
      // Konvertera till DTOs för presentation
      const teamDTOs = TeamDTOMapper.toDTOList(teams);
      
      return ok({
        teams: teamDTOs,
        total,
        hasMore
      });
    } catch (error) {
      return err(`Ett fel inträffade vid sökning efter team: ${error instanceof Error ? error.message : String(error)}`);
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
      
      // Utför jämförelse baserat på sorteringsmetod
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
      
      // Vänd på jämförelsen om sorteringsriktningen är fallande
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }
} 