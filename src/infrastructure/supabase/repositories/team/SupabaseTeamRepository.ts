import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Team } from '@/domain/team/entities/Team';
import { SupabaseClient } from '@supabase/supabase-js';
import { TeamDTO } from '@/domain/team/entities/TeamDTO';

/**
 * Implementation av TeamRepository med Supabase som datalagring
 */
export class SupabaseTeamRepository implements TeamRepository {
  private supabase: SupabaseClient;
  private readonly tableName = 'teams';

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Hitta ett team baserat på ID
   */
  async findById(id: string): Promise<Result<Team, Error>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      if (!data) {
        return err(new Error(`Hittade inget team med ID ${id}`));
      }

      const teamResult = Team.create(data as TeamDTO);
      return teamResult;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid hämtning av team'));
    }
  }

  /**
   * Hitta team baserat på ägare
   */
  async findByOwnerId(ownerId: string): Promise<Result<Team[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('ownerId', ownerId);

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      const teams: Team[] = [];

      for (const item of data || []) {
        const teamResult = Team.create(item as TeamDTO);
        if (teamResult.isOk()) {
          teams.push(teamResult.value);
        }
      }

      return ok(teams);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid hämtning av ägarteam'));
    }
  }

  /**
   * Hitta team baserat på organisation
   */
  async findByOrganizationId(organizationId: string): Promise<Result<Team[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organizationId', organizationId);

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      const teams: Team[] = [];

      for (const item of data || []) {
        const teamResult = Team.create(item as TeamDTO);
        if (teamResult.isOk()) {
          teams.push(teamResult.value);
        }
      }

      return ok(teams);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid hämtning av organisationsteam'));
    }
  }

  /**
   * Hitta team där en användare är medlem
   */
  async findByMemberId(userId: string): Promise<Result<Team[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .contains('members', [{ userId }]);

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      const teams: Team[] = [];

      for (const item of data || []) {
        const teamResult = Team.create(item as TeamDTO);
        if (teamResult.isOk()) {
          teams.push(teamResult.value);
        }
      }

      return ok(teams);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid hämtning av medlemsteam'));
    }
  }

  /**
   * Spara ett team
   */
  async save(team: Team): Promise<Result<Team, Error>> {
    try {
      const teamDTO = team.toDTO();
      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(teamDTO)
        .select()
        .single();

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      if (!data) {
        return err(new Error('Kunde inte spara teamet'));
      }

      const savedTeamResult = Team.create(data as TeamDTO);
      return savedTeamResult;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid sparande av team'));
    }
  }

  /**
   * Ta bort ett team
   */
  async delete(id: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      return ok(true);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid borttagning av team'));
    }
  }

  /**
   * Sök efter team med söksträng
   */
  async search(query: string): Promise<Result<Team[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      const teams: Team[] = [];

      for (const item of data || []) {
        const teamResult = Team.create(item as TeamDTO);
        if (teamResult.isOk()) {
          teams.push(teamResult.value);
        }
      }

      return ok(teams);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid sökning av team'));
    }
  }
} 