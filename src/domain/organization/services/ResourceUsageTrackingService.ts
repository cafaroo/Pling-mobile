import { UniqueId } from '../../core/UniqueId';
import { SubscriptionAdapter } from '../adapters/SubscriptionAdapter';
import { ResourceType } from '../strategies/ResourceLimitStrategy';

/**
 * Domäntjänst för att spåra resursanvändning i en organisation.
 * 
 * Denna service ansvarar för att regelbundet uppdatera och rapportera
 * resursanvändning till prenumerationssystemet.
 */
export class ResourceUsageTrackingService {
  constructor(private subscriptionAdapter: SubscriptionAdapter) {}

  /**
   * Spårar användning av en specifik resurstyp.
   * 
   * @param organizationId - ID för organisation att uppdatera
   * @param resourceType - Typ av resurs att spåra
   * @param count - Antal resurser som används
   * @returns Promise som löses när uppdateringen är klar
   */
  async trackResourceUsage(
    organizationId: UniqueId,
    resourceType: ResourceType,
    count: number
  ): Promise<void> {
    try {
      await this.subscriptionAdapter.updateUsageMetrics(
        organizationId,
        {
          resources: {
            [resourceType]: count
          }
        }
      );
      
      console.log(`Resursspårning: ${resourceType} (${count}) för org ${organizationId.toString()}`);
    } catch (error) {
      console.error(`Fel vid spårning av resursanvändning (${resourceType}):`, error);
    }
  }

  /**
   * Spårar användning av teammedlemmar.
   * 
   * @param organizationId - ID för organisation att uppdatera
   * @param count - Antal teammedlemmar som används
   * @returns Promise som löses när uppdateringen är klar
   */
  async trackTeamMemberUsage(
    organizationId: UniqueId,
    count: number
  ): Promise<void> {
    try {
      await this.subscriptionAdapter.updateUsageMetrics(
        organizationId,
        {
          teamMembers: count
        }
      );
      
      console.log(`Resursspårning: teammedlemmar (${count}) för org ${organizationId.toString()}`);
    } catch (error) {
      console.error('Fel vid spårning av teammedlemmar:', error);
    }
  }

  /**
   * Spårar användning av teams.
   * 
   * @param organizationId - ID för organisation att uppdatera
   * @param count - Antal team som används
   * @returns Promise som löses när uppdateringen är klar
   */
  async trackTeamUsage(
    organizationId: UniqueId,
    count: number
  ): Promise<void> {
    try {
      await this.subscriptionAdapter.updateUsageMetrics(
        organizationId,
        {
          teams: count
        }
      );
      
      console.log(`Resursspårning: team (${count}) för org ${organizationId.toString()}`);
    } catch (error) {
      console.error('Fel vid spårning av team:', error);
    }
  }

  /**
   * Uppdaterar alla resurstyper för en organisation.
   * 
   * @param organizationId - ID för organisation att uppdatera
   * @param resourceCounts - Objekt med alla resursantal att uppdatera
   * @returns Promise som löses när alla uppdateringar är klara
   */
  async updateAllResourceUsage(
    organizationId: UniqueId,
    resourceCounts: {
      teams?: number;
      teamMembers?: number;
      resources?: {[key in ResourceType]?: number};
    }
  ): Promise<void> {
    try {
      await this.subscriptionAdapter.updateUsageMetrics(
        organizationId,
        {
          teams: resourceCounts.teams,
          teamMembers: resourceCounts.teamMembers,
          resources: resourceCounts.resources
        }
      );
      
      console.log(`Resursspårning: batch-uppdatering för org ${organizationId.toString()}`);
    } catch (error) {
      console.error('Fel vid batch-uppdatering av resurser:', error);
    }
  }

  /**
   * Gör en fullständig skanning av en organisations resurser
   * och uppdaterar all användningsstatistik.
   * 
   * Denna metod är avsedd att köras periodiskt för att säkerställa
   * att användningsstatistiken är uppdaterad.
   * 
   * @param organizationId - ID för organisation att uppdatera
   * @param getResourceCounts - Funktion som returnerar resursmängder för organisationen
   * @returns Promise som löses när skanningen är klar
   */
  async scanAndUpdateUsage(
    organizationId: UniqueId,
    getResourceCounts: () => Promise<{
      teams?: number;
      teamMembers?: number;
      resources?: {[key in ResourceType]?: number};
    }>
  ): Promise<void> {
    try {
      const counts = await getResourceCounts();
      await this.updateAllResourceUsage(organizationId, counts);
      
      console.log(`Resursspårning: fullständig skanning klar för org ${organizationId.toString()}`);
    } catch (error) {
      console.error('Fel vid fullständig resursskanning:', error);
    }
  }
} 