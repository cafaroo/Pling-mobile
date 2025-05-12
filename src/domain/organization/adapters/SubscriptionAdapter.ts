import { SubscriptionService } from '../../subscription/interfaces/SubscriptionService';
import { FeatureFlagService } from '../../subscription/interfaces/FeatureFlagService';
import { UniqueId } from '../../core/UniqueId';

/**
 * Adapter för att integrera organization-domänen med subscription-domänen.
 * 
 * Denna adapter hanterar kommunikationen mellan domänerna och möjliggör kontroll
 * av prenumerationsbegränsningar och feature flags från organization-domänen.
 */
export class SubscriptionAdapter {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly featureFlagService?: FeatureFlagService
  ) {}

  /**
   * Kontrollerar om en organisation har en aktiv prenumeration.
   * 
   * @param organizationId - ID för organisationen att kontrollera
   * @returns True om organisationen har en aktiv prenumeration, annars false
   */
  async hasActiveSubscription(organizationId: UniqueId): Promise<boolean> {
    try {
      return await this.subscriptionService.hasActiveSubscription(organizationId);
    } catch (error) {
      console.error('Fel vid kontroll av aktiv prenumeration:', error);
      return false;
    }
  }

  /**
   * Kontrollerar om en organisation har tillgång till en specifik funktion.
   * 
   * @param organizationId - ID för organisationen
   * @param featureId - ID för funktionen att kontrollera
   * @returns True om organisationen har tillgång till funktionen, annars false
   */
  async hasFeatureAccess(organizationId: UniqueId, featureId: string): Promise<boolean> {
    try {
      if (this.featureFlagService) {
        const result = await this.featureFlagService.checkFeatureAccess(
          organizationId.toString(),
          featureId
        );
        return result.allowed;
      }
      
      // Fallback till subscriptionService om ingen featureFlagService finns
      return await this.subscriptionService.hasFeatureAccess(organizationId, featureId);
    } catch (error) {
      console.error('Fel vid kontroll av funktionsåtkomst:', error);
      return false;
    }
  }

  /**
   * Kontrollerar om en organisation kan lägga till fler användare.
   * 
   * @param organizationId - ID för organisationen
   * @param currentCount - Nuvarande antal användare
   * @param addCount - Antal användare att lägga till
   * @returns True om organisationen kan lägga till användarna, annars false
   */
  async canAddMoreUsers(
    organizationId: UniqueId, 
    currentCount: number, 
    addCount: number = 1
  ): Promise<boolean> {
    try {
      return await this.subscriptionService.canAddMoreUsers(
        organizationId,
        currentCount,
        addCount
      );
    } catch (error) {
      console.error('Fel vid kontroll av användarbegränsning:', error);
      return false;
    }
  }

  /**
   * Kontrollerar om en organisation kan skapa fler team.
   * 
   * @param organizationId - ID för organisationen
   * @param currentCount - Nuvarande antal team
   * @param addCount - Antal team att lägga till
   * @returns True om organisationen kan skapa fler team, annars false
   */
  async canAddMoreTeams(
    organizationId: UniqueId,
    currentCount: number,
    addCount: number = 1
  ): Promise<boolean> {
    try {
      // Egentligen borde vi ha en specifik metod för team i SubscriptionService,
      // men för nu använder vi canCreateMoreDashboards som en proxy
      return await this.subscriptionService.canCreateMoreDashboards(
        organizationId,
        currentCount,
        addCount
      );
    } catch (error) {
      console.error('Fel vid kontroll av teambegränsning:', error);
      return false;
    }
  }

  /**
   * Kontrollerar om en organisation kan skapa fler resurser av en viss typ.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs att kontrollera
   * @param currentCount - Nuvarande antal resurser
   * @param addCount - Antal resurser att lägga till
   * @returns True om organisationen kan skapa fler resurser, annars false
   */
  async canAddMoreResources(
    organizationId: UniqueId,
    resourceType: string,
    currentCount: number,
    addCount: number = 1
  ): Promise<boolean> {
    try {
      if (this.featureFlagService) {
        const result = await this.featureFlagService.checkUsageLimit(
          organizationId.toString(),
          `resources_${resourceType}`,
          currentCount + addCount
        );
        return result.allowed;
      }
      
      // Fallback till förenklad kontroll via subscriptionService
      return await this.subscriptionService.canCreateMoreDashboards(
        organizationId,
        currentCount,
        addCount
      );
    } catch (error) {
      console.error(`Fel vid kontroll av resursbegränsning (${resourceType}):`, error);
      return false;
    }
  }

  /**
   * Uppdaterar användningsdata för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param metrics - Objekt med mätvärden att uppdatera
   */
  async updateUsageMetrics(
    organizationId: UniqueId,
    metrics: {
      teamMembers?: number;
      teams?: number;
      resources?: {[resourceType: string]: number};
    }
  ): Promise<void> {
    try {
      // Konvertera resursmätning till format som används av SubscriptionService
      const convertedMetrics: {
        teamMembers?: number;
        mediaStorage?: number;
        apiRequests?: number;
      } = {};
      
      if (metrics.teamMembers !== undefined) {
        convertedMetrics.teamMembers = metrics.teamMembers;
      }
      
      // Uppdatera användningsdata via SubscriptionService
      await this.subscriptionService.updateUsageMetrics(
        organizationId,
        convertedMetrics
      );
      
      // Uppdatera även specifika resursmätningar via FeatureFlagService om tillgänglig
      if (this.featureFlagService && metrics.resources) {
        for (const [resourceType, count] of Object.entries(metrics.resources)) {
          await this.featureFlagService.updateUsage(
            organizationId.toString(),
            `resources_${resourceType}`,
            count
          );
        }
      }
    } catch (error) {
      console.error('Fel vid uppdatering av användningsdata:', error);
    }
  }

  /**
   * Hämtar begränsningar för en organisation baserat på dess prenumerationsplan.
   * 
   * @param organizationId - ID för organisationen
   * @returns Objekt med begränsningar för olika resurser
   */
  async getSubscriptionLimits(
    organizationId: UniqueId
  ): Promise<Record<string, number>> {
    try {
      if (this.featureFlagService) {
        return await this.featureFlagService.getSubscriptionLimits(
          organizationId.toString()
        );
      }
      
      // Returnera grundläggande begränsningar om ingen featureFlagService finns
      return {
        teamMembers: 3,
        teams: 1,
        resources: 5
      };
    } catch (error) {
      console.error('Fel vid hämtning av prenumerationsbegränsningar:', error);
      return {
        teamMembers: 3,
        teams: 1,
        resources: 5
      };
    }
  }

  /**
   * Hämtar information om prenumerationsstatus för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @returns Objekt med information om prenumerationsstatus
   */
  async getSubscriptionStatus(
    organizationId: UniqueId
  ): Promise<{
    status?: string;
    displayName?: string;
    isActive?: boolean;
    daysUntilRenewal?: number;
    isInTrial?: boolean;
    daysLeftInTrial?: number;
    isCanceled?: boolean;
    cancelAtPeriodEnd?: boolean;
  } | null> {
    try {
      return await this.subscriptionService.getSubscriptionStatusInfo(organizationId);
    } catch (error) {
      console.error('Fel vid hämtning av prenumerationsstatus:', error);
      return null;
    }
  }

  /**
   * Hämtar användningsprocentandelar för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @returns Objekt med användningsprocentandelar
   */
  async getUsagePercentages(
    organizationId: UniqueId
  ): Promise<{
    teamMembers: number;
    teams?: number;
    resources?: {[resourceType: string]: number};
  }> {
    try {
      const basicUsage = await this.subscriptionService.getUsagePercentages(organizationId);
      
      // Konvertera till format som förväntas av organization-domänen
      return {
        teamMembers: basicUsage.teamMembers || 0,
        teams: basicUsage.customDashboards || 0,
      };
    } catch (error) {
      console.error('Fel vid hämtning av användningsprocentandelar:', error);
      return {
        teamMembers: 0,
        teams: 0
      };
    }
  }
} 