import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { TeamScreen } from '../TeamScreen';
import { renderWithProviders } from './test-utils.jsx';
import { mockTeams } from './test-utils.jsx';

// Mock för supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

// Mock för hooks
jest.mock('@/hooks/useTeam', () => ({
  useTeam: jest.fn().mockReturnValue({
    team: mockTeams[0],
    isLoading: false,
    error: null,
    currentUserRole: 'owner',
    members: mockTeams[0].team_members,
    subscription: {
      tier: 'basic',
      status: 'active'
    },
    refetch: jest.fn()
  })
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ teamId: '1' }),
  Link: ({ children }) => children
}));

describe('TeamScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renderar TeamScreen korrekt', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamScreen />
    );
    
    expect(getByTestId('team-screen')).toBeTruthy();
    expect(getByText('Team 1')).toBeTruthy();
  });
  
  it('visar fliknavigering', () => {
    const { getByText } = renderWithProviders(
      <TeamScreen />
    );
    
    expect(getByText('Översikt')).toBeTruthy();
    expect(getByText('Medlemmar')).toBeTruthy();
    expect(getByText('Inställningar')).toBeTruthy();
  });
  
  it('byter flik vid klick', () => {
    const { getByText, queryByTestId } = renderWithProviders(
      <TeamScreen />
    );
    
    // Förvänta att översiktsvyn är aktiv från början
    expect(queryByTestId('team-overview')).toBeTruthy();
    
    // Klicka på medlemsfliken
    const membersTab = getByText('Medlemmar');
    fireEvent.press(membersTab);
    
    // Förvänta att medlemsvyn nu är aktiv
    expect(queryByTestId('team-members-tab')).toBeTruthy();
    expect(queryByTestId('team-overview')).toBeNull();
    
    // Klicka på inställningsfliken
    const settingsTab = getByText('Inställningar');
    fireEvent.press(settingsTab);
    
    // Förvänta att inställningsvyn nu är aktiv
    expect(queryByTestId('team-settings-tab')).toBeTruthy();
    expect(queryByTestId('team-members-tab')).toBeNull();
  });
  
  it('visar laddningsindikator när data laddas', () => {
    // Ändra mocken för att indikera laddning
    jest.spyOn(require('@/hooks/useTeam'), 'useTeam')
      .mockReturnValueOnce({
        team: null,
        isLoading: true,
        error: null,
        currentUserRole: null,
        members: [],
        subscription: null,
        refetch: jest.fn()
      });
      
    const { getByTestId } = renderWithProviders(
      <TeamScreen />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('visar felmeddelande vid fel', () => {
    // Ändra mocken för att simulera ett fel
    jest.spyOn(require('@/hooks/useTeam'), 'useTeam')
      .mockReturnValueOnce({
        team: null,
        isLoading: false,
        error: 'Kunde inte ladda teamet',
        currentUserRole: null,
        members: [],
        subscription: null,
        refetch: jest.fn()
      });
      
    const { getByText } = renderWithProviders(
      <TeamScreen />
    );
    
    expect(getByText('Kunde inte ladda teamet')).toBeTruthy();
  });
  
  it('visar inbjudningsformulär i medlemsfliken', () => {
    const { getByText, queryByTestId } = renderWithProviders(
      <TeamScreen />
    );
    
    // Klicka på medlemsfliken
    const membersTab = getByText('Medlemmar');
    fireEvent.press(membersTab);
    
    // Förvänta att medlemsvyn inkluderar inbjudningsknapp
    expect(queryByTestId('invite-member-button')).toBeTruthy();
    
    // Klicka på inbjudningsknappen
    const inviteButton = getByText('Bjud in');
    fireEvent.press(inviteButton);
    
    // Förvänta att inbjudningsformuläret visas
    expect(queryByTestId('team-invite-form')).toBeTruthy();
  });
  
  it('begränsar åtkomst till inställningar för icke-ägare', () => {
    // Ändra mocken för att simulera en vanlig medlem
    jest.spyOn(require('@/hooks/useTeam'), 'useTeam')
      .mockReturnValueOnce({
        team: mockTeams[0],
        isLoading: false,
        error: null,
        currentUserRole: 'member',
        members: mockTeams[0].team_members,
        subscription: {
          tier: 'basic',
          status: 'active'
        },
        refetch: jest.fn()
      });
      
    const { getByText, queryByTestId } = renderWithProviders(
      <TeamScreen />
    );
    
    // Klicka på inställningsfliken
    const settingsTab = getByText('Inställningar');
    fireEvent.press(settingsTab);
    
    // Förvänta begränsad åtkomst
    expect(queryByTestId('danger-zone')).toBeNull(); // Endast ägare ser farozonen
  });
}); 