import { Result } from '../../shared/core/Result';
import { FeatureFlagService } from '../../domain/subscription/services/FeatureFlagService';
import { SubscriptionTier } from '../../domain/subscription/value-objects/SubscriptionTier';

/**
 * MockServiceFactory tillhandahåller standardiserade mockfunktioner för att skapa
 * mockar av domäntjänster som kan användas i tester.
 */
export class MockServiceFactory {
  /**
   * Skapar en mock implementering av FeatureFlagService.
   * 
   * @param overrides - Override för specifika funktionsresultat
   * @returns En mockad FeatureFlagService
   */
  static createMockFeatureFlagService(overrides: Partial<{
    hasAccessToFeature: boolean;
    maxTeamMembers: number;
    maxTeamsPerOrganization: number;
    allowAdvancedNotifications: boolean;
    allowCustomization: boolean;
  }> = {}): FeatureFlagService {
    return {
      hasAccessToFeature: (organizationId: string, feature: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.ok(
          overrides.hasAccessToFeature !== undefined ? overrides.hasAccessToFeature : true
        ));
      },
      
      getMaxTeamMembers: (organizationId: string): Promise<Result<number>> => {
        return Promise.resolve(Result.ok(
          overrides.maxTeamMembers !== undefined ? overrides.maxTeamMembers : 25
        ));
      },
      
      getMaxTeamsPerOrganization: (organizationId: string): Promise<Result<number>> => {
        return Promise.resolve(Result.ok(
          overrides.maxTeamsPerOrganization !== undefined ? overrides.maxTeamsPerOrganization : 10
        ));
      },
      
      allowAdvancedNotifications: (organizationId: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.ok(
          overrides.allowAdvancedNotifications !== undefined ? overrides.allowAdvancedNotifications : true
        ));
      },
      
      allowCustomization: (organizationId: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.ok(
          overrides.allowCustomization !== undefined ? overrides.allowCustomization : true
        ));
      },
      
      getSubscriptionTier: (organizationId: string): Promise<Result<SubscriptionTier>> => {
        return Promise.resolve(Result.ok(SubscriptionTier.PREMIUM));
      }
    };
  }

  /**
   * Skapar en mock implementering av FeatureFlagService som simulerar en gratis prenumeration.
   * 
   * @returns En mockad FeatureFlagService för FREE-nivån
   */
  static createFreeTierFeatureFlagService(): FeatureFlagService {
    return this.createMockFeatureFlagService({
      maxTeamMembers: 10,
      maxTeamsPerOrganization: 3,
      allowAdvancedNotifications: false,
      allowCustomization: false
    });
  }

  /**
   * Skapar en mock implementering av FeatureFlagService som simulerar en pro prenumeration.
   * 
   * @returns En mockad FeatureFlagService för PRO-nivån
   */
  static createProTierFeatureFlagService(): FeatureFlagService {
    return this.createMockFeatureFlagService({
      maxTeamMembers: 25,
      maxTeamsPerOrganization: 10,
      allowAdvancedNotifications: true,
      allowCustomization: false
    });
  }

  /**
   * Skapar en mock implementering av FeatureFlagService som simulerar en premium prenumeration.
   * 
   * @returns En mockad FeatureFlagService för PREMIUM-nivån
   */
  static createPremiumTierFeatureFlagService(): FeatureFlagService {
    return this.createMockFeatureFlagService({
      maxTeamMembers: 100,
      maxTeamsPerOrganization: 50,
      allowAdvancedNotifications: true,
      allowCustomization: true
    });
  }

  /**
   * Skapar en mock implementering av FeatureFlagService som alltid nekar åtkomst.
   * 
   * @returns En mockad FeatureFlagService som alltid returnerar negativa resultat
   */
  static createDenyingFeatureFlagService(): FeatureFlagService {
    return {
      hasAccessToFeature: (organizationId: string, feature: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.ok(false));
      },
      
      getMaxTeamMembers: (organizationId: string): Promise<Result<number>> => {
        return Promise.resolve(Result.ok(5));
      },
      
      getMaxTeamsPerOrganization: (organizationId: string): Promise<Result<number>> => {
        return Promise.resolve(Result.ok(1));
      },
      
      allowAdvancedNotifications: (organizationId: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.ok(false));
      },
      
      allowCustomization: (organizationId: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.ok(false));
      },
      
      getSubscriptionTier: (organizationId: string): Promise<Result<SubscriptionTier>> => {
        return Promise.resolve(Result.ok(SubscriptionTier.FREE));
      }
    };
  }

  /**
   * Skapar en mock implementering av FeatureFlagService som simulerar systemfel.
   * 
   * @returns En mockad FeatureFlagService som alltid returnerar error-resultat
   */
  static createErrorFeatureFlagService(): FeatureFlagService {
    return {
      hasAccessToFeature: (organizationId: string, feature: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.err('Subscription service error'));
      },
      
      getMaxTeamMembers: (organizationId: string): Promise<Result<number>> => {
        return Promise.resolve(Result.err('Subscription service error'));
      },
      
      getMaxTeamsPerOrganization: (organizationId: string): Promise<Result<number>> => {
        return Promise.resolve(Result.err('Subscription service error'));
      },
      
      allowAdvancedNotifications: (organizationId: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.err('Subscription service error'));
      },
      
      allowCustomization: (organizationId: string): Promise<Result<boolean>> => {
        return Promise.resolve(Result.err('Subscription service error'));
      },
      
      getSubscriptionTier: (organizationId: string): Promise<Result<SubscriptionTier>> => {
        return Promise.resolve(Result.err('Subscription service error'));
      }
    };
  }

  // Exportera mock för PermissionService via MockServiceFactory
  static createMockPermissionService = createMockPermissionService;
}

/**
 * Skapar en mock av PermissionService för testning
 * 
 * @param overrides Anpassningar för mocken
 * @returns En mock av PermissionService
 */
export function createMockPermissionService(overrides: Partial<{
  hasOrganizationPermission: jest.Mock;
  hasTeamPermission: jest.Mock;
  hasResourcePermission: jest.Mock;
  hasOrganizationRole: jest.Mock;
  hasTeamRole: jest.Mock;
  getOrganizationPermissions: jest.Mock;
  getTeamPermissions: jest.Mock;
  getResourcePermissions: jest.Mock;
}> = {}) {
  return {
    hasOrganizationPermission: overrides.hasOrganizationPermission || 
      jest.fn().mockResolvedValue({ isOk: () => true, value: true }),
    hasTeamPermission: overrides.hasTeamPermission || 
      jest.fn().mockResolvedValue({ isOk: () => true, value: true }),
    hasResourcePermission: overrides.hasResourcePermission || 
      jest.fn().mockResolvedValue({ isOk: () => true, value: true }),
    hasOrganizationRole: overrides.hasOrganizationRole || 
      jest.fn().mockResolvedValue({ isOk: () => true, value: true }),
    hasTeamRole: overrides.hasTeamRole || 
      jest.fn().mockResolvedValue({ isOk: () => true, value: true }),
    getOrganizationPermissions: overrides.getOrganizationPermissions || 
      jest.fn().mockResolvedValue({ isOk: () => true, value: [] }),
    getTeamPermissions: overrides.getTeamPermissions || 
      jest.fn().mockResolvedValue({ isOk: () => true, value: [] }),
    getResourcePermissions: overrides.getResourcePermissions || 
      jest.fn().mockResolvedValue({ isOk: () => true, value: [] })
  };
} 