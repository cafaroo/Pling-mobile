import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { TeamInviteSection } from '../TeamInviteSection';
import { renderWithProviders } from './test-utils';
import { Team } from '@/types';
import * as Clipboard from 'expo-clipboard';

// Mock för Clipboard API
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true)
}));

// Mock för lucide-ikoner
jest.mock('lucide-react-native', () => ({
  UserPlus: () => 'UserPlus-icon',
  Copy: () => 'Copy-icon',
  Check: () => 'Check-icon'
}));

describe('TeamInviteSection', () => {
  const mockSelectedTeam: Team = {
    id: 'team1',
    name: 'Testteam',
    is_private: true,
    owner_id: 'user1',
    created_at: new Date().toISOString()
  };
  
  const mockInviteCodeData = {
    code: 'ABC123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 timmar framåt
  };
  
  const mockOnJoinTeam = jest.fn();
  const mockOnGenerateInviteCode = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renderar gå-med-formuläret när inget team är valt', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <TeamInviteSection
        selectedTeam={null}
        isLeader={false}
        inviteCode={null}
        inviteError={null}
        onJoinTeam={mockOnJoinTeam}
        onGenerateInviteCode={mockOnGenerateInviteCode}
        inviteCodeData={null}
      />
    );
    
    expect(getByText('Gå med i ett team')).toBeTruthy();
    expect(getByPlaceholderText('Ange inbjudningskod')).toBeTruthy();
    expect(getByText('Gå med')).toBeTruthy();
  });
  
  it('anropar onJoinTeam med korrekt kod', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <TeamInviteSection
        selectedTeam={null}
        isLeader={false}
        inviteCode={null}
        inviteError={null}
        onJoinTeam={mockOnJoinTeam}
        onGenerateInviteCode={mockOnGenerateInviteCode}
        inviteCodeData={null}
      />
    );
    
    const codeInput = getByPlaceholderText('Ange inbjudningskod');
    fireEvent.changeText(codeInput, 'ABC123');
    
    const joinButton = getByText('Gå med');
    fireEvent.press(joinButton);
    
    expect(mockOnJoinTeam).toHaveBeenCalledWith('ABC123');
  });
  
  it('visar felmeddelande vid tom inbjudningskod', async () => {
    const { getByText } = renderWithProviders(
      <TeamInviteSection
        selectedTeam={null}
        isLeader={false}
        inviteCode={null}
        inviteError={null}
        onJoinTeam={mockOnJoinTeam}
        onGenerateInviteCode={mockOnGenerateInviteCode}
        inviteCodeData={null}
      />
    );
    
    const joinButton = getByText('Gå med');
    fireEvent.press(joinButton);
    
    expect(mockOnJoinTeam).not.toHaveBeenCalled();
    expect(getByText('Ange en inbjudningskod')).toBeTruthy();
  });
  
  it('visar inbjudningskod om teamledare och kod finns', () => {
    const { getByText } = renderWithProviders(
      <TeamInviteSection
        selectedTeam={mockSelectedTeam}
        isLeader={true}
        inviteCode={mockInviteCodeData.code}
        inviteError={null}
        onJoinTeam={mockOnJoinTeam}
        onGenerateInviteCode={mockOnGenerateInviteCode}
        inviteCodeData={mockInviteCodeData}
      />
    );
    
    expect(getByText('Bjud in medlemmar')).toBeTruthy();
    expect(getByText('ABC123')).toBeTruthy();
    expect(getByText('Kopiera kod')).toBeTruthy();
    expect(getByText('Koden är giltig i 24 timmar')).toBeTruthy();
  });
  
  it('anropar Clipboard vid knappen "Kopiera kod"', async () => {
    const { getByText } = renderWithProviders(
      <TeamInviteSection
        selectedTeam={mockSelectedTeam}
        isLeader={true}
        inviteCode={mockInviteCodeData.code}
        inviteError={null}
        onJoinTeam={mockOnJoinTeam}
        onGenerateInviteCode={mockOnGenerateInviteCode}
        inviteCodeData={mockInviteCodeData}
      />
    );
    
    const copyButton = getByText('Kopiera kod');
    fireEvent.press(copyButton);
    
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('ABC123');
    
    // Vänta på att knappen ändrar text till "Kopierad!"
    await waitFor(() => {
      expect(getByText('Kopierad!')).toBeTruthy();
    });
  });
  
  it('visar generera-knapp när ingen kod finns', () => {
    const { getByText } = renderWithProviders(
      <TeamInviteSection
        selectedTeam={mockSelectedTeam}
        isLeader={true}
        inviteCode={null}
        inviteError={null}
        onJoinTeam={mockOnJoinTeam}
        onGenerateInviteCode={mockOnGenerateInviteCode}
        inviteCodeData={null}
      />
    );
    
    const generateButton = getByText('Generera inbjudningskod');
    expect(generateButton).toBeTruthy();
    
    fireEvent.press(generateButton);
    expect(mockOnGenerateInviteCode).toHaveBeenCalled();
  });
  
  it('renderar inget när användaren inte är ledare och ett team är valt', () => {
    const { container } = renderWithProviders(
      <TeamInviteSection
        selectedTeam={mockSelectedTeam}
        isLeader={false}
        inviteCode={null}
        inviteError={null}
        onJoinTeam={mockOnJoinTeam}
        onGenerateInviteCode={mockOnGenerateInviteCode}
        inviteCodeData={null}
      />
    );
    
    // Vi förväntar oss att komponenten returnerar null och inte renderas
    expect(container.children.length).toBe(0);
  });
}); 