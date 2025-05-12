import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseResourceCountProvider } from '../SupabaseResourceCountProvider';

// Mock av SupabaseClient
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
} as unknown as jest.Mocked<SupabaseClient>;

describe('SupabaseResourceCountProvider', () => {
  let provider: SupabaseResourceCountProvider;
  
  beforeEach(() => {
    jest.clearAllMocks();
    provider = new SupabaseResourceCountProvider(mockSupabaseClient);
  });
  
  describe('getGoalCount', () => {
    it('bör returnera antalet mål för en organisation', async () => {
      // Arrange
      const orgId = 'test-org-id';
      const mockCount = 5;
      
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: mockCount,
            error: null
          })
        })
      });
      
      // Act
      const result = await provider.getGoalCount(orgId);
      
      // Assert
      expect(result).toBe(mockCount);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('goals');
    });
    
    it('bör hantera fel och returnera 0', async () => {
      // Arrange
      const orgId = 'test-org-id';
      
      (mockSupabaseClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: null,
            error: new Error('Test error')
          })
        })
      });
      
      // Act
      const result = await provider.getGoalCount(orgId);
      
      // Assert
      expect(result).toBe(0);
    });
  });
  
  describe('getAllResourceCounts', () => {
    it('bör hämta alla resursantal samtidigt', async () => {
      // Arrange
      const orgId = 'test-org-id';
      
      // Skapa spy för att kontrollera att alla metoder anropas
      const getGoalCountSpy = jest.spyOn(provider, 'getGoalCount').mockResolvedValue(5);
      const getCompetitionCountSpy = jest.spyOn(provider, 'getCompetitionCount').mockResolvedValue(3);
      const getReportCountSpy = jest.spyOn(provider, 'getReportCount').mockResolvedValue(2);
      const getDashboardCountSpy = jest.spyOn(provider, 'getDashboardCount').mockResolvedValue(1);
      const getMediaUsageSpy = jest.spyOn(provider, 'getMediaUsage').mockResolvedValue(50);
      
      // Act
      const result = await provider.getAllResourceCounts(orgId);
      
      // Assert
      expect(getGoalCountSpy).toHaveBeenCalledWith(orgId);
      expect(getCompetitionCountSpy).toHaveBeenCalledWith(orgId);
      expect(getReportCountSpy).toHaveBeenCalledWith(orgId);
      expect(getDashboardCountSpy).toHaveBeenCalledWith(orgId);
      expect(getMediaUsageSpy).toHaveBeenCalledWith(orgId);
      
      expect(result).toEqual({
        goals: 5,
        competitions: 3,
        reports: 2,
        dashboards: 1,
        mediaUsage: 50
      });
    });
  });
}); 