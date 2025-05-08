import { SupabaseClient } from '@supabase/supabase-js';
import { EventBus } from '@/shared/core/EventBus';
import { OptimizedUserRepository } from './supabase/repositories/OptimizedUserRepository';
import { CacheService } from './cache/CacheService';
import { LoggingService, LogLevel } from './logger/LoggingService';
import { PerformanceMonitor } from './monitoring/PerformanceMonitor';
import { SupabaseTeamActivityRepository } from './supabase/repositories/SupabaseTeamActivityRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { OptimizedTeamActivityRepository } from './supabase/repositories/OptimizedTeamActivityRepository';

/**
 * Konfigurationsalternativ för infrastruktur
 */
export interface InfrastructureConfig {
  /**
   * Om loggning ska aktiveras
   */
  enableLogging?: boolean;
  
  /**
   * Minimal loggnivå
   */
  logLevel?: LogLevel;
  
  /**
   * Om fjärrloggning ska aktiveras
   */
  enableRemoteLogging?: boolean;
  
  /**
   * URL för fjärrloggning
   */
  remoteLoggingUrl?: string;
  
  /**
   * Om prestandaövervakning ska aktiveras
   */
  enablePerformanceMonitoring?: boolean;
  
  /**
   * Tröskel för långsamma operationer (ms)
   */
  slowOperationThreshold?: number;
  
  /**
   * Rapporteringsintervall för prestandastatistik (ms)
   */
  performanceReportInterval?: number;
  
  /**
   * Cachningens livslängd (Time To Live) i ms
   */
  cacheTtl?: number;
  
  /**
   * Cachversion för invalidering
   */
  cacheVersion?: string;
  
  /**
   * Om debug-loggning ska aktiveras för cache
   */
  enableCacheDebug?: boolean;
  
  /**
   * Användaranalytik-callback
   */
  analyticsCallback?: (event: string, properties?: Record<string, any>) => void;
}

/**
 * Factory-klass för att konfigurera och tillhandahålla infrastrukturtjänster
 */
export class InfrastructureFactory {
  private static instance: InfrastructureFactory;
  
  private readonly supabase: SupabaseClient;
  private readonly eventBus: EventBus;
  private readonly config: InfrastructureConfig;
  
  private userRepository?: OptimizedUserRepository;
  private cacheService?: CacheService;
  private teamActivityRepository?: SupabaseTeamActivityRepository;
  
  private constructor(
    supabase: SupabaseClient,
    eventBus: EventBus,
    config: InfrastructureConfig = {}
  ) {
    this.supabase = supabase;
    this.eventBus = eventBus;
    this.config = config;
    
    // Initiera loggningstjänst
    LoggingService.getInstance({
      minLevel: config.logLevel ?? LogLevel.INFO,
      remoteLogging: config.enableRemoteLogging,
      remoteUrl: config.remoteLoggingUrl,
      analyticsCallback: config.analyticsCallback
    });
    
    // Initiera prestandaövervakning
    PerformanceMonitor.getInstance({
      enabled: config.enablePerformanceMonitoring !== false,
      slowThreshold: config.slowOperationThreshold,
      remoteReporting: config.enableRemoteLogging,
      reportingInterval: config.performanceReportInterval
    });
  }
  
  /**
   * Hämta instans av infrastructure factory
   */
  public static getInstance(
    supabase: SupabaseClient,
    eventBus: EventBus,
    config?: InfrastructureConfig
  ): InfrastructureFactory {
    if (!InfrastructureFactory.instance) {
      InfrastructureFactory.instance = new InfrastructureFactory(
        supabase,
        eventBus,
        config
      );
    }
    
    return InfrastructureFactory.instance;
  }
  
  /**
   * Uppdatera konfiguration
   */
  public updateConfig(config: Partial<InfrastructureConfig>): void {
    // Uppdatera loggningstjänst
    LoggingService.getInstance({
      minLevel: config.logLevel ?? this.config.logLevel ?? LogLevel.INFO,
      remoteLogging: config.enableRemoteLogging ?? this.config.enableRemoteLogging,
      remoteUrl: config.remoteLoggingUrl ?? this.config.remoteLoggingUrl,
      analyticsCallback: config.analyticsCallback ?? this.config.analyticsCallback
    });
    
    // Uppdatera prestandaövervakning
    PerformanceMonitor.getInstance({
      enabled: config.enablePerformanceMonitoring ?? this.config.enablePerformanceMonitoring,
      slowThreshold: config.slowOperationThreshold ?? this.config.slowOperationThreshold,
      remoteReporting: config.enableRemoteLogging ?? this.config.enableRemoteLogging,
      reportingInterval: config.performanceReportInterval ?? this.config.performanceReportInterval
    });
    
    // Uppdatera cachningens version om den ändrats
    if (config.cacheVersion && config.cacheVersion !== this.config.cacheVersion) {
      if (this.cacheService) {
        this.cacheService.updateOptions({
          version: config.cacheVersion
        });
      }
    }
    
    // Uppdatera konfiguration
    Object.assign(this.config, config);
  }
  
  /**
   * Hämta cachetjänst
   */
  public getCacheService(namespace: string = 'app'): CacheService {
    if (!this.cacheService) {
      this.cacheService = new CacheService(namespace, {
        ttl: this.config.cacheTtl,
        version: this.config.cacheVersion,
        debug: this.config.enableCacheDebug
      });
    }
    
    return this.cacheService;
  }
  
  /**
   * Hämta optimerad användarrepository
   */
  public getUserRepository(): OptimizedUserRepository {
    if (!this.userRepository) {
      this.userRepository = new OptimizedUserRepository(this.supabase, this.eventBus);
    }
    
    return this.userRepository;
  }
  
  /**
   * Hämta optimerad TeamActivityRepository
   */
  public getTeamActivityRepository(): TeamActivityRepository {
    if (!this.teamActivityRepository) {
      this.teamActivityRepository = new OptimizedTeamActivityRepository(
        this.supabase,
        this.eventBus
      );
    }
    
    return this.teamActivityRepository;
  }
  
  /**
   * Hämta loggningstjänst
   */
  public getLogger(): LoggingService {
    return LoggingService.getInstance();
  }
  
  /**
   * Hämta prestandaövervakare
   */
  public getPerformanceMonitor(): PerformanceMonitor {
    return PerformanceMonitor.getInstance();
  }
} 