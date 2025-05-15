import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { createStandardizedQuery, createStandardizedMutation } from '../createStandardizedHook';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Result } from '@/shared/core/Result';
import { HookError } from '../BaseHook';

describe('createStandardizedHook', () => {
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
  
  describe('createStandardizedQuery', () => {
    it('should create a query hook with correct parameters', async () => {
      // Arrange
      const mockFetchData = jest.fn().mockResolvedValue('testData');
      const useTestQuery = createStandardizedQuery<string, [string]>({
        queryKeyPrefix: 'test',
        buildQueryKey: ([id]) => ['test', id],
        queryFn: mockFetchData
      });
      
      function TestComponent() {
        const { data, isLoading } = useTestQuery('123');
        return (
          <div>
            {isLoading ? 'Laddar...' : data}
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
      expect(mockFetchData).toHaveBeenCalledWith('123');
      
      await waitFor(() => {
        expect(screen.getByText('testData')).toBeInTheDocument();
      });
    });
    
    it('should handle errors correctly', async () => {
      // Arrange
      const errorMessage = 'Test error';
      const mockFetchData = jest.fn().mockRejectedValue(new Error(errorMessage));
      const useTestQuery = createStandardizedQuery<string, [string]>({
        queryKeyPrefix: 'test',
        queryFn: mockFetchData
      });
      
      function TestComponent() {
        const { error, isLoading, data } = useTestQuery('123');
        if (isLoading) return <div>Laddar...</div>;
        if (error) return <div>Fel: {error.message}</div>;
        return <div>{data}</div>;
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
        expect(screen.getByText(`Fel: ${errorMessage}`)).toBeInTheDocument();
      });
    });
  });
  
  describe('createStandardizedMutation', () => {
    it('should create a mutation hook with correct parameters', async () => {
      // Arrange
      const mockMutateFn = jest.fn().mockResolvedValue('success');
      const mockOnSuccess = jest.fn();
      const mockInvalidateQueryKey = ['test', '123'];
      
      const useTestMutation = createStandardizedMutation<string, { id: string }>({
        mutationFn: mockMutateFn,
        onSuccess: mockOnSuccess,
        invalidateQueryKey: mockInvalidateQueryKey
      });
      
      const queryClientInvalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
      
      function TestComponent() {
        const { mutate, isLoading, data, error } = useTestMutation();
        
        return (
          <div>
            <button onClick={() => mutate({ id: '123' })}>Mutate</button>
            {isLoading && <span>Laddar...</span>}
            {data && <span>Resultat: {data}</span>}
            {error && <span>Fel: {error.message}</span>}
          </div>
        );
      }
      
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
      
      // Klicka på knappen för att köra mutationen
      await act(async () => {
        screen.getByText('Mutate').click();
      });
      
      // Assert
      expect(mockMutateFn).toHaveBeenCalledWith({ id: '123' });
      
      await waitFor(() => {
        expect(screen.getByText('Resultat: success')).toBeInTheDocument();
      });
      
      expect(mockOnSuccess).toHaveBeenCalledWith('success', { id: '123' });
      expect(queryClientInvalidateQueries).toHaveBeenCalledWith({ queryKey: mockInvalidateQueryKey });
    });
    
    it('should handle errors correctly', async () => {
      // Arrange
      const errorMessage = 'Mutation error';
      const mockMutateFn = jest.fn().mockRejectedValue(new Error(errorMessage));
      const mockOnError = jest.fn();
      
      const useTestMutation = createStandardizedMutation<string, { id: string }>({
        mutationFn: mockMutateFn,
        onError: mockOnError
      });
      
      function TestComponent() {
        const { mutate, isLoading, error } = useTestMutation();
        
        return (
          <div>
            <button onClick={() => mutate({ id: '123' })}>Mutate</button>
            {isLoading && <span>Laddar...</span>}
            {error && <span>Fel: {error.message}</span>}
          </div>
        );
      }
      
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
      
      // Klicka på knappen för att köra mutationen
      await act(async () => {
        screen.getByText('Mutate').click();
      });
      
      // Assert
      expect(mockMutateFn).toHaveBeenCalledWith({ id: '123' });
      
      await waitFor(() => {
        expect(screen.getByText(`Fel: ${errorMessage}`)).toBeInTheDocument();
      });
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ 
          message: errorMessage,
          originalError: expect.any(Error)
        } as HookError),
        { id: '123' }
      );
    });
  });
}); 