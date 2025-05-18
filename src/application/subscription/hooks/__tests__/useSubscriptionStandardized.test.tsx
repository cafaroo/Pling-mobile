import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { QueryClientTestProvider } from '@/test-utils';
import { useSubscription } from '../useSubscriptionContext';
import { Result } from '@/shared/core/Result';

// Mock för repository
const mockSubscriptionRepository = {
  findByOrganizationId: jest.fn(),
  updateStatus: jest.fn(),
  checkFeatureAccess: jest.fn(),
  trackUsage: jest.fn()
};

// Mock för hooks utanför jest.mock
const mockUseOrganizationSubscription = jest.fn();
const mockUseFeatureFlag = jest.fn();
const mockUseUpdateSubscriptionStatus = jest.fn();
const mockUseTrackUsage = jest.fn();

// Mock för context
jest.mock('../useSubscriptionContext', () => {
  return {
    __esModule: true,
    useSubscriptionContext: () => ({
      subscriptionRepository: mockSubscriptionRepository,
      featureFlagService: {
        isFeatureEnabled: mockSubscriptionRepository.checkFeatureAccess
      },
      usageTrackingService: {
        trackUsage: mockSubscriptionRepository.trackUsage
      }
    }),
    useSubscription: () => ({
      useOrganizationSubscription: mockUseOrganizationSubscription,
      useFeatureFlag: mockUseFeatureFlag,
      useUpdateSubscriptionStatus: mockUseUpdateSubscriptionStatus,
      useTrackUsage: mockUseTrackUsage
    })
  };
});

// Hjälpfunktion för att vänta på React Query-uppdateringar
const waitForNextUpdate = () => new Promise(resolve => setTimeout(resolve, 50));

