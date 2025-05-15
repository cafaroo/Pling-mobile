/**
 * DefaultSubscriptionService
 * 
 * OBS: Detta är bara ett skal för att kunna mocka i testerna
 */
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { Subscription } from '../entities/Subscription';

export interface SubscriptionService {
  getActiveSubscription(organizationId: UniqueId): Promise<Result<Subscription | null, string>>;
  createSubscription(organizationId: UniqueId, planId: string): Promise<Result<Subscription, string>>;
  cancelSubscription(subscriptionId: UniqueId, immediate?: boolean): Promise<Result<void, string>>;
  isFeatureEnabled(organizationId: UniqueId, featureName: string): Promise<Result<boolean, string>>;
}

/**
 * Standard implementation av SubscriptionService
 */
export class DefaultSubscriptionService implements SubscriptionService {
  /**
   * Hämtar aktiv prenumeration för en organisation
   */
  async getActiveSubscription(organizationId: UniqueId): Promise<Result<Subscription | null, string>> {
    try {
      // Detta är bara en stub för tester
      return ok(null);
    } catch (error) {
      return err(`Failed to get active subscription: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Skapar en ny prenumeration
   */
  async createSubscription(organizationId: UniqueId, planId: string): Promise<Result<Subscription, string>> {
    try {
      // Detta är bara en stub för tester
      const result = Subscription.create({
        organizationId,
        planId
      });
      if (result.isErr()) {
        return err(result.error);
      }
      return ok(result.value);
    } catch (error) {
      return err(`Failed to create subscription: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Avbryter en prenumeration
   */
  async cancelSubscription(subscriptionId: UniqueId, immediate: boolean = false): Promise<Result<void, string>> {
    try {
      // Detta är bara en stub för tester
      return ok(undefined);
    } catch (error) {
      return err(`Failed to cancel subscription: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en funktion är aktiverad för en organisation
   */
  async isFeatureEnabled(organizationId: UniqueId, featureName: string): Promise<Result<boolean, string>> {
    try {
      // Detta är bara en stub för tester
      return ok(true);
    } catch (error) {
      return err(`Failed to check feature: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 