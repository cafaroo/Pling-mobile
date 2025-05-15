import { Organization } from '../Organization';
import { OrganizationInvitation } from '../../value-objects/OrganizationInvitation';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../../value-objects/OrganizationRole';
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';
import { OrganizationCreatedEvent } from '../../events/OrganizationCreatedEvent';
import { OrganizationMemberJoinedEvent } from '../../events/OrganizationMemberJoinedEvent';
import { OrganizationMemberLeftEvent } from '../../events/OrganizationMemberLeftEvent';
import { OrganizationMemberRoleChangedEvent } from '../../events/OrganizationMemberRoleChangedEvent';
import { TeamAddedToOrganizationEvent } from '../../events/TeamAddedToOrganizationEvent';
import { TeamRemovedFromOrganizationEvent } from '../../events/TeamRemovedFromOrganizationEvent';
import { OrganizationMemberInvitedEvent } from '../../events/OrganizationMemberInvitedEvent';
import { OrganizationInvitationAcceptedEvent } from '../../events/OrganizationInvitationAcceptedEvent';
import { OrganizationInvitationDeclinedEvent } from '../../events/OrganizationInvitationDeclinedEvent';
import { mockDomainEvents } from '@/test-utils/mocks';
import { OrgSettings } from '../../value-objects/OrgSettings';
import { OrganizationMember } from '../../value-objects/OrganizationMember';

