import { StorageInterface } from './StorageInterface';
import { AsyncStorageAdapter } from './AsyncStorage';

/**
 * Typ för cache-poster
 */
interface CacheItem<T> {
  value: T;
  timestamp: number;
  version: string;
}

/**
 * Alternativ för cachekonfiguration
 */
export interface CacheOptions {
  /**
   * TTL (Time To Live) i millisekunder
   * Default: 5 minuter
   */
  ttl?: number;
  
  /**
   * Cacheversion, används för att invalidera hela cachen när versionen förändras
   * Default: '1.0'
   */
  version?: string;
  
  /**
   * Om Debug-loggning ska aktiveras
   * Default: false
   */
  debug?: boolean;
}

/**
 * Centraliserad cache-tjänst med TTL, versionshantering och transparant cache-invalidering
 */
export class CacheService {
  private storage: StorageInterface;
  private ttl: number;
  private version: string;
  private debug: boolean;
  private namespace: string;

  constructor(
    namespace: string = 'app',
    options: CacheOptions = {},
    storage?: StorageInterface
  ) {
    this.namespace = namespace;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minuter default
    this.version = options.version || '1.0';
    this.debug = options.debug || false;
    this.storage = storage || new AsyncStorageAdapter();
  }

  /**
   * Sätter ett värde i cachen med nyckel
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
    }
  }

  /**
   * Hämtar ett värde från cachen
   * Returnerar null om värdet inte finns eller har gått ut
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
      return null;
    }
  }

  /**
   * Hämtar ett värde från cachen, eller använder en callback för att ladda värdet
   */
  async getOrSet<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    this.logDebug(`Cache LOAD: ${this.getCacheKey(key)}`);
    const value = await loader();
    await this.set(key, value);
    return value;
  }

  /**
   * Tar bort ett värde från cachen
   */
  async remove(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    
    try {
      await this.storage.removeItem(cacheKey);
      this.logDebug(`Cache REMOVE: ${cacheKey}`);
    } catch (error) {
      this.logDebug(`Cache REMOVE error: ${error}`);
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
    }
  }

  /**
   * Uppdaterar alla cache-alternativ
   */
  updateOptions(options: CacheOptions): void {
    if (options.ttl !== undefined) this.ttl = options.ttl;
    if (options.debug !== undefined) this.debug = options.debug;
    
    // Om versionen ändras: rensa all cache för att undvika inkompatibla versioner
    if (options.version !== undefined && options.version !== this.version) {
      this.version = options.version;
      this.clear().catch(err => {
        this.logDebug(`Error clearing cache after version change: ${err}`);
      });
    }
  }

  /**
   * Genererar en nyckel för att spara i cachen
   */
  private getCacheKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Loggar debugmeddelanden
   */
  private logDebug(message: string): void {
    if (this.debug) {
      console.log(`[CacheService] ${message}`);
    }
  }
} 