import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { MemberJoined, MemberLeft, TeamMemberRoleChanged } from '@/domain/team/events/TeamEvents';
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';
import { MockEventBus } from '@/infrastructure/events/__mocks__/eventBus';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserSettings } from '@/domain/user/entities/UserSettings';

describe('User-Team Integration', () => {
  let mockEventBus: MockEventBus;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockTeamRepo: jest.Mocked<TeamRepository>;
  let eventTestHelper: DomainEventTestHelper;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
    eventTestHelper = new DomainEventTestHelper(mockEventBus);

    mockUserRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
    };

    mockTeamRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByMemberId: jest.fn(),
    };
  });

  const createTestUser = async (id: string = 'test-user-id') => {
    const settings = await UserSettings.create({
      language: 'sv',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        inApp: true
      },
      privacy: {
        showProfile: true,
        showActivity: true,
        showTeams: true
      }
    });

    if (settings.isErr()) {
      throw new Error('Kunde inte skapa användarinställningar');
    }

    const userResult = await User.create({
      email: `${id}@example.com`,
      name: 'Test User',
      settings: settings.value,
      teamIds: []
    });

    if (userResult.isErr()) {
      throw new Error('Kunde inte skapa testanvändare');
    }

    return userResult.value;
  };

  const createTestTeam = (id: string = 'test-team-id', ownerIdStr: string = 'test-owner-id') => {
    const ownerId = new UniqueId(ownerIdStr);
    
    const teamResult = Team.create({
      name: 'Test Team',
      description: 'Test description',
      ownerId: ownerId
    });

    if (teamResult.isErr()) {
      console.error('Kunde inte skapa team:', teamResult.error);
      throw new Error(`Kunde inte skapa testteam: ${teamResult.error}`);
    }

    // För att undvika hoisting-problem och säkerställa att teamet är korrekt initialiserat
    const team = teamResult.value;
    console.log('Team skapades:', {
      id: team.id.toString(),
      name: team.name,
      ownerId: team.ownerId.toString(),
      members: team.members.map(m => ({ userId: m.userId.toString(), role: m.role }))
    });

    return team;
  };

  describe('när en användare läggs till i ett team', () => {
    it('ska skapa korrekt relation och publicera MemberJoined-händelse', async () => {
      // Arrange
      const userId = new UniqueId('test-user-id');
      const ownerId = new UniqueId('test-owner-id');

      const user = await createTestUser('test-user-id');
      const team = createTestTeam('test-team-id', ownerId.toString());
      
      console.log('Användare skapad med ID:', user.id.toString());
      console.log('Team skapat med ID:', team.id.toString());
      console.log('Team medlemmar före:', team.members.map(m => ({ userId: m.userId.toString(), role: m.role })));

      const memberResult = TeamMember.create({
        userId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });

      if (memberResult.isErr()) {
        throw new Error(`Kunde inte skapa TeamMember: ${memberResult.error}`);
      }

      const member = memberResult.value;
      
      mockUserRepo.findById.mockResolvedValue(ok(user));
      mockTeamRepo.findById.mockResolvedValue(ok(team));
      mockTeamRepo.save.mockImplementation(async (team) => ok(team));

      // Act
      console.log('Försöker lägga till medlem:', member.userId.toString());
      const addMemberResult = team.addMember(member);
      console.log('Resultat av addMember:', addMemberResult.isOk() ? 'OK' : addMemberResult.error);
      console.log('Team medlemmar efter:', team.members.map(m => ({ userId: m.userId.toString(), role: m.role })));

      // Assert
      expect(addMemberResult.isOk()).toBeTruthy();
      
      if (addMemberResult.isOk()) {
        // Verifiera att användaren lades till i teamet
        const addedMember = team.members.find(m => m.userId.equals(userId));
        expect(addedMember).toBeDefined();
        expect(addedMember?.role).toBe(TeamRole.MEMBER);

        // Verifiera att MemberJoined-händelsen publicerades
        const events = team.domainEvents;
        const joinedEvent = events.find(e => e instanceof MemberJoined) as MemberJoined;
        expect(joinedEvent).toBeDefined();
        expect(joinedEvent.teamId.equals(team.id)).toBeTruthy();
        expect(joinedEvent.userId.equals(userId)).toBeTruthy();
        expect(joinedEvent.role).toBe(TeamRole.MEMBER);
      }
    });

    it('ska hantera fel när användaren redan är medlem', async () => {
      // Arrange
      const user = await createTestUser();
      const team = createTestTeam();
      
      const memberResult = TeamMember.create({
        userId: new UniqueId('test-user-id'),
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });

      if (memberResult.isErr()) {
        throw new Error(`Kunde inte skapa TeamMember: ${memberResult.error}`);
      }

      const member = memberResult.value;
      const addResult = team.addMember(member);
      expect(addResult.isOk()).toBeTruthy();

      // Act
      const secondAddResult = team.addMember(member);

      // Assert
      expect(secondAddResult.isErr()).toBeTruthy();
      if (secondAddResult.isErr()) {
        expect(secondAddResult.error).toBe('Användaren är redan medlem i teamet');
      }
    });
  });

  describe('när en medlem befordras till admin', () => {
    it('ska hantera rollförändring och publicera TeamMemberRoleChanged-händelse', async () => {
      // Arrange
      const ownerId = new UniqueId('test-owner-id');
      const userId = new UniqueId('test-user-id');
      const team = createTestTeam('test-team-id', ownerId.toString());
      
      const memberResult = TeamMember.create({
        userId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });

      if (memberResult.isErr()) {
        throw new Error('Kunde inte skapa TeamMember');
      }

      const addResult = team.addMember(memberResult.value);
      expect(addResult.isOk()).toBeTruthy();

      // Act
      const updateResult = team.updateMemberRole(userId, TeamRole.ADMIN);

      // Assert
      expect(updateResult.isOk()).toBeTruthy();
      
      // Verifiera att medlemmens roll uppdaterades
      const updatedMember = team.members.find(m => m.userId.equals(userId));
      expect(updatedMember).toBeDefined();
      expect(updatedMember?.role).toBe(TeamRole.ADMIN);

      // Verifiera att TeamMemberRoleChanged-händelsen publicerades
      const events = team.domainEvents;
      const roleChangedEvent = events.find(e => e instanceof TeamMemberRoleChanged) as TeamMemberRoleChanged;
      expect(roleChangedEvent).toBeDefined();
      expect(roleChangedEvent.teamId.equals(team.id)).toBeTruthy();
      expect(roleChangedEvent.userId.equals(userId)).toBeTruthy();
      expect(roleChangedEvent.oldRole).toBe(TeamRole.MEMBER);
      expect(roleChangedEvent.newRole).toBe(TeamRole.ADMIN);
    });

    it('ska förhindra ändring av ägarens roll', async () => {
      // Arrange
      const ownerId = new UniqueId('test-owner-id');
      const team = createTestTeam('test-team-id', ownerId.toString());

      // Act
      const updateResult = team.updateMemberRole(ownerId, TeamRole.MEMBER);

      // Assert
      expect(updateResult.isErr()).toBeTruthy();
      if (updateResult.isErr()) {
        expect(updateResult.error).toBe('Ägarrollen kan inte ändras');
      }
    });
  });

  describe('när en medlem lämnar teamet', () => {
    it('ska ta bort medlemmen och publicera MemberLeft-händelse', async () => {
      // Arrange
      const userId = new UniqueId('test-user-id');
      const team = createTestTeam();
      
      const memberResult = TeamMember.create({
        userId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      });

      if (memberResult.isErr()) {
        throw new Error('Kunde inte skapa TeamMember');
      }

      const addResult = team.addMember(memberResult.value);
      expect(addResult.isOk()).toBeTruthy();

      // Act
      const removeResult = team.removeMember(userId);

      // Assert
      expect(removeResult.isOk()).toBeTruthy();
      
      // Verifiera att medlemmen togs bort
      const removedMember = team.members.find(m => m.userId.equals(userId));
      expect(removedMember).toBeUndefined();

      // Verifiera att MemberLeft-händelsen publicerades
      const events = team.domainEvents;
      const leftEvent = events.find(e => e instanceof MemberLeft) as MemberLeft;
      expect(leftEvent).toBeDefined();
      expect(leftEvent.teamId.equals(team.id)).toBeTruthy();
      expect(leftEvent.userId.equals(userId)).toBeTruthy();
    });

    it('ska förhindra borttagning av ägaren', async () => {
      // Arrange
      const ownerId = new UniqueId('test-owner-id');
      const team = createTestTeam('test-team-id', ownerId.toString());

      // Act
      const removeResult = team.removeMember(ownerId);

      // Assert
      expect(removeResult.isErr()).toBeTruthy();
      if (removeResult.isErr()) {
        expect(removeResult.error).toBe('Ägaren kan inte tas bort från teamet');
      }
    });
  });
}); 