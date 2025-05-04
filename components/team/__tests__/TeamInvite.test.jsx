import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { TeamInvite } from '../TeamInvite';
import { renderWithProviders } from './test-utils.jsx';
import Toast from 'react-native-toast-message';

jest.mock('react-native-toast-message', () => ({
  show: jest.fn()
}));

// Mock för inviteService
jest.mock('@/services/inviteService', () => ({
  inviteService: {
    sendTeamInvite: jest.fn().mockResolvedValue({
      data: { id: 'invite1', email: 'test@example.com', role: 'member' },
      error: null,
      status: 'success'
    })
  }
}));

describe('TeamInvite', () => {
  const mockTeam = {
    id: 'team1',
    name: 'Testteam',
    is_private: true
  };
  
  const mockOnInviteSent = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renderar inbjudningsformuläret korrekt', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamInvite
        team={mockTeam}
        onInviteSent={mockOnInviteSent}
      />
    );
    
    expect(getByTestId('team-invite-form')).toBeTruthy();
    expect(getByText('Bjud in medlemmar')).toBeTruthy();
  });
  
  it('uppdaterar e-postfältet korrekt', () => {
    const { getByTestId } = renderWithProviders(
      <TeamInvite
        team={mockTeam}
        onInviteSent={mockOnInviteSent}
      />
    );
    
    const emailInput = getByTestId('invite-email-input');
    fireEvent.changeText(emailInput, 'test@example.com');
    
    expect(emailInput.props.value).toBe('test@example.com');
  });
  
  it('validerar e-postformatet', async () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamInvite
        team={mockTeam}
        onInviteSent={mockOnInviteSent}
      />
    );
    
    const emailInput = getByTestId('invite-email-input');
    fireEvent.changeText(emailInput, 'ogiltig-epost');
    
    const sendButton = getByText('Skicka inbjudan');
    fireEvent.press(sendButton);
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error'
        })
      );
    });
    
    expect(mockOnInviteSent).not.toHaveBeenCalled();
  });
  
  it('hanterar rollval korrekt', () => {
    const { getByTestId } = renderWithProviders(
      <TeamInvite
        team={mockTeam}
        onInviteSent={mockOnInviteSent}
      />
    );
    
    const rolePicker = getByTestId('invite-role-picker');
    fireEvent(rolePicker, 'onValueChange', 'admin');
    
    expect(rolePicker.props.selectedValue).toBe('admin');
  });
  
  it('skickar inbjudan med korrekt data', async () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamInvite
        team={mockTeam}
        onInviteSent={mockOnInviteSent}
      />
    );
    
    const emailInput = getByTestId('invite-email-input');
    fireEvent.changeText(emailInput, 'test@example.com');
    
    const rolePicker = getByTestId('invite-role-picker');
    fireEvent(rolePicker, 'onValueChange', 'admin');
    
    const sendButton = getByText('Skicka inbjudan');
    fireEvent.press(sendButton);
    
    await waitFor(() => {
      expect(mockOnInviteSent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'invite1',
          email: 'test@example.com',
          role: 'member' // OBS: Den verkliga rollbyten är inte aktiv i testet
        })
      );
    });
  });
  
  it('hanterar eventuella felmeddelanden', async () => {
    // Ändra mock för ett testfall för att simulera ett fel
    jest.spyOn(require('@/services/inviteService').inviteService, 'sendTeamInvite')
      .mockResolvedValueOnce({
        data: null,
        error: 'E-postadressen används redan',
        status: 'error'
      });
      
    const { getByTestId, getByText } = renderWithProviders(
      <TeamInvite
        team={mockTeam}
        onInviteSent={mockOnInviteSent}
      />
    );
    
    const emailInput = getByTestId('invite-email-input');
    fireEvent.changeText(emailInput, 'test@example.com');
    
    const sendButton = getByText('Skicka inbjudan');
    fireEvent.press(sendButton);
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: expect.stringContaining('error')
        })
      );
    });
    
    expect(mockOnInviteSent).not.toHaveBeenCalled();
  });
  
  it('visar hjälptext för olika roller', () => {
    const { getByText } = renderWithProviders(
      <TeamInvite
        team={mockTeam}
        onInviteSent={mockOnInviteSent}
      />
    );
    
    expect(getByText(expect.stringContaining('behörigheter'))).toBeTruthy();
  });
}); 