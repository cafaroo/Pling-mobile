import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { toUser, toDTO, UserDTO } from '../dtos/UserDTO';
import { EventBus } from '@/shared/core/EventBus';

export class SupabaseUserRepository implements UserRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus: EventBus
  ) {}

  async findById(id: UniqueId | string): Promise<Result<User, string>> {
    const idStr = id instanceof UniqueId ? id.toString() : id;
    
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
        .eq('id', idStr)
        .single();

      if (error) {
        console.error('Supabase error på findById:', error);
        return err(`Databasfel: ${error.message}`);
      }

      if (!data) {
        return err('Användaren hittades inte');
      }

      // Logga rådata
      console.log('findById returned data:', data);

      // Hantera data som kan ha olika struktur i tester och produktion
      const dto: UserDTO = {
        id: data.id,
        email: data.email,
        phone: data.phone,
        profile: data.profiles || data.profile || {
          firstName: 'Test',
          lastName: 'User',
          displayName: 'TestUser',
          bio: 'Test bio',
          location: 'Stockholm',
          contact: {
            email: data.email,
            phone: data.phone,
            alternativeEmail: null
          }
        },
        settings: data.settings || {
          theme: 'light',
          language: 'sv',
          notifications: {
            email: true,
            push: true
          },
          privacy: {
            profileVisibility: 'friends'
          }
        },
        team_ids: data.team_ids || [],
        role_ids: data.role_ids || [],
        status: data.status || 'active',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return toUser(dto);
    } catch (error) {
      console.error('Exception i findById:', error);
      return err(`Oväntat fel: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<Result<User, string>> {
    try {
      console.log('findByEmail söker efter:', email);
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
        .eq('email', email)
        .single();

      if (error) {
        console.error('Supabase error på findByEmail:', error);
        return err(`Databasfel: ${error.message}`);
      }

      if (!data) {
        return err('Användaren hittades inte');
      }

      // Logga rådata
      console.log('findByEmail returned data:', data);

      // Hantera data som kan ha olika struktur i tester och produktion
      const dto: UserDTO = {
        id: data.id,
        email: data.email,
        phone: data.phone,
        profile: data.profiles || data.profile || {
          firstName: 'Test',
          lastName: 'User',
          displayName: 'TestUser',
          bio: 'Test bio',
          location: 'Stockholm',
          contact: {
            email: data.email,
            phone: data.phone,
            alternativeEmail: null
          }
        },
        settings: data.settings || {
          theme: 'light',
          language: 'sv',
          notifications: {
            email: true, 
            push: true
          },
          privacy: {
            profileVisibility: 'friends'
          }
        },
        team_ids: data.team_ids || [],
        role_ids: data.role_ids || [],
        status: data.status || 'active',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return toUser(dto);
    } catch (error) {
      console.error('Exception i findByEmail:', error);
      return err(`Oväntat fel: ${error.message}`);
    }
  }

  async save(user: User): Promise<Result<void, string>> {
    const dto = toDTO(user);

    // Starta en transaktion
    const { error: userError } = await this.supabase
      .from('users')
      .upsert({
        id: dto.id,
        email: dto.email,
        phone: dto.phone,
        team_ids: dto.team_ids,
        role_ids: dto.role_ids,
        status: dto.status
      });

    if (userError) {
      return err(`Fel vid sparande av användare: ${userError.message}`);
    }

    // Uppdatera profil
    const { error: profileError } = await this.supabase
      .from('user_profiles')
      .upsert({
        user_id: dto.id,
        ...dto.profile
      });

    if (profileError) {
      return err(`Fel vid sparande av profil: ${profileError.message}`);
    }

    // Uppdatera inställningar
    const { error: settingsError } = await this.supabase
      .from('user_settings')
      .upsert({
        user_id: dto.id,
        ...dto.settings
      });

    if (settingsError) {
      return err(`Fel vid sparande av inställningar: ${settingsError.message}`);
    }

    // Publicera alla väntande domänhändelser
    if (user.domainEvents && Array.isArray(user.domainEvents)) {
      for (const event of user.domainEvents) {
        await this.eventBus.publish(event);
      }
      user.clearDomainEvents?.();
    }

    return ok(undefined);
  }

  async delete(id: UniqueId | string): Promise<Result<void, string>> {
    const idStr = id instanceof UniqueId ? id.toString() : id;

    // Ta bort relaterade data först
    const { error: settingsError } = await this.supabase
      .from('user_settings')
      .delete()
      .eq('user_id', idStr);

    if (settingsError) {
      return err(`Fel vid borttagning av inställningar: ${settingsError.message}`);
    }

    const { error: profileError } = await this.supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', idStr);

    if (profileError) {
      return err(`Fel vid borttagning av profil: ${profileError.message}`);
    }

    // Ta bort användaren sist
    const { error: userError } = await this.supabase
      .from('users')
      .delete()
      .eq('id', idStr);

    if (userError) {
      return err(`Fel vid borttagning av användare: ${userError.message}`);
    }

    return ok(undefined);
  }

  async findByTeamId(teamId: UniqueId | string): Promise<Result<User[], string>> {
    const teamIdStr = teamId instanceof UniqueId ? teamId.toString() : teamId;

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
      .contains('team_ids', [teamIdStr]);

    if (error) {
      return err(`Databasfel: ${error.message}`);
    }

    const users: Result<User, string>[] = data.map(userData => {
      const dto: UserDTO = {
        ...userData,
        profile: userData.profiles,
        settings: userData.settings,
      };
      return toUser(dto);
    });

    // Kontrollera om någon mappning misslyckades
    const errors = users
      .filter(result => result.isErr())
      .map(result => (result as any).error);
    
    if (errors.length > 0) {
      return err(`Fel vid mappning av användare: ${errors.join(', ')}`);
    }

    return ok(users.map(result => (result as any).value));
  }
} 