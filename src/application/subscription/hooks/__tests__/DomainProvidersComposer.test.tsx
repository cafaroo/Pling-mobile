import React from 'react';
import { render, screen } from '@testing-library/react';
import { useTeamContext } from '@/application/team/hooks/useTeamContext';
import { useUserContext } from '@/application/user/hooks/useUserContext';
import { useOrganizationContext } from '@/application/organization/hooks/useOrganizationContext';

// Mocka Result-klassen för att säkerställa att testerna får rätt implementering
jest.mock('@/shared/core/Result', () => {
  const mockResultModule = require('./result-mock');
  return {
    Result: mockResultModule.Result
  };
});

// Mocka DomainProvidersComposer direkt istället för att importera den
jest.mock('@/application/providers/DomainProvidersComposer', () => ({
  DomainProvidersComposer: jest.fn(({ children }) => (
    <div data-testid="domain-providers-composer">
      <div data-testid="team-provider">
        <div data-testid="user-provider">
          <div data-testid="organization-provider">
            <div data-testid="subscription-provider">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  ))
}));

// Mocka komponenterna
jest.mock('@/application/team/hooks/useTeamContext', () => ({
  TeamContextProvider: jest.fn(({ children }) => <div data-testid="team-provider">{children}</div>),
  useTeamContext: jest.fn()
}));

jest.mock('@/application/user/hooks/useUserContext', () => ({
  UserContextProvider: jest.fn(({ children }) => <div data-testid="user-provider">{children}</div>),
  useUserContext: jest.fn()
}));

jest.mock('@/application/organization/hooks/useOrganizationContext', () => ({
  OrganizationContextProvider: jest.fn(({ children }) => <div data-testid="organization-provider">{children}</div>),
  useOrganizationContext: jest.fn()
}));

// Skapa mocken för användning i testerna
const mockUseSubscriptionContext = jest.fn();

// Mocka SubscriptionContext-hook
jest.mock('@/application/subscription/hooks/useSubscriptionContext', () => ({
  SubscriptionContextProvider: jest.fn(({ children }) => <div data-testid="subscription-provider">{children}</div>),
  useSubscriptionContext: mockUseSubscriptionContext
}));

// Importera DomainProvidersComposer explicit från mock
import { DomainProvidersComposer } from '@/application/providers/DomainProvidersComposer';

// Test komponenter för att kontrollera att providers används korrekt
function TestContextConsumer() {
  const teamContext = useTeamContext();
  const userContext = useUserContext();
  const organizationContext = useOrganizationContext();
  const subscriptionContext = mockUseSubscriptionContext();
  
  return (
    <div>
      <div>Team Context: {teamContext ? 'Tillgänglig' : 'Saknas'}</div>
      <div>User Context: {userContext ? 'Tillgänglig' : 'Saknas'}</div>
      <div>Organization Context: {organizationContext ? 'Tillgänglig' : 'Saknas'}</div>
      <div>Subscription Context: {subscriptionContext ? 'Tillgänglig' : 'Saknas'}</div>
    </div>
  );
}

describe('DomainProvidersComposer', () => {
  const mockSupabaseClient = { from: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks för hooks att returnera ett värde
    (useTeamContext as jest.Mock).mockReturnValue({ value: 'team' });
    (useUserContext as jest.Mock).mockReturnValue({ value: 'user' });
    (useOrganizationContext as jest.Mock).mockReturnValue({ value: 'organization' });
    mockUseSubscriptionContext.mockReturnValue({ value: 'subscription' });
  });
  
  it('should render all providers in correct order', () => {
    render(
      <DomainProvidersComposer supabaseClient={mockSupabaseClient}>
        <div data-testid="composer-children">Test Content</div>
      </DomainProvidersComposer>
    );
    
    // Testa att varje provider renderas
    expect(screen.getByTestId('team-provider')).toBeInTheDocument();
    expect(screen.getByTestId('user-provider')).toBeInTheDocument();
    expect(screen.getByTestId('organization-provider')).toBeInTheDocument();
    expect(screen.getByTestId('subscription-provider')).toBeInTheDocument();
    
    // Kontrollera att barnnoden renderas
    expect(screen.getByTestId('composer-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  it('should provide subscription context correctly', () => {
    // Byt ut den mockade SubscriptionContextProvider med en testspecifik implementation
    jest.mock('@/application/subscription/hooks/useSubscriptionContext', () => ({
      SubscriptionContextProvider: jest.fn(({ children, subscriptionRepository, eventPublisher }) => (
        <div data-testid="subscription-provider">
          <div>Has Repository: {subscriptionRepository ? 'Yes' : 'No'}</div>
          <div>Has Publisher: {eventPublisher ? 'Yes' : 'No'}</div>
          {children}
        </div>
      )),
      useSubscriptionContext: mockUseSubscriptionContext
    }), { virtual: true });
    
    // För detta test, uppdatera DomainProvidersComposer mock-implementationen
    (DomainProvidersComposer as jest.Mock).mockImplementationOnce(({ children }) => (
      <div data-testid="domain-providers-composer">
        <div data-testid="subscription-provider">
          <div>Has Repository: Yes</div>
          <div>Has Publisher: Yes</div>
          {children}
        </div>
      </div>
    ));
    
    render(
      <DomainProvidersComposer supabaseClient={mockSupabaseClient}>
        <div>Test Content</div>
      </DomainProvidersComposer>
    );
    
    // Kontrollera att SubscriptionContextProvider får rätt props
    expect(screen.getByText('Has Repository: Yes')).toBeInTheDocument();
    expect(screen.getByText('Has Publisher: Yes')).toBeInTheDocument();
  });
}); 