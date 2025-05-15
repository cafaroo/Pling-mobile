import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { OrganizationMapper } from '../mappers/OrganizationMapper';
import { EventBus } from '@/infrastructure/events/EventBus';

/**
 * SupabaseOrganizationRepository
 * 
 * Implementation av OrganizationRepository med Supabase som datakälla.
 * Följer DDD-principer genom att använda domänobjekt och Result-typen.
 */
export class SupabaseOrganizationRepository implements OrganizationRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus?: EventBus
  ) {}

  async findById(id: UniqueId): Promise<Result<Organization | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          id,
          name,
          owner_id,
          created_at,
          updated_at,
          settings,
          members:organization_members(*),
          team_ids
        `)
        .eq('id', id.toString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Ingen data hittades
          return ok(null);
        }
        return err(`Databasfel vid hämtning av organisation: ${error.message}`);
      }

      if (!data) {
        return ok(null);
      }

      // Konvertera data till DTO-format
      const dto = {
        id: data.id,
        name: data.name,
        owner_id: data.owner_id,
        members: data.members,
        settings: data.settings,
        team_ids: data.team_ids || [],
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Använd OrganizationMapper för att konvertera till domänmodell
      const orgResult = OrganizationMapper.toDomain(dto);
      if (orgResult.isErr()) {
        return err(`Kunde inte mappa organisation från databasen: ${orgResult.error}`);
      }
      
      return ok(orgResult.value);
    } catch (error) {
      return err(`Fel vid hämtning av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByName(name: string): Promise<Result<Organization | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          id,
          name,
          owner_id,
          created_at,
          updated_at,
          settings,
          members:organization_members(*),
          team_ids
        `)
        .eq('name', name)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Ingen data hittades
          return ok(null);
        }
        return err(`Databasfel vid sökning efter organisationsnamn: ${error.message}`);
      }

      if (!data) {
        return ok(null);
      }

      // Konvertera data till DTO-format
      const dto = {
        id: data.id,
        name: data.name,
        owner_id: data.owner_id,
        members: data.members,
        settings: data.settings,
        team_ids: data.team_ids || [],
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Använd OrganizationMapper för att konvertera till domänmodell
      const orgResult = OrganizationMapper.toDomain(dto);
      if (orgResult.isErr()) {
        return err(`Kunde inte mappa organisation från databasen: ${orgResult.error}`);
      }
      
      return ok(orgResult.value);
    } catch (error) {
      return err(`Fel vid sökning efter organisation med namn: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async save(organization: Organization): Promise<Result<void, string>> {
    try {
      // Konvertera till DTO för datalagring
      const orgData = OrganizationMapper.toPersistence(organization);

      // Starta en transaktion för organisationsdata
      const { error: orgError } = await this.supabase
        .from('organizations')
        .upsert({
          id: orgData.id,
          name: orgData.name,
          owner_id: orgData.owner_id,
          settings: orgData.settings,
          team_ids: orgData.team_ids,
          created_at: orgData.created_at,
          updated_at: orgData.updated_at
        });

      if (orgError) {
        return err(`Fel vid sparande av organisation: ${orgError.message}`);
      }

      // Spara medlemsdata
      if (orgData.members && orgData.members.length > 0) {
        // Ta först bort alla befintliga medlemmar för att hantera borttagna medlemmar
        const { error: deleteMembersError } = await this.supabase
          .from('organization_members')
          .delete()
          .eq('organization_id', orgData.id);

        if (deleteMembersError) {
          return err(`Fel vid borttagning av organisationsmedlemmar: ${deleteMembersError.message}`);
        }

        // Lägg sedan till de aktuella medlemmarna
        const membersData = orgData.members.map(member => ({
          organization_id: orgData.id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at
        }));

        const { error: membersError } = await this.supabase
          .from('organization_members')
          .insert(membersData);

        if (membersError) {
          return err(`Fel vid sparande av organisationsmedlemmar: ${membersError.message}`);
        }
      }

      // Publicera domänevents om EventBus finns
      if (this.eventBus) {
        organization.getDomainEvents().forEach(event => {
          this.eventBus?.publish(event);
        });
        
        // Rensa domänevents efter publicering
        organization.clearEvents();
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid sparande av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      // Börja med att ta bort relaterade data
      const { error: membersError } = await this.supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', id.toString());

      if (membersError) {
        return err(`Fel vid borttagning av organisationsmedlemmar: ${membersError.message}`);
      }

      // Ta bort organisationsentiteten sist
      const { error: orgError } = await this.supabase
        .from('organizations')
        .delete()
        .eq('id', id.toString());

      if (orgError) {
        return err(`Fel vid borttagning av organisation: ${orgError.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByUserId(userId: UniqueId): Promise<Result<Organization[], string>> {
    try {
      // Hitta alla organisationer där användaren är medlem
      const { data, error } = await this.supabase
        .from('organization_members')
        .select(`
          organization_id
        `)
        .eq('user_id', userId.toString());

      if (error) {
        return err(`Databasfel vid sökning efter användarens organisationer: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return ok([]);
      }

      // Hämta fullständig information för varje organisation
      const organizations: Organization[] = [];
      for (const item of data) {
        const orgResult = await this.findById(new UniqueId(item.organization_id));
        if (orgResult.isErr()) {
          console.warn(`Kunde inte hämta organisation ${item.organization_id}: ${orgResult.error}`);
          continue;
        }
        if (orgResult.value) {
          organizations.push(orgResult.value);
        }
      }

      return ok(organizations);
    } catch (error) {
      return err(`Fel vid hämtning av användarens organisationer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(name: string): Promise<Result<boolean, string>> {
    try {
      const { data, error, count } = await this.supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('name', name);

      if (error) {
        return err(`Databasfel vid kontroll av organisationsnamn: ${error.message}`);
      }

      return ok(count !== null && count > 0);
    } catch (error) {
      return err(`Fel vid kontroll av organisationsnamn: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTeams(organizationId: UniqueId): Promise<Result<UniqueId[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('team_ids')
        .eq('id', organizationId.toString())
        .single();

      if (error) {
        return err(`Databasfel vid hämtning av teams: ${error.message}`);
      }

      if (!data || !data.team_ids) {
        return ok([]);
      }

      return ok(data.team_ids.map((id: string) => new UniqueId(id)));
    } catch (error) {
      return err(`Fel vid hämtning av teams: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addTeam(organizationId: UniqueId, teamId: UniqueId): Promise<Result<void, string>> {
    try {
      // Hämta först nuvarande team-IDs
      const teamsResult = await this.getTeams(organizationId);
      if (teamsResult.isErr()) {
        return err(`Kunde inte hämta befintliga teams: ${teamsResult.error}`);
      }

      const teams = teamsResult.value;
      
      // Kontrollera om teamet redan finns i listan
      if (teams.some(id => id.equals(teamId))) {
        return ok(undefined); // Team finns redan, inget behöver göras
      }

      // Lägg till det nya teamet
      const updatedTeams = [...teams, teamId];

      // Uppdatera organisationen
      const { error } = await this.supabase
        .from('organizations')
        .update({ 
          team_ids: updatedTeams.map(id => id.toString()),
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId.toString());

      if (error) {
        return err(`Databasfel vid tillägg av team: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid tillägg av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async removeTeam(organizationId: UniqueId, teamId: UniqueId): Promise<Result<void, string>> {
    try {
      // Hämta först nuvarande team-IDs
      const teamsResult = await this.getTeams(organizationId);
      if (teamsResult.isErr()) {
        return err(`Kunde inte hämta befintliga teams: ${teamsResult.error}`);
      }

      const teams = teamsResult.value;
      
      // Filtrera bort teamet som ska tas bort
      const updatedTeams = teams.filter(id => !id.equals(teamId));

      // Om ingen förändring skett, behöver vi inte uppdatera
      if (updatedTeams.length === teams.length) {
        return ok(undefined);
      }

      // Uppdatera organisationen
      const { error } = await this.supabase
        .from('organizations')
        .update({ 
          team_ids: updatedTeams.map(id => id.toString()),
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId.toString());

      if (error) {
        return err(`Databasfel vid borttagning av team: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 