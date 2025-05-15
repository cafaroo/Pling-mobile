import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Subscription } from '../entities/Subscription';
import { SubscriptionStatus, SubscriptionUsage } from '../value-objects/SubscriptionTypes';

/**
 * SubscriptionRepository Interface
 * 
 * Abstrakt repository för hantering av prenumerationer enligt DDD-principer.
 * Implementeras av konkreta klasser i infrastrukturlagret.
 */
export interface SubscriptionRepository {
  /**
   * Hämta en prenumeration med specifikt ID
   */
  getById(id: UniqueId): Promise<Result<Subscription | null, string>>;
  
  /**
   * Spara en ny eller uppdaterad prenumeration
   */
  save(subscription: Subscription): Promise<Result<void, string>>;

  /**
   * Hämta aktiv prenumeration för en organisation
   */
  getActiveByOrganizationId(organizationId: UniqueId): Promise<Result<Subscription | null, string>>;
  
  /**
   * Hämta alla prenumerationer för en organisation
   */
  getAllByOrganizationId(organizationId: UniqueId): Promise<Result<Subscription[], string>>;
  
  /**
   * Hämta prenumerationer med specifik status
   */
  getByStatus(status: SubscriptionStatus): Promise<Result<Subscription[], string>>;
  
  /**
   * Hämta prenumerationer som förnyas inom ett visst tidsintervall
   */
  getSubscriptionsRenewingBetween(
    startDate: Date, 
    endDate: Date
  ): Promise<Result<Subscription[], string>>;
  
  /**
   * Hämta prenumerationer som har förfallit
   */
  getExpiredSubscriptions(referenceDate: Date): Promise<Result<Subscription[], string>>;
  
  /**
   * Hämta prenumerationer med angivet plan-ID
   */
  getByPlanId(planId: string): Promise<Result<Subscription[], string>>;
  
  /**
   * Uppdatera användningsinformation för en prenumeration
   */
  updateSubscriptionUsage(
    subscriptionId: UniqueId, 
    usage: Partial<SubscriptionUsage>
  ): Promise<Result<void, string>>;
  
  /**
   * Hämta en prenumerationsplan med specifikt ID
   */
  getSubscriptionPlanById(planId: string): Promise<Result<any, string>>;
} 