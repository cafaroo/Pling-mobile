import { ResourceType, ResourceLimit } from '@/components/subscription/ResourceLimitProvider';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  organizationId: string;
}

interface CacheOptions {
  ttl?: number; // Tid i millisekunder (default: 5 minuter)
  forceRefresh?: boolean; // Tvinga uppdatering oavsett TTL
}

/**
 * Hanterar cachning av resursbegränsningar med TTL-baserad strategi
 */
export class ResourceCacheManager {
  private static instance: ResourceCacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minuter i ms

  // Singleton-mönster
  private constructor() {}

  public static getInstance(): ResourceCacheManager {
    if (!ResourceCacheManager.instance) {
      ResourceCacheManager.instance = new ResourceCacheManager();
    }
    return ResourceCacheManager.instance;
  }

  /**
   * Hämta en cachad resurs eller null om cachen är ogiltig
   * @param key Nyckel för cachad data
   * @param organizationId ID för organisationen
   * @param options Cachealternativ
   * @returns Cachad data eller null
   */
  public get<T>(
    key: string,
    organizationId: string,
    options: CacheOptions = {}
  ): T | null {
    const cacheKey = this.buildCacheKey(key, organizationId);
    const entry = this.cache.get(cacheKey);
    const { ttl = this.defaultTTL, forceRefresh = false } = options;

    // Om ingen cache-post finns eller force refresh är aktiverat
    if (!entry || forceRefresh) {
      return null;
    }

    // Kontrollera om cachen har gått ut
    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      // Rensa utgången cache
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Spara data i cachen
   * @param key Nyckel för cachad data
   * @param organizationId ID för organisationen
   * @param data Data att cacha
   */
  public set<T>(key: string, organizationId: string, data: T): void {
    const cacheKey = this.buildCacheKey(key, organizationId);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      organizationId
    });
  }

  /**
   * Rensa alla cachade poster för en viss organisation
   * @param organizationId ID för organisationen
   */
  public clearForOrganization(organizationId: string): void {
    this.cache.forEach((value, key) => {
      if (value.organizationId === organizationId) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Rensa specifik cache för en resurstyp i en organisation
   * @param resourceType Typ av resurs
   * @param organizationId ID för organisationen
   */
  public clearForResourceType(
    resourceType: ResourceType,
    organizationId: string
  ): void {
    const cacheKey = this.buildCacheKey(`resource_${resourceType}`, organizationId);
    this.cache.delete(cacheKey);
  }

  /**
   * Rensa all cache
   */
  public clearAll(): void {
    this.cache.clear();
  }

  /**
   * Bygg cachenyckeln
   * @param key Basnyckel
   * @param organizationId Organisations-ID
   * @returns Komplett cachenyckel
   */
  private buildCacheKey(key: string, organizationId: string): string {
    return `${key}_${organizationId}`;
  }

  /**
   * Cacha resursbegränsningar för en organisation
   * @param organizationId Organisations-ID
   * @param limits Lista med resursbegränsningar
   */
  public cacheResourceLimits(
    organizationId: string,
    limits: ResourceLimit[]
  ): void {
    // Cacha hela listan
    this.set('resource_limits', organizationId, limits);
    
    // Cacha även individuella resursbegränsningar för snabbare lookups
    limits.forEach(limit => {
      this.set(`resource_${limit.resourceType}`, organizationId, limit);
    });
  }

  /**
   * Hämta cachade resursbegränsningar
   * @param organizationId Organisations-ID
   * @param options Cachealternativ
   * @returns Cachade resursbegränsningar eller null
   */
  public getCachedResourceLimits(
    organizationId: string,
    options: CacheOptions = {}
  ): ResourceLimit[] | null {
    return this.get<ResourceLimit[]>('resource_limits', organizationId, options);
  }

  /**
   * Hämta cachad resursbegränsning för specifik resurstyp
   * @param resourceType Typ av resurs
   * @param organizationId Organisations-ID
   * @param options Cachealternativ
   * @returns Cachad resursbegränsning eller null
   */
  public getCachedResourceLimit(
    resourceType: ResourceType,
    organizationId: string,
    options: CacheOptions = {}
  ): ResourceLimit | null {
    return this.get<ResourceLimit>(
      `resource_${resourceType}`,
      organizationId,
      options
    );
  }
} 