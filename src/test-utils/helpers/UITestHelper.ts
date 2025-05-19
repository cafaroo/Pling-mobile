import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useUserWithStandardHook } from '@/application/user/hooks/useUserWithStandardHook';
import { Result } from '@/shared/core/Result';

/**
 * UITestHelper - Hjälpfunktioner för UI-komponenttestning
 * 
 * Innehåller olika hjälpfunktioner för att förenkla testning av UI-komponenter, 
 * särskilt de som följer container/presentation-mönstret.
 */
export const UITestHelper = {
  /**
   * Skapar en QueryClient med standardinställningar för testning
   */
  createTestQueryClient: (): QueryClient => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
        },
      },
    });
  },

  /**
   * Renderar en komponent med React Query Provider
   */
  renderWithQueryClient: (
    ui: React.ReactElement,
    options?: RenderOptions
  ) => {
    const queryClient = UITestHelper.createTestQueryClient();
    
    const wrappedComponent = React.createElement(
      QueryClientProvider, 
      { client: queryClient }, 
      ui
    );
    
    return render(wrappedComponent, options);
  },
  
  /**
   * Skapar ett standardiserat laddningstillstånd för API-resultat
   */
  createLoadingState: () => ({
    data: null,
    isLoading: true,
    error: null,
    execute: jest.fn(),
  }),
  
  /**
   * Skapar ett standardiserat feltillstånd för API-resultat
   */
  createErrorState: (errorMessage: string) => ({
    data: null,
    isLoading: false,
    error: { message: errorMessage },
    execute: jest.fn(),
  }),
  
  /**
   * Skapar ett standardiserat tomt datatillstånd för API-resultat
   */
  createEmptyState: () => ({
    data: [],
    isLoading: false,
    error: null,
    execute: jest.fn(),
  }),
  
  /**
   * Skapar ett standardiserat datatillstånd för API-resultat
   */
  createDataState: <T>(data: T, executeFn = jest.fn()) => ({
    data,
    isLoading: false,
    error: null,
    execute: executeFn,
  }),
  
  /**
   * Skapar en standardiserad mockad mutationstillstånd
   */
  createMockMutation: (isSuccess = true) => ({
    isLoading: false,
    error: null,
    execute: jest.fn().mockImplementation(() => 
      Promise.resolve(isSuccess ? Result.ok(true) : Result.err(new Error('Mockad mutation misslyckades')))
    ),
  }),
  
  /**
   * Mockad version av useTeamWithStandardHook med möjlighet att anpassa olika tillstånd
   */
  mockTeamHook: (options: {
    teamData?: any;
    teamMembersData?: any;
    teamActivitiesData?: any;
    isLoading?: boolean;
    error?: { message: string } | null;
    mutations?: Record<string, any>;
  } = {}) => {
    const {
      teamData = null,
      teamMembersData = [],
      teamActivitiesData = [],
      isLoading = false,
      error = null,
      mutations = {}
    } = options;
    
    return {
      getTeam: {
        data: teamData,
        isLoading,
        error,
        execute: jest.fn(),
      },
      getTeamMembers: {
        data: teamMembersData,
        isLoading,
        error,
        execute: jest.fn(),
      },
      getTeamActivities: {
        data: teamActivitiesData,
        isLoading,
        error,
        execute: jest.fn(),
      },
      addTeamMember: mutations.addTeamMember || UITestHelper.createMockMutation(),
      removeTeamMember: mutations.removeTeamMember || UITestHelper.createMockMutation(),
      updateTeamMemberRole: mutations.updateTeamMemberRole || UITestHelper.createMockMutation(),
      updateTeam: mutations.updateTeam || UITestHelper.createMockMutation(),
    };
  },
  
  /**
   * Mockad version av useUserWithStandardHook med möjlighet att anpassa olika tillstånd
   */
  mockUserHook: (options: {
    profileData?: any;
    userTeamsData?: any;
    isLoading?: boolean;
    error?: { message: string } | null;
    mutations?: Record<string, any>;
  } = {}) => {
    const {
      profileData = null,
      userTeamsData = [],
      isLoading = false,
      error = null,
      mutations = {}
    } = options;
    
    return {
      getUserProfile: {
        data: profileData,
        isLoading,
        error,
        execute: jest.fn(),
      },
      getUserTeams: {
        data: userTeamsData,
        isLoading,
        error,
        execute: jest.fn(),
      },
      updateUserProfile: mutations.updateUserProfile || UITestHelper.createMockMutation(),
      updateUserSettings: mutations.updateUserSettings || UITestHelper.createMockMutation(),
      uploadProfileImage: mutations.uploadProfileImage || UITestHelper.createMockMutation(),
    };
  },
  
  /**
   * Konfigurerar vanliga mocks för UI-tester
   */
  setupCommonMocks: () => {
    // Mocka userWithStandardHook och teamWithStandardHook
    jest.mock('@/application/user/hooks/useUserWithStandardHook', () => ({
      useUserWithStandardHook: jest.fn()
    }));
    
    jest.mock('@/application/team/hooks/useTeamWithStandardHook', () => ({
      useTeamWithStandardHook: jest.fn()
    }));
    
    // Mocka navigation hooks
    jest.mock('expo-router', () => ({
      useLocalSearchParams: jest.fn().mockReturnValue({}),
      useRouter: jest.fn().mockReturnValue({
        back: jest.fn(),
        push: jest.fn(),
        replace: jest.fn(),
      })
    }));
    
    // Mocka UI-komponenter
    jest.mock('@/ui/components/Screen', () => ({
      Screen: ({ children }: any) => children,
    }));
  },
  
  /**
   * Genererar dummy-data för tester
   */
  mockData: {
    team: (customProps = {}) => ({
      id: 'team-123',
      name: 'Test Team',
      description: 'Test team description',
      ownerId: 'user-1',
      createdAt: new Date().toISOString(),
      memberCount: 3,
      ...customProps
    }),
    
    teamMember: (index = 1, customProps = {}) => ({
      id: `user-${index}`,
      name: `Test User ${index}`,
      email: `user${index}@example.com`,
      role: index === 1 ? 'admin' : 'member',
      ...customProps
    }),
    
    teamMembers: (count = 3) => 
      Array.from({ length: count }, (_, i) => UITestHelper.mockData.teamMember(i + 1)),
    
    user: (customProps = {}) => ({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      photoUrl: 'https://example.com/photo.jpg',
      bio: 'Test bio',
      phone: '+46701234567',
      ...customProps
    }),
    
    teamActivity: (index = 1, type = 'message') => {
      const types = ['message', 'member_joined', 'role_changed', 'team_updated'];
      const actualType = type || types[index % types.length];
      
      const titles = {
        message: 'Nytt meddelande',
        member_joined: 'Ny medlem',
        role_changed: 'Roll ändrad',
        team_updated: 'Team uppdaterat'
      };
      
      return {
        id: `activity-${index}`,
        type: actualType,
        title: titles[actualType as keyof typeof titles],
        description: `Test activity ${index} description`,
        createdAt: new Date().toISOString(),
        createdBy: `user-${index}`,
        createdByName: `User ${index}`,
      };
    },
    
    teamActivities: (count = 5) =>
      Array.from({ length: count }, (_, i) => UITestHelper.mockData.teamActivity(i + 1)),
  },
  
  /**
   * Testassistans genom att ange vanliga testscenarier
   */
  testScenarios: {
    loadingState: (renderFn: () => any) => {
      it('visar laddningsindikator när data hämtas', () => {
        const { getByTestId } = renderFn();
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });
    },
    
    errorState: (renderFn: () => any, errorMessage = 'Test error') => {
      it('visar felmeddelande när ett fel uppstår', () => {
        const { getByText, getByTestId } = renderFn();
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText(errorMessage)).toBeTruthy();
      });
    },
    
    emptyState: (renderFn: () => any, emptyStateText = 'Inga data att visa') => {
      it('visar tomt tillstånd när inga data finns', () => {
        const { getByText, getByTestId } = renderFn();
        expect(getByTestId('empty-state')).toBeTruthy();
        expect(getByText(emptyStateText)).toBeTruthy();
      });
    },
  }
};

export default UITestHelper; 