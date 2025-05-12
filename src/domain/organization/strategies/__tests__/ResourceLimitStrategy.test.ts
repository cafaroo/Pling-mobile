import { UniqueId } from '../../../core/UniqueId';
import { SubscriptionAdapter } from '../../adapters/SubscriptionAdapter';
import { 
  BaseResourceLimitStrategy, 
  ResourceType, 
  OrganizationResourceLimitStrategy 
} from '../ResourceLimitStrategy';
import { GoalLimitStrategy } from '../GoalLimitStrategy';
import { CompetitionLimitStrategy } from '../CompetitionLimitStrategy';
import { ReportLimitStrategy } from '../ReportLimitStrategy';

// Mock för SubscriptionAdapter
const mockSubscriptionAdapter: jest.Mocked<SubscriptionAdapter> = {
  hasActiveSubscription: jest.fn(),
  hasFeatureAccess: jest.fn(),
  canAddMoreUsers: jest.fn(),
  canAddMoreTeams: jest.fn(),
  canAddMoreResources: jest.fn(),
  updateUsageMetrics: jest.fn(),
  getSubscriptionLimits: jest.fn(),
  getSubscriptionStatus: jest.fn(),
  getUsagePercentages: jest.fn(),
} as unknown as jest.Mocked<SubscriptionAdapter>;

describe('ResourceLimitStrategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const organizationId = new UniqueId('org-123');

  describe('GoalLimitStrategy', () => {
    it('ska returnera tillåten när under gränsen', async () => {
      // Arrange
      mockSubscriptionAdapter.hasActiveSubscription.mockResolvedValue(true);
      mockSubscriptionAdapter.canAddMoreResources.mockResolvedValue(true);
      mockSubscriptionAdapter.getSubscriptionLimits.mockResolvedValue({ goals: 10 });
      
      const strategy = new GoalLimitStrategy(mockSubscriptionAdapter);
      
      // Act
      const result = await strategy.isActionAllowed(organizationId, 5, 1);
      
      // Assert
      expect(result.allowed).toBe(true);
      expect(mockSubscriptionAdapter.canAddMoreResources).toHaveBeenCalledWith(
        organizationId,
        ResourceType.GOAL,
        5,
        1
      );
    });
    
    it('ska returnera ej tillåten när över gränsen', async () => {
      // Arrange
      mockSubscriptionAdapter.hasActiveSubscription.mockResolvedValue(true);
      mockSubscriptionAdapter.canAddMoreResources.mockResolvedValue(false);
      mockSubscriptionAdapter.getSubscriptionLimits.mockResolvedValue({ goals: 10 });
      
      const strategy = new GoalLimitStrategy(mockSubscriptionAdapter);
      
      // Act
      const result = await strategy.isActionAllowed(organizationId, 10, 1);
      
      // Assert
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Du har nått gränsen för antal');
    });
    
    it('ska använda fallback-gräns när ingen prenumeration finns', async () => {
      // Arrange
      mockSubscriptionAdapter.hasActiveSubscription.mockResolvedValue(false);
      
      const strategy = new GoalLimitStrategy(mockSubscriptionAdapter, 3);
      
      // Act
      const result = await strategy.isActionAllowed(organizationId, 3, 1);
      
      // Assert
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(3);
      expect(result.reason).toContain('Basic-planen');
    });
  });

  describe('CompetitionLimitStrategy', () => {
    it('ska returnera korrekt användningsprocent', async () => {
      // Arrange
      mockSubscriptionAdapter.getSubscriptionLimits.mockResolvedValue({ competitions: 10 });
      
      const strategy = new CompetitionLimitStrategy(mockSubscriptionAdapter);
      
      // Act
      const usagePercentage = await strategy.getUsagePercentage(organizationId, 5);
      
      // Assert
      expect(usagePercentage).toBe(50);
    });
  });

  describe('ReportLimitStrategy', () => {
    it('ska hantera maxvärde för användningsprocent', async () => {
      // Arrange
      mockSubscriptionAdapter.getSubscriptionLimits.mockResolvedValue({ reports: 2 });
      
      const strategy = new ReportLimitStrategy(mockSubscriptionAdapter);
      
      // Act
      const usagePercentage = await strategy.getUsagePercentage(organizationId, 5);
      
      // Assert
      expect(usagePercentage).toBe(100); // Bör vara cappat till 100%
    });
  });

  describe('OrganizationResourceLimitStrategy', () => {
    it('ska konstrueras med rätt parametrar', () => {
      // Arrange & Act
      const strategy = new OrganizationResourceLimitStrategy(
        mockSubscriptionAdapter,
        ResourceType.GOAL,
        15
      );
      
      // Assert
      expect((strategy as any).limitKey).toBe(`resources_${ResourceType.GOAL}`);
      expect((strategy as any).fallbackLimit).toBe(15);
    });
  });
}); 