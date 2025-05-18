import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { createStandardizedQuery, createStandardizedMutation } from '../createStandardizedHook';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Result } from '@/shared/core/Result';
import { HookError } from '../BaseHook';

// Hjälpfunktion för att vänta på asynkrona operationer
const waitForNextUpdate = () => new Promise(resolve => setTimeout(resolve, 50));

describe('createStandardizedHook', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: false
        }
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
      
      let renderResult: any = {};
      
      function TestComponent() {
        const { data, isLoading } = useTestQuery('123');
        renderResult = { data, isLoading };
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
      
      // Assert - initial load
      expect(renderResult.isLoading).toBe(true);
      expect(mockFetchData).toHaveBeenCalledWith('123');
      
      // Låt operationen slutföras
      await waitForNextUpdate();
      
      // Vänta på att queryn ska slutföras och data vara tillgänglig
      expect(renderResult.data).toBe('testData');
      expect(renderResult.isLoading).toBe(false);
    });
    
    it('should handle errors correctly', async () => {
      // Arrange
      const errorMessage = 'Test error';
      const mockFetchData = jest.fn().mockRejectedValue(new Error(errorMessage));
      const useTestQuery = createStandardizedQuery<string, [string]>({
        queryKeyPrefix: 'test',
        queryFn: mockFetchData,
        retry: false // Se till att inga återförsök görs
      });
      
      let renderResult: any = {};
      
      function TestComponent() {
        const { error, isLoading, data } = useTestQuery('123');
        renderResult = { error, isLoading, data };
        return (
          <div>
            {isLoading && <div>Laddar...</div>}
            {error && <div>Fel: {error.message}</div>}
            {data && <div>{data}</div>}
          </div>
        );
      }
      
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
      
      // Assert - initial load
      expect(renderResult.isLoading).toBe(true);
      
      // Låt operationen slutföras och fel hanteras
      await waitForNextUpdate();
      
      // Kontrollera bara att error-objektet finns, inte exakt meddelande eftersom det kan transformeras
      expect(renderResult.error).toBeDefined();
      // Kontrollera att originalError finns 
      expect(renderResult.error.originalError).toBeDefined();
      expect(renderResult.error.originalError.message).toBe(errorMessage);
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
      
      let mutate: any;
      let renderResult: any = {};
      
      function TestComponent() {
        const mutation = useTestMutation();
        renderResult = mutation;
        mutate = mutation.mutate;
        
        return (
          <div>
            <button onClick={() => mutate({ id: '123' })}>Mutate</button>
            {mutation.isLoading && <span>Laddar...</span>}
            {mutation.data && <span>Resultat: {mutation.data}</span>}
            {mutation.error && <span>Fel: {mutation.error.message}</span>}
          </div>
        );
      }
      
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
      
      // Kör mutationen
      act(() => {
        mutate({ id: '123' });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Assert
      expect(mockMutateFn).toHaveBeenCalled();
      expect(mockMutateFn.mock.calls[0][0]).toEqual({ id: '123' });
      
      // Vänta på att mutationen ska slutföras och data vara tillgänglig
      expect(renderResult.data).toBe('success');
      expect(renderResult.isLoading).toBe(false);
      
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
      
      let mutate: any;
      let renderResult: any = {};
      
      function TestComponent() {
        const mutation = useTestMutation();
        renderResult = mutation;
        mutate = mutation.mutate;
        
        return (
          <div>
            <button onClick={() => mutate({ id: '123' })}>Mutate</button>
            {mutation.isLoading && <span>Laddar...</span>}
            {mutation.error && <span>Fel: {mutation.error.message}</span>}
          </div>
        );
      }
      
      // Act
      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
      
      // Kör mutationen direkt
      act(() => {
        mutate({ id: '123' });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Assert
      expect(mockMutateFn).toHaveBeenCalled();
      expect(mockMutateFn.mock.calls[0][0]).toEqual({ id: '123' });
      
      // Kontrollera bara att error-objektet finns och att onError har anropats
      expect(renderResult.error).toBeDefined();
      expect(mockOnError).toHaveBeenCalled();
      
      // Kontrollera att originalError finns
      const error = mockOnError.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.originalError).toBeDefined();
      expect(error.originalError.message).toBe(errorMessage);
    });
  });
}); 