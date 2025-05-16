import { ICacheService, CacheOptions } from './ICacheService';
import { IStorageAdapter } from './IStorageAdapter';
import { CacheServiceImpl } from './CacheServiceImpl';
import { AsyncStorageAdapter } from './adapters/AsyncStorageAdapter';
import { MemoryStorageAdapter } from './adapters/MemoryStorageAdapter';
import { ILogger } from '../logger/ILogger';
import { LoggerFactory } from '../logger/LoggerFactory';

/**
 * Factory för att skapa cache-tjänster
 * Detta möjliggör konsekvent skapande och konfiguration av cache-tjänster i hela applikationen
 */
export class CacheFactory {
  /**
   * Standardalternativ för cache-tjänster
   */
  private static defaultOptions: CacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minuter
    version: '1.0',
    debug: false
  };
  
  /**
   * Skapa en ny cache-tjänst
   * 
   * @param namespace Namnutrymme för att separera cachade data
   * @param options Anpassade cachealternativ
   * @param storage Valfri anpassad lagringsadapter
   * @param logger Valfri anpassad logger
   * @returns Implementering av ICacheService
   */
  static createCache(
    namespace: string,
    options?: Partial<CacheOptions>,
    storage?: IStorageAdapter,
    logger?: ILogger
  ): ICacheService {
    const mergedOptions: CacheOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    return new CacheServiceImpl(
      namespace,
      mergedOptions,
      storage,
      logger || LoggerFactory.createLogger()
    );
  }
  
  /**
   * Skapa en cache-tjänst för utvecklingsmiljö
   * Med debug aktiverat och kortare TTL
   * 
   * @param namespace Namnutrymme för att separera cachade data
   * @returns Implementering av ICacheService
   */
  static createDevelopmentCache(namespace: string): ICacheService {
    return this.createCache(namespace, {
      ttl: 60 * 1000, // 1 minut
      debug: true
    });
  }
  
  /**
   * Skapa en cache-tjänst för testmiljö
   * Använder minneslagring istället för AsyncStorage
   * 
   * @param namespace Namnutrymme för att separera cachade data
   * @returns Implementering av ICacheService
   */
  static createTestCache(namespace: string): ICacheService {
    return this.createCache(
      namespace,
      { debug: false },
      new MemoryStorageAdapter(),
      LoggerFactory.createTestLogger()
    );
  }
  
  /**
   * Skapa en cache-tjänst för produktion
   * Med längre TTL och debug inaktiverat
   * 
   * @param namespace Namnutrymme för att separera cachade data 
   * @returns Implementering av ICacheService
   */
  static createProductionCache(namespace: string): ICacheService {
    return this.createCache(namespace, {
      ttl: 30 * 60 * 1000, // 30 minuter
      debug: false
    });
  }
  
  /**
   * Skapa en cache-tjänst för permanent lagrad data
   * Med mycket lång TTL
   * 
   * @param namespace Namnutrymme för att separera cachade data
   * @returns Implementering av ICacheService
   */
  static createPersistentCache(namespace: string): ICacheService {
    return this.createCache(namespace, {
      ttl: 365 * 24 * 60 * 60 * 1000, // 1 år
      debug: false
    });
  }
  
  /**
   * Uppdatera standardalternativ för alla nya cache-tjänster
   * 
   * @param options Nya standardalternativ
   */
  static setDefaultOptions(options: Partial<CacheOptions>): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options
    };
  }
} 