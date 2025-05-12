import { ResourceLimit, ResourceUsage } from '@/components/subscription/ResourceLimitProvider';
import { ResourceType } from '@/domain/organization/strategies/ResourceLimitStrategy';

/**
 * Interface för cached data med TTL (Time-To-Live).
 */
interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number; // i millisekunder
}

/**
 * Service för att hantera caching av resursbegränsningsdata.
 * Implementerar TTL-baserad caching och selektiv uppdatering.
 */
export class ResourceCacheManager {
  private static instance: ResourceCacheManager;
  
  // Cache för resursbegränsningar per plan
  private limitsCache: Map<string, CachedData<ResourceLimit[]>> = new Map();
  
  // Cache för resursanvändning per organisation
  private usageCache: Map<string, CachedData<ResourceUsage[]>> = new Map();
  
  // Cache för användningshistorik
  private usageHistoryCache: Map<string, CachedData<any[]>> = new Map();
  
  // Standard-TTL-värden i millisekunder
  private readonly DEFAULT_LIMITS_TTL = 24 * 60 * 60 * 1000; // 24 timmar
  private readonly DEFAULT_USAGE_TTL = 5 * 60 * 1000; // 5 minuter
  private readonly DEFAULT_HISTORY_TTL = 30 * 60 * 1000; // 30 minuter

  private constructor() {}

  /**
   * Hämtar singleton-instans av ResourceCacheManager.
   */
  public static getInstance(): ResourceCacheManager {
    if (!ResourceCacheManager.instance) {
      ResourceCacheManager.instance = new ResourceCacheManager();
    }
    return ResourceCacheManager.instance;
  }

  /**
   * Hämtar cachad data om tillgänglig och inte utgången, annars null.
   * 
   * @param cache - Cache att hämta från
   * @param key - Nyckel att hämta
   * @returns Cachad data eller null om utgången/saknas
   */
  private getCachedData<T>(cache: Map<string, CachedData<T>>, key: string): T | null {
    const cached = cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      // TTL har löpt ut, ta bort från cache
      cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Lagrar data i cache med TTL.
   * 
   * @param cache - Cache att lagra i
   * @param key - Nyckel för cachad data
   * @param data - Data att cacha
   * @param ttl - TTL i millisekunder
   */
  private setCachedData<T>(
    cache: Map<string, CachedData<T>>, 
    key: string, 
    data: T, 
    ttl: number
  ): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Hämtar cachade resursbegränsningar för en prenumerationsplan.
   * 
   * @param planType - Typ av prenumerationsplan
   * @returns Cachade resursbegränsningar eller null
   */
  public getCachedLimits(planType: string): ResourceLimit[] | null {
    return this.getCachedData(this.limitsCache, planType);
  }

  /**
   * Lagrar resursbegränsningar i cache.
   * 
   * @param planType - Typ av prenumerationsplan
   * @param limits - Resursbegränsningar att cacha
   * @param ttl - Valfri TTL-värde
   */
  public setCachedLimits(
    planType: string, 
    limits: ResourceLimit[], 
    ttl: number = this.DEFAULT_LIMITS_TTL
  ): void {
    this.setCachedData(this.limitsCache, planType, limits, ttl);
  }

  /**
   * Hämtar cachad resursanvändning för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @returns Cachad resursanvändning eller null
   */
  public getCachedUsage(organizationId: string): ResourceUsage[] | null {
    return this.getCachedData(this.usageCache, organizationId);
  }

  /**
   * Lagrar resursanvändning i cache.
   * 
   * @param organizationId - ID för organisationen
   * @param usage - Resursanvändning att cacha
   * @param ttl - Valfri TTL-värde
   */
  public setCachedUsage(
    organizationId: string, 
    usage: ResourceUsage[], 
    ttl: number = this.DEFAULT_USAGE_TTL
  ): void {
    this.setCachedData(this.usageCache, organizationId, usage, ttl);
  }

  /**
   * Uppdaterar en specifik resurstyps användning i cachen.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs att uppdatera
   * @param currentUsage - Aktuell användning
   * @param limit - Resursbegränsning
   * @returns True om cache uppdaterades, false om ingen cache fanns
   */
  public updateCachedUsage(
    organizationId: string,
    resourceType: ResourceType,
    currentUsage: number,
    limit: number
  ): boolean {
    const cachedUsage = this.getCachedUsage(organizationId);
    
    if (!cachedUsage) {
      return false;
    }
    
    // Hitta och uppdatera användningen för den specifika resurstypen
    const usageIndex = cachedUsage.findIndex(usage => usage.resourceType === resourceType);
    
    if (usageIndex >= 0) {
      const usagePercentage = Math.round((currentUsage / limit) * 100);
      
      // Skapa en ny array med uppdaterad resursanvändning
      const updatedUsage = [...cachedUsage];
      updatedUsage[usageIndex] = {
        ...updatedUsage[usageIndex],
        currentUsage,
        limit,
        usagePercentage,
        limitReached: currentUsage >= limit,
        nearLimit: usagePercentage >= 80 && usagePercentage < 100
      };
      
      // Uppdatera cachen med den nya arrayen
      this.setCachedUsage(organizationId, updatedUsage);
      return true;
    }
    
    return false;
  }

  /**
   * Hämtar cachad användningshistorik.
   * 
   * @param cacheKey - Nyckel för historik-cache (format: orgId_resourceType)
   * @returns Cachad historikdata eller null
   */
  public getCachedUsageHistory(cacheKey: string): any[] | null {
    return this.getCachedData(this.usageHistoryCache, cacheKey);
  }

  /**
   * Lagrar användningshistorik i cache.
   * 
   * @param cacheKey - Nyckel för historik-cache (format: orgId_resourceType)
   * @param historyData - Historikdata att cacha
   * @param ttl - Valfri TTL-värde
   */
  public setCachedUsageHistory(
    cacheKey: string, 
    historyData: any[], 
    ttl: number = this.DEFAULT_HISTORY_TTL
  ): void {
    this.setCachedData(this.usageHistoryCache, cacheKey, historyData, ttl);
  }

  /**
   * Rensar all cache eller specifik cache-typ.
   * 
   * @param cacheType - Typ av cache att rensa (limits, usage, history eller null för alla)
   */
  public clearCache(cacheType?: 'limits' | 'usage' | 'history'): void {
    if (!cacheType || cacheType === 'limits') {
      this.limitsCache.clear();
    }
    
    if (!cacheType || cacheType === 'usage') {
      this.usageCache.clear();
    }
    
    if (!cacheType || cacheType === 'history') {
      this.usageHistoryCache.clear();
    }
  }

  /**
   * Tar bort utgången data från alla cacher.
   */
  public purgeExpiredCache(): void {
    const now = Date.now();
    
    // Funktion för att rensa utgången data från en cache-map
    const purgeExpired = <T>(cache: Map<string, CachedData<T>>) => {
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > value.ttl) {
          cache.delete(key);
        }
      }
    };
    
    // Rensa utgången data från alla cacher
    purgeExpired(this.limitsCache);
    purgeExpired(this.usageCache);
    purgeExpired(this.usageHistoryCache);
  }
} 