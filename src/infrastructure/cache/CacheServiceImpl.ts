import { ICacheService, CacheOptions } from './ICacheService';
import { IStorageAdapter } from './IStorageAdapter';
import { AsyncStorageAdapter } from './adapters/AsyncStorageAdapter';
import { ILogger } from '../logger/ILogger';
import { LoggerFactory } from '../logger/LoggerFactory';

/**
 * Typ för cache-poster
 */
interface CacheItem<T> {
  value: T;
  timestamp: number;
  version: string;
}

/**
 * Centraliserad cache-tjänst med TTL, versionshantering och transparant cache-invalidering
 * Implementerar ICacheService gränssnittet
 */
export class CacheServiceImpl implements ICacheService {
  /**
   * Tid innan cachen anses utdaterad (ms)
   */
  private ttl: number;
  
  /**
   * Versionsidentifierare för cachen
   */
  private version: string;
  
  /**
   * Om debug-loggning ska vara aktiverad
   */
  private debug: boolean;
  
  /**
   * Namnutrymme för cachelagringen
   */
  private namespace: string;
  
  /**
   * Storage adapter för att lagra cache-data
   */
  private storage: IStorageAdapter;
  
  /**
   * Logger för debugging och övervakning
   */
  private logger: ILogger;

  /**
   * Skapar en ny instans av CacheServiceImpl
   * 
   * @param namespace Namnutrymme för att separera olika cache-instanser
   * @param options Konfiguration för cachen
   * @param storage Lagringsadapter att använda
   * @param logger Logger att använda
   */
  constructor(
    namespace: string = 'app',
    options: CacheOptions = {},
    storage?: IStorageAdapter,
    logger?: ILogger
  ) {
    this.namespace = namespace;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minuter default
    this.version = options.version || '1.0';
    this.debug = options.debug || false;
    this.storage = storage || new AsyncStorageAdapter();
    this.logger = logger || LoggerFactory.createLogger();
  }

  /**
   * Sätter ett värde i cachen med nyckel
   * 
   * @param key Nyckel för att identifiera värdet
   * @param value Värdet att spara
   */
  async set<T>(key: string, value: T): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      version: this.version
    };

    try {
      await this.storage.setItem(cacheKey, JSON.stringify(item));
      this.logDebug(`Cache SET: ${cacheKey}`);
    } catch (error) {
      this.logDebug(`Cache SET error: ${error}`);
      this.logger.error(`Misslyckades med att spara i cache: ${key}`, { error });
    }
  }

  /**
   * Hämtar ett värde från cachen
   * Returnerar null om värdet inte finns eller har gått ut
   * 
   * @param key Nyckel för att identifiera värdet
   * @returns Cachade värdet, eller null om det inte finns/har gått ut
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);
    
    try {
      const data = await this.storage.getItem(cacheKey);
      
      if (!data) {
        this.logDebug(`Cache MISS: ${cacheKey} (not found)`);
        return null;
      }

      const item = JSON.parse(data) as CacheItem<T>;
      
      // Kontrollera version
      if (item.version !== this.version) {
        this.logDebug(`Cache MISS: ${cacheKey} (version mismatch: ${item.version} vs ${this.version})`);
        await this.remove(key);
        return null;
      }
      
      // Kontrollera TTL
      const age = Date.now() - item.timestamp;
      if (age > this.ttl) {
        this.logDebug(`Cache MISS: ${cacheKey} (expired: ${age}ms > ${this.ttl}ms)`);
        await this.remove(key);
        return null;
      }
      
      this.logDebug(`Cache HIT: ${cacheKey} (age: ${age}ms)`);
      return item.value;
    } catch (error) {
      this.logDebug(`Cache GET error: ${error}`);
      this.logger.error(`Misslyckades med att hämta från cache: ${key}`, { error });
      return null;
    }
  }

  /**
   * Hämtar ett värde från cachen, eller använder en callback för att ladda värdet
   * 
   * @param key Nyckel för att identifiera värdet
   * @param loader Funktion som returnerar ett löfte om värdet om det behöver laddas
   * @returns Cachade värdet, eller resultatet av loader-funktionen
   */
  async getOrSet<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    this.logDebug(`Cache LOAD: ${this.getCacheKey(key)}`);
    try {
      const value = await loader();
      await this.set(key, value);
      return value;
    } catch (error) {
      this.logger.error(`Misslyckades med att ladda data för cache: ${key}`, { error });
      throw error; // Vidarebefordra felet för att tillåta hantering på högre nivå
    }
  }

  /**
   * Tar bort ett värde från cachen
   * 
   * @param key Nyckel för att identifiera värdet att ta bort
   */
  async remove(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    
    try {
      await this.storage.removeItem(cacheKey);
      this.logDebug(`Cache REMOVE: ${cacheKey}`);
    } catch (error) {
      this.logDebug(`Cache REMOVE error: ${error}`);
      this.logger.error(`Misslyckades med att ta bort från cache: ${key}`, { error });
    }
  }

  /**
   * Rensar hela cachen för aktuell namespace
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.storage.getAllKeys();
      const namespacedKeys = keys.filter(key => 
        key.startsWith(`${this.namespace}:`)
      );
      
      await Promise.all(namespacedKeys.map(key => 
        this.storage.removeItem(key)
      ));
      
      this.logDebug(`Cache CLEAR: ${namespacedKeys.length} keys`);
    } catch (error) {
      this.logDebug(`Cache CLEAR error: ${error}`);
      this.logger.error(`Misslyckades med att rensa cache för ${this.namespace}`, { error });
    }
  }

  /**
   * Uppdaterar alla cache-alternativ
   * 
   * @param options Nya cachealternativ
   */
  updateOptions(options: Partial<CacheOptions>): void {
    if (options.ttl !== undefined) this.ttl = options.ttl;
    if (options.debug !== undefined) this.debug = options.debug;
    
    // Om versionen ändras: rensa all cache för att undvika inkompatibla versioner
    if (options.version !== undefined && options.version !== this.version) {
      this.version = options.version;
      this.clear().catch(err => {
        this.logDebug(`Error clearing cache after version change: ${err}`);
        this.logger.error(`Kunde inte rensa cache efter versionsändring`, { error: err });
      });
    }
  }

  /**
   * Genererar en nyckel för att spara i cachen
   * 
   * @param key Basnyckel
   * @returns Formaterad cachenyckel
   */
  private getCacheKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Loggar debugmeddelanden om debug är aktiverat
   * 
   * @param message Meddelande att logga
   */
  private logDebug(message: string): void {
    if (this.debug) {
      this.logger.debug(`[CacheService:${this.namespace}] ${message}`);
    }
  }
} 