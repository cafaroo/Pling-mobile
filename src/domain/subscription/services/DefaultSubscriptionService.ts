import { UniqueId } from '../../core/UniqueId';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { SubscriptionService } from '../interfaces/SubscriptionService';
import { SubscriptionStatus } from '../value-objects/SubscriptionTypes';
import { PlanName } from '../entities/SubscriptionPlan';

export class DefaultSubscriptionService implements SubscriptionService {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async hasActiveSubscription(organizationId: UniqueId): Promise<boolean> {
    const subscription = await this.subscriptionRepository.getSubscriptionByOrganizationId(organizationId);
    
    if (!subscription) {
      return false;
    }
    
    return subscription.isActive;
  }

  async getCurrentPlanName(organizationId: UniqueId): Promise<string> {
    const subscription = await this.subscriptionRepository.getSubscriptionByOrganizationId(organizationId);
    
    if (!subscription || !subscription.isActive) {
      return 'basic';
    }
    
    const plan = await this.subscriptionRepository.getSubscriptionPlanById(subscription.planId);
    return plan?.name || 'basic';
  }

  async hasFeatureAccess(organizationId: UniqueId, featureId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.getSubscriptionByOrganizationId(organizationId);
    
    if (!subscription || !subscription.isActive) {
      // Basic features are accessible to all
      const allPlans = await this.subscriptionRepository.getAllSubscriptionPlans();
      const basicPlan = allPlans.find(plan => plan.name === 'basic');
      
      return basicPlan?.hasFeature(featureId) || false;
    }
    
    const plan = await this.subscriptionRepository.getSubscriptionPlanById(subscription.planId);
    return plan?.hasFeature(featureId) || false;
  }

  async canAddMoreUsers(organizationId: UniqueId, currentCount: number, addCount: number): Promise<boolean> {
    const planName = await this.getCurrentPlanName(organizationId);
    const allPlans = await this.subscriptionRepository.getAllSubscriptionPlans();
    const plan = allPlans.find(p => p.name === planName);
    
    if (!plan) {
      return false;
    }
    
    const maxUsers = plan.limits.teamMembers;
    return currentCount + addCount <= maxUsers;
  }

  async canUseMoreStorage(organizationId: UniqueId, currentSizeMB: number, addSizeMB: number): Promise<boolean> {
    const planName = await this.getCurrentPlanName(organizationId);
    const allPlans = await this.subscriptionRepository.getAllSubscriptionPlans();
    const plan = allPlans.find(p => p.name === planName);
    
    if (!plan) {
      return false;
    }
    
    const maxStorage = plan.limits.mediaStorage;
    return currentSizeMB + addSizeMB <= maxStorage;
  }

  async canCreateMoreDashboards(organizationId: UniqueId, currentCount: number, addCount: number): Promise<boolean> {
    const planName = await this.getCurrentPlanName(organizationId);
    const allPlans = await this.subscriptionRepository.getAllSubscriptionPlans();
    const plan = allPlans.find(p => p.name === planName);
    
    if (!plan) {
      return false;
    }
    
    const maxDashboards = plan.limits.customDashboards;
    return currentCount + addCount <= maxDashboards;
  }

  async canUseApiResources(organizationId: UniqueId): Promise<boolean> {
    const planName = await this.getCurrentPlanName(organizationId);
    return planName === 'enterprise';
  }

  async updateUsageMetrics(organizationId: UniqueId, metrics: {
    teamMembers?: number;
    mediaStorage?: number;
    apiRequests?: number;
  }): Promise<void> {
    const subscription = await this.subscriptionRepository.getSubscriptionByOrganizationId(organizationId);
    
    if (!subscription) {
      return;
    }
    
    subscription.updateUsage(metrics);
    await this.subscriptionRepository.saveSubscription(subscription);
    
    // Uppdatera även detaljerad användningsstatistik
    const now = new Date();
    
    if (metrics.teamMembers !== undefined) {
      await this.subscriptionRepository.updateSubscriptionUsage(
        subscription.id,
        'teamMembers',
        metrics.teamMembers
      );
    }
    
    if (metrics.mediaStorage !== undefined) {
      await this.subscriptionRepository.updateSubscriptionUsage(
        subscription.id,
        'mediaStorage',
        metrics.mediaStorage
      );
    }
    
    if (metrics.apiRequests !== undefined) {
      await this.subscriptionRepository.updateSubscriptionUsage(
        subscription.id,
        'apiRequests',
        metrics.apiRequests
      );
    }
  }

  async getUsagePercentages(organizationId: UniqueId): Promise<{
    teamMembers: number;
    mediaStorage: number;
    customDashboards?: number;
    apiRequests?: number;
  }> {
    const subscription = await this.subscriptionRepository.getSubscriptionByOrganizationId(organizationId);
    
    if (!subscription) {
      return {
        teamMembers: 0,
        mediaStorage: 0,
      };
    }
    
    const plan = await this.subscriptionRepository.getSubscriptionPlanById(subscription.planId);
    
    if (!plan) {
      return {
        teamMembers: 0,
        mediaStorage: 0,
      };
    }
    
    const usage = subscription.usage;
    const limits = plan.limits;
    
    const result: any = {
      teamMembers: limits.teamMembers > 0 ? Math.min(100, (usage.teamMembers / limits.teamMembers) * 100) : 0,
      mediaStorage: limits.mediaStorage > 0 ? Math.min(100, (usage.mediaStorage / limits.mediaStorage) * 100) : 0,
    };
    
    if (limits.customDashboards && limits.customDashboards > 0) {
      // Här skulle vi kunna hämta faktiskt antal dashboards från en separat service
      result.customDashboards = 0;
    }
    
    if (limits.apiRequests && limits.apiRequests > 0 && usage.apiRequests !== undefined) {
      result.apiRequests = Math.min(100, (usage.apiRequests / limits.apiRequests) * 100);
    }
    
    return result;
  }

  async getSubscriptionStatusInfo(organizationId: UniqueId): Promise<{
    status: string;
    displayName: string;
    isActive: boolean;
    daysUntilRenewal?: number;
    isInTrial?: boolean;
    daysLeftInTrial?: number;
    isCanceled?: boolean;
    cancelAtPeriodEnd?: boolean;
  } | null> {
    const subscription = await this.subscriptionRepository.getSubscriptionByOrganizationId(organizationId);
    
    if (!subscription) {
      return null;
    }
    
    const plan = await this.subscriptionRepository.getSubscriptionPlanById(subscription.planId);
    
    return {
      status: subscription.status,
      displayName: plan?.displayName || 'Okänd plan',
      isActive: subscription.isActive,
      daysUntilRenewal: subscription.daysUntilRenewal,
      isInTrial: subscription.isInTrial(),
      daysLeftInTrial: subscription.getDaysLeftInTrial(),
      isCanceled: subscription.isCanceled,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }
} 