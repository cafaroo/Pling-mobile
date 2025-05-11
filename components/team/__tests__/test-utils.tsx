import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Skapa en QueryClient för tester
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => {},
  },
});

// Hjälpfunktion för att direkt anropa en komponents onPress
export function simulatePress(element: any): boolean {
  if (element && element.props && typeof element.props.onPress === 'function') {
    element.props.onPress();
    return true;
  }
  return false;
}

// Mockade team för TeamList tester
export const mockTeams = [
  {
    id: '1',
    name: 'Team 1',
    description: 'Beskrivning för team 1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: 'user1',
    is_private: false,
    team_members: [
      { id: 'member1', user_id: 'user1', team_id: '1', role: 'owner', status: 'active' },
      { id: 'member2', user_id: 'user2', team_id: '1', role: 'member', status: 'active' }
    ]
  },
  {
    id: '2',
    name: 'Team 2',
    description: 'Beskrivning för team 2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: 'user2',
    is_private: true,
    team_members: [
      { id: 'member3', user_id: 'user2', team_id: '2', role: 'owner', status: 'active' },
      { id: 'member4', user_id: 'user1', team_id: '2', role: 'member', status: 'active' }
    ]
  }
];

// Utökad fireEvent-hantering
const enhancedFireEvent = {
  press: (element: any) => {
    // Om elementet har en onPress-funktion, anropa den
    if (element && element.props && typeof element.props.onPress === 'function') {
      element.props.onPress();
      return true;
    }
    return false;
  }
};

// Skapar en ny queryClient för varje test
export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );

  // Hitta alla DOM-element inklusive deras props/barn
  const findAllElements = () => {
    try {
      if (utils.UNSAFE_root && typeof utils.UNSAFE_root.findAll === 'function') {
        return utils.UNSAFE_root.findAll((node: any) => node.props !== undefined);
      }
      return [];
    } catch (error) {
      console.warn('Kunde inte hitta element med UNSAFE_root:', error);
      return [];
    }
  };

  // Specialversion som hittar text oavsett om det är via text-innehåll eller props
  const getAllElements = () => {
    return findAllElements();
  };

  return {
    ...utils,
    queryClient,
    simulatePress,
    fireEvent: {
      ...utils.fireEvent,
      ...enhancedFireEvent
    },
    // Utökade selektorer för att hantera både text och testID
    getByText: (text: string) => {
      try {
        return utils.getByText(text);
      } catch (error) {
        // Sök igenom alla element efter matchande text
        const elements = getAllElements();
        
        // Först kolla children-egenskaper
        for (const el of elements) {
          if (el.props?.children === text) {
            return el;
          }
          
          // Hantera textinnehåll i react-element
          if (el.props?.children && typeof el.props.children === 'object' && el.props.children.props?.children === text) {
            return el;
          }
        }
        
        throw new Error(`Kunde inte hitta text: ${text}`);
      }
    },
    debugAllElements: () => {
      console.log(JSON.stringify(getAllElements().map(el => ({
        type: el.type,
        testID: el.props['data-testid'] || el.props.testID,
        children: el.props.children
      })), null, 2));
    }
  };
}

// Hjälpfunktion för att fördröja test
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Hjälpfunktioner för testning
export const createTestProps = (props: object = {}) => ({
  navigation: {
    navigate: jest.fn(),
    goBack: jest.fn(),
  },
  route: {
    params: {},
  },
  ...props,
});

// Mocka Supabase-klienten
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
}; 