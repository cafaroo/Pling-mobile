// Exportera huvudinterfaces
export * from './ICacheService';
export * from './IStorageAdapter';

// Exportera implementationer
export * from './CacheServiceImpl';
export * from './CacheFactory';
export * from './TeamCacheService';

// Exportera adapters
export * from './adapters/AsyncStorageAdapter';
export * from './adapters/MemoryStorageAdapter';

// Skapa och exportera default cachefactory och cache-instanser
import { CacheFactory } from './CacheFactory';

// Exportera standardinstanser för enkel användning
export const appCache = CacheFactory.createCache('app');
export const userCache = CacheFactory.createCache('user');
export const settingsCache = CacheFactory.createCache('settings');

// För testmiljö
export const testCache = CacheFactory.createTestCache('test'); 