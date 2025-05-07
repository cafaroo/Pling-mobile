/**
 * Gränssnitt för lagringstjänster som kan användas av CacheService
 */
export interface StorageInterface {
  /**
   * Hämtar ett värde från lagringen
   */
  getItem(key: string): Promise<string | null>;
  
  /**
   * Sparar ett värde i lagringen
   */
  setItem(key: string, value: string): Promise<void>;
  
  /**
   * Tar bort ett värde från lagringen
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * Hämtar alla nycklar från lagringen
   */
  getAllKeys(): Promise<string[]>;
  
  /**
   * Rensar hela lagringen
   */
  clear(): Promise<void>;
} 