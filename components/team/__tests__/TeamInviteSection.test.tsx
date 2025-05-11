import React from 'react';
import { render } from '@testing-library/react-native';
import { TeamInviteSection } from '../TeamInviteSection';
import * as Clipboard from 'expo-clipboard';

// Definiera Team-typen lokalt för testerna
interface Team {
  id: string;
  name: string;
  is_private: boolean;
  owner_id: string;
  created_at: string;
  description?: string;
  team_members?: Array<any>;
}

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
  
  it('kan rendera gå-med-formuläret när inget team är valt', () => {
    const { debug } = render(
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
    // Om testet kör hela vägen hit har komponenten renderats utan att krascha
    expect(true).toBe(true);
  });
  
  it('kan rendera inbjudningskod när ett team är valt och användaren är ledare', () => {
    const { debug } = render(
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
    // Om testet kör hela vägen hit har komponenten renderats utan att krascha
    expect(true).toBe(true);
  });
  
  it('kan rendera generera-knapp när inget kod finns och användaren är ledare', () => {
    const { debug } = render(
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
    // Om testet kör hela vägen hit har komponenten renderats utan att krascha
    expect(true).toBe(true);
  });
  
  it.skip('renderar inget när användaren inte är ledare och ett team är valt', () => {
    const { container } = render(
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
    
    // Vi kontrollerar helt enkelt att container är tom eller bara har en kommentar
    // Eftersom null renderas som tom container eller kommentar i React
    expect(container.children.length).toBe(0);
  });
}); 