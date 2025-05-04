import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TeamCard } from '../../ui/TeamCard';
import { renderWithProviders } from './test-utils.jsx';

describe('TeamCard', () => {
  const mockTeam = {
    id: '1',
    name: 'Test Team',
    description: 'En testbeskrivning',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: 'user1',
    is_private: true,
    settings: {
      privacy: {
        isPublic: false
      }
    },
    team_members: [
      { id: '1', user_id: 'user1', team_id: '1', role: 'owner', status: 'active' }
    ]
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renderar teamnamnet', () => {
    const { getByText } = renderWithProviders(
      <TeamCard 
        team={mockTeam} 
        onPress={mockOnPress}
        variant="default"
      />
    );

    expect(getByText('Test Team')).toBeTruthy();
  });

  it('anropar onPress när kortet klickas', () => {
    const { getByTestId } = renderWithProviders(
      <TeamCard 
        team={mockTeam} 
        onPress={mockOnPress}
        variant="default"
      />
    );

    fireEvent.press(getByTestId(`team-card-${mockTeam.id}`));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('visar att teamet är privat', () => {
    const { getByText } = renderWithProviders(
      <TeamCard 
        team={mockTeam} 
        onPress={mockOnPress}
        variant="default"
      />
    );

    expect(getByText('Privat')).toBeTruthy();
  });

  it('visar medlemsantal', () => {
    const { getByText } = renderWithProviders(
      <TeamCard 
        team={mockTeam} 
        onPress={mockOnPress}
        variant="default"
        showMemberCount={true}
      />
    );

    expect(getByText('1')).toBeTruthy();
  });

  it('hanterar olika varianter av komponenten', () => {
    const variants = ['compact', 'default', 'detailed'];
    
    variants.forEach(variant => {
      const { getByTestId } = renderWithProviders(
        <TeamCard 
          team={mockTeam} 
          onPress={mockOnPress}
          variant={variant}
        />
      );
      
      expect(getByTestId(`team-card-${mockTeam.id}`)).toBeTruthy();
    });
  });
}); 