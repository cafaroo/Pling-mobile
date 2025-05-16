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
 * Gränssnitt för cachningsservice
 * Detta interface definierar det centrala kontraktet för alla cachningtjänster i applikationen
 */
export interface ICacheService {
  /**
   * Sätter ett värde i cachen med nyckel
   * 
   * @param key Nyckel för att identifiera värdet
   * @param value Värdet att spara
   */
  set<T>(key: string, value: T): Promise<void>;
  
  /**
   * Hämtar ett värde från cachen
   * Returnerar null om värdet inte finns eller har gått ut
   * 
   * @param key Nyckel för att identifiera värdet
   * @returns Cachade värdet, eller null om det inte finns/har gått ut
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Hämtar ett värde från cachen, eller använder en callback för att ladda värdet
   * 
   * @param key Nyckel för att identifiera värdet
   * @param loader Funktion som returnerar ett löfte om värdet om det behöver laddas
   * @returns Cachade värdet, eller resultatet av loader-funktionen
   */
  getOrSet<T>(key: string, loader: () => Promise<T>): Promise<T>;
  
  /**
   * Tar bort ett värde från cachen
   * 
   * @param key Nyckel för att identifiera värdet att ta bort
   */
  remove(key: string): Promise<void>;
  
  /**
   * Rensar hela cachen
   */
  clear(): Promise<void>;
  
  /**
   * Uppdaterar alla cache-alternativ
   * 
   * @param options Nya cachealternativ
   */
  updateOptions(options: Partial<CacheOptions>): void;
} 