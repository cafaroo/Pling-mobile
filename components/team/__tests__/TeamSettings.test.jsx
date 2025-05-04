import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { TeamSettings } from '../TeamSettings';
import { renderWithProviders } from './test-utils.jsx';
import Toast from 'react-native-toast-message';

jest.mock('react-native-toast-message', () => ({
  show: jest.fn()
}));

// Mock för teamService
jest.mock('@/services/teamService', () => ({
  teamService: {
    updateTeam: jest.fn().mockResolvedValue({
      data: { id: 'team1', name: 'Uppdaterat team', description: 'Ny beskrivning' },
      error: null,
      status: 'success'
    }),
    deleteTeam: jest.fn().mockResolvedValue({
      data: { id: 'team1' },
      error: null,
      status: 'success'
    })
  }
}));

describe('TeamSettings', () => {
  const mockTeam = {
    id: 'team1',
    name: 'Testteam',
    description: 'En testbeskrivning',
    is_private: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: 'user1'
  };
  
  const mockSubscription = {
    id: 'sub1',
    team_id: 'team1',
    tier: 'basic',
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renderar grundläggande inställningar', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamSettings
        team={mockTeam}
        subscription={mockSubscription}
        navigation={mockNavigation}
        currentUserRole="owner"
      />
    );
    
    expect(getByTestId('team-settings')).toBeTruthy();
    expect(getByText('Teaminställningar')).toBeTruthy();
  });
  
  it('visar teamnamn och beskrivning', () => {
    const { getByTestId } = renderWithProviders(
      <TeamSettings
        team={mockTeam}
        subscription={mockSubscription}
        navigation={mockNavigation}
        currentUserRole="owner"
      />
    );
    
    const nameInput = getByTestId('team-name-input');
    const descriptionInput = getByTestId('team-description-input');
    
    expect(nameInput.props.value).toBe('Testteam');
    expect(descriptionInput.props.value).toBe('En testbeskrivning');
  });
  
  it('visar abonnemangsinformation', () => {
    const { getByText } = renderWithProviders(
      <TeamSettings
        team={mockTeam}
        subscription={mockSubscription}
        navigation={mockNavigation}
        currentUserRole="owner"
      />
    );
    
    expect(getByText('Abonnemang')).toBeTruthy();
    expect(getByText('Basic')).toBeTruthy();
    expect(getByText('Aktivt')).toBeTruthy();
  });
  
  it('uppdaterar teaminformation vid spara', async () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamSettings
        team={mockTeam}
        subscription={mockSubscription}
        navigation={mockNavigation}
        currentUserRole="owner"
      />
    );
    
    const nameInput = getByTestId('team-name-input');
    fireEvent.changeText(nameInput, 'Uppdaterat team');
    
    const descriptionInput = getByTestId('team-description-input');
    fireEvent.changeText(descriptionInput, 'Ny beskrivning');
    
    const saveButton = getByText('Spara ändringar');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          text1: expect.stringContaining('sparades')
        })
      );
    });
  });
  
  it('visar farozonen endast för ägare', () => {
    const { queryByText } = renderWithProviders(
      <TeamSettings
        team={mockTeam}
        subscription={mockSubscription}
        navigation={mockNavigation}
        currentUserRole="admin" // Inte ägare
      />
    );
    
    expect(queryByText('Farozon')).toBeNull();
    expect(queryByText('Ta bort team')).toBeNull();
  });
  
  it('visar bekräftelsedialog vid borttagning av team', async () => {
    const { getByText, getByTestId } = renderWithProviders(
      <TeamSettings
        team={mockTeam}
        subscription={mockSubscription}
        navigation={mockNavigation}
        currentUserRole="owner"
      />
    );
    
    const deleteButton = getByText('Ta bort team');
    fireEvent.press(deleteButton);
    
    // Bekräftelsedialog bör visas
    await waitFor(() => {
      expect(getByTestId('delete-confirm-dialog')).toBeTruthy();
    });
    
    // Bekräfta borttagning
    const confirmButton = getByText('Ja, ta bort');
    fireEvent.press(confirmButton);
    
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('TeamList');
    });
  });
}); 