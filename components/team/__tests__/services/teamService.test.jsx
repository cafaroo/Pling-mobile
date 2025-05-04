import { teamService } from '../../../../services/teamService';
import { supabase } from '../../../../lib/supabase';

// Mock för Supabase
jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    csv: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

describe('teamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getTeam', () => {
    it('returnerar teamdata vid framgångsrik hämtning', async () => {
      const mockTeam = { id: 'team1', name: 'Testteam' };
      
      supabase.single.mockResolvedValue({
        data: mockTeam,
        error: null
      });
      
      const result = await teamService.getTeam('team1');
      
      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('id', 'team1');
      expect(result).toEqual({
        data: mockTeam,
        error: null,
        status: 'success'
      });
    });
    
    it('hanterar fel korrekt', async () => {
      const mockError = new Error('Teamet hittades inte');
      
      supabase.single.mockResolvedValue({
        data: null,
        error: mockError
      });
      
      const result = await teamService.getTeam('nonexistent');
      
      expect(result).toEqual({
        data: null,
        error: mockError,
        status: 'error'
      });
    });
  });
  
  describe('getTeamMembers', () => {
    it('returnerar teammedlemmar vid framgångsrik hämtning', async () => {
      const mockMembers = [
        { id: 'member1', user_id: 'user1', team_id: 'team1', role: 'owner' },
        { id: 'member2', user_id: 'user2', team_id: 'team1', role: 'member' }
      ];
      
      supabase.order.mockReturnThis();
      supabase.csv.mockResolvedValue({
        data: mockMembers,
        error: null
      });
      
      const result = await teamService.getTeamMembers('team1');
      
      expect(supabase.from).toHaveBeenCalledWith('team_members');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('team_id', 'team1');
      expect(result).toEqual({
        data: mockMembers,
        error: null,
        status: 'success'
      });
    });
  });
  
  describe('createTeam', () => {
    it('skapar ett nytt team framgångsrikt', async () => {
      const newTeam = { name: 'Nytt team', description: 'Beskrivning' };
      const mockResponse = { ...newTeam, id: 'new-team-id', created_at: new Date().toISOString() };
      
      supabase.insert.mockReturnThis();
      supabase.single.mockResolvedValue({
        data: mockResponse,
        error: null
      });
      
      const result = await teamService.createTeam(newTeam);
      
      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining(newTeam));
      expect(result).toEqual({
        data: mockResponse,
        error: null,
        status: 'success'
      });
    });
    
    it('hanterar fel vid teamskapande', async () => {
      const newTeam = { name: 'Felaktigt team' };
      const mockError = new Error('Teamskapande misslyckades');
      
      supabase.insert.mockReturnThis();
      supabase.single.mockResolvedValue({
        data: null,
        error: mockError
      });
      
      const result = await teamService.createTeam(newTeam);
      
      expect(result).toEqual({
        data: null,
        error: mockError,
        status: 'error'
      });
    });
  });
  
  describe('updateTeam', () => {
    it('uppdaterar ett team framgångsrikt', async () => {
      const updatedTeam = { id: 'team1', name: 'Uppdaterat team' };
      
      supabase.update.mockReturnThis();
      supabase.match.mockReturnThis();
      supabase.single.mockResolvedValue({
        data: updatedTeam,
        error: null
      });
      
      const result = await teamService.updateTeam('team1', { name: 'Uppdaterat team' });
      
      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(supabase.update).toHaveBeenCalledWith({ name: 'Uppdaterat team' });
      expect(supabase.match).toHaveBeenCalledWith({ id: 'team1' });
      expect(result).toEqual({
        data: updatedTeam,
        error: null,
        status: 'success'
      });
    });
  });
  
  describe('deleteTeam', () => {
    it('tar bort ett team framgångsrikt', async () => {
      supabase.delete.mockReturnThis();
      supabase.match.mockReturnThis();
      supabase.csv.mockResolvedValue({
        data: { id: 'team1' },
        error: null
      });
      
      const result = await teamService.deleteTeam('team1');
      
      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.match).toHaveBeenCalledWith({ id: 'team1' });
      expect(result).toEqual({
        data: { id: 'team1' },
        error: null,
        status: 'success'
      });
    });
  });
  
  describe('getCurrentUserRole', () => {
    it('returnerar användarroll i teamet', async () => {
      const mockMember = { role: 'admin' };
      
      supabase.single.mockResolvedValue({
        data: mockMember,
        error: null
      });
      
      const result = await teamService.getCurrentUserRole('team1', 'user1');
      
      expect(supabase.from).toHaveBeenCalledWith('team_members');
      expect(supabase.select).toHaveBeenCalledWith('role');
      expect(supabase.match).toHaveBeenCalledWith({ team_id: 'team1', user_id: 'user1' });
      expect(result).toEqual({
        data: 'admin',
        error: null,
        status: 'success'
      });
    });
    
    it('hanterar situation när användaren inte är medlem', async () => {
      supabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Ingen post hittad' }
      });
      
      const result = await teamService.getCurrentUserRole('team1', 'user2');
      
      expect(result).toEqual({
        data: null,
        error: expect.anything(),
        status: 'error'
      });
    });
  });
}); 