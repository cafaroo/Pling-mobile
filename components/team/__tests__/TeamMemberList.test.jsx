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
    user: {
      id: '3',
      name: 'Teamadmin',
      email: 'admin@example.com',
      avatar_url: 'https://example.com/avatar3.png'
    }
  }
];

describe('TeamMemberList', () => {
  const mockOnRemoveMember = jest.fn();
  const mockOnChangeRole = jest.fn();
  
  beforeEach(() => {
    mockOnRemoveMember.mockClear();
    mockOnChangeRole.mockClear();
  });
  
  it('renderar medlemslistan korrekt', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamMemberList
        members={mockMembers}
        currentUserRole="owner"
        onRemoveMember={mockOnRemoveMember}
        onChangeRole={mockOnChangeRole}
      />
    );
    
    expect(getByTestId('team-member-list')).toBeTruthy();
    expect(getByText('Teamägare')).toBeTruthy();
    expect(getByText('Teammedlem')).toBeTruthy();
    expect(getByText('Teamadmin')).toBeTruthy();
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
  
  it('sorterar medlemmar med ägare först', () => {
    const { getAllByTestId } = renderWithProviders(
      <TeamMemberList
        members={mockMembers}
        currentUserRole="member"
      />
    );
    
    const memberItems = getAllByTestId(/^member-item-/);
    // Förväntar att owner visas först
    expect(memberItems[0]).toHaveTextContent('Teamägare');
  });
}); 