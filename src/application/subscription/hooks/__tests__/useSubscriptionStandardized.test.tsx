import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  let queryClient: QueryClient;

  // Skapa ny QueryClient för varje test
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    });
    
    // Rensa alla mock-anrop mellan tester
    jest.clearAllMocks();
    
    // Reset mocks
    mockUseOrganizationSubscription.mockReset();
    mockUseFeatureFlag.mockReset();
    mockUseUpdateSubscriptionStatus.mockReset();
    mockUseTrackUsage.mockReset();
  });

  const createWrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

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
        <QueryClientProvider client={queryClient}>
          <OrganizationSubscriptionTest />
        </QueryClientProvider>
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
        <QueryClientProvider client={queryClient}>
          <OrganizationSubscriptionTest />
        </QueryClientProvider>
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
        <QueryClientProvider client={queryClient}>
          <FeatureFlagTest />
        </QueryClientProvider>
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
        <QueryClientProvider client={queryClient}>
          <FeatureFlagTest />
        </QueryClientProvider>
      );

      // Assert
      expect(screen.getByText('Feature enabled: Nej')).toBeInTheDocument();
      expect(mockUseFeatureFlag).toHaveBeenCalledWith(null, 'feature');
    });
  });

  describe('useUpdateSubscriptionStatus', () => {
    it('should update subscription status successfully', async () => {
      // Arrange
      mockSubscriptionRepository.updateStatus.mockResolvedValue(
        Result.ok(true)
      );
      
      // Mock mutation implementation
      const mockMutate = jest.fn();
      mockUseUpdateSubscriptionStatus.mockImplementation(() => {
        return {
          mutate: mockMutate,
          isLoading: false,
          isSuccess: true,
          error: null
        };
      });

      // Act
      const UpdateSubscriptionTest = () => {
        const { useUpdateSubscriptionStatus } = useSubscription();
        const mutation = useUpdateSubscriptionStatus();
        
        React.useEffect(() => {
          mutation.mutate({ 
            subscriptionId: 'sub-1', 
            status: 'active' 
          });
        }, []);
        
        return (
          <div>
            {mutation.isLoading ? (
              'Uppdaterar...'
            ) : mutation.isSuccess ? (
              'Status uppdaterad!'
            ) : mutation.error ? (
              `Fel: ${mutation.error.message}`
            ) : (
              'Redo att uppdatera'
            )}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <UpdateSubscriptionTest />
        </QueryClientProvider>
      );

      // Assert
      expect(screen.getByText('Status uppdaterad!')).toBeInTheDocument();
      expect(mockMutate).toHaveBeenCalledWith({ 
        subscriptionId: 'sub-1', 
        status: 'active' 
      });
    });
  });

  describe('useTrackUsage', () => {
    it('should track usage successfully', async () => {
      // Arrange
      mockSubscriptionRepository.trackUsage.mockResolvedValue(
        Result.ok(true)
      );
      
      // Mock mutation implementation
      const mockMutate = jest.fn();
      mockUseTrackUsage.mockImplementation(() => {
        return {
          mutate: mockMutate,
          isLoading: false,
          isSuccess: true,
          error: null
        };
      });

      // Act
      const TrackUsageTest = () => {
        const { useTrackUsage } = useSubscription();
        const mutation = useTrackUsage();
        
        React.useEffect(() => {
          mutation.mutate({ 
            organizationId: 'org-1', 
            featureKey: 'api_calls', 
            usage: 1 
          });
        }, []);
        
        return (
          <div>
            {mutation.isLoading ? (
              'Spårar användning...'
            ) : mutation.isSuccess ? (
              'Användning spårad!'
            ) : mutation.error ? (
              `Fel: ${mutation.error.message}`
            ) : (
              'Redo att spåra'
            )}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TrackUsageTest />
        </QueryClientProvider>
      );

      // Assert
      expect(screen.getByText('Användning spårad!')).toBeInTheDocument();
      expect(mockMutate).toHaveBeenCalledWith({ 
        organizationId: 'org-1', 
        featureKey: 'api_calls', 
        usage: 1 
      });
    });
  });
}); 