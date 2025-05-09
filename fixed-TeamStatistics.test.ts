import { TeamStatistics } from '../TeamStatistics';
import { ok, err } from '@/shared/core/Result';

describe('TeamStatistics', () => {
  it('ska beräkna totalpoäng korrekt', () => {
    // Skapa TeamStatistics
    const statisticsResult = TeamStatistics.create({
      teamId: '123',
      points: 100,
      activities: [
        { id: '1', points: 10, completed: true },
        { id: '2', points: 20, completed: true },
        { id: '3', points: 30, completed: false },
      ]
    });
    
    // Använder standardiserad API
    expect(statisticsResult.isOk()).toBe(true);
    const statistics = statisticsResult.value;
    expect(statistics.getTotalPoints()).toBe(100);
    
    // Använder explicit kontroll innan värdeåtkomst
    const pointsResult = statistics.calculateTotalPointsFromActivities();
    expect(pointsResult.isOk()).toBe(true);
    expect(pointsResult.value).toBe(30);
  });
  
  it('ska hantera felberäkningar korrekt', () => {
    // Skapa TeamStatistics med saknad data (som bör ge ett fel)
    const statisticsResult = TeamStatistics.create({
      teamId: '123',
      points: 100,
      activities: null // Ska orsaka ett fel
    });
    
    // Använder standardiserad API
    expect(statisticsResult.isErr()).toBe(true);
    expect(statisticsResult.error).toBe('Aktiviteter saknas');
    
    // Använder explicit kontroll innan värdeåtkomst
    const validStatisticsResult = TeamStatistics.create({
      teamId: '123',
      points: 50,
      activities: []
    });
    
    expect(validStatisticsResult.isOk()).toBe(true);
    const validStatistics = validStatisticsResult.value;
    
    // Använder explicit felhantering istället för unwrapOr
    const pointsResult = validStatistics.getPointsForActivity('non-existent');
    const points = pointsResult.isOk() ? pointsResult.value : 0;
    expect(points).toBe(0);
  });
}); 