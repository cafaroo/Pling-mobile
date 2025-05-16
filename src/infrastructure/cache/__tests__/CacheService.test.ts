import { CacheServiceImpl } from '../CacheServiceImpl';
import { MemoryStorageAdapter } from '../adapters/MemoryStorageAdapter';
import { LoggerFactory } from '../../logger/LoggerFactory';

describe('CacheServiceImpl', () => {
  let cacheService: CacheServiceImpl;
  let storageAdapter: MemoryStorageAdapter;
  
  beforeEach(() => {
    storageAdapter = new MemoryStorageAdapter();
    cacheService = new CacheServiceImpl(
      'test',
      { debug: false, ttl: 100 }, // kort TTL för testning
      storageAdapter,
      LoggerFactory.createTestLogger()
    );
  });
  
  describe('set', () => {
    it('ska spara värden i cachen', async () => {
      const key = 'testKey';
      const value = { id: 1, name: 'Test' };
      
      await cacheService.set(key, value);
      
      // Verifiera att data sparades i lagringen
      const storedData = await storageAdapter.getItem('test:testKey');
      expect(storedData).not.toBeNull();
      
      // Verifiera att vi kan avkoda data
      const parsedData = JSON.parse(storedData as string);
      expect(parsedData.value).toEqual(value);
      expect(parsedData.version).toBeDefined();
      expect(parsedData.timestamp).toBeDefined();
    });
  });
  
  describe('get', () => {
    it('ska hämta värden från cachen', async () => {
      const key = 'testKey';
      const value = { id: 1, name: 'Test' };
      
      await cacheService.set(key, value);
      const result = await cacheService.get(key);
      
      expect(result).toEqual(value);
    });
    
    it('ska returnera null för saknade nycklar', async () => {
      const result = await cacheService.get('nonExistentKey');
      expect(result).toBeNull();
    });
    
    it('ska respektera TTL för cachade värden', async () => {
      const key = 'expiringKey';
      const value = { id: 1, name: 'Expiring Value' };
      
      await cacheService.set(key, value);
      
      // Värdet ska finnas först
      let result = await cacheService.get(key);
      expect(result).toEqual(value);
      
      // Vänta tills TTL har passerat
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Värdet ska ha utgått
      result = await cacheService.get(key);
      expect(result).toBeNull();
    });
    
    it('ska invalidera värden med olika versioner', async () => {
      const key = 'versionKey';
      const value = { id: 1, name: 'Version Test' };
      
      await cacheService.set(key, value);
      
      // Värdet ska finnas först
      let result = await cacheService.get(key);
      expect(result).toEqual(value);
      
      // Uppdatera cache-version
      cacheService.updateOptions({ version: '2.0' });
      
      // Värdet ska nu vara ogiltigt
      result = await cacheService.get(key);
      expect(result).toBeNull();
    });
  });
  
  describe('getOrSet', () => {
    it('ska returnera cachade värden om de finns', async () => {
      const key = 'getOrSetKey';
      const value = { id: 1, name: 'GetOrSet Test' };
      
      await cacheService.set(key, value);
      
      // Skapa en mock loader som aldrig ska anropas
      const loader = jest.fn().mockResolvedValue({ id: 2, name: 'New Value' });
      
      const result = await cacheService.getOrSet(key, loader);
      
      expect(result).toEqual(value);
      expect(loader).not.toHaveBeenCalled();
    });
    
    it('ska anropa loader-funktionen om värdet inte finns', async () => {
      const key = 'missingKey';
      const value = { id: 2, name: 'Loaded Value' };
      
      const loader = jest.fn().mockResolvedValue(value);
      
      const result = await cacheService.getOrSet(key, loader);
      
      expect(result).toEqual(value);
      expect(loader).toHaveBeenCalledTimes(1);
      
      // Verifiera att värdet sparades i cachen
      const cachedValue = await cacheService.get(key);
      expect(cachedValue).toEqual(value);
    });
    
    it('ska hantera fel i loader-funktionen', async () => {
      const key = 'errorKey';
      const error = new Error('Loader error');
      
      const loader = jest.fn().mockRejectedValue(error);
      
      await expect(cacheService.getOrSet(key, loader)).rejects.toThrow('Loader error');
      expect(loader).toHaveBeenCalledTimes(1);
      
      // Värdet ska inte ha lagts i cachen
      const cachedValue = await cacheService.get(key);
      expect(cachedValue).toBeNull();
    });
  });
  
  describe('remove', () => {
    it('ska ta bort värden från cachen', async () => {
      const key = 'removeKey';
      const value = { id: 1, name: 'Remove Test' };
      
      await cacheService.set(key, value);
      
      // Verifiera att värdet finns
      let result = await cacheService.get(key);
      expect(result).toEqual(value);
      
      // Ta bort värdet
      await cacheService.remove(key);
      
      // Verifiera att värdet är borta
      result = await cacheService.get(key);
      expect(result).toBeNull();
    });
  });
  
  describe('clear', () => {
    it('ska rensa alla värden i cachen', async () => {
      // Lägg till flera värden
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');
      
      // Verifiera att värdena finns
      expect(await cacheService.get('key1')).toEqual('value1');
      expect(await cacheService.get('key2')).toEqual('value2');
      expect(await cacheService.get('key3')).toEqual('value3');
      
      // Rensa cachen
      await cacheService.clear();
      
      // Verifiera att alla värden är borta
      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();
      expect(await cacheService.get('key3')).toBeNull();
    });
    
    it('ska endast rensa värden i det aktuella namespace', async () => {
      // Skapa en annan cache med ett annat namespace
      const otherCache = new CacheServiceImpl(
        'otherTest',
        { debug: false },
        storageAdapter,
        LoggerFactory.createTestLogger()
      );
      
      // Lägg till värden i båda cacharna
      await cacheService.set('key1', 'test value');
      await otherCache.set('key1', 'other value');
      
      // Rensa den första cachen
      await cacheService.clear();
      
      // Verifiera att värdet i den första cachen är borta
      expect(await cacheService.get('key1')).toBeNull();
      
      // Verifiera att värdet i den andra cachen fortfarande finns
      expect(await otherCache.get('key1')).toEqual('other value');
    });
  });
  
  describe('updateOptions', () => {
    it('ska uppdatera TTL', async () => {
      // Skapa en cache med lång TTL
      const longCache = new CacheServiceImpl(
        'longCache',
        { ttl: 1000 },
        storageAdapter,
        LoggerFactory.createTestLogger()
      );
      
      await longCache.set('key', 'value');
      expect(await longCache.get('key')).toEqual('value');
      
      // Uppdatera till kort TTL
      longCache.updateOptions({ ttl: 50 });
      
      // Värdet ska fortfarande finnas direkt efter
      expect(await longCache.get('key')).toEqual('value');
      
      // Vänta tills den korta TTL:en har passerat
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Värdet ska nu ha utgått
      expect(await longCache.get('key')).toBeNull();
    });
    
    it('ska rensa cachen vid versionsändring', async () => {
      await cacheService.set('versionedKey', 'initial value');
      
      // Ändra versionen
      cacheService.updateOptions({ version: '2.0' });
      
      // Cachade värdet ska vara borta
      expect(await cacheService.get('versionedKey')).toBeNull();
    });
  });
}); 