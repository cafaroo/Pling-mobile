import { SupabaseTeamRepository } from '../TeamRepository';
import { MockEventBus } from '@/shared/core/__mocks__/EventBus';
import { Team } from '@/domain/team/entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';

// Mocka Supabase-klienten
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockIn = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  const mockUpsert = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockMaybeSingle = jest.fn().mockReturnThis();
  
  return {
    createClient: jest.fn().mockReturnValue({
      from: mockFrom,
      select: mockSelect,
      single: mockSingle,
      eq: mockEq,
      in: mockIn,
      delete: mockDelete,
      upsert: mockUpsert,
      insert: mockInsert,
      update: mockUpdate,
      maybeSingle: mockMaybeSingle,
    }),
  };
});

describe('SupabaseTeamRepository', () => {
  let repository: SupabaseTeamRepository;
  let eventBus: MockEventBus;
  let mockSupabase: any;
  
  beforeEach(() => {
    // Skapa en mock för Supabase-klienten
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      maybeSingle: jest.fn(),
    };
    
    // Skapa en ny instans av MockEventBus för varje test
    eventBus = new MockEventBus();
    
    // Skapa repository med mockat Supabase och EventBus
    repository = new SupabaseTeamRepository(mockSupabase as any, eventBus as any);
  });
  
  describe('save', () => {
    it('ska publicera domänhändelser när ett team sparas', async () => {
      // Arrange
      const team = createTestTeam();
      const memberId = new UniqueId('test-member-id');
      const member = TeamMember.create({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).getValue();
      
      // Lägg till en medlem för att generera en MemberJoined-händelse
      team.addMember(member);
      
      // Mocka lyckade Supabase-operationer
      mockSupabase.upsert.mockResolvedValue({ error: null });
      mockSupabase.delete.mockResolvedValue({ error: null });
      
      // Act
      const result = await repository.save(team);
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      // Verifiera att domänhändelser har publicerats
      expect(eventBus.getPublishedEvents().length).toBe(1);
      expect(eventBus.hasPublishedEventOfType('MemberJoined')).toBe(true);
      
      // Verifiera att domänhändelser har rensats från teamet
      expect(team.domainEvents.length).toBe(0);
    });
    
    it('ska inte publicera händelser om databasen returnerar fel', async () => {
      // Arrange
      const team = createTestTeam();
      team.update({ name: 'Nytt namn' }); // Generera en TeamUpdated-händelse
      
      // Mocka ett databasfel
      mockSupabase.upsert.mockResolvedValue({ error: { message: 'DB error' } });
      
      // Act
      const result = await repository.save(team);
      
      // Assert
      expect(result.isErr()).toBe(true);
      
      // Verifiera att inga domänhändelser har publicerats
      expect(eventBus.getPublishedEvents().length).toBe(0);
      
      // Verifiera att domänhändelser fortfarande finns kvar i teamet
      expect(team.domainEvents.length).toBe(1);
    });
  });
  
  describe('findById', () => {
    it('ska returnera ett team när det hittas', async () => {
      // Arrange
      const teamId = new UniqueId('test-team-id');
      
      // Mocka Supabase-svar
      const mockTeamData = {
        id: teamId.toString(),
        name: 'Test Team',
        description: 'Test Description',
        owner_id: 'test-owner-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          visibility: 'private',
          joinPolicy: 'invite_only',
          memberLimit: 50,
          notificationPreferences: {
            memberJoined: true,
            memberLeft: true,
            roleChanged: true
          },
          customFields: {}
        }
      };
      
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: mockTeamData, error: null });
      
      // Mocka tom medlemslista
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            data: [],
            error: null
          };
        }
        if (table === 'team_invitations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            data: [],
            error: null
          };
        }
        return mockSupabase;
      });
      
      // Act
      const result = await repository.findById(teamId);
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      const team = result.getValue();
      expect(team.id.toString()).toBe(teamId.toString());
      expect(team.name).toBe('Test Team');
    });
  });
  
  describe('domänhändelser', () => {
    it('ska publicera domänhändelser i rätt ordning', async () => {
      // Arrange
      const team = createTestTeam();
      
      // Generera flera händelser
      const memberId1 = new UniqueId('test-member-1');
      const memberId2 = new UniqueId('test-member-2');
      
      const member1 = TeamMember.create({
        userId: memberId1,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).getValue();
      
      const member2 = TeamMember.create({
        userId: memberId2,
        role: TeamRole.ADMIN,
        joinedAt: new Date()
      }).getValue();
      
      // Lägg till medlemmar och uppdatera teamet för att generera händelser
      team.addMember(member1);
      team.addMember(member2);
      team.update({ name: 'Nytt teamnamn' });
      
      // Förväntat resultat: MemberJoined, MemberJoined, TeamUpdated
      
      // Mocka lyckade Supabase-operationer
      mockSupabase.upsert.mockResolvedValue({ error: null });
      mockSupabase.delete.mockResolvedValue({ error: null });
      
      // Act
      const result = await repository.save(team);
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      // Verifiera att alla domänhändelser har publicerats i rätt ordning
      const events = eventBus.getPublishedEvents();
      expect(events.length).toBe(3);
      expect(events[0].name).toBe('MemberJoined');
      expect(events[1].name).toBe('MemberJoined');
      expect(events[2].name).toBe('TeamUpdated');
      
      // Verifiera korrekt data i händelserna
      expect(events[0].payload.userId).toBe(memberId1.toString());
      expect(events[1].payload.userId).toBe(memberId2.toString());
      expect(events[2].payload.name).toBe('Nytt teamnamn');
    });
  });
});

// Hjälpfunktion för att skapa ett testteam
function createTestTeam(): Team {
  const ownerId = 'test-owner-id';
  const result = Team.create({
    name: 'Test Team',
    description: 'Test description',
    ownerId
  });
  
  // Rensa bort TeamCreated-händelsen för att inte påverka tester
  const team = result.getValue();
  team.clearDomainEvents();
  
  return team;
} 