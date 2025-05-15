import { FeatureFlagService, FeatureAccessResult } from '../interfaces/FeatureFlagService';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { PlanTypes } from '../value-objects/PlanTypes';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * DefaultFeatureFlagService
 * 
 * OBS: Detta är bara ett skal för att kunna mocka i testerna
 */
export interface FeatureFlagService {
  isFeatureEnabled(organizationId: UniqueId, featureName: string): Promise<Result<boolean, string>>;
  getFeatureValue<T>(organizationId: UniqueId, featureName: string, defaultValue: T): Promise<Result<T, string>>;
}

/**
 * Standardimplementering av FeatureFlagService som använder
 * SubscriptionRepository för att hämta prenumerationsdata.
 */
export class DefaultFeatureFlagService implements FeatureFlagService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository
  ) {}

  /**
   * Kontrollerar om en funktion är aktiverad för en organisation
   */
  async isFeatureEnabled(organizationId: UniqueId, featureName: string): Promise<Result<boolean, string>> {
    try {
      // Detta är bara en stub för tester
      return ok(true);
    } catch (error) {
      return err(`Failed to check feature flag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar värdet för en funktionsflagga
   */
  async getFeatureValue<T>(organizationId: UniqueId, featureName: string, defaultValue: T): Promise<Result<T, string>> {
    try {
      // Detta är bara en stub för tester
      return ok(defaultValue);
    } catch (error) {
      return err(`Failed to get feature value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en specifik funktion är tillgänglig för en organisation
   */
  async checkFeatureAccess(
    organizationId: string,
    featureId: string
  ): Promise<FeatureAccessResult> {
    try {
      const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
      
      if (!subscription) {
        return {
          allowed: false,
          reason: 'Ingen aktiv prenumeration hittades',
        };
      }

      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        return {
          allowed: false,
          reason: `Prenumerationen är inte aktiv (${subscription.status})`,
        };
      }

      const plan = await this.subscriptionRepository.getSubscriptionPlan(subscription.planId);
      
      if (!plan) {
        return {
          allowed: false,
          reason: 'Prenumerationsplan kunde inte hittas',
        };
      }

      // Kontrollera om funktionen är tillgänglig för planen
      const feature = plan.features.find(f => f.id === featureId);
      
      if (!feature || !feature.enabled) {
        return {
          allowed: false,
          reason: `Funktionen ${featureId} är inte tillgänglig i ${plan.displayName}-planen`,
        };
      }

      return {
        allowed: true,
      };
    } catch (error) {
      console.error('Fel vid kontroll av funktionsåtkomst:', error);
      return {
        allowed: false,
        reason: 'Ett fel uppstod vid kontroll av funktionsåtkomst',
      };
    }
  }

  /**
   * Kontrollerar om en organisation har tillräcklig kvot kvar för en resurs
   */
  async checkUsageLimit(
    organizationId: string,
    metricName: string,
    requestedAmount: number
  ): Promise<FeatureAccessResult> {
    try {
      const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
      
      if (!subscription) {
        return {
          allowed: false,
          reason: 'Ingen aktiv prenumeration hittades',
        };
      }

      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        return {
          allowed: false,
          reason: `Prenumerationen är inte aktiv (${subscription.status})`,
        };
      }

      const plan = await this.subscriptionRepository.getSubscriptionPlan(subscription.planId);
      
      if (!plan) {
        return {
          allowed: false,
          reason: 'Prenumerationsplan kunde inte hittas',
        };
      }

      // Kontrollera om begränsningen finns i planen
      if (!plan.limits || !(metricName in plan.limits)) {
        return {
          allowed: true, // Om ingen begränsning är angiven, tillåt
        };
      }

      const limit = plan.limits[metricName];
      
      // Kontrollera om begärd användning överskrider gränsen
      // För enterprise-planer med värdet -1, representerar det obegränsad användning
      if (limit === -1 || requestedAmount <= limit) {
        return {
          allowed: true,
          limit,
          currentUsage: subscription.usage?.[metricName] || 0,
        };
      }

      return {
        allowed: false,
        reason: `Begärd användning (${requestedAmount}) överskrider gränsen (${limit}) för ${metricName}`,
        limit,
        currentUsage: subscription.usage?.[metricName] || 0,
      };
    } catch (error) {
      console.error('Fel vid kontroll av användningsgräns:', error);
      return {
        allowed: false,
        reason: 'Ett fel uppstod vid kontroll av användningsgräns',
      };
    }
  }

  /**
   * Uppdaterar användningsstatistik för en organisation
   */
  async updateUsage(
    organizationId: string,
    metricName: string,
    newValue: number
  ): Promise<void> {
    try {
      const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
      
      if (!subscription) {
        throw new Error('Ingen aktiv prenumeration hittades');
      }

      const updatedUsage = {
        ...subscription.usage,
        [metricName]: newValue,
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
        newValue
      );
    } catch (error) {
      console.error('Fel vid uppdatering av användning:', error);
      throw new Error(`Kunde inte uppdatera användning: ${error.message}`);
    }
  }

  /**
   * Hämtar lista av alla funktioner tillgängliga för en organisation
   */
  async getAvailableFeatures(organizationId: string): Promise<string[]> {
    try {
      const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
      
      if (!subscription || 
          (subscription.status !== 'active' && subscription.status !== 'trialing')) {
        // Returnera endast grundläggande funktioner om ingen aktiv prenumeration finns
        return this.getBasicFeatures();
      }

      const plan = await this.subscriptionRepository.getSubscriptionPlan(subscription.planId);
      
      if (!plan) {
        return this.getBasicFeatures();
      }

      return plan.features
        .filter(feature => feature.enabled)
        .map(feature => feature.id);
    } catch (error) {
      console.error('Fel vid hämtning av tillgängliga funktioner:', error);
      return this.getBasicFeatures();
    }
  }

  /**
   * Hämtar begränsningar för en organisation baserat på deras prenumerationsplan
   */
  async getSubscriptionLimits(
    organizationId: string
  ): Promise<Record<string, number>> {
    try {
      const subscription = await this.subscriptionRepository.getByOrganizationId(organizationId);
      
      if (!subscription || 
          (subscription.status !== 'active' && subscription.status !== 'trialing')) {
        // Returnera grundläggande begränsningar om ingen aktiv prenumeration finns
        return this.getBasicLimits();
      }

      const plan = await this.subscriptionRepository.getSubscriptionPlan(subscription.planId);
      
      if (!plan) {
        return this.getBasicLimits();
      }

      return plan.limits;
    } catch (error) {
      console.error('Fel vid hämtning av prenumerationsbegränsningar:', error);
      return this.getBasicLimits();
    }
  }

  /**
   * Hjälpmetod som returnerar grundläggande funktioner för Basic-planen
   */
  private getBasicFeatures(): string[] {
    return [
      'basic_goal_management',
      'basic_statistics',
      'basic_competition_features',
    ];
  }

  /**
   * Hjälpmetod som returnerar grundläggande begränsningar för Basic-planen
   */
  private getBasicLimits(): Record<string, number> {
    return {
      teamMembers: 3,
      mediaStorage: 100, // MB
      customDashboards: 0,
    };
  }
} 