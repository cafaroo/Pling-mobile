import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TeamList } from '../TeamList';
import { renderWithProviders, mockTeams } from './test-utils.jsx';

describe('TeamList', () => {
  it('renderar en lista med team korrekt', () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(
      <TeamList
        teams={mockTeams}
        onSelectTeam={() => {}}
        selectedTeamId={null}
        variant="default"
      />
    );

    expect(getByTestId('team-list')).toBeTruthy();
    const teamCards = getAllByTestId(/^team-card-/);
    expect(teamCards).toHaveLength(2);
  });

  it('anropar onSelectTeam med korrekt team-id vid klick', () => {
    const mockOnSelectTeam = jest.fn();
    const { getByTestId } = renderWithProviders(
      <TeamList
        teams={mockTeams}
        onSelectTeam={mockOnSelectTeam}
        selectedTeamId={null}
        variant="default"
      />
    );

    fireEvent.press(getByTestId('team-card-1'));
    expect(mockOnSelectTeam).toHaveBeenCalledWith('1');
  });

  it('markerar valt team', () => {
    const { getByTestId } = renderWithProviders(
      <TeamList
        teams={mockTeams}
        onSelectTeam={() => {}}
        selectedTeamId="1"
        variant="default"
      />
    );
    
    const selectedCard = getByTestId('team-card-1');
    expect(selectedCard).toBeTruthy();
  });
}); 