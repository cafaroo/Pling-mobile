import { supabase } from '@/lib/supabase';
import { ResourceType } from '@/domain/organization/strategies/ResourceLimitStrategy';

/**
 * Service för att spåra och uppdatera resursanvändning i organisationer.
 * Integrerar med resource_usage och resource_usage_history tabellerna.
 */
export class ResourceUsageTrackingService {
  /**
   * Uppdaterar användningsstatistik för en specifik resurstyp.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs att uppdatera
   * @param usageValue - Aktuellt antal använda resurser
   * @returns Success status
   */
  public async updateResourceUsage(
    organizationId: string,
    resourceType: ResourceType,
    usageValue: number
  ): Promise<boolean> {
    try {
      // Anropa database-funktionen för att uppdatera användning och skapa historik
      const { error } = await supabase.rpc('update_resource_usage', {
        org_id: organizationId,
        res_type: resourceType,
        usage_val: usageValue
      });

      if (error) {
        console.error(`Fel vid uppdatering av resursanvändning för ${resourceType}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Fel vid uppdatering av resursanvändning för ${resourceType}:`, error);
      return false;
    }
  }

  /**
   * Uppdaterar användningsstatistik för flera resurstyper samtidigt.
   * 
   * @param organizationId - ID för organisationen
   * @param usageData - Objekt med resurstyp som nyckel och användning som värde
   * @returns Success status
   */
  public async updateMultipleResourceUsage(
    organizationId: string,
    usageData: Partial<Record<ResourceType, number>>
  ): Promise<boolean> {
    try {
      // Skapa array av promises för alla uppdateringar
      const updatePromises = Object.entries(usageData).map(([type, usage]) => 
        this.updateResourceUsage(
          organizationId, 
          type as ResourceType, 
          usage as number
        )
      );

      // Kör alla uppdateringar parallellt
      const results = await Promise.all(updatePromises);
      
      // Returnera true endast om alla uppdateringar lyckades
      return results.every(success => success === true);
    } catch (error) {
      console.error('Fel vid batch-uppdatering av resursanvändning:', error);
      return false;
    }
  }

  /**
   * Hämtar aktuell resursanvändning för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs att hämta (valfritt)
   * @returns Resursanvändningsdata
   */
  public async getResourceUsage(
    organizationId: string,
    resourceType?: ResourceType
  ): Promise<Array<{ resourceType: ResourceType; currentUsage: number }>> {
    try {
      let query = supabase
        .from('resource_usage')
        .select('resource_type, current_usage')
        .eq('organization_id', organizationId);

      // Filtrera på resurstyp om specificerad
      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fel vid hämtning av resursanvändning:', error);
        return [];
      }

      return (data || []).map(item => ({
        resourceType: item.resource_type as ResourceType,
        currentUsage: item.current_usage
      }));
    } catch (error) {
      console.error('Fel vid hämtning av resursanvändning:', error);
      return [];
    }
  }

  /**
   * Hämtar historisk resursanvändning för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs att hämta historik för
   * @param limit - Maximalt antal poster att hämta
   * @param fromDate - Startdatum för historik (valfritt)
   * @param toDate - Slutdatum för historik (valfritt)
   * @returns Historisk användningsdata
   */
  public async getResourceUsageHistory(
    organizationId: string,
    resourceType: ResourceType,
    limit: number = 30,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Array<{ timestamp: Date; usageValue: number }>> {
    try {
      let query = supabase
        .from('resource_usage_history')
        .select('recorded_at, usage_value')
        .eq('organization_id', organizationId)
        .eq('resource_type', resourceType)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      // Lägg till datumfilter om specificerade
      if (fromDate) {
        query = query.gte('recorded_at', fromDate.toISOString());
      }

      if (toDate) {
        query = query.lte('recorded_at', toDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fel vid hämtning av resursanvändningshistorik:', error);
        return [];
      }

      return (data || []).map(item => ({
        timestamp: new Date(item.recorded_at),
        usageValue: item.usage_value
      }));
    } catch (error) {
      console.error('Fel vid hämtning av resursanvändningshistorik:', error);
      return [];
    }
  }

  /**
   * Beräknar användningstrend för en resurstyp.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs att beräkna trend för
   * @param days - Antal dagar att beräkna trend för (default: 30)
   * @returns Trend i procent (positiv = ökning, negativ = minskning)
   */
  public async calculateUsageTrend(
    organizationId: string,
    resourceType: ResourceType,
    days: number = 30
  ): Promise<number> {
    try {
      // Beräkna datum för N dagar sedan
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      // Hämta resursanvändningshistorik
      const history = await this.getResourceUsageHistory(
        organizationId,
        resourceType,
        days + 1,
        fromDate
      );

      if (history.length < 2) {
        return 0; // Otillräcklig data för trendberäkning
      }

      // Hämta första och senaste värdet
      const oldestValue = history[history.length - 1].usageValue;
      const newestValue = history[0].usageValue;

      // Beräkna trend i procent
      if (oldestValue === 0) return 100; // Om startvärdet är 0, räkna som 100% ökning
      
      const trendPercentage = ((newestValue - oldestValue) / oldestValue) * 100;
      return Math.round(trendPercentage);
    } catch (error) {
      console.error('Fel vid beräkning av användningstrend:', error);
      return 0;
    }
  }
} 