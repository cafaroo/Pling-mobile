import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TeamMemberList } from '../TeamMemberList';
import { renderWithProviders } from './test-utils.jsx';

const mockMembers = [
  {
    id: '1',
    user_id: '1',
    team_id: 'team1',
    role: 'owner',
    status: 'active',
    created_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
    profile: {
      name: 'Teamägare',
      email: 'owner@example.com',
      avatar_url: 'https://example.com/avatar1.png'
    },
    user: {
      id: '1',
      name: 'Teamägare',
      email: 'owner@example.com',
      avatar_url: 'https://example.com/avatar1.png'
    }
  },
  {
    id: '2',
    user_id: '2',
    team_id: 'team1',
    role: 'member',
    status: 'active',
    created_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
    profile: {
      name: 'Teammedlem',
      email: 'member@example.com',
      avatar_url: 'https://example.com/avatar2.png'
    },
    user: {
      id: '2',
      name: 'Teammedlem',
      email: 'member@example.com',
      avatar_url: 'https://example.com/avatar2.png'
    }
  },
  {
    id: '3',
    user_id: '3',
    team_id: 'team1',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
    profile: {
      name: 'Teamadmin',
      email: 'admin@example.com',
      avatar_url: 'https://example.com/avatar3.png'
    },
    user: {
      id: '3',
      name: 'Teamadmin',
      email: 'admin@example.com',
      avatar_url: 'https://example.com/avatar3.png'
    }
  }
];

// Mocka MemberItem-komponenten
jest.mock('../MemberItem', () => ({
  MemberItem: ({ member, onPress, showRole, onRoleChange, onRemove, testID }) => {
    // Förenkla memberobjektet för enklare debugging
    const simpleMember = {
      id: member.id,
      name: member.profile?.name || `Användarnamn saknas-${member.id}`,
      role: member.role
    };
    
    return (
      <div 
        data-testid={testID || `member-item-${member.id}`}
        onClick={() => onPress && onPress(member)}
      >
        <div data-testid={`member-name-${member.id}`}>{member.profile?.name}</div>
        {showRole && (
          <div data-testid={`role-badge-${member.id}`}>
            {member.role === 'owner' ? 'Ägare' : 
             member.role === 'admin' ? 'Admin' : 'Medlem'}
          </div>
        )}
        {onRoleChange && (
          <select 
            data-testid={`role-selector-${member.id}`}
            onChange={(e) => onRoleChange(member.id, e.target.value)}
          >
            <option value="member">Medlem</option>
            <option value="admin">Admin</option>
          </select>
        )}
        {onRemove && (
          <button 
            data-testid={`remove-member-${member.id}`}
            onClick={() => onRemove(member.id)}
          >
            Ta bort
          </button>
        )}
      </div>
    );
  },
  getRoleLabel: (role) => role === 'owner' ? 'Ägare' : 
                          role === 'admin' ? 'Admin' : 'Medlem',
  getRoleIcon: () => 'icon'
}));

// Mocka themekontext
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#006AFF',
      secondary: '#FF6B00',
      background: '#FFFFFF',
      card: '#F0F0F0',
      text: '#000000',
      border: '#CCCCCC',
      notification: '#FF3B30',
      success: '#34C759',
      warning: '#FFCC00',
      error: '#FF3B30',
      primaryButton: '#006AFF',
      secondaryButton: '#FF6B00',
      disabledButton: '#CCCCCC',
    },
    dark: false
  })
}));

// Mocka EmptyState och LoadingState
jest.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, message, testID }) => (
    <div data-testid={testID || 'empty-state'}>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}));

jest.mock('@/components/ui/LoadingState', () => ({
  LoadingState: ({ testID }) => (
    <div data-testid={testID || 'loading-indicator'}>Laddar...</div>
  )
}));

