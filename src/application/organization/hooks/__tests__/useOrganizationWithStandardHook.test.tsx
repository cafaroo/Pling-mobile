import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useOrganizationWithStandardHook } from '../useOrganizationWithStandardHook';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '@/domain/organization/entities/Organization';

// Mocka useOrganizationContext
jest.mock('../useOrganizationContext', () => ({
  useOrganizationContext: jest.fn(() => ({
    organizationRepository: mockOrganizationRepository,
    eventPublisher: mockEventPublisher
  }))
}));

// Skapa mocks för repositories och eventPublisher
const mockOrganizationRepository = {
  findById: jest.fn(),
  findByName: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  getTeams: jest.fn(),
  addTeam: jest.fn(),
  removeTeam: jest.fn()
};

const mockEventPublisher = {
  publish: jest.fn(),
  registerHandler: jest.fn(),
  clearHandlers: jest.fn()
};

// Mocka Organization.create statisk metod
jest.mock('@/domain/organization/entities/Organization', () => {
  const originalModule = jest.requireActual('@/domain/organization/entities/Organization');
  return {
    ...originalModule,
    Organization: {
      ...originalModule.Organization,
      create: jest.fn()
    }
  };
});

describe('useOrganizationWithStandardHook', () => {
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
  
  describe('useOrganizationById', () => {
    it('should fetch organization by ID and handle success case', async () => {
      // Arrange
      const mockOrg = { id: new UniqueId('test-org-id'), name: 'Test Organization' } as Organization;
      mockOrganizationRepository.findById.mockResolvedValue(Result.ok(mockOrg));
      
      // Component that uses the hook
      function TestComponent() {
        const { useOrganizationById } = useOrganizationWithStandardHook();
        const { data, isLoading } = useOrganizationById('test-org-id');
        
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
      expect(mockOrganizationRepository.findById).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.getByText('Test Organization')).toBeInTheDocument();
      });
    });
    
    it('should handle error case', async () => {
      // Arrange
      mockOrganizationRepository.findById.mockResolvedValue(Result.err('Organisationen kunde inte hittas'));
      
      // Component that uses the hook
      function TestComponent() {
        const { useOrganizationById } = useOrganizationWithStandardHook();
        const { data, isLoading, error } = useOrganizationById('invalid-id');
        
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
        expect(screen.getByText('Fel: Organisationen kunde inte hittas')).toBeInTheDocument();
      });
    });
  });
  
  describe('useCreateOrganization', () => {
    it('should create an organization and handle success case', async () => {
      // Arrange
      const mockOrg = { 
        id: new UniqueId('new-org-id'), 
        name: 'New Organization',
        getDomainEvents: jest.fn().mockReturnValue([]),
      } as unknown as Organization;
      
      // Setup mocks for the flow of creating an organization
      const mockCreateResult = Result.ok(mockOrg);
      (Organization.create as jest.Mock).mockResolvedValue(mockCreateResult);
      mockOrganizationRepository.save.mockResolvedValue(Result.ok(undefined));
      
      // Component that uses the hook
      function TestComponent() {
        const { useCreateOrganization } = useOrganizationWithStandardHook();
        const { mutate, isLoading, data } = useCreateOrganization();
        
        React.useEffect(() => {
          mutate({
            name: 'New Organization',
            ownerId: 'owner-id'
          });
        }, [mutate]);
        
        return (
          <div>
            {isLoading ? 'Skapar organisation...' : data ? 'Organisation skapad!' : 'Redo att skapa organisation'}
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
      expect(screen.getByText('Skapar organisation...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Organisation skapad!')).toBeInTheDocument();
        expect(Organization.create).toHaveBeenCalledWith({
          name: 'New Organization',
          ownerId: 'owner-id'
        });
        expect(mockOrganizationRepository.save).toHaveBeenCalled();
      });
    });
  });
}); 