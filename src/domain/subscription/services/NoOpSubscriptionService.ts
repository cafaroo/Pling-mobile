import { UniqueId } from '../../core/UniqueId';
import { SubscriptionService } from '../interfaces/SubscriptionService';

/**
 * En implementering av SubscriptionService som alltid returnerar positiva svar
 * Används för utveckling och testning när den riktiga prenumerationslogiken inte är integrerad
 */
export class NoOpSubscriptionService implements SubscriptionService {
  private readonly mockPlanName: string;

  constructor(mockPlanName: string = 'basic') {
    this.mockPlanName = mockPlanName;
  }

  async hasActiveSubscription(organizationId: UniqueId): Promise<boolean> {
    return this.mockPlanName !== 'basic';
  }

  async getCurrentPlanName(organizationId: UniqueId): Promise<string> {
    return this.mockPlanName;
  }

  async hasFeatureAccess(organizationId: UniqueId, featureId: string): Promise<boolean> {
    // Returnera true för grundläggande features, och true för alla features om planen
    // är högre än basic
    if (featureId.startsWith('basic_')) {
      return true;
    }
    
    if (featureId.startsWith('advanced_') || featureId.startsWith('pro_')) {
      return this.mockPlanName === 'pro' || this.mockPlanName === 'enterprise';
    }
    
    if (featureId.startsWith('enterprise_')) {
      return this.mockPlanName === 'enterprise';
    }
    
    // Specifika feature-kontroller
    if (featureId === 'api_access') {
      return this.mockPlanName === 'enterprise';
    }
    
    if (featureId === 'custom_dashboards') {
      return this.mockPlanName === 'pro' || this.mockPlanName === 'enterprise';
    }
    
    return true;
  }

  async canAddMoreUsers(organizationId: UniqueId, currentCount: number, addCount: number): Promise<boolean> {
    const limits = {
      basic: 3,
      pro: 10,
      enterprise: 25
    };
    
    const maxUsers = limits[this.mockPlanName as keyof typeof limits] || 3;
    return currentCount + addCount <= maxUsers;
  }

  async canUseMoreStorage(organizationId: UniqueId, currentSizeMB: number, addSizeMB: number): Promise<boolean> {
    const limits = {
      basic: 100,
      pro: 1024,
      enterprise: 15 * 1024
    };
    
    const maxStorage = limits[this.mockPlanName as keyof typeof limits] || 100;
    return currentSizeMB + addSizeMB <= maxStorage;
  }

  async canCreateMoreDashboards(organizationId: UniqueId, currentCount: number, addCount: number): Promise<boolean> {
    const limits = {
      basic: 0,
      pro: 3,
      enterprise: 10
    };
    
    const maxDashboards = limits[this.mockPlanName as keyof typeof limits] || 0;
    return currentCount + addCount <= maxDashboards;
  }

  async canUseApiResources(organizationId: UniqueId): Promise<boolean> {
    return this.mockPlanName === 'enterprise';
  }

  async updateUsageMetrics(organizationId: UniqueId, metrics: {
    teamMembers?: number;
    mediaStorage?: number;
    apiRequests?: number;
  }): Promise<void> {
    // Gör ingenting i NoOp-versionen
    return;
  }

  async getUsagePercentages(organizationId: UniqueId): Promise<{
    teamMembers: number;
    mediaStorage: number;
    customDashboards?: number;
    apiRequests?: number;
  }> {
    // Returnera låga mockade användningsprocent
    return {
      teamMembers: 25,
      mediaStorage: 30,
      customDashboards: this.mockPlanName !== 'basic' ? 20 : undefined,
      apiRequests: this.mockPlanName === 'enterprise' ? 15 : undefined,
    };
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
    if (this.mockPlanName === 'basic') {
      return null;
    }
    
    const displayNames = {
      basic: 'Pling Basic',
      pro: 'Pling Pro',
      enterprise: 'Pling Enterprise'
    };
    
    return {
      status: 'active',
      displayName: displayNames[this.mockPlanName as keyof typeof displayNames],
      isActive: true,
      daysUntilRenewal: 25,
      isInTrial: false,
      daysLeftInTrial: 0,
      isCanceled: false,
      cancelAtPeriodEnd: false,
    };
  }
} 