import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageInterface } from './StorageInterface';

/**
 * Implementering av StorageInterface med React Native's AsyncStorage
 */
export class AsyncStorageAdapter implements StorageInterface {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  async getAllKeys(): Promise<string[]> {
    return AsyncStorage.getAllKeys();
  }

  async clear(): Promise<void> {
    return AsyncStorage.clear();
  }
} 