describe('Organization Aggregate', () => {
  // Setup
  beforeEach(() => {
    mockDomainEvents.clearEvents();
  });

  afterEach(() => {
    mockDomainEvents.clearEvents();
  });

  describe('Skapande av Organization', () => {
    test('ska skapa en giltig organisation', () => {
      // Arrange
      const ownerId = new UniqueId();
      const name = 'Test Organization';
      
      // Act
      const orgResult = Organization.create({
        name,
        ownerId
      });
      
      // Assert
      expect(orgResult.isOk()).toBe(true);
      
      if (orgResult.isOk()) {
        const org = orgResult.value;
        expect(org.name).toBe(name);
        expect(org.ownerId.equals(ownerId)).toBe(true);
        
        // Kontrollera att ägaren är medlem med OWNER-roll
        const ownerMember = org.members.find(m => 
          m.userId.equals(ownerId) && m.role === OrganizationRole.OWNER
        );
        expect(ownerMember).toBeDefined();
      }
    });
    
    test('ska publicera OrganizationCreatedEvent vid skapande', () => {
      // Arrange
      const ownerId = new UniqueId();
      const name = 'Test Organization';
      
      // Act
      const orgResult = Organization.create({
        name,
        ownerId
      });
      
      // Assert
      expect(orgResult.isOk()).toBe(true);
      
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event).toBeInstanceOf(OrganizationCreatedEvent);
      
      const createdEvent = event as OrganizationCreatedEvent;
      expect(createdEvent.name).toBe(name);
      expect(createdEvent.ownerId.toString()).toBe(ownerId.toString());
    });
  });

  describe('Invarianter', () => {
    test('ska avvisa skapande utan namn', () => {
      // Arrange & Act
      const orgResult = Organization.create({
        name: '',
        ownerId: new UniqueId()
      });
      
      // Assert
      expect(orgResult.isErr()).toBe(true);
      expect(orgResult.error).toContain('namn');
    });
    
    test('ska säkerställa att ägaren är medlem med OWNER-roll', () => {
      // Arrange
      const ownerId = new UniqueId();
      
      // Act
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      // Assert
      expect(orgResult.isOk()).toBe(true);
      
      if (orgResult.isOk()) {
        const org = orgResult.value;
        const ownerMember = org.members.find(m => 
          m.userId.equals(ownerId) && m.role === OrganizationRole.OWNER
        );
        
        expect(ownerMember).toBeDefined();
      }
    });
    
    test('ska hantera dubblettmedlemmar korrekt', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      const userId = new UniqueId();
      const member = new OrganizationMember({
        userId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      // Act
      const addResult = org.addMember(member);
      expect(addResult.isOk()).toBe(true);
      
      // Försök lägga till samma medlem igen
      const secondAddResult = org.addMember(member);
      
      // Assert
      expect(secondAddResult.isErr()).toBe(true);
      expect(secondAddResult.error).toContain('redan medlem');
    });
  });

  describe('Medlemshantering', () => {
    test('ska lägga till medlemmar och publicera OrganizationMemberJoinedEvent', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      const userId = new UniqueId();
      const member = new OrganizationMember({
        userId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act
      const addResult = org.addMember(member);
      
      // Assert
      expect(addResult.isOk()).toBe(true);
      
      // Kontrollera att medlemmen lades till
      const addedMember = org.members.find(m => m.userId.equals(userId));
      expect(addedMember).toBeDefined();
      expect(addedMember?.role).toBe(OrganizationRole.MEMBER);
      
      // Kontrollera event
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event).toBeInstanceOf(OrganizationMemberJoinedEvent);
      
      const joinedEvent = event as OrganizationMemberJoinedEvent;
      expect(joinedEvent.userId.toString()).toBe(userId.toString());
      expect(joinedEvent.role).toBe(OrganizationRole.MEMBER);
    });
    
    test('ska ta bort medlemmar och publicera OrganizationMemberLeftEvent', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      const userId = new UniqueId();
      const member = new OrganizationMember({
        userId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      const addResult = org.addMember(member);
      expect(addResult.isOk()).toBe(true);
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act
      const removeResult = org.removeMember(userId);
      
      // Assert
      expect(removeResult.isOk()).toBe(true);
      
      // Kontrollera att medlemmen togs bort
      const removedMember = org.members.find(m => m.userId.equals(userId));
      expect(removedMember).toBeUndefined();
      
      // Kontrollera event
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event).toBeInstanceOf(OrganizationMemberLeftEvent);
      
      const leftEvent = event as OrganizationMemberLeftEvent;
      expect(leftEvent.userId.toString()).toBe(userId.toString());
    });
    
    test('ska inte tillåta borttagning av ägare', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      // Act
      const removeResult = org.removeMember(ownerId);
      
      // Assert
      expect(removeResult.isErr()).toBe(true);
      expect(removeResult.error).toContain('ägaren');
      
      // Kontrollera att ägaren fortfarande är medlem
      const ownerMember = org.members.find(m => m.userId.equals(ownerId));
      expect(ownerMember).toBeDefined();
      
      // Kontrollera att inga events publicerades
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(0);
    });
    
    test('ska uppdatera medlemsroll och publicera OrganizationMemberRoleChangedEvent', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      const userId = new UniqueId();
      const member = new OrganizationMember({
        userId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      const addResult = org.addMember(member);
      expect(addResult.isOk()).toBe(true);
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act
      const updateResult = org.updateMemberRole(userId, OrganizationRole.ADMIN);
      
      // Assert
      expect(updateResult.isOk()).toBe(true);
      
      // Kontrollera att medlemsrollen uppdaterades
      const updatedMember = org.members.find(m => m.userId.equals(userId));
      expect(updatedMember).toBeDefined();
      expect(updatedMember?.role).toBe(OrganizationRole.ADMIN);
      
      // Kontrollera event
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event).toBeInstanceOf(OrganizationMemberRoleChangedEvent);
      
      const roleChangedEvent = event as OrganizationMemberRoleChangedEvent;
      expect(roleChangedEvent.userId.toString()).toBe(userId.toString());
      expect(roleChangedEvent.oldRole).toBe(OrganizationRole.MEMBER);
      expect(roleChangedEvent.newRole).toBe(OrganizationRole.ADMIN);
    });
    
    test('ska inte tillåta uppdatering av ägarrollen', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      // Act
      const updateResult = org.updateMemberRole(ownerId, OrganizationRole.ADMIN);
      
      // Assert
      expect(updateResult.isErr()).toBe(true);
      expect(updateResult.error).toContain('ägaren');
      
      // Kontrollera att inga events publicerades
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(0);
    });
  });
  
  describe('Teamhantering', () => {
    test('ska lägga till team och publicera TeamAddedToOrganizationEvent', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      const teamId = new UniqueId();
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act
      const addResult = org.addTeam(teamId);
      
      // Assert
      expect(addResult.isOk()).toBe(true);
      
      // Kontrollera att teamet lades till
      expect(org.teamIds).toContainEqual(teamId);
      
      // Kontrollera event
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event).toBeInstanceOf(TeamAddedToOrganizationEvent);
      
      const addedEvent = event as TeamAddedToOrganizationEvent;
      expect(addedEvent.teamId.toString()).toBe(teamId.toString());
    });
    
    test('ska ta bort team och publicera TeamRemovedFromOrganizationEvent', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      const teamId = new UniqueId();
      
      const addResult = org.addTeam(teamId);
      expect(addResult.isOk()).toBe(true);
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act
      const removeResult = org.removeTeam(teamId);
      
      // Assert
      expect(removeResult.isOk()).toBe(true);
      
      // Kontrollera att teamet togs bort
      expect(org.teamIds).not.toContainEqual(teamId);
      
      // Kontrollera event
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event).toBeInstanceOf(TeamRemovedFromOrganizationEvent);
      
      const removedEvent = event as TeamRemovedFromOrganizationEvent;
      expect(removedEvent.teamId.toString()).toBe(teamId.toString());
    });
    
    test('ska inte tillåta duplicerade team', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      const teamId = new UniqueId();
      
      const addResult = org.addTeam(teamId);
      expect(addResult.isOk()).toBe(true);
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act
      const secondAddResult = org.addTeam(teamId);
      
      // Assert
      expect(secondAddResult.isErr()).toBe(true);
      expect(secondAddResult.error).toContain('redan kopplat');
      
      // Kontrollera att inga events publicerades
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBe(0);
    });
  });
  
  describe('Organisationsinställningar', () => {
    test('ska uppdatera organisationsinställningar', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      mockDomainEvents.clearEvents(); // Rensa tidigare events
      
      // Act
      const updateResult = org.update({
        name: 'Updated Organization',
        settings: {
          maxMembers: 10,
          maxTeams: 5
        }
      });
      
      // Assert
      expect(updateResult.isOk()).toBe(true);
      
      // Kontrollera att namnet uppdaterades
      expect(org.name).toBe('Updated Organization');
      
      // Kontrollera att inställningarna uppdaterades
      expect(org.settings.maxMembers).toBe(10);
      expect(org.settings.maxTeams).toBe(5);
      
      // Kontrollera event
      const events = mockDomainEvents.getEvents();
      expect(events.length).toBeGreaterThan(0);
    });
    
    test('ska validera namn vid uppdatering', () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      // Act
      const updateResult = org.update({
        name: 'A'  // För kort namn
      });
      
      // Assert
      expect(updateResult.isErr()).toBe(true);
      expect(updateResult.error).toContain('namn');
      
      // Kontrollera att namnet inte uppdaterades
      expect(org.name).toBe('Test Organization');
    });
  });
  
  describe('Resursbegränsningar', () => {
    test('ska hantera resursbegränsningar vid medlemsläggning', async () => {
      // Arrange
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      // Sätt upp limit-strategifactory mock
      const mockLimitStrategyFactory = {
        getTeamMemberStrategy: jest.fn().mockReturnValue({
          isActionAllowed: jest.fn().mockResolvedValue({
            allowed: false,
            reason: 'Medlemsgräns överskriden',
            limit: 3,
            currentUsage: 3,
            usagePercentage: 100
          })
        })
      };
      
      org.setLimitStrategyFactory(mockLimitStrategyFactory as any);
      
      const userId = new UniqueId();
      const member = new OrganizationMember({
        userId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      // Act
      const canAddResult = await org.canAddMoreMembers();
      
      // Assert
      expect(canAddResult.isErr()).toBe(true);
      expect(canAddResult.error).toContain('Medlemsgräns');
    });
  });
});

