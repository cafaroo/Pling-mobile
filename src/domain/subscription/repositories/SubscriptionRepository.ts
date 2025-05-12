import { UniqueId } from '../../core/UniqueId';
import { Subscription } from '../entities/Subscription';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';

export interface SubscriptionRepository {
  // Subscription methods
  getSubscriptionById(id: UniqueId): Promise<Subscription | null>;
  getSubscriptionByOrganizationId(organizationId: UniqueId): Promise<Subscription | null>;
  saveSubscription(subscription: Subscription): Promise<void>;
  deleteSubscription(id: UniqueId): Promise<void>;
  
  // SubscriptionPlan methods
  getSubscriptionPlanById(id: UniqueId): Promise<SubscriptionPlan | null>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  saveSubscriptionPlan(plan: SubscriptionPlan): Promise<void>;
  deleteSubscriptionPlan(id: UniqueId): Promise<void>;
  
  // Usage tracking methods
  updateSubscriptionUsage(subscriptionId: UniqueId, metricName: string, value: number): Promise<void>;
  getSubscriptionUsageHistory(
    subscriptionId: UniqueId, 
    metricName: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Array<{ timestamp: Date; value: number }>>;
  
  // Subscription history methods
  getSubscriptionHistory(subscriptionId: UniqueId): Promise<Array<{
    eventType: string;
    eventData: Record<string, any>;
    createdAt: Date;
  }>>;
} 