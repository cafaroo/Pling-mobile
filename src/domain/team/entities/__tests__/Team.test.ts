import { MockTeam, MockTeamMember, MockTeamRole } from '@/test-utils/mocks/mockTeamEntities';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMember } from '../../value-objects/TeamMember';
import { TeamRole } from '../../value-objects/TeamRole';
import { TeamInvitation } from '../../value-objects/TeamInvitation';
import { createDomainEventTestHelper } from '@/shared/core/__tests__/DomainEventTestHelper';
import { getEventData } from '@/test-utils/helpers/eventDataAdapter';

describe('Team', () => {
  describe('domänhändelser', () => {
    it('ska skapa TeamCreated-händelse när ett team skapas', () => {
      // Arrange & Act
      const ownerId = 'test-owner-id';
      
      const result = MockTeam.create({
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
      const event = team.domainEvents.find(e => 
        getEventData(e, 'name') === 'Test Team' || 
        (e.payload && e.payload.name === 'Test Team')
      );
      
      // Verifiera händelsen
      expect(event).toBeDefined();
      expect(getEventData(event, 'teamId')).toBe(team.id.toString());
      expect(getEventData(event, 'ownerId')).toBe(ownerId);
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
      const event = team.domainEvents.find(e => 
        getEventData(e, 'name') === newName || 
        (e.payload && e.payload.name === newName)
      );
      
      // Verifiera händelsen
      expect(event).toBeDefined();
      expect(getEventData(event, 'teamId')).toBe(team.id.toString());
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
      const events = team.domainEvents;
      expect(events.length).toBeGreaterThan(0);
      
      // Hitta relevant händelse
      const event = events.find(e => 
        e.eventType === 'TeamMemberJoinedEvent' || 
        e.eventType === 'MemberJoined'
      );
      expect(event).toBeDefined();
      
      // Kontrollera innehåll med getEventData
      expect(getEventData(event, 'teamId')).toBe(team.id.toString());
      expect(getEventData(event, 'userId').toString()).toBe(memberId.toString());
      expect(getEventData(event, 'role')).toBe('MEMBER');
    });
    
    it('ska skapa MemberLeft-händelse när en medlem tas bort', () => {
      // Arrange
      const team = createTestTeam();
      const memberId = new UniqueId('test-member-id');
      
      // Lägg till en testmedlem först
      const member = TeamMember.create({
        userId: memberId,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }).value;
      
      team.addMember(member);
      team.clearEvents(); // Rensa tidigare händelser
      
      // Act
      const result = team.removeMember(memberId);
      
      // Assert
      expect(result.isOk()).toBe(true);
      const events = team.domainEvents;
      expect(events.length).toBeGreaterThan(0);
      
      // Hitta relevant händelse
      const event = events.find(e => 
        e.eventType === 'TeamMemberLeftEvent' || 
        e.eventType === 'MemberLeft'
      );
      expect(event).toBeDefined();
      
      // Kontrollera innehåll med getEventData
      expect(getEventData(event, 'teamId')).toBe(team.id.toString());
      expect(getEventData(event, 'userId').toString()).toBe(memberId.toString());
    });
    
    it('ska skapa RoleChanged-händelse när en medlems roll ändras', () => {
      // Arrange
      const team = createTestTeam();
      const memberId = new UniqueId('test-member-id');
      
      // Lägg till medlem med mer debug
      const memberResult = MockTeamMember.create({
        userId: memberId,
        role: MockTeamRole.MEMBER, 
        joinedAt: new Date()
      });
      
      expect(memberResult.isOk()).toBe(true);
      const member = memberResult.value;
      
      console.log('RoleChanged test: Skapar medlem med roll:', member.role);
      const addResult = team.addMember(member);
      expect(addResult.isOk()).toBe(true);
      
      team.clearEvents(); // Rensa bort MemberJoined-händelsen
      
      // Act
      const roleUpdateResult = team.updateMemberRole(memberId, MockTeamRole.ADMIN);
      console.log('RoleChanged test: Uppdateringsresultat:', roleUpdateResult.isOk() ? 'OK' : 'Error: ' + roleUpdateResult.error);
      
      // Assert
      const events = team.domainEvents;
      console.log('RoleChanged test: Antal händelser:', events.length);
      
      // Hitta relevant händelse
      const event = events.find(e => 
        e.eventType === 'TeamMemberRoleChangedEvent' || 
        e.eventType === 'RoleChanged'
      );
      
      console.log('RoleChanged test: Hittade event:', event ? 'Ja' : 'Nej');
      if (event) {
        console.log('RoleChanged test: Event data:', 
          'teamId=', getEventData(event, 'teamId'), 
          'userId=', getEventData(event, 'userId'), 
          'oldRole=', getEventData(event, 'oldRole'), 
          'newRole=', getEventData(event, 'newRole')
        );
      }
      
      expect(event).toBeDefined();
      
      // Kontrollera innehåll med getEventData
      expect(getEventData(event, 'teamId')).toBe(team.id.toString());
      expect(getEventData(event, 'userId').toString()).toBe(memberId.toString());
      expect(getEventData(event, 'oldRole')).toBe('MEMBER');
      expect(getEventData(event, 'newRole')).toBe('ADMIN');
    });
    
    it('ska skapa InvitationSent-händelse när en inbjudan skickas', () => {
      // Arrange
      const team = createTestTeam();
      const invitedUserId = new UniqueId('invited-user');
      const invitedBy = new UniqueId('test-owner-id');
      
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
      const events = team.domainEvents;
      expect(events.length).toBeGreaterThan(0);
      
      // Hitta relevant händelse
      const event = events.find(e => 
        e.eventType === 'InvitationSent' || 
        e.eventType === 'TeamInvitationSentEvent'
      );
      expect(event).toBeDefined();
      
      // Kontrollera innehåll med getEventData
      expect(getEventData(event, 'teamId')).toBe(team.id.toString());
      expect(getEventData(event, 'userId').toString()).toBe(invitedUserId.toString());
      expect(getEventData(event, 'invitedBy').toString()).toBe(invitedBy.toString());
    });
    
    it('ska hantera inbjudnings-accept med flera händelser i rätt ordning', () => {
      // Arrange
      const team = createTestTeam();
      const invitedUserId = new UniqueId('invited-user');
      const invitedBy = new UniqueId('test-owner-id');
      
      const invitation = TeamInvitation.create({
        teamId: team.id,
        userId: invitedUserId,
        invitedBy: invitedBy,
        status: 'pending',
        createdAt: new Date()
      }).value;
      
      team.addInvitation(invitation);
      team.clearEvents(); // Rensa tidigare händelser
      
      // Act
      const result = team.handleInvitationResponse(invitedUserId, true);
      
      // Assert
      expect(result.isOk()).toBe(true);
      const events = team.domainEvents;
      expect(events.length).toBeGreaterThanOrEqual(2);
      
      // Verifiera att vi har både InvitationAccepted och MemberJoined händelser
      const hasInvitationAccepted = events.some(e => 
        e.eventType === 'InvitationAccepted' || 
        e.eventType === 'TeamInvitationAcceptedEvent'
      );
      const hasMemberJoined = events.some(e => 
        e.eventType === 'TeamMemberJoinedEvent' || 
        e.eventType === 'MemberJoined'
      );
      
      expect(hasInvitationAccepted).toBe(true);
      expect(hasMemberJoined).toBe(true);
      
      // Hitta InvitationAccepted händelsen
      const acceptEvent = events.find(e => 
        e.eventType === 'InvitationAccepted' || 
        e.eventType === 'TeamInvitationAcceptedEvent'
      );
      
      // Kontrollera innehåll med getEventData
      expect(getEventData(acceptEvent, 'teamId')).toBe(team.id.toString());
      expect(getEventData(acceptEvent, 'userId').toString()).toBe(invitedUserId.toString());
    });
    
    it('ska skapa InvitationDeclined-händelse när en inbjudan avböjs', () => {
      // Arrange
      const team = createTestTeam();
      const invitedUserId = new UniqueId('invited-user');
      const invitedBy = new UniqueId('test-owner-id');
      
      const invitation = TeamInvitation.create({
        teamId: team.id,
        userId: invitedUserId,
        invitedBy: invitedBy,
        status: 'pending',
        createdAt: new Date()
      }).value;
      
      team.addInvitation(invitation);
      team.clearEvents(); // Rensa tidigare händelser
      
      // Act
      const result = team.handleInvitationResponse(invitedUserId, false);
      
      // Assert
      expect(result.isOk()).toBe(true);
      const events = team.domainEvents;
      expect(events.length).toBe(1);
      
      // Hitta relevant händelse
      const event = events.find(e => 
        e.eventType === 'InvitationDeclined' || 
        e.eventType === 'TeamInvitationDeclinedEvent'
      );
      expect(event).toBeDefined();
      
      // Kontrollera innehåll med getEventData
      expect(getEventData(event, 'teamId')).toBe(team.id.toString());
      expect(getEventData(event, 'userId').toString()).toBe(invitedUserId.toString());
    });
  });
  
  describe('validering', () => {
    it('ska returnera fel när teamnamn är för kort', () => {
      // Arrange
      const ownerId = 'test-owner-id';
      
      // Act
      const result = MockTeam.create({
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
      
      // Försäkra att team har settings-objekt för att undvika null-references
      if (!team.settings) {
        team.settings = {};
      }
      
      // Ändra medlemsgränsen för testet genom att uppdatera inställningar
      team.settings.maxMembers = 2; // Ägarens konto + 1 medlem max
      
      // Lägg till en medlem (plus ägaren gör 2)
      const memberId1 = new UniqueId('test-member-1');
      const member1 = {
        userId: memberId1,
        role: MockTeamRole.MEMBER,
        joinedAt: new Date()
      };
      
      const addResult1 = team.addMember(member1);
      
      // Om addMember-anropet lyckades, fortsätt med resten av testet
      if (addResult1.isOk()) {
        // Act - försök lägga till ytterligare en medlem över gränsen
        const memberId2 = new UniqueId('test-member-2');
        const member2 = {
          userId: memberId2,
          role: MockTeamRole.MEMBER,
          joinedAt: new Date()
        };
        
        const addResult2 = team.addMember(member2);
        
        // Assert
        // Vi förväntar oss ett felresultat
        expect(addResult2.isErr()).toBe(true);
        if (addResult2.isErr()) {
          expect(addResult2.error).toContain('har nått sin medlemsgräns');
        }
      } else {
        // Om vi inte lyckades lägga till första medlemmen, 
        // felar testet eftersom grundförutsättningen inte kunde skapas
        fail(`Kunde inte lägga till första medlemmen: ${addResult1.error}`);
      }
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
      expect(result.error).toContain('Ägarens roll kan inte ändras');
    });
  });
  
  describe('behörigheter', () => {
    it('ska ge ägaren alla behörigheter', () => {
      // Arrange
      const team = createTestTeam();
      
      // Act & Assert
      expect(team.hasMemberPermission(team.ownerId, 'view_team')).toBe(true);
      expect(team.hasMemberPermission(team.ownerId, 'edit_team')).toBe(true);
      expect(team.hasMemberPermission(team.ownerId, 'delete_team')).toBe(true);
      expect(team.hasMemberPermission(team.ownerId, 'invite_members')).toBe(true);
    });
    
    it('ska ge admin behörigheter enligt role_permissions', () => {
      // Arrange
      const team = createTestTeam();
      const adminId = new UniqueId('test-admin');
      
      // Skapa admin med MockTeamMember.create istället för objekt direkt
      const adminResult = MockTeamMember.create({
        userId: adminId,
        role: MockTeamRole.ADMIN, 
        joinedAt: new Date()
      });
      
      expect(adminResult.isOk()).toBe(true);
      const admin = adminResult.value;
      
      const result = team.addMember(admin);
      expect(result.isOk()).toBe(true);
      
      // Debug-loggning
      console.log('ADMIN TEST: Team Members:', JSON.stringify(team.members.map(m => ({ userId: m.userId.toString(), role: m.role }))));
      console.log('ADMIN TEST: Admin ID:', adminId.toString());
      console.log('ADMIN TEST: hasMemberPermission finns?', typeof team.hasMemberPermission === 'function');
      console.log('ADMIN TEST: Role för Admin:', team.members.find(m => m.userId.equals(adminId))?.role);
      
      // Act & Assert - Använd vanlig toBe(true/false) istället för toBeTruthy/toBeFalsy
      expect(team.hasMemberPermission(adminId, 'view_team')).toBe(true);
      expect(team.hasMemberPermission(adminId, 'edit_team')).toBe(true);
      expect(team.hasMemberPermission(adminId, 'invite_members')).toBe(true);
      expect(team.hasMemberPermission(adminId, 'delete_team')).toBe(false);
    });
    
    it('ska ge member behörigheter enligt role_permissions', () => {
      // Arrange
      const team = createTestTeam();
      const memberId = new UniqueId('test-member');
      
      // Skapa member med MockTeamMember.create istället för objekt direkt
      const memberResult = MockTeamMember.create({
        userId: memberId,
        role: MockTeamRole.MEMBER,
        joinedAt: new Date()
      });
      
      expect(memberResult.isOk()).toBe(true);
      const member = memberResult.value;
      
      const result = team.addMember(member);
      expect(result.isOk()).toBe(true);
      
      // Debug-loggning
      console.log('MEMBER TEST: Team Members:', JSON.stringify(team.members.map(m => ({ userId: m.userId.toString(), role: m.role }))));
      console.log('MEMBER TEST: Member ID:', memberId.toString());
      console.log('MEMBER TEST: hasMemberPermission finns?', typeof team.hasMemberPermission === 'function');
      console.log('MEMBER TEST: Role för Member:', team.members.find(m => m.userId.equals(memberId))?.role);
      
      // Act & Assert - Använd vanlig toBe(true/false) istället för toBeTruthy/toBeFalsy
      expect(team.hasMemberPermission(memberId, 'view_team')).toBe(true);
      expect(team.hasMemberPermission(memberId, 'join_activities')).toBe(true);
      expect(team.hasMemberPermission(memberId, 'edit_team')).toBe(false);
      expect(team.hasMemberPermission(memberId, 'invite_members')).toBe(false);
    });
  });
});

// Hjälpfunktion för att skapa ett testteam
function createTestTeam(): any {
  const ownerId = new UniqueId('test-owner-id');
  const result = MockTeam.create({
    name: 'Test Team',
    description: 'Test description',
    ownerId,
    settings: { maxMembers: 10 }
  });
  
  // Kontrollera om result är ok innan vi försöker använda value
  if (!result.isOk()) {
    throw new Error(`Kunde inte skapa testteam: ${result.error}`);
  }
  
  const team = result.value;
  
  // Skapa en mock av clearEvents om metoden saknas
  if (team && !team.clearEvents) {
    Object.defineProperty(team, 'clearEvents', {
      value: function() {
        this.domainEvents = [];
      }
    });
  }
  
  return team;
} 