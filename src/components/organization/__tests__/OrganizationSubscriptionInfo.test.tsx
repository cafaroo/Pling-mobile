import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { OrganizationSubscriptionInfo } from '../OrganizationSubscriptionInfo';
import { useOrganization } from '../OrganizationProvider';
import { SubscriptionStatus } from '@/domain/organization/interfaces/SubscriptionService';

// Mocka OrganizationProvider hook
jest.mock('../OrganizationProvider', () => ({
  useOrganization: jest.fn()
}));

const mockUseOrganization = useOrganization as jest.MockedFunction<typeof useOrganization>;

describe('OrganizationSubscriptionInfo', () => {
  const mockOrganizationId = 'org-123';
  
  // Skapa en mockad prenumerationsstatus
  const mockSubscriptionStatus: SubscriptionStatus = {
    hasActiveSubscription: true,
    plan: {
      id: 'pro-plan',
      name: 'pro',
      displayName: 'Professionell',
      description: 'Avancerade funktioner för team',
      isActive: true,
      price: 249,
      currency: 'SEK',
      interval: 'monthly',
      features: {
        maxResources: 1000,
        maxTeams: 20,
        maxMembersPerTeam: 25,
        maxStorageGB: 10,
        allowAdvancedPermissions: true,
        allowIntegrations: true,
        allowExport: true,
        prioritySupport: false
      }
    },
    currentUsage: {
      resourceCount: 50,
      teamCount: 5,
      storageUsedBytes: 1073741824 // 1GB
    },
    expiresAt: null,
    trialEndsAt: null,
    isInTrial: false,
    isCancelled: false,
    willRenew: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Standardmockning för useOrganization
    mockUseOrganization.mockReturnValue({
      getSubscriptionStatus: jest.fn().mockResolvedValue(mockSubscriptionStatus),
      getSubscriptionManagementUrl: jest.fn().mockResolvedValue('https://example.com/manage'),
      // Lägga till övriga mockade värden som komponenten förväntar sig
      currentOrganization: null,
      organizations: [],
      setCurrentOrganization: jest.fn(),
      createOrganization: jest.fn(),
      updateOrganization: jest.fn(),
      deleteOrganization: jest.fn(),
      inviteUserToOrganization: jest.fn(),
      acceptInvitation: jest.fn(),
      declineInvitation: jest.fn(),
      userInvitations: [],
      organizationInvitations: [],
      members: [],
      loading: false,
      teams: [],
      createTeam: jest.fn(),
      updateTeam: jest.fn(),
      deleteTeam: jest.fn(),
      addTeamMember: jest.fn(),
      removeTeamMember: jest.fn(),
      resources: [],
      createResource: jest.fn(),
      updateResource: jest.fn(),
      deleteResource: jest.fn(),
      getResourcesForOrganization: jest.fn(),
      addResourcePermission: jest.fn(),
      removeResourcePermission: jest.fn(),
      loadingResources: false,
      hasActiveSubscription: jest.fn().mockResolvedValue(true),
      canPerformResourceAction: jest.fn(),
      getAvailablePlans: jest.fn()
    } as any);
  });

  it('visar laddningsindikator initialt', () => {
    const { getByText } = render(
      <OrganizationSubscriptionInfo organizationId={mockOrganizationId} />
    );
    
    expect(getByText('Hämtar prenumerationsinformation...')).toBeTruthy();
  });

  it('visar prenumerationsstatus när data har laddats', async () => {
    const { getByText, queryByText } = render(
      <OrganizationSubscriptionInfo organizationId={mockOrganizationId} />
    );
    
    // Vänta på att laddningen är klar
    await waitFor(() => {
      expect(queryByText('Hämtar prenumerationsinformation...')).toBeNull();
    });
    
    // Verifiera att prenumerationsinformation visas
    expect(getByText('Prenumerationsinformation')).toBeTruthy();
    expect(getByText('Aktiv')).toBeTruthy();
    expect(getByText('Professionell')).toBeTruthy();
    expect(getByText('Avancerade funktioner för team')).toBeTruthy();
    expect(getByText('249 SEK/månad')).toBeTruthy();
    
    // Verifiera att användningsinformation visas
    expect(getByText('Användning')).toBeTruthy();
    expect(getByText('50 / 1000 (5%)')).toBeTruthy();
    expect(getByText('5 / 20 (25%)')).toBeTruthy();
    
    // Verifiera att funktioner visas
    expect(getByText('Funktioner')).toBeTruthy();
    expect(getByText('Avancerade behörigheter')).toBeTruthy();
    expect(getByText('Integrationer')).toBeTruthy();
    
    // Verifiera att knappen för att hantera prenumeration visas
    expect(getByText('Hantera prenumeration')).toBeTruthy();
  });

  it('visar felmeddelande när hämtning av prenumerationsdata misslyckas', async () => {
    // Mocka ett fel vid hämtning av prenumerationsstatus
    mockUseOrganization.mockReturnValue({
      ...mockUseOrganization(),
      getSubscriptionStatus: jest.fn().mockRejectedValue(new Error('Ett fel uppstod')),
    } as any);
    
    const { getByText, queryByText } = render(
      <OrganizationSubscriptionInfo organizationId={mockOrganizationId} />
    );
    
    // Vänta på att laddningen är klar
    await waitFor(() => {
      expect(queryByText('Hämtar prenumerationsinformation...')).toBeNull();
    });
    
    // Verifiera att felmeddelande visas
    expect(getByText('Det gick inte att hämta prenumerationsinformation')).toBeTruthy();
    
    // Verifiera att knappen "Försök igen" visas
    expect(getByText('Försök igen')).toBeTruthy();
    
    // Testa att klicka på "Försök igen"
    mockUseOrganization.mockReturnValue({
      ...mockUseOrganization(),
      getSubscriptionStatus: jest.fn().mockResolvedValue(mockSubscriptionStatus),
    } as any);
    
    fireEvent.press(getByText('Försök igen'));
    
    // Verifiera att laddningsindikator visas igen
    expect(getByText('Hämtar prenumerationsinformation...')).toBeTruthy();
    
    // Vänta på att laddningen är klar (innehållet visas)
    await waitFor(() => {
      expect(queryByText('Hämtar prenumerationsinformation...')).toBeNull();
    });
    
    // Verifiera att innehållet visas efter att ha försökt igen
    expect(getByText('Prenumerationsinformation')).toBeTruthy();
  });

  it('visar prenumerationsplan med gratisinnehåll korrekt', async () => {
    // Ändra mockad prenumerationsstatus till gratisplan
    const freePlan = {
      ...mockSubscriptionStatus,
      plan: {
        ...mockSubscriptionStatus.plan!,
        id: 'free-plan',
        name: 'free',
        displayName: 'Gratisplan',
        price: 0,
        features: {
          ...mockSubscriptionStatus.plan!.features,
          allowAdvancedPermissions: false,
          allowIntegrations: false
        }
      }
    };
    
    mockUseOrganization.mockReturnValue({
      ...mockUseOrganization(),
      getSubscriptionStatus: jest.fn().mockResolvedValue(freePlan),
    } as any);
    
    const { getByText, queryByText } = render(
      <OrganizationSubscriptionInfo organizationId={mockOrganizationId} />
    );
    
    // Vänta på att laddningen är klar
    await waitFor(() => {
      expect(queryByText('Hämtar prenumerationsinformation...')).toBeNull();
    });
    
    // Verifiera att gratisplan visas korrekt
    expect(getByText('Gratisplan')).toBeTruthy();
    expect(getByText('Gratis')).toBeTruthy();
  });

  it('visar testperiod-information när organisationen är i testperiod', async () => {
    // Ändra mockad prenumerationsstatus till att vara i testperiod
    const trialStatus = {
      ...mockSubscriptionStatus,
      isInTrial: true,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dagar framåt
    };
    
    mockUseOrganization.mockReturnValue({
      ...mockUseOrganization(),
      getSubscriptionStatus: jest.fn().mockResolvedValue(trialStatus),
    } as any);
    
    const { getByText, queryByText } = render(
      <OrganizationSubscriptionInfo organizationId={mockOrganizationId} />
    );
    
    // Vänta på att laddningen är klar
    await waitFor(() => {
      expect(queryByText('Hämtar prenumerationsinformation...')).toBeNull();
    });
    
    // Verifiera att testperiodsinformation visas
    expect(getByText(/Testperiod slutar:/)).toBeTruthy();
  });
}); 