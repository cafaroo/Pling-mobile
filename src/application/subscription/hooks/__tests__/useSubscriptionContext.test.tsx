import React from 'react';
import { render, screen } from '@testing-library/react';
import { SubscriptionContextProvider, useSubscriptionContext, useSubscription } from '../useSubscriptionContext.tsx';
import { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';
import { DefaultSubscriptionService } from '@/domain/subscription/services/DefaultSubscriptionService';
import { DefaultFeatureFlagService } from '@/domain/subscription/services/DefaultFeatureFlagService';
import { UsageTrackingService } from '@/domain/subscription/services/UsageTrackingService';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';

// Mocka Result-klassen för att säkerställa att testerna får rätt implementering
jest.mock('@/shared/core/Result', () => {
  const mockResultModule = require('./result-mock');
  return {
    Result: mockResultModule.Result
  };
});

// Skapa mock repositories och services
const mockSubscriptionRepository: jest.Mocked<SubscriptionRepository> = {
  getById: jest.fn(),
  getActiveByOrganizationId: jest.fn(),
  getAllByOrganizationId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
} as unknown as jest.Mocked<SubscriptionRepository>;

const mockEventPublisher: jest.Mocked<IDomainEventPublisher> = {
  publish: jest.fn(),
  publishAll: jest.fn(),
  clearListeners: jest.fn()
} as unknown as jest.Mocked<IDomainEventPublisher>;

const mockFeatureFlagService: jest.Mocked<DefaultFeatureFlagService> = {
  isFeatureEnabled: jest.fn()
} as unknown as jest.Mocked<DefaultFeatureFlagService>;

const mockUsageTrackingService: jest.Mocked<UsageTrackingService> = {
  trackUsage: jest.fn()
} as unknown as jest.Mocked<UsageTrackingService>;

const mockSubscriptionService: jest.Mocked<DefaultSubscriptionService> = {
  getActiveSubscription: jest.fn()
} as unknown as jest.Mocked<DefaultSubscriptionService>;

// Test komponenter
function TestConsumer() {
  const context = useSubscriptionContext();
  return (
    <div>
      <div>Hittat kontext: {context ? 'Ja' : 'Nej'}</div>
    </div>
  );
}

function TestSubscriptionConsumer() {
  const { subscriptionService, featureFlagService } = useSubscription();
  return (
    <div>
      <div>Hittat prenumerationstjänst: {subscriptionService ? 'Ja' : 'Nej'}</div>
      <div>Hittat feature flag-tjänst: {featureFlagService ? 'Ja' : 'Nej'}</div>
    </div>
  );
}

// Omkringliggande mock för supabase
jest.mock('@/infrastructure/supabase', () => ({
  supabase: { from: jest.fn() }
}));

// Mock för repository och service-klasser
jest.mock('@/infrastructure/supabase/repositories/subscription/SupabaseSubscriptionRepository', () => ({
  SupabaseSubscriptionRepository: jest.fn().mockImplementation(() => mockSubscriptionRepository)
}));

jest.mock('@/domain/subscription/services/DefaultSubscriptionService', () => ({
  DefaultSubscriptionService: jest.fn().mockImplementation(() => mockSubscriptionService)
}));

jest.mock('@/domain/subscription/services/DefaultFeatureFlagService', () => ({
  DefaultFeatureFlagService: jest.fn().mockImplementation(() => mockFeatureFlagService)
}));

jest.mock('@/domain/subscription/services/UsageTrackingService', () => ({
  UsageTrackingService: jest.fn().mockImplementation(() => mockUsageTrackingService)
}));

jest.mock('@/infrastructure/events/DomainEventPublisher', () => ({
  DomainEventPublisher: jest.fn().mockImplementation(() => mockEventPublisher)
}));

describe('useSubscriptionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should provide context values to consumers', () => {
    render(
      <SubscriptionContextProvider
        subscriptionRepository={mockSubscriptionRepository}
        eventPublisher={mockEventPublisher}
      >
        <TestConsumer />
      </SubscriptionContextProvider>
    );
    
    expect(screen.getByText('Hittat kontext: Ja')).toBeInTheDocument();
  });
  
  it('should create default services if not provided', () => {
    // Skapa spies för service-konstruktorer
    const DefaultSubscriptionServiceSpy = jest.spyOn(
      require('@/domain/subscription/services/DefaultSubscriptionService'),
      'DefaultSubscriptionService'
    );
    
    const DefaultFeatureFlagServiceSpy = jest.spyOn(
      require('@/domain/subscription/services/DefaultFeatureFlagService'),
      'DefaultFeatureFlagService'
    );
    
    const UsageTrackingServiceSpy = jest.spyOn(
      require('@/domain/subscription/services/UsageTrackingService'),
      'UsageTrackingService'
    );
    
    render(
      <SubscriptionContextProvider
        subscriptionRepository={mockSubscriptionRepository}
        eventPublisher={mockEventPublisher}
      >
        <TestConsumer />
      </SubscriptionContextProvider>
    );
    
    // Kontrollera att serviceklasserna skapades med rätt parameters
    expect(DefaultSubscriptionServiceSpy).toHaveBeenCalledWith(
      mockSubscriptionRepository,
      mockEventPublisher
    );
    
    expect(DefaultFeatureFlagServiceSpy).toHaveBeenCalledWith(
      mockSubscriptionRepository
    );
    
    expect(UsageTrackingServiceSpy).toHaveBeenCalledWith(
      mockSubscriptionRepository,
      mockEventPublisher
    );
  });
  
  it('should use provided services when given', () => {
    render(
      <SubscriptionContextProvider
        subscriptionRepository={mockSubscriptionRepository}
        subscriptionService={mockSubscriptionService}
        featureFlagService={mockFeatureFlagService}
        usageTrackingService={mockUsageTrackingService}
        eventPublisher={mockEventPublisher}
      >
        <TestConsumer />
      </SubscriptionContextProvider>
    );
    
    // Inget att testa här direkt, men vi säkerställer att inget felmeddelande visas
    expect(screen.getByText('Hittat kontext: Ja')).toBeInTheDocument();
  });
  
  it('should provide usable services via useSubscription', () => {
    render(
      <SubscriptionContextProvider
        subscriptionRepository={mockSubscriptionRepository}
        eventPublisher={mockEventPublisher}
      >
        <TestSubscriptionConsumer />
      </SubscriptionContextProvider>
    );
    
    expect(screen.getByText('Hittat prenumerationstjänst: Ja')).toBeInTheDocument();
    expect(screen.getByText('Hittat feature flag-tjänst: Ja')).toBeInTheDocument();
  });
  
  it('should provide fallback values when used outside provider', () => {
    // Skapa spies för repository och service-konstruktorer
    const SupabaseSubscriptionRepositorySpy = jest.spyOn(
      require('@/infrastructure/supabase/repositories/subscription/SupabaseSubscriptionRepository'),
      'SupabaseSubscriptionRepository'
    );
    
    const DomainEventPublisherSpy = jest.spyOn(
      require('@/infrastructure/events/DomainEventPublisher'),
      'DomainEventPublisher'
    );
    
    // Rendera utan provider
    render(<TestConsumer />);
    
    // Kontrollera att repository skapades
    expect(SupabaseSubscriptionRepositorySpy).toHaveBeenCalled();
    expect(DomainEventPublisherSpy).toHaveBeenCalled();
    
    // Se till att komponenten inte kraschar
    expect(screen.getByText('Hittat kontext: Ja')).toBeInTheDocument();
  });
}); 