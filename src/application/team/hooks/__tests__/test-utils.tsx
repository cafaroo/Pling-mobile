import React from 'react';
import { createTestQueryClient, WAIT_FOR_OPTIONS } from '@/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

export { WAIT_FOR_OPTIONS };

export const createWrapper = () => {
  const testQueryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(
      QueryClientProvider, 
      { client: testQueryClient }, 
      children
    );
}; 