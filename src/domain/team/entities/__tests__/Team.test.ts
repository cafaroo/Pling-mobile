import { Team } from '../Team';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMember } from '../../value-objects/TeamMember';
import { TeamRole } from '../../value-objects/TeamRole';
import { TeamInvitation } from '../../value-objects/TeamInvitation';
import { createDomainEventTestHelper } from '@/shared/core/__tests__/DomainEventTestHelper';

describe('Team', () => {
  describe('domänhändelser', () => {
    it('ska skapa TeamCreated-händelse när ett team skapas', () => {
      // Arrange & Act
      const ownerId = 'test-owner-id';
      
      const result = Team.create({
        name: 'Test Team',
        description: 'Test description',
        ownerId
      });
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      const team = result.value;
      
      // Verifiera att vi har minst en händelse
      expect(team.domainEvents.length).toBeGreaterThan(0);
      
      // Hitta TeamCreated händelsen
      const event = team.domainEvents.find(e => e.payload && e.payload.name === 'Test Team');
      
      // Verifiera händelsen
      expect(event).toBeDefined();
      expect(event?.payload.teamId).toBe(team.id.toString());
      expect(event?.payload.ownerId).toBe(ownerId);
    });
    
    it('ska skapa TeamUpdated-händelse när ett team uppdateras', () => {
      // Arrange
      const team = createTestTeam();
      const newName = 'Updated Team Name';
      
      // Rensa tidigare händelser
      team.clearEvents();
      
      // Act
      const result = team.update({
        name: newName
      });
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      // Verifiera att vi har minst en händelse
      expect(team.domainEvents.length).toBeGreaterThan(0);
      
      // Hitta TeamUpdated händelsen
      const event = team.domainEvents.find(e => e.payload && e.payload.name === newName);
      
      // Verifiera händelsen
      expect(event).toBeDefined();
      expect(event?.payload.teamId).toBe(team.id.toString());
    });
    
    it('ska skapa MemberJoined-händelse när en medlem läggs till', () => {
      // Arrange
      const team = createTestTeam();
      const memberId = new UniqueId('test-member-id');
      const member = TeamMember.create({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).value;
      const eventHelper = createDomainEventTestHelper(team);
      
      // Act
      const result = team.addMember(member);
      
      // Assert
      expect(result.isOk()).toBe(true);
      eventHelper.expectEvent('MemberJoined', {
        teamId: team.id.toString(),
        userId: memberId.toString(),
        role: TeamRole.MEMBER
      });
    });
    
    it('ska skapa MemberLeft-händelse när en medlem tas bort', () => {
      // Arrange
      const team = createTestTeam();
      const memberId = new UniqueId('test-member-id');
      const eventHelper = createDomainEventTestHelper(team);
      
      // Lägg till en testmedlem först
      const member = TeamMember.create({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).value;
      
      team.addMember(member);
      eventHelper.clearEvents(); // Rensa tidigare händelser
      
      // Act
      const result = team.removeMember(memberId);
      
      // Assert
      expect(result.isOk()).toBe(true);
      eventHelper.expectEvent('MemberLeft', {
        teamId: team.id.toString(),
        userId: memberId.toString()
      });
    });
    
    it('ska skapa RoleChanged-händelse när en medlems roll ändras', () => {
      // Arrange
      const team = createTestTeam();
      const memberId = new UniqueId('test-member-id');
      const eventHelper = createDomainEventTestHelper(team);
      
      // Lägg till medlem
      const member = TeamMember.create({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).value;
      
      team.addMember(member);
      eventHelper.clearEvents(); // Rensa bort MemberJoined-händelsen
      
      // Act
      team.updateMemberRole(memberId, TeamRole.ADMIN);
      
      // Assert
      eventHelper.expectEvent('TeamMemberRoleChanged', {
        teamId: team.id.toString(),
        userId: memberId.toString(),
        oldRole: TeamRole.MEMBER,
        newRole: TeamRole.ADMIN
      });
    });
    
    it('ska skapa InvitationSent-händelse när en inbjudan skickas', () => {
      // Arrange
      const team = createTestTeam();
      const invitedUserId = new UniqueId('invited-user');
      const invitedBy = new UniqueId('test-owner-id');
      const eventHelper = createDomainEventTestHelper(team);
      
      const invitation = TeamInvitation.create({
        teamId: team.id,
        userId: invitedUserId,
        invitedBy: invitedBy,
        status: 'pending',
        createdAt: new Date()
      }).value;
      
      // Act
      const result = team.addInvitation(invitation);
      
      // Assert
      expect(result.isOk()).toBe(true);
      eventHelper.expectEvent('InvitationSent', {
        teamId: team.id.toString(),
        userId: invitedUserId.toString(),
        invitedBy: invitedBy.toString()
      });
    });
    
    it('ska hantera inbjudnings-accept med flera händelser i rätt ordning', () => {
      // Arrange
      const team = createTestTeam();
      const invitedUserId = new UniqueId('invited-user');
      const invitedBy = new UniqueId('test-owner-id');
      const eventHelper = createDomainEventTestHelper(team);
      
      const invitation = TeamInvitation.create({
        teamId: team.id,
        userId: invitedUserId,
        invitedBy: invitedBy,
        status: 'pending',
        createdAt: new Date()
      }).value;
      
      team.addInvitation(invitation);
      eventHelper.clearEvents(); // Rensa tidigare händelser
      
      // Act
      const result = team.handleInvitationResponse(invitedUserId, true);
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      // Kontrollera att både InvitationAccepted och MemberJoined har genererats i rätt ordning
      eventHelper.expectEventSequence(['InvitationAccepted', 'MemberJoined']);
      
      // Verifiera enskilda händelser mer i detalj
      eventHelper.expectEvent('InvitationAccepted', {
        teamId: team.id.toString(),
        userId: invitedUserId.toString()
      });
      
      eventHelper.expectEvent('MemberJoined', {
        teamId: team.id.toString(),
        userId: invitedUserId.toString()
      });
      
      // Verifiera att vi har exakt 2 händelser
      expect(team.domainEvents.length).toBe(2);
    });
    
    it('ska skapa InvitationDeclined-händelse när en inbjudan avböjs', () => {
      // Arrange
      const team = createTestTeam();
      const invitedUserId = new UniqueId('invited-user');
      const invitedBy = new UniqueId('test-owner-id');
      const eventHelper = createDomainEventTestHelper(team);
      
      const invitation = TeamInvitation.create({
        teamId: team.id,
        userId: invitedUserId,
        invitedBy: invitedBy,
        status: 'pending',
        createdAt: new Date()
      }).value;
      
      team.addInvitation(invitation);
      eventHelper.clearEvents(); // Rensa tidigare händelser
      
      // Act
      const result = team.handleInvitationResponse(invitedUserId, false);
      
      // Assert
      expect(result.isOk()).toBe(true);
      eventHelper.expectEvent('InvitationDeclined', {
        teamId: team.id.toString(),
        userId: invitedUserId.toString()
      });
      
      // Verifiera att vi har exakt 1 händelse
      eventHelper.expectEventCount('InvitationDeclined', 1);
      expect(team.domainEvents.length).toBe(1);
    });
  });
  
  describe('validering', () => {
    it('ska returnera fel när teamnamn är för kort', () => {
      // Arrange
      const ownerId = 'test-owner-id';
      
      // Act
      const result = Team.create({
        name: 'T',
        description: 'Test description',
        ownerId
      });
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Teamnamn måste vara minst 2 tecken');
    });
    
    it('ska validera medlemskapsgränser för teamet', () => {
      // Arrange
      const team = createTestTeam();
      
      // Ändra medlemsgränsen för testet genom att uppdatera inställningar
      const settingsResult = team.update({
        settings: {
          maxMembers: 2 // Ägarens konto + 1 medlem max
        }
      });
      expect(settingsResult.isOk()).toBe(true);
      
      // Lägg till en medlem (plus ägaren gör 2)
      const memberId1 = new UniqueId('test-member-1');
      const member1 = TeamMember.create({
        userId: memberId1,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).value;
      
      const addResult1 = team.addMember(member1);
      expect(addResult1.isOk()).toBe(true);
      
      // Act - försök lägga till ytterligare en medlem över gränsen
      const memberId2 = new UniqueId('test-member-2');
      const member2 = TeamMember.create({
        userId: memberId2,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).value;
      
      const addResult2 = team.addMember(member2);
      
      // Assert
      expect(addResult2.isErr()).toBe(true);
      expect(addResult2.error).toContain('Teamet har nått sin medlemsgräns');
    });
    
    it('ska förhindra borttagning av teamägaren', () => {
      // Arrange
      const team = createTestTeam();
      
      // Act
      const result = team.removeMember(team.ownerId);
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ägaren kan inte tas bort från teamet');
    });
    
    it('ska förhindra ändring av ägarens roll', () => {
      // Arrange
      const team = createTestTeam();
      
      // Act
      const result = team.updateMemberRole(team.ownerId, TeamRole.MEMBER);
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ägarrollen kan inte ändras');
    });
  });
  
  describe('behörigheter', () => {
    it('ska ge ägaren alla behörigheter', () => {
      // Arrange
      const team = createTestTeam();
      
      // Act & Assert
      expect(team.hasMemberPermission(team.ownerId, 'view_team' as any)).toBe(true);
      expect(team.hasMemberPermission(team.ownerId, 'edit_team' as any)).toBe(true);
      expect(team.hasMemberPermission(team.ownerId, 'delete_team' as any)).toBe(true);
      expect(team.hasMemberPermission(team.ownerId, 'invite_members' as any)).toBe(true);
    });
    
    it('ska ge admin behörigheter enligt role_permissions', () => {
      // Arrange
      const team = createTestTeam();
      const adminId = new UniqueId('test-admin');
      
      const admin = TeamMember.create({
        userId: adminId,
        role: TeamRole.ADMIN,
        joinedAt: new Date()
      }).value;
      
      team.addMember(admin);
      
      // Act & Assert
      expect(team.hasMemberPermission(adminId, 'view_team' as any)).toBe(true);
      expect(team.hasMemberPermission(adminId, 'edit_team' as any)).toBe(true);
      expect(team.hasMemberPermission(adminId, 'invite_members' as any)).toBe(true);
      expect(team.hasMemberPermission(adminId, 'delete_team' as any)).toBe(false);
    });
    
    it('ska ge member behörigheter enligt role_permissions', () => {
      // Arrange
      const team = createTestTeam();
      const memberId = new UniqueId('test-member');
      
      const member = TeamMember.create({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).value;
      
      team.addMember(member);
      
      // Act & Assert
      expect(team.hasMemberPermission(memberId, 'view_team' as any)).toBe(true);
      expect(team.hasMemberPermission(memberId, 'join_activities' as any)).toBe(true);
      expect(team.hasMemberPermission(memberId, 'edit_team' as any)).toBe(false);
      expect(team.hasMemberPermission(memberId, 'invite_members' as any)).toBe(false);
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
  const team = result.value;
  team.clearEvents();
  
  return team;
} 