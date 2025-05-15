import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { Email } from '@/domain/user/value-objects/Email';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserMapper } from '../mappers/UserMapper';
import { EventBus } from '@/infrastructure/events/EventBus';

/**
 * SupabaseUserRepository
 * 
 * Implementation av UserRepository med Supabase som datakälla.
 * Följer DDD-principer genom att använda domänobjekt och Result-typen.
 */
export class SupabaseUserRepository implements UserRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus?: EventBus
  ) {}

  async findById(id: UniqueId): Promise<Result<User | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          phone,
          created_at,
          updated_at,
          profiles:user_profiles(*),
          settings:user_settings(*),
          team_ids,
          role_ids,
          status
        `)
        .eq('id', id.toString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Ingen data hittades
          return ok(null);
        }
        return err(`Databasfel vid hämtning av användare: ${error.message}`);
      }

      if (!data) {
        return ok(null);
      }

      // Konvertera data till DTO-format
      const dto = {
        id: data.id,
        email: data.email,
        phone: data.phone,
        profile: data.profiles,
        settings: data.settings,
        team_ids: data.team_ids || [],
        role_ids: data.role_ids || [],
        status: data.status || 'active',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Använd UserMapper för att konvertera till domänmodell
      const userResult = UserMapper.toDomain(dto);
      if (userResult.isErr()) {
        return err(`Kunde inte mappa användare från databasen: ${userResult.error}`);
      }
      
      return ok(userResult.value);
    } catch (error) {
      return err(`Fel vid hämtning av användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByEmail(email: Email): Promise<Result<User | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          phone,
          created_at,
          updated_at,
          profiles:user_profiles(*),
          settings:user_settings(*),
          team_ids,
          role_ids,
          status
        `)
        .eq('email', email.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Ingen data hittades
          return ok(null);
        }
        return err(`Databasfel vid sökning efter e-post: ${error.message}`);
      }

      if (!data) {
        return ok(null);
      }

      // Konvertera data till DTO-format
      const dto = {
        id: data.id,
        email: data.email,
        phone: data.phone,
        profile: data.profiles,
        settings: data.settings,
        team_ids: data.team_ids || [],
        role_ids: data.role_ids || [],
        status: data.status || 'active',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Använd UserMapper för att konvertera till domänmodell
      const userResult = UserMapper.toDomain(dto);
      if (userResult.isErr()) {
        return err(`Kunde inte mappa användare från databasen: ${userResult.error}`);
      }
      
      return ok(userResult.value);
    } catch (error) {
      return err(`Fel vid sökning efter användare med e-post: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async save(user: User): Promise<Result<void, string>> {
    try {
      // Konvertera till DTO för datalagring
      const userData = UserMapper.toPersistence(user);

      // Starta en transaktion för användardata
      const { error: userError } = await this.supabase
        .from('users')
        .upsert({
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
          team_ids: userData.team_ids,
          role_ids: userData.role_ids,
          status: userData.status,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        });

      if (userError) {
        return err(`Fel vid sparande av användare: ${userError.message}`);
      }

      // Spara profildata om det finns
      if (userData.profile) {
        const { error: profileError } = await this.supabase
          .from('user_profiles')
          .upsert({
            user_id: userData.id,
            ...userData.profile,
            updated_at: userData.updated_at
          });

        if (profileError) {
          return err(`Fel vid sparande av användarprofil: ${profileError.message}`);
        }
      }

      // Spara inställningar om det finns
      if (userData.settings) {
        const { error: settingsError } = await this.supabase
          .from('user_settings')
          .upsert({
            user_id: userData.id,
            ...userData.settings,
            updated_at: userData.updated_at
          });

        if (settingsError) {
          return err(`Fel vid sparande av användarinställningar: ${settingsError.message}`);
        }
      }

      // Publicera domänevents om EventBus finns
      if (this.eventBus) {
        user.getDomainEvents().forEach(event => {
          this.eventBus?.publish(event);
        });
        
        // Rensa domänevents efter publicering
        user.clearEvents();
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid sparande av användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      // Börja med att ta bort relaterade data
      const { error: profileError } = await this.supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', id.toString());

      if (profileError) {
        return err(`Fel vid borttagning av användarprofil: ${profileError.message}`);
      }

      const { error: settingsError } = await this.supabase
        .from('user_settings')
        .delete()
        .eq('user_id', id.toString());

      if (settingsError) {
        return err(`Fel vid borttagning av användarinställningar: ${settingsError.message}`);
      }

      // Ta bort användarentiteten sist
      const { error: userError } = await this.supabase
        .from('users')
        .delete()
        .eq('id', id.toString());

      if (userError) {
        return err(`Fel vid borttagning av användare: ${userError.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByTeamId(teamId: UniqueId): Promise<Result<User[], string>> {
    try {
      // Hitta användare som är medlemmar i ett team baserat på team_ids-arrayen
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          phone,
          created_at,
          updated_at,
          profiles:user_profiles(*),
          settings:user_settings(*),
          team_ids,
          role_ids,
          status
        `)
        .contains('team_ids', [teamId.toString()]);

      if (error) {
        return err(`Databasfel vid sökning efter teammedlemmar: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return ok([]);
      }

      // Konvertera data till domänmodeller
      const users: User[] = [];
      for (const userData of data) {
        const dto = {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
          profile: userData.profiles,
          settings: userData.settings,
          team_ids: userData.team_ids || [],
          role_ids: userData.role_ids || [],
          status: userData.status || 'active',
          created_at: userData.created_at,
          updated_at: userData.updated_at
        };

        const userResult = UserMapper.toDomain(dto);
        if (userResult.isErr()) {
          console.warn(`Kunde inte mappa användare: ${userResult.error}`);
          continue;
        }
        users.push(userResult.value);
      }

      return ok(users);
    } catch (error) {
      return err(`Fel vid hämtning av användare för team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async search(query: string, limit: number = 10): Promise<Result<User[], string>> {
    try {
      // Sök efter användare baserat på e-post, namn eller användarnamn
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          phone,
          created_at,
          updated_at,
          profiles:user_profiles(*),
          settings:user_settings(*),
          team_ids,
          role_ids,
          status
        `)
        .or(`email.ilike.%${query}%,profiles.firstName.ilike.%${query}%,profiles.lastName.ilike.%${query}%,profiles.displayName.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        return err(`Databasfel vid sökning efter användare: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return ok([]);
      }

      // Konvertera data till domänmodeller
      const users: User[] = [];
      for (const userData of data) {
        const dto = {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
          profile: userData.profiles,
          settings: userData.settings,
          team_ids: userData.team_ids || [],
          role_ids: userData.role_ids || [],
          status: userData.status || 'active',
          created_at: userData.created_at,
          updated_at: userData.updated_at
        };

        const userResult = UserMapper.toDomain(dto);
        if (userResult.isErr()) {
          console.warn(`Kunde inte mappa användare: ${userResult.error}`);
          continue;
        }
        users.push(userResult.value);
      }

      return ok(users);
    } catch (error) {
      return err(`Fel vid sökning efter användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(email: Email): Promise<Result<boolean, string>> {
    try {
      const { data, error, count } = await this.supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('email', email.value);

      if (error) {
        return err(`Databasfel vid kontroll av e-post: ${error.message}`);
      }

      return ok(count !== null && count > 0);
    } catch (error) {
      return err(`Fel vid kontroll av e-post: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateStatus(id: UniqueId, status: 'pending' | 'active' | 'inactive' | 'blocked'): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id.toString());

      if (error) {
        return err(`Databasfel vid uppdatering av status: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid uppdatering av användarstatus: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 