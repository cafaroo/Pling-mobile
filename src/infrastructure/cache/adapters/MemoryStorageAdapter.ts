import { IStorageAdapter } from '../IStorageAdapter';

/**
 * Implementering av IStorageAdapter som använder minnet
 * Detta är användbart för testning och webbmiljöer
 */
export class MemoryStorageAdapter implements IStorageAdapter {
  /**
   * In-memory lagring av värden
   */
  private storage: Map<string, string> = new Map();

  /**
   * Hämtar ett värde från minneslagringen
   * 
   * @param key Nyckel för att identifiera värdet
   * @returns Värdet som en sträng, eller null om det inte finns
   */
  async getItem(key: string): Promise<string | null> {
    return this.storage.has(key) ? this.storage.get(key) || null : null;
  }

  /**
   * Sparar ett värde i minneslagringen
   * 
   * @param key Nyckel för att identifiera värdet
   * @param value Värdet att spara, som en sträng
   */
  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  /**
   * Tar bort ett värde från minneslagringen
   * 
   * @param key Nyckel för att identifiera värdet
   */
  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  /**
   * Hämtar alla nycklar från minneslagringen
   * 
   * @returns En array med alla nycklar i lagringen
   */
  async getAllKeys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  /**
   * Rensar hela minneslagringen
   */
  async clear(): Promise<void> {
    this.storage.clear();
  }
} 