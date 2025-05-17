import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { Organization } from '@/domain/organization/entities/Organization';
import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationDTO } from '@/domain/organization/entities/OrganizationDTO';

/**
 * Implementation av OrganizationRepository med Supabase som datalagring
 */
export class SupabaseOrganizationRepository implements OrganizationRepository {
  private supabase: SupabaseClient;
  private readonly tableName = 'organizations';

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Hitta en organisation baserat på ID
   */
  async findById(id: string): Promise<Result<Organization, Error>> {
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
        return err(new Error(`Hittade ingen organisation med ID ${id}`));
      }

      const organizationResult = Organization.create(data as OrganizationDTO);
      return organizationResult;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid hämtning av organisation'));
    }
  }

  /**
   * Hitta organisationer baserat på användar-ID
   */
  async findByUserId(userId: string): Promise<Result<Organization[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .contains('members', [{ userId }]);

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      const organizations: Organization[] = [];

      for (const item of data || []) {
        const organizationResult = Organization.create(item as OrganizationDTO);
        if (organizationResult.isOk()) {
          organizations.push(organizationResult.value);
        }
      }

      return ok(organizations);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid hämtning av användarorganisationer'));
    }
  }

  /**
   * Spara en organisation
   */
  async save(organization: Organization): Promise<Result<Organization, Error>> {
    try {
      const organizationDTO = organization.toDTO();
      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(organizationDTO)
        .select()
        .single();

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      if (!data) {
        return err(new Error('Kunde inte spara organisationen'));
      }

      const savedOrganizationResult = Organization.create(data as OrganizationDTO);
      return savedOrganizationResult;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid sparande av organisation'));
    }
  }

  /**
   * Ta bort en organisation
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
      return err(error instanceof Error ? error : new Error('Okänt fel vid borttagning av organisation'));
    }
  }

  /**
   * Sök efter organisationer med söksträng
   */
  async search(query: string): Promise<Result<Organization[], Error>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      if (error) {
        return err(new Error(`Databasfel: ${error.message}`));
      }

      const organizations: Organization[] = [];

      for (const item of data || []) {
        const organizationResult = Organization.create(item as OrganizationDTO);
        if (organizationResult.isOk()) {
          organizations.push(organizationResult.value);
        }
      }

      return ok(organizations);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid sökning av organisationer'));
    }
  }
} 