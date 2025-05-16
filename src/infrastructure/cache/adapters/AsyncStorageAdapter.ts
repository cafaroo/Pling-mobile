import AsyncStorage from '@react-native-async-storage/async-storage';
import { IStorageAdapter } from '../IStorageAdapter';

/**
 * Implementering av IStorageAdapter med React Native's AsyncStorage
 * Detta är standardadaptern för mobilapplikationer
 */
export class AsyncStorageAdapter implements IStorageAdapter {
  /**
   * Hämtar ett värde från AsyncStorage
   * 
   * @param key Nyckel för att identifiera värdet
   * @returns Värdet som en sträng, eller null om det inte finns
   */
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  /**
   * Sparar ett värde i AsyncStorage
   * 
   * @param key Nyckel för att identifiera värdet
   * @param value Värdet att spara, som en sträng
   */
  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  /**
   * Tar bort ett värde från AsyncStorage
   * 
   * @param key Nyckel för att identifiera värdet
   */
  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  /**
   * Hämtar alla nycklar från AsyncStorage
   * 
   * @returns En array med alla nycklar i lagringen
   */
  async getAllKeys(): Promise<string[]> {
    return AsyncStorage.getAllKeys();
  }

  /**
   * Rensar hela AsyncStorage
   * Varning: Detta rensar ALLA data i AsyncStorage
   */
  async clear(): Promise<void> {
    return AsyncStorage.clear();
  }
} 