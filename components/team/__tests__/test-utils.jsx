const React = require('react');
const { render } = require('@testing-library/react-native');

// Fake ThemeProvider för tester
const ThemeProvider = ({ children }) => {
  return React.createElement('div', null, children);
};

// Skapa en QueryClient för tester
const createTestQueryClient = () => ({
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

// Mock data för team
const mockTeams = [
  {
    id: '1',
    name: 'Team 1',
    description: 'Ett testteam',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: 'user1',
    is_private: true,
    settings: {
      privacy: {
        isPublic: false
      }
    },
    team_members: [
      { 
        id: '1', 
        user_id: 'user1', 
        team_id: '1', 
        role: 'owner', 
        status: 'active',
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        user: {
          id: '1',
          name: 'Teamägare',
          email: 'owner@example.com',
          avatar_url: 'https://example.com/avatar1.png'
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Team 2',
    description: 'Ett annat testteam',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: 'user2',
    is_private: false,
    settings: {
      privacy: {
        isPublic: true
      }
    },
    team_members: [
      {
        id: '2',
        user_id: 'user2',
        team_id: '2',
        role: 'owner',
        status: 'active',
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        user: {
          id: '2',
          name: 'Annan ägare',
          email: 'other@example.com',
          avatar_url: 'https://example.com/avatar2.png'
        }
      }
    ]
  }
];

// Wrapper för tester med providers
const renderWithProviders = (
  ui,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    React.createElement(ThemeProvider, null, children)
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Hjälpfunktioner för testning
const createTestProps = (props = {}) => ({
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
const mockSupabaseClient = {
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

module.exports = {
  renderWithProviders,
  mockTeams,
  createTestProps,
  mockSupabaseClient,
  ThemeProvider,
  createTestQueryClient
}; 