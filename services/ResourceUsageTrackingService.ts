import { supabase } from '@/lib/supabase';
import { ResourceType } from '@/components/subscription/ResourceLimitProvider';
import { ResourceCacheManager } from './ResourceCacheManager';

interface ResourceTrackingOptions {
  silent?: boolean; // Om sant, generera inga notifieringar även om gränsen nås
  incrementBy?: number; // Standardvärde 1
  bypassCache?: boolean; // Om sant, bypassa cache och hämta direkt från databasen
}

/**
 * Service för att spåra och uppdatera resursanvändning
 */
export class ResourceUsageTrackingService {
  private organizationId: string;
  private cacheManager: ResourceCacheManager;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.cacheManager = ResourceCacheManager.getInstance();
  }

  /**
   * Registrera användning av en resurs
   * @param resourceType Typ av resurs som används
   * @param options Alternativ för spårning
   * @returns True om operationen slutfördes framgångsrikt, false annars
   */
  public async trackResourceUsage(
    resourceType: ResourceType,
    options: ResourceTrackingOptions = {}
  ): Promise<boolean> {
    try {
      const { incrementBy = 1, silent = false } = options;

      // Anropa funktionen för att spåra resursanvändning
      const { data, error } = await supabase.rpc('track_resource_usage', {
        p_organization_id: this.organizationId,
        p_resource_type: resourceType,
        p_increment_by: incrementBy,
        p_silent_mode: silent,
      });

      if (error) {
        console.error('Fel vid spårning av resursanvändning:', error);
        return false;
      }

      // Invalidera cache för denna resurstyp eftersom användningen har ändrats
      this.cacheManager.clearForResourceType(resourceType, this.organizationId);

      return data?.success || false;
    } catch (error) {
      console.error('Oväntat fel vid resursanvändningsspårning:', error);
      return false;
    }
  }

  /**
   * Hämta aktuell användning för en specifik resurs
   * @param resourceType Typ av resurs att kontrollera
   * @param options Alternativ för resurshämtning
   * @returns Aktuell användning eller null om ett fel uppstod
   */
  public async getCurrentUsage(
    resourceType: ResourceType, 
    options: ResourceTrackingOptions = {}
  ): Promise<number | null> {
    try {
      const { bypassCache = false } = options;
      
      // Försök hämta från cache först om inte bypassCache är true
      if (!bypassCache) {
        const cachedLimit = this.cacheManager.getCachedResourceLimit(
          resourceType,
          this.organizationId
        );
        
        if (cachedLimit) {
          return cachedLimit.currentUsage;
        }
      }

      // Cache saknas eller bypass, hämta från databasen med optimerad RPC
      const { data, error } = await supabase.rpc('get_resource_usage', {
        p_organization_id: this.organizationId,
        p_resource_type: resourceType
      });

      if (error) {
        // Fallback till direkt tabell-query om RPC misslyckas
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('resource_usage')
          .select('current_usage')
          .eq('organization_id', this.organizationId)
          .eq('resource_type', resourceType)
          .single();

        if (fallbackError) {
          console.error('Fel vid hämtning av nuvarande användning:', fallbackError);
          return null;
        }

        return fallbackData?.current_usage || 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Oväntat fel vid hämtning av nuvarande användning:', error);
      return null;
    }
  }

  /**
   * Hämta en batchad överblick av resurser för dashboard
   * @returns Objekt med alla resursanvändningar eller null vid fel
   */
  public async getResourcesDashboard(): Promise<Record<ResourceType, number> | null> {
    try {
      // Försök hämta från cache först
      const cachedLimits = this.cacheManager.getCachedResourceLimits(this.organizationId);
      if (cachedLimits) {
        const dashboardData: Partial<Record<ResourceType, number>> = {};
        cachedLimits.forEach(limit => {
          dashboardData[limit.resourceType] = limit.currentUsage;
        });
        return dashboardData as Record<ResourceType, number>;
      }
      
      // Cache saknas, hämta från databasen med optimerad RPC
      const { data, error } = await supabase.rpc('get_organization_resource_dashboard', {
        p_organization_id: this.organizationId
      });

      if (error) {
        // Fallback till direkt tabell-query om RPC misslyckas
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('resource_usage')
          .select('resource_type, current_usage')
          .eq('organization_id', this.organizationId);

        if (fallbackError) {
          console.error('Fel vid hämtning av dashboard-data:', fallbackError);
          return null;
        }

        const dashboardData: Partial<Record<ResourceType, number>> = {};
        fallbackData.forEach(item => {
          dashboardData[item.resource_type as ResourceType] = item.current_usage;
        });
        
        return dashboardData as Record<ResourceType, number>;
      }

      // Konvertera svar till rätt format
      const dashboardData: Partial<Record<ResourceType, number>> = {};
      data.forEach((item: any) => {
        dashboardData[item.resource_type as ResourceType] = item.current_usage;
      });
      
      return dashboardData as Record<ResourceType, number>;
    } catch (error) {
      console.error('Oväntat fel vid hämtning av dashboard-data:', error);
      return null;
    }
  }

  /**
   * Återställ användningen för en resurs till 0
   * @param resourceType Typ av resurs att återställa
   * @returns True om operationen slutfördes framgångsrikt, false annars
   */
  public async resetUsage(resourceType: ResourceType): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resource_usage')
        .update({ current_usage: 0 })
        .eq('organization_id', this.organizationId)
        .eq('resource_type', resourceType);

      if (error) {
        console.error('Fel vid återställning av resursanvändning:', error);
        return false;
      }

      // Invalidera cache för denna resurstyp eftersom användningen har återställts
      this.cacheManager.clearForResourceType(resourceType, this.organizationId);

      return true;
    } catch (error) {
      console.error('Oväntat fel vid återställning av resursanvändning:', error);
      return false;
    }
  }
} 