describe('TeamMemberList', () => {
  const mockOnRemoveMember = jest.fn();
  const mockOnChangeRole = jest.fn();
  
  beforeEach(() => {
    mockOnRemoveMember.mockClear();
    mockOnChangeRole.mockClear();
  });
  
  it('renderar medlemslistan korrekt', () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(
      <TeamMemberList
        members={mockMembers}
        currentUserRole="owner"
        onRemoveMember={mockOnRemoveMember}
        onChangeRole={mockOnChangeRole}
      />
    );
    
    expect(getByTestId('team-member-list')).toBeTruthy();
    const memberNames = getAllByTestId(/^member-name-/);
    expect(memberNames.length).toBe(3);
    expect(memberNames[0]).toHaveTextContent('Teamägare');
    expect(memberNames[1]).toHaveTextContent('Teammedlem');
    expect(memberNames[2]).toHaveTextContent('Teamadmin');
  });
  
  it('visar rollerna korrekt', () => {
    const { getAllByTestId } = renderWithProviders(
      <TeamMemberList
        members={mockMembers}
        currentUserRole="owner"
        onRemoveMember={mockOnRemoveMember}
        onChangeRole={mockOnChangeRole}
        showRoleBadges={true}
      />
    );
    
    const roleBadges = getAllByTestId(/^role-badge-/);
    expect(roleBadges).toHaveLength(3);
    expect(roleBadges[0]).toHaveTextContent('Ägare');
    expect(roleBadges[1]).toHaveTextContent('Medlem');
    expect(roleBadges[2]).toHaveTextContent('Admin');
  });
  
  it('tillåter borttagning av medlemmar endast för ägare/admin', () => {
    const { getAllByTestId } = renderWithProviders(
      <TeamMemberList
        members={mockMembers}
        currentUserRole="owner"
        onRemoveMember={mockOnRemoveMember}
        onChangeRole={mockOnChangeRole}
      />
    );
    
    const removeButtons = getAllByTestId(/^remove-member-/);
    // Visa inte Ta bort-knappen för ägare, visa för andra
    expect(removeButtons).toHaveLength(2);
    
    fireEvent.press(removeButtons[0]);
    expect(mockOnRemoveMember).toHaveBeenCalledWith('2');
  });
  
  it('begränsar behörigheter för medlemmar', () => {
    const { queryAllByTestId } = renderWithProviders(
      <TeamMemberList
        members={mockMembers}
        currentUserRole="member"
        onRemoveMember={mockOnRemoveMember}
        onChangeRole={mockOnChangeRole}
      />
    );
    
    // Vanliga medlemmar bör inte se Ta bort-knappar eller roll-ändringar
    const removeButtons = queryAllByTestId(/^remove-member-/);
    expect(removeButtons).toHaveLength(0);
    
    const roleSelectors = queryAllByTestId(/^role-selector-/);
    expect(roleSelectors).toHaveLength(0);
  });
  
  it('tillåter roll-ändringar för ägare', () => {
    const { getAllByTestId } = renderWithProviders(
      <TeamMemberList
        members={mockMembers}
        currentUserRole="owner"
        onRemoveMember={mockOnRemoveMember}
        onChangeRole={mockOnChangeRole}
      />
    );
    
    const roleSelectors = getAllByTestId(/^role-selector-/);
    expect(roleSelectors).toHaveLength(2); // Inte för ägaren själv
    
    fireEvent(roleSelectors[0], 'onValueChange', 'admin');
    expect(mockOnChangeRole).toHaveBeenCalledWith('2', 'admin');
  });
  
  it('visar laddningstillstånd när isLoading är true', () => {
    const { getByTestId } = renderWithProviders(
      <TeamMemberList
        members={[]}
        currentUserRole="member"
        isLoading={true}
      />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('visar tomt tillstånd när det inte finns några medlemmar', () => {
    const { getByTestId } = renderWithProviders(
      <TeamMemberList
        members={[]}
        currentUserRole="member"
      />
    );
    
    expect(getByTestId('empty-state')).toBeTruthy();
  });
}); 