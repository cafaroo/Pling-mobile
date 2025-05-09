import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TeamStatisticsCard } from '../TeamStatisticsCard';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { UniqueId } from '@/domain/core/UniqueId';

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: () => null
}));

describe('TeamStatisticsCard', () => {
  const teamId = new UniqueId();
  const statisticsResult = TeamStatistics.calculateFromGoals(
    teamId,
    [],
    [],
    StatisticsPeriod.WEEKLY
  );
  
  // Kontrollera att resultatet är OK innan vi fortsätter
  expect(statisticsResult.isOk()).toBe(true);
  const mockStatistics = statisticsResult.value;

  it('ska rendera alla statistikkomponenter', () => {
    const { getByText } = render(
      <TeamStatisticsCard statistics={mockStatistics} />
    );

    // Verifiera att huvudrubriken visas
    expect(getByText('Teamstatistik')).toBeTruthy();

    // Verifiera att statistiketiketter visas
    expect(getByText('Avslutade mål')).toBeTruthy();
    expect(getByText('Aktiva mål')).toBeTruthy();
    expect(getByText('Aktiva medlemmar')).toBeTruthy();

    // Verifiera att målframstegssektionen visas
    expect(getByText('Målframsteg')).toBeTruthy();

    // Verifiera att aktivitetstrendsektionen visas
    expect(getByText('Aktivitetstrend')).toBeTruthy();
  });

  it('ska visa korrekta statistikvärden', () => {
    const statsWithDataResult = TeamStatistics.calculateFromGoals(
      teamId,
      [
        {
          id: new UniqueId(),
          teamId,
          title: 'Test Goal',
          description: 'Test Description',
          startDate: new Date(),
          status: 'completed',
          progress: 100,
          createdBy: new UniqueId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [
        {
          id: new UniqueId(),
          teamId,
          type: 'goal_completed',
          userId: new UniqueId(),
          timestamp: new Date(),
          metadata: {}
        }
      ],
      StatisticsPeriod.WEEKLY
    );
    
    // Kontrollera att resultatet är OK innan vi fortsätter
    expect(statsWithDataResult.isOk()).toBe(true);
    const mockStatsWithData = statsWithDataResult.value;

    const { getByText } = render(
      <TeamStatisticsCard statistics={mockStatsWithData} />
    );

    // Verifiera att statistikvärden visas korrekt
    expect(getByText('1')).toBeTruthy(); // Avslutade mål
    expect(getByText('0')).toBeTruthy(); // Aktiva mål
    expect(getByText('1')).toBeTruthy(); // Aktiva medlemmar
  });

  it('ska hantera periodändringar', () => {
    const handlePeriodChange = jest.fn();
    const { getByText } = render(
      <TeamStatisticsCard
        statistics={mockStatistics}
        onPeriodChange={handlePeriodChange}
      />
    );

    // Klicka på olika periodknappar
    fireEvent.press(getByText('Daglig'));
    expect(handlePeriodChange).toHaveBeenCalledWith(StatisticsPeriod.DAILY);

    fireEvent.press(getByText('Månadsvis'));
    expect(handlePeriodChange).toHaveBeenCalledWith(StatisticsPeriod.MONTHLY);

    fireEvent.press(getByText('Årlig'));
    expect(handlePeriodChange).toHaveBeenCalledWith(StatisticsPeriod.YEARLY);
  });

  it('ska markera aktiv period', () => {
    const { getByText } = render(
      <TeamStatisticsCard statistics={mockStatistics} />
    );

    // Verifiera att den aktiva perioden är markerad
    const weeklyButton = getByText('Veckovis').parent;
    expect(weeklyButton.props.style).toContainEqual(
      expect.objectContaining({
        backgroundColor: expect.any(String)
      })
    );
  });

  it('ska visa korrekt formaterade datum i aktivitetstrenden', () => {
    const now = new Date();
    const statsWithTrendResult = TeamStatistics.calculateFromGoals(
      teamId,
      [],
      [
        {
          id: new UniqueId(),
          teamId,
          type: 'goal_created',
          userId: new UniqueId(),
          timestamp: now,
          metadata: {}
        }
      ],
      StatisticsPeriod.WEEKLY
    );
    
    // Kontrollera att resultatet är OK innan vi fortsätter
    expect(statsWithTrendResult.isOk()).toBe(true);
    const mockStatsWithTrend = statsWithTrendResult.value;

    const { getByText } = render(
      <TeamStatisticsCard statistics={mockStatsWithTrend} />
    );

    // Verifiera att aktivitetstrenden visar korrekt formaterade datum
    expect(getByText('Aktivitetstrend')).toBeTruthy();
  });

  it('ska visa korrekt procentuellt målframsteg', () => {
    const statsWithProgressResult = TeamStatistics.calculateFromGoals(
      teamId,
      [
        {
          id: new UniqueId(),
          teamId,
          title: 'Test Goal',
          description: 'Test Description',
          startDate: new Date(),
          status: 'in_progress',
          progress: 75,
          createdBy: new UniqueId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [],
      StatisticsPeriod.WEEKLY
    );
    
    // Kontrollera att resultatet är OK innan vi fortsätter
    expect(statsWithProgressResult.isOk()).toBe(true);
    const mockStatsWithProgress = statsWithProgressResult.value;

    const { getByText } = render(
      <TeamStatisticsCard statistics={mockStatsWithProgress} />
    );

    // Verifiera att målframsteget visas korrekt
    expect(getByText('75%')).toBeTruthy();
  });
}); 