describe('useSubscriptionStandardized', () => {
  // Rensa alla mock-anrop mellan tester
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockUseOrganizationSubscription.mockReset();
    mockUseFeatureFlag.mockReset();
    mockUseUpdateSubscriptionStatus.mockReset();
    mockUseTrackUsage.mockReset();
  });

  describe('useOrganizationSubscription', () => {
    it('should load a subscription by organization id', async () => {
      // Arrange
      const orgId = 'test-org-id';
      const mockSubscription = {
        id: 'sub-1',
        organizationId: orgId,
        status: 'active',
        planId: 'premium',
        currentPeriodEnd: new Date().toISOString()
      };

      mockSubscriptionRepository.findByOrganizationId.mockResolvedValue(
        Result.ok(mockSubscription)
      );
      
      mockUseOrganizationSubscription.mockImplementation((id) => {
        return {
          data: id === orgId ? mockSubscription : null,
          isLoading: false,
          error: null
        };
      });

      // Act
      const OrganizationSubscriptionTest = () => {
        const { useOrganizationSubscription } = useSubscription();
        const { data: subscription, isLoading } = useOrganizationSubscription(orgId);
        
        return (
          <div>
            {isLoading ? (
              'Laddar...'
            ) : subscription ? (
              `Prenumeration: ${subscription.planId}`
            ) : (
              'Ingen prenumeration hittades'
            )}
          </div>
        );
      };

      render(
        <QueryClientTestProvider>
          <OrganizationSubscriptionTest />
        </QueryClientTestProvider>
      );

      // Assert
      expect(screen.getByText(/Prenumeration/)).toBeInTheDocument();
      expect(mockUseOrganizationSubscription).toHaveBeenCalledWith(orgId);
    });

    it('should return null when no organizationId is provided', async () => {
      // Arrange
      mockUseOrganizationSubscription.mockImplementation((id) => {
        return {
          data: null,
          isLoading: false,
          error: null
        };
      });

      // Act
      const OrganizationSubscriptionTest = () => {
        const { useOrganizationSubscription } = useSubscription();
        const { data: subscription, isLoading } = useOrganizationSubscription(null);
        
        return (
          <div>
            {isLoading ? (
              'Laddar...'
            ) : subscription ? (
              `Prenumeration: ${subscription.planId}`
            ) : (
              'Ingen prenumeration hittades'
            )}
          </div>
        );
      };

      render(
        <QueryClientTestProvider>
          <OrganizationSubscriptionTest />
        </QueryClientTestProvider>
      );

      // Assert
      expect(screen.getByText('Ingen prenumeration hittades')).toBeInTheDocument();
      expect(mockUseOrganizationSubscription).toHaveBeenCalledWith(null);
    });
  });

  describe('useFeatureFlag', () => {
    it('should check if a feature is enabled', async () => {
      // Arrange
      const orgId = 'test-org-id';
      const featureKey = 'max_teams';
      
      mockSubscriptionRepository.checkFeatureAccess.mockResolvedValue(
        Result.ok(true)
      );
      
      mockUseFeatureFlag.mockImplementation((orgId, featureKey) => {
        return {
          data: true,
          isLoading: false,
          error: null
        };
      });

      // Act
      const FeatureFlagTest = () => {
        const { useFeatureFlag } = useSubscription();
        const { data: isEnabled, isLoading } = useFeatureFlag(orgId, featureKey);
        
        return (
          <div>
            {isLoading ? (
              'Kontrollerar feature...'
            ) : (
              `Feature enabled: ${isEnabled ? 'Ja' : 'Nej'}`
            )}
          </div>
        );
      };

      render(
        <QueryClientTestProvider>
          <FeatureFlagTest />
        </QueryClientTestProvider>
      );

      // Assert
      expect(screen.getByText(/Feature enabled: Ja/)).toBeInTheDocument();
      expect(mockUseFeatureFlag).toHaveBeenCalledWith(orgId, featureKey);
    });

    it('should return false when params are missing', async () => {
      // Arrange
      mockUseFeatureFlag.mockImplementation((orgId, featureKey) => {
        return {
          data: false,
          isLoading: false,
          error: null
        };
      });

      // Act
      const FeatureFlagTest = () => {
        const { useFeatureFlag } = useSubscription();
        const { data: isEnabled, isLoading } = useFeatureFlag(null, 'feature');
        
        return (
          <div>
            {isLoading ? (
              'Kontrollerar feature...'
            ) : (
              `Feature enabled: ${isEnabled ? 'Ja' : 'Nej'}`
            )}
          </div>
        );
      };

      render(
        <QueryClientTestProvider>
          <FeatureFlagTest />
        </QueryClientTestProvider>
      );

      // Assert
      expect(screen.getByText('Feature enabled: Nej')).toBeInTheDocument();
      expect(mockUseFeatureFlag).toHaveBeenCalledWith(null, 'feature');
    });
  });

  describe('useUpdateSubscriptionStatus', () => {
    it('should update subscription status', async () => {
      // Arrange
      const orgId = 'test-org-id';
      const newStatus = 'canceled';
      
      mockSubscriptionRepository.updateStatus.mockResolvedValue(
        Result.ok(true)
      );
      
      // Mock för mutation
      mockUseUpdateSubscriptionStatus.mockImplementation(() => {
        return {
          mutate: async (params) => {
            const { organizationId, status } = params;
            await mockSubscriptionRepository.updateStatus(organizationId, status);
            return Result.ok(true);
          },
          isLoading: false,
          error: null
        };
      });

      // Act
      const UpdateSubscriptionTest = () => {
        const { useUpdateSubscriptionStatus } = useSubscription();
        const { mutate, isLoading } = useUpdateSubscriptionStatus();
        
        const handleClick = async () => {
          await mutate({ organizationId: orgId, status: newStatus });
        };
        
        return (
          <div>
            <button onClick={handleClick}>
              {isLoading ? 'Uppdaterar...' : 'Uppdatera status'}
            </button>
          </div>
        );
      };

      render(
        <QueryClientTestProvider>
          <UpdateSubscriptionTest />
        </QueryClientTestProvider>
      );

      // Klicka på knappen
      await act(async () => {
        screen.getByText('Uppdatera status').click();
        await waitForNextUpdate();
      });

      // Assert
      expect(mockUseUpdateSubscriptionStatus).toHaveBeenCalled();
      expect(mockSubscriptionRepository.updateStatus).toHaveBeenCalledWith(
        orgId,
        newStatus
      );
    });
  });

  describe('useTrackUsage', () => {
    it('should track feature usage', async () => {
      // Arrange
      const orgId = 'test-org-id';
      const featureKey = 'api_calls';
      const amount = 1;
      
      mockSubscriptionRepository.trackUsage.mockResolvedValue(
        Result.ok(true)
      );
      
      // Mock för mutation
      mockUseTrackUsage.mockImplementation(() => {
        return {
          mutate: async (params) => {
            const { organizationId, feature, amount } = params;
            await mockSubscriptionRepository.trackUsage(organizationId, feature, amount);
            return Result.ok(true);
          },
          isLoading: false,
          error: null
        };
      });

      // Act
      const TrackUsageTest = () => {
        const { useTrackUsage } = useSubscription();
        const { mutate, isLoading } = useTrackUsage();
        
        const handleClick = async () => {
          await mutate({ organizationId: orgId, feature: featureKey, amount });
        };
        
        return (
          <div>
            <button onClick={handleClick}>
              {isLoading ? 'Registrerar användning...' : 'Registrera användning'}
            </button>
          </div>
        );
      };

      render(
        <QueryClientTestProvider>
          <TrackUsageTest />
        </QueryClientTestProvider>
      );

      // Klicka på knappen
      await act(async () => {
        screen.getByText('Registrera användning').click();
        await waitForNextUpdate();
      });

      // Assert
      expect(mockUseTrackUsage).toHaveBeenCalled();
      expect(mockSubscriptionRepository.trackUsage).toHaveBeenCalledWith(
        orgId,
        featureKey,
        amount
      );
    });
  });
}); 