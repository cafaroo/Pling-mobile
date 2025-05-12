import { SubscriptionRepository } from '../repositories/SubscriptionRepository';

/**
 * Service för att spåra och uppdatera användningsdata för prenumerationer.
 * Denna service används för att hålla koll på resursutnyttjande för
 * organisationer med prenumerationsbaserade begränsningar.
 */
export class UsageTrackingService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository
  ) {}

  /**
   * Uppdaterar teammedlemmar för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param memberCount - Antal teammedlemmar
   */
  async updateTeamMembersCount(organizationId: string, memberCount: number): Promise<void> {
    try {
      await this.updateUsageMetric(organizationId, 'teamMembers', memberCount);
    } catch (error) {
      console.error('Fel vid uppdatering av teammedlemmar:', error);
      throw new Error(`Kunde inte uppdatera teammedlemmar: ${error.message}`);
    }
  }

  /**
   * Uppdaterar medialagring för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param storageMB - Använd medialagring i MB
   */
  async updateMediaStorage(organizationId: string, storageMB: number): Promise<void> {
    try {
      await this.updateUsageMetric(organizationId, 'mediaStorage', storageMB);
    } catch (error) {
      console.error('Fel vid uppdatering av medialagring:', error);
      throw new Error(`Kunde inte uppdatera medialagring: ${error.message}`);
    }
  }

  /**
   * Uppdaterar antal anpassade dashboards för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param dashboardCount - Antal dashboards
   */
  async updateCustomDashboardsCount(organizationId: string, dashboardCount: number): Promise<void> {
    try {
      await this.updateUsageMetric(organizationId, 'customDashboards', dashboardCount);
    } catch (error) {
      console.error('Fel vid uppdatering av dashboards:', error);
      throw new Error(`Kunde inte uppdatera dashboards: ${error.message}`);
    }
  }

  /**
   * Uppdaterar API-anrop för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param requestCount - Antal API-anrop
   */
  async updateApiRequestCount(organizationId: string, requestCount: number): Promise<void> {
    try {
      await this.updateUsageMetric(organizationId, 'apiRequests', requestCount);
    } catch (error) {
      console.error('Fel vid uppdatering av API-anrop:', error);
      throw new Error(`Kunde inte uppdatera API-anrop: ${error.message}`);
    }
  }

  /**
   * Ökar API-anrop med ett visst antal för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param incrementBy - Antal att öka med, standard 1
   */
  async incrementApiRequestCount(organizationId: string, incrementBy: number = 1): Promise<void> {
    try {
      const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
      
      if (!subscription) {
        throw new Error('Ingen aktiv prenumeration hittades');
      }

      const currentCount = subscription.usage?.apiRequests || 0;
      await this.updateApiRequestCount(organizationId, currentCount + incrementBy);
    } catch (error) {
      console.error('Fel vid ökning av API-anrop:', error);
      // Svälja fel här för att undvika avbrott av API-anrop
    }
  }

  /**
   * Hämtar aktuell användningsdata för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @returns Objekt med användningsdata
   */
  async getCurrentUsage(organizationId: string): Promise<Record<string, number>> {
    try {
      const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
      
      if (!subscription) {
        return {};
      }

      return subscription.usage || {};
    } catch (error) {
      console.error('Fel vid hämtning av användningsdata:', error);
      return {};
    }
  }

  /**
   * Kontrollerar om en organisation överskrider sina användningsgränser.
   * 
   * @param organizationId - ID för organisationen
   * @returns Objekt med gränser som överskrids
   */
  async checkExceededLimits(organizationId: string): Promise<Record<string, boolean>> {
    try {
      const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
      
      if (!subscription) {
        return {};
      }

      const plan = await this.subscriptionRepository.getSubscriptionPlan(subscription.planId);
      
      if (!plan) {
        return {};
      }

      const exceededLimits: Record<string, boolean> = {};
      const usage = subscription.usage || {};

      // Kontrollera varje gräns mot användningen
      for (const [metric, limit] of Object.entries(plan.limits)) {
        // Om gränsen är -1 betyder det obegränsad användning
        if (limit !== -1 && usage[metric] && usage[metric] > limit) {
          exceededLimits[metric] = true;
        } else {
          exceededLimits[metric] = false;
        }
      }

      return exceededLimits;
    } catch (error) {
      console.error('Fel vid kontroll av överträdda gränser:', error);
      return {};
    }
  }

  /**
   * Generell metod för att uppdatera en användningsmetrik.
   * 
   * @param organizationId - ID för organisationen
   * @param metricName - Namnet på metriken att uppdatera
   * @param value - Värdet att sätta
   */
  private async updateUsageMetric(
    organizationId: string,
    metricName: string,
    value: number
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
    
    if (!subscription) {
      throw new Error('Ingen aktiv prenumeration hittades');
    }

    const updatedUsage = {
      ...subscription.usage,
      [metricName]: value,
      lastUpdated: new Date(),
    };

    // Uppdatera användningsinformation i prenumerationen
    await this.subscriptionRepository.updateSubscription(
      subscription.id,
      { usage: updatedUsage }
    );

    // Logga användningsstatistik för framtida rapporter
    await this.subscriptionRepository.logUsage(
      subscription.id,
      metricName,
      value
    );
  }
} 