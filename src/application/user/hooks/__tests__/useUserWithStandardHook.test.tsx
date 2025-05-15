import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useUserWithStandardHook } from '../useUserWithStandardHook';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';

// Mocka useUserContext
jest.mock('../useUserContext', () => ({
  useUserContext: jest.fn(() => ({
    userRepository: mockUserRepository,
    eventPublisher: mockEventPublisher
  }))
}));

// Skapa mocks för repositories och eventPublisher
const mockUserRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByTeamId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
  exists: jest.fn(),
  updateStatus: jest.fn()
};

const mockEventPublisher = {
  publish: jest.fn(),
  registerHandler: jest.fn(),
  clearHandlers: jest.fn()
};

// Mocka User use cases
jest.mock('../../useCases', () => ({
  CreateUserUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  })),
  UpdateProfileUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  })),
  DeactivateUserUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  })),
  ActivateUserUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  }))
}));

describe('useUserWithStandardHook', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0
        },
      },
    });
    jest.clearAllMocks();
  });
  
  describe('useUserById', () => {
    it('should fetch user by ID and handle success case', async () => {
      // Arrange
      const mockUser = { id: new UniqueId('test-user-id'), name: 'Test User' } as User;
      mockUserRepository.findById.mockResolvedValue(Result.ok(mockUser));
      
      // Component that uses the hook
      function TestComponent() {
        const { useUserById } = useUserWithStandardHook();
        const { data, isLoading } = useUserById('test-user-id');
        
        return (
          <div>
            {isLoading ? 'Laddar...' : data?.name}
          </div>
        );
      }
      
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
      
      // Assert
      expect(screen.getByText('Laddar...')).toBeInTheDocument();
      expect(mockUserRepository.findById).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
    
    it('should handle error case', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(Result.err('Användaren kunde inte hittas'));
      
      // Component that uses the hook
      function TestComponent() {
        const { useUserById } = useUserWithStandardHook();
        const { data, isLoading, error } = useUserById('invalid-id');
        
        if (isLoading) return <div>Laddar...</div>;
        if (error) return <div>Fel: {error.message}</div>;
        return <div>{data?.name}</div>;
      }
      
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
      
      // Assert
      expect(screen.getByText('Laddar...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Fel: Användaren kunde inte hittas')).toBeInTheDocument();
      });
    });
  });
  
  describe('useCreateUser', () => {
    it('should create a user and handle success case', async () => {
      // Arrange
      const mockCreatedUser = { id: new UniqueId('new-user-id'), name: 'New User' } as User;
      const mockCreateUserUseCase = require('../../useCases').CreateUserUseCase.mock.instances[0];
      mockCreateUserUseCase.execute.mockResolvedValue(Result.ok(mockCreatedUser));
      
      // Component that uses the hook
      function TestComponent() {
        const { useCreateUser } = useUserWithStandardHook();
        const { mutate, isLoading, data } = useCreateUser();
        
        React.useEffect(() => {
          mutate({
            email: 'new@example.com',
            profile: {
              firstName: 'New',
              lastName: 'User'
            },
            settings: {
              theme: 'light',
              language: 'sv',
              notifications: {
                email: true,
                push: true,
                inApp: true
              },
              privacy: {
                showProfile: true,
                showActivity: true,
                showTeams: true
              }
            }
          });
        }, [mutate]);
        
        return (
          <div>
            {isLoading ? 'Skapar användare...' : data ? 'Användare skapad!' : 'Redo att skapa användare'}
          </div>
        );
      }
      
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
      
      // Assert
      expect(screen.getByText('Skapar användare...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Användare skapad!')).toBeInTheDocument();
        expect(mockCreateUserUseCase.execute).toHaveBeenCalled();
      });
    });
  });
}); 