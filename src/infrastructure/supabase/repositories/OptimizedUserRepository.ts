import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { toUser, toDTO, UserDTO } from '../dtos/UserDTO';
import { EventBus } from '@/shared/core/EventBus';
import { CacheService } from '../../cache/CacheService';
import { LoggingService } from '../../logger/LoggingService';
import { PerformanceMonitor, OperationType } from '../../monitoring/PerformanceMonitor';

/**
 * Optimerad användardatabas-åtkomst med caching, loggning och prestandaövervakning
 */
export class OptimizedUserRepository implements UserRepository {
  private readonly cacheService: CacheService;
  private readonly logger: LoggingService;
  private readonly performance: PerformanceMonitor;
  private readonly cacheKeyPrefix = 'user';
  
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus: EventBus
  ) {
    this.cacheService = new CacheService('users', {
      ttl: 15 * 60 * 1000, // 15 minuter cachning
      version: '1.0',
      debug: false
    });
    
    this.logger = LoggingService.getInstance();
    this.performance = PerformanceMonitor.getInstance();
  }

  /**
   * Hämta användare via ID med caching och prestandaövervakning
   */
  async findById(id: UniqueId | string): Promise<Result<User, string>> {
    const idStr = id instanceof UniqueId ? id.toString() : id;
    const cacheKey = `${this.cacheKeyPrefix}_${idStr}`;
    
    // Försök hämta från cache först
    try {
      const cachedUser = await this.cacheService.get<Result<User, string>>(cacheKey);
      if (cachedUser) {
        this.logger.debug(`Cache hit för användare: ${idStr}`);
        return cachedUser;
      }
    } catch (error) {
      this.logger.error(`Fel vid cachehämtning: ${error}`);
      // Fortsätt med databasåtkomst vid fel
    }
    
    // Mät databasåtkomst
    return this.performance.measure(
      OperationType.DATABASE_READ,
      'findUserById',
      async () => {
        try {
          // Försök först med standardapproachen
          const { data, error } = await this.supabase
            .from('users')
            .select(`
              id,
              email,
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
            this.logger.warning(`Fel vid hämtning från optimerat repository, provar standard: [${error.message}]`);
            
            // Om standardapproachen misslyckas, prova med en alternativ strategi
            const { data: userData, error: userError } = await this.supabase
              .from('users')
              .select('id, email, created_at, updated_at, team_ids, role_ids, status')
              .eq('id', idStr)
              .single();
              
            if (userError) {
              const errorMsg = `Databasfel vid hämtning av användare: ${userError.message}`;
              this.logger.error(errorMsg, { userId: idStr, code: userError.code });
              return err(errorMsg);
            }
            
            // Hämta profil i separata anrop
            const { data: profileData, error: profileError } = await this.supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', idStr)
              .single();
              
            if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = ingen post hittades
              const errorMsg = `Databasfel vid hämtning av profil: ${profileError.message}`;
              this.logger.error(errorMsg, { userId: idStr, code: profileError.code });
              return err(errorMsg);
            }
            
            // Hämta inställningar i separata anrop
            const { data: settingsData, error: settingsError } = await this.supabase
              .from('user_settings')
              .select('*')
              .eq('user_id', idStr)
              .single();
              
            if (settingsError && settingsError.code !== 'PGRST116') {
              const errorMsg = `Databasfel vid hämtning av inställningar: ${settingsError.message}`;
              this.logger.error(errorMsg, { userId: idStr, code: settingsError.code });
              return err(errorMsg);
            }
            
            // Kombinera resultaten
            const dto: UserDTO = {
              ...userData,
              profile: profileData || {},
              settings: settingsData || {}
            };
            
            const result = toUser(dto);
            
            // Cacha resultatet
            if (result.isOk()) {
              this.cacheService.set(cacheKey, result).catch(error => {
                this.logger.error(`Fel vid cachning: ${error}`);
              });
            }
            
            return result;
          }

          if (!data) {
            const errorMsg = 'Användaren hittades inte';
            this.logger.warning(errorMsg, { userId: idStr });
            return err(errorMsg);
          }

          // Omstrukturera data för att matcha UserDTO
          const dto: UserDTO = {
            ...data,
            profile: data.profiles,
            settings: data.settings,
          };

          const result = toUser(dto);
          
          // Cacha resultatet
          if (result.isOk()) {
            this.cacheService.set(cacheKey, result).catch(error => {
              this.logger.error(`Fel vid cachning: ${error}`);
            });
          }
          
          return result;
        } catch (unexpectedError) {
          const errorMsg = `Oväntat fel: ${unexpectedError}`;
          this.logger.error(errorMsg, { userId: idStr });
          return err(errorMsg);
        }
      },
      { userId: idStr }
    );
  }

  /**
   * Hämta användare via e-post med caching och prestandaövervakning
   */
  async findByEmail(email: string): Promise<Result<User, string>> {
    const cacheKey = `${this.cacheKeyPrefix}_email_${email}`;
    
    // Försök hämta från cache först
    try {
      const cachedUser = await this.cacheService.get<Result<User, string>>(cacheKey);
      if (cachedUser) {
        this.logger.debug(`Cache hit för e-post: ${email}`);
        return cachedUser;
      }
    } catch (error) {
      this.logger.error(`Fel vid cachehämtning: ${error}`);
      // Fortsätt med databasåtkomst vid fel
    }
    
    // Mät databasåtkomst
    return this.performance.measure(
      OperationType.DATABASE_READ,
      'findUserByEmail',
      async () => {
        try {
          // Försök först med standardapproachen
          const { data, error } = await this.supabase
            .from('users')
            .select(`
              id,
              email,
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
            this.logger.warning(`Fel vid hämtning från optimerat repository, provar standard: [${error.message}]`);
            
            // Om standardapproachen misslyckas, prova med en alternativ strategi
            const { data: userData, error: userError } = await this.supabase
              .from('users')
              .select('id, email, created_at, updated_at, team_ids, role_ids, status')
              .eq('email', email)
              .single();
              
            if (userError) {
              const errorMsg = `Databasfel vid hämtning av användare: ${userError.message}`;
              this.logger.error(errorMsg, { email, code: userError.code });
              return err(errorMsg);
            }
            
            // Hämta profil i separata anrop
            const { data: profileData, error: profileError } = await this.supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', userData.id)
              .single();
              
            if (profileError && profileError.code !== 'PGRST116') {
              const errorMsg = `Databasfel vid hämtning av profil: ${profileError.message}`;
              this.logger.error(errorMsg, { email, userId: userData.id, code: profileError.code });
              return err(errorMsg);
            }
            
            // Hämta inställningar i separata anrop
            const { data: settingsData, error: settingsError } = await this.supabase
              .from('user_settings')
              .select('*')
              .eq('user_id', userData.id)
              .single();
              
            if (settingsError && settingsError.code !== 'PGRST116') {
              const errorMsg = `Databasfel vid hämtning av inställningar: ${settingsError.message}`;
              this.logger.error(errorMsg, { email, userId: userData.id, code: settingsError.code });
              return err(errorMsg);
            }
            
            // Kombinera resultaten
            const dto: UserDTO = {
              ...userData,
              profile: profileData || {},
              settings: settingsData || {}
            };
            
            const result = toUser(dto);
            
            // Cacha resultatet
            if (result.isOk()) {
              this.cacheService.set(cacheKey, result).catch(error => {
                this.logger.error(`Fel vid cachning: ${error}`);
              });
              
              // Cacha också per ID för att upprätthålla konsistens
              const user = result.value;
              this.cacheService.set(`${this.cacheKeyPrefix}_${user.id.toString()}`, result).catch(error => {
                this.logger.error(`Fel vid cachning: ${error}`);
              });
            }
            
            return result;
          }
          
          if (!data) {
            const errorMsg = 'Användaren hittades inte';
            this.logger.warning(errorMsg, { email });
            return err(errorMsg);
          }

          // Omstrukturera data för att matcha UserDTO
          const dto: UserDTO = {
            ...data,
            profile: data.profiles,
            settings: data.settings,
          };

          const result = toUser(dto);
          
          // Cacha resultatet
          if (result.isOk()) {
            this.cacheService.set(cacheKey, result).catch(error => {
              this.logger.error(`Fel vid cachning: ${error}`);
            });
          }
          
          return result;
        } catch (unexpectedError) {
          const errorMsg = `Oväntat fel: ${unexpectedError}`;
          this.logger.error(errorMsg, { email });
          return err(errorMsg);
        }
      },
      { email }
    );
  }

  /**
   * Spara användare med prestandaövervakning och cache-rensning
   */
  async save(user: User): Promise<Result<void, string>> {
    return this.performance.measure(
      OperationType.DATABASE_WRITE,
      'saveUser',
      async () => {
        const dto = toDTO(user);
        const userId = dto.id;
        
        this.logger.info(`Sparar användare: ${userId}`);
        
        // Batched insert (en enda transaktion)
        try {
          // Starta en transaktion
          const { error: userError } = await this.supabase
            .from('users')
            .upsert({
              id: dto.id,
              email: dto.email,
              team_ids: dto.team_ids,
              role_ids: dto.role_ids,
              status: dto.status
            });

          if (userError) {
            const errorMsg = `Fel vid sparande av användare: ${userError.message}`;
            this.logger.error(errorMsg, { userId, code: userError.code });
            return err(errorMsg);
          }

          // Uppdatera profil
          const { error: profileError } = await this.supabase
            .from('user_profiles')
            .upsert({
              user_id: dto.id,
              ...dto.profile
            });

          if (profileError) {
            const errorMsg = `Fel vid sparande av profil: ${profileError.message}`;
            this.logger.error(errorMsg, { userId, code: profileError.code });
            return err(errorMsg);
          }

          // Uppdatera inställningar
          const { error: settingsError } = await this.supabase
            .from('user_settings')
            .upsert({
              user_id: dto.id,
              ...dto.settings
            });

          if (settingsError) {
            const errorMsg = `Fel vid sparande av inställningar: ${settingsError.message}`;
            this.logger.error(errorMsg, { userId, code: settingsError.code });
            return err(errorMsg);
          }

          // Publicera alla väntande domänhändelser
          for (const event of user.domainEvents) {
            await this.eventBus.publish(event);
          }
          user.clearDomainEvents();
          
          // Rensa alla cachenycklar relaterade till användaren
          await this.invalidateCacheForUser(user);

          this.logger.info(`Användare sparad: ${userId}`);
          return ok(undefined);
          
        } catch (error) {
          const errorMsg = `Oväntat fel vid sparande: ${error}`;
          this.logger.error(errorMsg, { userId });
          return err(errorMsg);
        }
      },
      { userId: user.id.toString() }
    );
  }

  /**
   * Ta bort användare med prestandaövervakning och cache-rensning
   */
  async delete(id: UniqueId | string): Promise<Result<void, string>> {
    const idStr = id instanceof UniqueId ? id.toString() : id;
    
    return this.performance.measure(
      OperationType.DATABASE_WRITE,
      'deleteUser',
      async () => {
        this.logger.info(`Tar bort användare: ${idStr}`);

        // Ta bort relaterade data först
        const { error: settingsError } = await this.supabase
          .from('user_settings')
          .delete()
          .eq('user_id', idStr);

        if (settingsError) {
          const errorMsg = `Fel vid borttagning av inställningar: ${settingsError.message}`;
          this.logger.error(errorMsg, { userId: idStr, code: settingsError.code });
          return err(errorMsg);
        }

        const { error: profileError } = await this.supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', idStr);

        if (profileError) {
          const errorMsg = `Fel vid borttagning av profil: ${profileError.message}`;
          this.logger.error(errorMsg, { userId: idStr, code: profileError.code });
          return err(errorMsg);
        }

        // Ta bort användaren sist
        const { error: userError } = await this.supabase
          .from('users')
          .delete()
          .eq('id', idStr);

        if (userError) {
          const errorMsg = `Fel vid borttagning av användare: ${userError.message}`;
          this.logger.error(errorMsg, { userId: idStr, code: userError.code });
          return err(errorMsg);
        }
        
        // Rensa cache för användaren
        await this.invalidateCacheForUserId(idStr);
        
        this.logger.info(`Användare borttagen: ${idStr}`);
        return ok(undefined);
      },
      { userId: idStr }
    );
  }

  /**
   * Hämta användare per team med prestandaövervakning och caching
   */
  async findByTeamId(teamId: UniqueId | string): Promise<Result<User[], string>> {
    const teamIdStr = teamId instanceof UniqueId ? teamId.toString() : teamId;
    const cacheKey = `${this.cacheKeyPrefix}_team_${teamIdStr}`;
    
    // Försök hämta från cache först
    try {
      const cachedUsers = await this.cacheService.get<Result<User[], string>>(cacheKey);
      if (cachedUsers) {
        this.logger.debug(`Cache hit för team: ${teamIdStr}`);
        return cachedUsers;
      }
    } catch (error) {
      this.logger.error(`Fel vid cachehämtning: ${error}`);
      // Fortsätt med databasåtkomst vid fel
    }
    
    // Mät databasåtkomst
    return this.performance.measure(
      OperationType.DATABASE_READ,
      'findUsersByTeamId',
      async () => {
        // Kör optimerad fråga med indexerat contains
        const { data, error } = await this.supabase
          .from('users')
          .select(`
            id,
            email,
            created_at,
            updated_at,
            profiles:user_profiles(*),
            settings:user_settings(*),
            team_ids,
            role_ids,
            status
          `)
          .filter('team_ids', 'cs', `{${teamIdStr}}`);  // Använd contains istället för equals

        if (error) {
          const errorMsg = `Databasfel: ${error.message}`;
          this.logger.error(errorMsg, { teamId: teamIdStr, code: error.code });
          return err(errorMsg);
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
          const errorMsg = `Fel vid mappning av användare: ${errors.join(', ')}`;
          this.logger.error(errorMsg, { teamId: teamIdStr });
          return err(errorMsg);
        }

        const result = ok(users.map(result => (result as any).value));
        
        // Cacha resultatet
        this.cacheService.set(cacheKey, result).catch(error => {
          this.logger.error(`Fel vid cachning: ${error}`);
        });
        
        // Cacha även individuella användare
        const validUsers = users.filter(u => u.isOk()).map(u => (u as any).value);
        for (const user of validUsers) {
          this.cacheService.set(`${this.cacheKeyPrefix}_${user.id.toString()}`, ok(user)).catch(error => {
            this.logger.error(`Fel vid cachning: ${error}`);
          });
        }
        
        return result;
      },
      { teamId: teamIdStr }
    );
  }
  
  /**
   * Rensa alla cachetposter relaterade till en användare
   */
  private async invalidateCacheForUser(user: User): Promise<void> {
    await this.invalidateCacheForUserId(user.id.toString());
    
    // Om användarens e-post är känd, rensa även den cacheposten
    const email = user.email?.value;
    if (email) {
      await this.cacheService.remove(`${this.cacheKeyPrefix}_email_${email}`);
    }
    
    // Rensa teamrelaterade cacheposer
    for (const teamId of user.teamIds) {
      await this.cacheService.remove(`${this.cacheKeyPrefix}_team_${teamId.toString()}`);
    }
  }
  
  /**
   * Rensa alla cachetposter relaterade till ett användar-ID
   */
  private async invalidateCacheForUserId(userId: string): Promise<void> {
    await this.cacheService.remove(`${this.cacheKeyPrefix}_${userId}`);
    
    // Logga cacheinvalidering
    this.logger.debug(`Cache invaliderad för användare: ${userId}`);
  }
} 