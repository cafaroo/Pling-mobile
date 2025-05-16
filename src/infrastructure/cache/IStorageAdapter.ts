/**
 * Gränssnitt för lagringstjänster som kan användas av CacheService
 * Detta gränssnitt tillåter flexibel implementering av olika lagringsmekanismer
 */
export interface IStorageAdapter {
  /**
   * Hämtar ett värde från lagringen
   * 
   * @param key Nyckel för att identifiera värdet
   * @returns Värdet som en sträng, eller null om det inte finns
   */
  getItem(key: string): Promise<string | null>;
  
  /**
   * Sparar ett värde i lagringen
   * 
   * @param key Nyckel för att identifiera värdet
   * @param value Värdet att spara, som en sträng
   */
  setItem(key: string, value: string): Promise<void>;
  
  /**
   * Tar bort ett värde från lagringen
   * 
   * @param key Nyckel för att identifiera värdet
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * Hämtar alla nycklar från lagringen
   * 
   * @returns En array med alla nycklar i lagringen
   */
  getAllKeys(): Promise<string[]>;
  
  /**
   * Rensar hela lagringen
   */
  clear(): Promise<void>;
} 