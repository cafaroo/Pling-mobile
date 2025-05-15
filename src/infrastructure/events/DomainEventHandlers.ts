import { DomainEventPublisher } from './DomainEventPublisher';
import { Logger } from '../logger/Logger';
import { TeamEventHandlerFactory } from '@/application/team/eventHandlers/TeamEventHandlerFactory';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { SupabaseTeamRepository } from '../repositories/SupabaseTeamRepository';
import { SupabaseUserRepository } from '../repositories/SupabaseUserRepository';

/**
 * Initaliserar och registrerar alla domän event handlers
 * 
 * Denna klass ansvarar för att:
 * 1. Skapa en DomainEventPublisher 
 * 2. Registrera alla domän-specifika event handlers
 * 3. Tillhandahålla metoder för att publicera events
 */
export class DomainEventHandlerInitializer {
  private static _instance: DomainEventHandlerInitializer;
  private _publisher: DomainEventPublisher;
  private _initialized: boolean = false;
  
  private constructor(private logger: Logger) {
    this._publisher = new DomainEventPublisher(logger);
  }
  
  /**
   * Initierar event handlers med repositories och övriga beroenden
   */
  public initialize(
    teamRepository: TeamRepository,
    userRepository: UserRepository,
    // Övriga repositories läggs till här
  ): void {
    if (this._initialized) {
      this.logger.warn('DomainEventHandlers already initialized');
      return;
    }
    
    // Registrera team-relaterade event handlers
    TeamEventHandlerFactory.initializeHandlers(
      this._publisher,
      teamRepository,
      userRepository
    );
    
    // Här läggs ytterligare domänspecifika handlers till
    // UserEventHandlerFactory.initializeHandlers(...);
    // OrganizationEventHandlerFactory.initializeHandlers(...);
    
    this._initialized = true;
    this.logger.info('DomainEventHandlers initialized successfully');
  }
  
  /**
   * Returnerar DomainEventPublisher-instansen
   */
  public get publisher(): DomainEventPublisher {
    return this._publisher;
  }
  
  /**
   * Singleton-instans av initializer
   */
  public static getInstance(logger: Logger): DomainEventHandlerInitializer {
    if (!DomainEventHandlerInitializer._instance) {
      DomainEventHandlerInitializer._instance = new DomainEventHandlerInitializer(logger);
    }
    return DomainEventHandlerInitializer._instance;
  }
  
  /**
   * Initierar alla event handlers med Supabase repositories
   * Enkel hjälpmetod för att konfigurera med standardberoenden
   */
  public static initializeWithDefaultRepositories(
    logger: Logger,
    supabaseTeamRepository: SupabaseTeamRepository,
    supabaseUserRepository: SupabaseUserRepository
  ): DomainEventHandlerInitializer {
    const instance = DomainEventHandlerInitializer.getInstance(logger);
    
    instance.initialize(
      supabaseTeamRepository,
      supabaseUserRepository
    );
    
    return instance;
  }
} 