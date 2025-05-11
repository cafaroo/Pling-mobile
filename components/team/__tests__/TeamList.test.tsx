import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TeamList } from '../TeamList';
import { renderWithProviders, mockTeams } from './test-utils.tsx';

// Mock för TeamCard eftersom det verkar vara olika importvägar
jest.mock('@components/ui/TeamCard', () => ({
  TeamCard: ({ team, onPress, isSelected, testID }) => (
    <div 
      testID={testID}
      onClick={onPress}
      style={isSelected ? { backgroundColor: 'blue' } : {}}
      data-teamid={team.id}
    >
      <div>{team.name}</div>
      {team.is_private ? <div>Privat</div> : <div>Offentlig</div>}
      <div>{team.team_members?.length || 0}</div>
      {team.description && <div>{team.description}</div>}
    </div>
  )
}));

describe('TeamList', () => {
  it('renderar en lista med team korrekt', () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(
      <TeamList
        teams={mockTeams}
        onSelectTeam={() => {}}
        selectedTeamId={null}
        cardVariant="default"
      />
    );

    expect(getByTestId('team-list')).toBeTruthy();
    const teamCards = getAllByTestId(/team-card-\d/);
    expect(teamCards.length).toBe(2);
  });

  it('anropar onSelectTeam med korrekt team-id vid klick', () => {
    const mockOnSelectTeam = jest.fn();
    const { getAllByTestId } = renderWithProviders(
      <TeamList
        teams={mockTeams}
        onSelectTeam={mockOnSelectTeam}
        selectedTeamId={null}
        cardVariant="default"
      />
    );

    // Hitta första teamet och klicka på det
    const teamCards = getAllByTestId(/team-card-\d/);
    fireEvent.press(teamCards[0]);
    expect(mockOnSelectTeam).toHaveBeenCalledWith('1');
  });

  it('visar laddningsindikator när isLoading är true', () => {
    const { getByTestId } = renderWithProviders(
      <TeamList
        teams={[]}
        onSelectTeam={() => {}}
        selectedTeamId={null}
        isLoading={true}
      />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('visar tomt tillstånd när det inte finns några team', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamList
        teams={[]}
        onSelectTeam={() => {}}
        selectedTeamId={null}
      />
    );

    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByText('Inga team hittades')).toBeTruthy();
  });
}); 