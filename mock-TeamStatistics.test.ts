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
    
    // Använder nya API-metoder
    expect(statisticsResult.isOk()).toBe(true);
    const statistics = statisticsResult.value;
    expect(statistics.getTotalPoints()).toBe(100);
    
    // Använder explicit kontroll istället för unwrap
    const pointsResult = statistics.calculateTotalPointsFromActivities();
    expect(pointsResult.isOk()).toBe(true);
    const totalPoints = pointsResult.value;
    expect(totalPoints).toBe(30);
  });
  
  it('ska hantera felberäkningar korrekt', () => {
    // Skapa TeamStatistics med saknad data (som bör ge ett fel)
    const statisticsResult = TeamStatistics.create({
      teamId: '123',
      points: 100,
      activities: null // Ska orsaka ett fel
    });
    
    // Använder nya API-metoder
    expect(statisticsResult.isErr()).toBe(true);
    expect(statisticsResult.error).toBe('Aktiviteter saknas');
    
    // Försöker skapa en statistik som ska lyckas
    const validStatisticsResult = TeamStatistics.create({
      teamId: '123',
      points: 50,
      activities: []
    });
    
    // Explicit kontroll före användning
    expect(validStatisticsResult.isOk()).toBe(true);
    const validStatistics = validStatisticsResult.value;
    
    // Anropar en metod som kan returnera err med explicit kontroll
    const pointsResult = validStatistics.getPointsForActivity('non-existent');
    expect(pointsResult.isErr()).toBe(true);
    // Använda explicit fallback istället för unwrapOr
    const points = pointsResult.isOk() ? pointsResult.value : 0;
    expect(points).toBe(0);
  });
}); 