describe('Organization - Inbjudningar', () => {
  // Testdata
  const ownerId = new UniqueId();
  const userId = new UniqueId();
  const validOrgData = {
    name: 'Test Organisation',
    ownerId: ownerId.toString()
  };
  
  // Hjälpvariabler för test
  let organization: Organization;
  
  beforeEach(() => {
    // Återställ domänhändelser före varje test
    DomainEventTestHelper.clearEvents();
    
    // Skapa en organisation för testerna
    const orgResult = Organization.create(validOrgData);
    expect(orgResult.isOk()).toBe(true);
    organization = orgResult.value;
  });
  
  describe('inviteUser', () => {
    it('ska lägga till en giltig inbjudan', () => {
      // Arrangera
      const email = 'test@exempel.se';
      
      // Agera
      const result = organization.inviteUser(userId, email, ownerId);
      
      // Kontrollera
      expect(result.isOk()).toBe(true);
      
      // Kontrollera att inbjudan har lagts till
      const invitations = organization.getPendingInvitations();
      expect(invitations.length).toBe(1);
      expect(invitations[0].userId.equals(userId)).toBe(true);
      expect(invitations[0].email).toBe(email);
      expect(invitations[0].isPending()).toBe(true);
      
      // Kontrollera att korrekt domänhändelse utlöstes med den nya hjälpmetoden
      DomainEventTestHelper.expectEventDispatched(OrganizationMemberInvitedEvent, {
        organizationId: organization.id,
        userId: userId,
        invitedBy: ownerId
      });
    });
    
    it('ska hindra dubbla inbjudningar till samma användare', () => {
      // Arrangera
      const email = 'test@exempel.se';
      const firstInvite = organization.inviteUser(userId, email, ownerId);
      expect(firstInvite.isOk()).toBe(true);
      
      // Återställ händelser
      DomainEventTestHelper.clearEvents();
      
      // Agera
      const result = organization.inviteUser(userId, email, ownerId);
      
      // Kontrollera
      expect(result.isErr()).toBe(true);
      
      // Kontrollera att ingen ny inbjudan lades till
      const invitations = organization.getPendingInvitations();
      expect(invitations.length).toBe(1);
      
      // Kontrollera att ingen händelse utlöstes
      DomainEventTestHelper.expectEventCount(OrganizationMemberInvitedEvent, 0);
    });
    
    it('ska hindra inbjudan av befintliga medlemmar', () => {
      // Arrangera - skapa en medlem och lägg till direkt i organisationen
      const memberResult = OrganizationMember.create({
        userId: userId.toString(),
        role: OrganizationRole.MEMBER
      });
      expect(memberResult.isOk()).toBe(true);
      
      const addMemberResult = organization.addMember(memberResult.value);
      expect(addMemberResult.isOk()).toBe(true);
      
      DomainEventTestHelper.clearEvents();
      
      // Agera
      const result = organization.inviteUser(userId, 'test@exempel.se', ownerId);
      
      // Kontrollera
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('redan medlem');
      
      // Kontrollera att ingen händelse utlöstes
      DomainEventTestHelper.expectEventNotDispatched(OrganizationMemberInvitedEvent);
    });
  });
  
  describe('acceptInvitation', () => {
    it('ska acceptera en giltig inbjudan och lägga till användaren som medlem', () => {
      // Arrangera
      const email = 'test@exempel.se';
      const inviteResult = organization.inviteUser(userId, email, ownerId);
      expect(inviteResult.isOk()).toBe(true);
      
      const invitations = organization.getPendingInvitations();
      expect(invitations.length).toBe(1);
      const invitationId = invitations[0].id;
      
      DomainEventTestHelper.clearEvents();
      
      // Agera
      const result = organization.acceptInvitation(invitationId, userId);
      
      // Kontrollera
      expect(result.isOk()).toBe(true);
      
      // Kontrollera att användaren har lagts till som medlem
      const members = organization.members;
      expect(members.length).toBe(2); // Ägaren + den nya medlemmen
      
      const newMember = members.find(m => m.userId.equals(userId));
      expect(newMember).toBeDefined();
      expect(newMember?.role).toBe(OrganizationRole.MEMBER);
      
      // Kontrollera att inbjudan har accepterats
      const pendingInvitations = organization.getPendingInvitations();
      expect(pendingInvitations.length).toBe(0);
      
      // Kontrollera att korrekta domänhändelser utlöstes
      DomainEventTestHelper.expectEventDispatched(OrganizationInvitationAcceptedEvent, {
        invitationId: invitationId
      });
    });
    
    it('ska förhindra accepterande av en utgången inbjudan', () => {
      // Arrangera - skapa en utgången inbjudan
      const email = 'test@exempel.se';
      
      // Skapa inbjudan manuellt med utgånget datum
      const createInvitationResult = OrganizationInvitation.create({
        organizationId: organization.id.toString(),
        userId: userId.toString(),
        invitedBy: ownerId.toString(),
        email: email,
        expiresAt: new Date(Date.now() - 1000) // 1 sekund i det förflutna
      });
      
      expect(createInvitationResult.isOk()).toBe(true);
      const invitation = createInvitationResult.value;
      
      // Lägg till inbjudan direkt i organisationen via en reflektion av privat metod
      (organization as any).props.invitations = [invitation];
      
      DomainEventTestHelper.clearEvents();
      
      // Agera
      const result = organization.acceptInvitation(invitation.id, userId);
      
      // Kontrollera
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('löpt ut');
      
      // Kontrollera att användaren inte har lagts till
      const members = organization.members;
      expect(members.length).toBe(1); // Bara ägaren
      
      // Kontrollera att ingen händelse utlöstes
      DomainEventTestHelper.expectEventNotDispatched(OrganizationInvitationAcceptedEvent);
    });
  });
  
  describe('declineInvitation', () => {
    it('ska avböja en giltig inbjudan', () => {
      // Arrangera
      const email = 'test@exempel.se';
      const inviteResult = organization.inviteUser(userId, email, ownerId);
      expect(inviteResult.isOk()).toBe(true);
      
      const invitations = organization.getPendingInvitations();
      expect(invitations.length).toBe(1);
      const invitationId = invitations[0].id;
      
      DomainEventTestHelper.clearEvents();
      
      // Agera
      const result = organization.declineInvitation(invitationId, userId);
      
      // Kontrollera
      expect(result.isOk()).toBe(true);
      
      // Kontrollera att inbjudan har avböjts
      const pendingInvitations = organization.getPendingInvitations();
      expect(pendingInvitations.length).toBe(0);
      
      // Kontrollera att användaren inte har lagts till som medlem
      const members = organization.members;
      expect(members.length).toBe(1); // Bara ägaren
      
      // Kontrollera att korrekt domänhändelse utlöstes
      DomainEventTestHelper.expectEventDispatched(OrganizationInvitationDeclinedEvent, {
        invitationId: invitationId,
        userId: userId
      });
    });
    
    it('ska förhindra avböjande av en inbjudan för fel användare', () => {
      // Arrangera
      const email = 'test@exempel.se';
      const inviteResult = organization.inviteUser(userId, email, ownerId);
      expect(inviteResult.isOk()).toBe(true);
      
      const invitations = organization.getPendingInvitations();
      const invitationId = invitations[0].id;
      
      const wrongUserId = new UniqueId(); // Annan användare
      
      DomainEventTestHelper.clearEvents();
      
      // Agera
      const result = organization.declineInvitation(invitationId, wrongUserId);
      
      // Kontrollera
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('matchar inte');
      
      // Kontrollera att inbjudan är kvar
      const pendingInvitations = organization.getPendingInvitations();
      expect(pendingInvitations.length).toBe(1);
      
      // Kontrollera att ingen händelse utlöstes
      DomainEventTestHelper.expectEventNotDispatched(OrganizationInvitationDeclinedEvent);
    });
  });
}); 