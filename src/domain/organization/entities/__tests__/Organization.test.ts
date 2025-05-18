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
import { MockDomainEvents } from '@/test-utils/mocks/mockDomainEvents';
import { OrgSettings } from '../../value-objects/OrgSettings';
import { OrganizationMember } from '../../value-objects/OrganizationMember';

describe('Organization Aggregate', () => {
  // Setup
  beforeEach(() => {
    MockDomainEvents.clearEvents();
  });

  afterEach(() => {
    MockDomainEvents.clearEvents();
  });

  describe('Skapande av Organization', () => {
    test('ska skapa en giltig organisation', () => {
      // Arrange
      const ownerId = new UniqueId();
      const name = 'Test Organization';
      
      // Rensa events innan test
      MockDomainEvents.clearEvents();
      
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
      
      // Rensa events innan test
      MockDomainEvents.clearEvents();
      
      // Act
      const orgResult = Organization.create({
        name,
        ownerId
      });
      
      // Assert
      expect(orgResult.isOk()).toBe(true);
      
      const events = MockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event.constructor.name).toBe('OrganizationCreatedEvent');
      
      // Kontrollera att name-egenskapen är tillgänglig på något av de förväntade ställena
      const eventData = event.payload || event;
      const eventName = eventData.name || event.name;
      expect(eventName).toBe(name);
      
      // Kontrollera ägare
      const eventOwnerId = eventData.ownerId || event.ownerId;
      expect(eventOwnerId.toString()).toBe(ownerId.toString());
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
      // Skapa manuellt en OrganizationMember först
      const memberResult = OrganizationMember.create({
        userId: userId.toString(),
        role: OrganizationRole.MEMBER,
      });
      expect(memberResult.isOk()).toBe(true);
      
      // Act
      // Lägg till medlemmen i organisationen
      const member = memberResult.value;
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
      // Skapa manuellt en OrganizationMember först
      const memberResult = OrganizationMember.create({
        userId: userId.toString(),
        role: OrganizationRole.MEMBER,
      });
      expect(memberResult.isOk()).toBe(true);
      const member = memberResult.value;
      
      // Rensa tidigare events före vi testar den faktiska operationen
      MockDomainEvents.clearEvents();
      
      // Act
      const addResult = org.addMember(member);
      
      // Assert
      expect(addResult.isOk()).toBe(true);
      
      // Kontrollera att medlemmen lades till
      const addedMember = org.members.find(m => m.userId.equals(userId));
      expect(addedMember).toBeDefined();
      expect(addedMember?.role).toBe(OrganizationRole.MEMBER);
      
      // Kontrollera event
      const events = MockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event.constructor.name).toBe('OrganizationMemberJoinedEvent');
      
      // Hämta data från eventet, oavsett struktur
      const eventData = event.payload || event;
      const eventUserId = eventData.userId || event.userId;
      expect(eventUserId.toString()).toBe(userId.toString());
      
      const eventRole = eventData.role || event.role;
      expect(eventRole).toBe(OrganizationRole.MEMBER);
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
      // Skapa manuellt en OrganizationMember först
      const memberResult = OrganizationMember.create({
        userId: userId.toString(),
        role: OrganizationRole.MEMBER,
      });
      expect(memberResult.isOk()).toBe(true);
      const member = memberResult.value;
      
      const addResult = org.addMember(member);
      expect(addResult.isOk()).toBe(true);
      
      // Rensa tidigare events före vi testar borttagningen
      MockDomainEvents.clearEvents();
      
      // Act
      const removeResult = org.removeMember(userId);
      
      // Assert
      expect(removeResult.isOk()).toBe(true);
      
      // Kontrollera att medlemmen togs bort
      const removedMember = org.members.find(m => m.userId.equals(userId));
      expect(removedMember).toBeUndefined();
      
      // Kontrollera event
      const events = MockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event.constructor.name).toBe('OrganizationMemberLeftEvent');
      
      // Hämta data från eventet, oavsett struktur
      const eventData = event.payload || event;
      const eventUserId = eventData.userId || event.userId;
      expect(eventUserId.toString()).toBe(userId.toString());
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
      
      // Rensa events
      MockDomainEvents.clearEvents();
      
      // Act
      const removeResult = org.removeMember(ownerId);
      
      // Assert
      expect(removeResult.isErr()).toBe(true);
      expect(removeResult.error).toContain('garen');
      
      // Kontrollera att ägaren fortfarande är medlem
      const ownerMember = org.members.find(m => m.userId.equals(ownerId));
      expect(ownerMember).toBeDefined();
      
      // Kontrollera att inga events publicerades
      const events = MockDomainEvents.getEvents();
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
      // Skapa manuellt en OrganizationMember först
      const memberResult = OrganizationMember.create({
        userId: userId.toString(),
        role: OrganizationRole.MEMBER,
      });
      expect(memberResult.isOk()).toBe(true);
      const member = memberResult.value;
      
      const addResult = org.addMember(member);
      expect(addResult.isOk()).toBe(true);
      
      // Rensa tidigare events före vi testar uppdateringen
      MockDomainEvents.clearEvents();
      
      // Act
      const updateResult = org.updateMemberRole(userId, OrganizationRole.ADMIN);
      
      // Assert
      expect(updateResult.isOk()).toBe(true);
      
      // Kontrollera att medlemsrollen uppdaterades
      const updatedMember = org.members.find(m => m.userId.equals(userId));
      expect(updatedMember).toBeDefined();
      expect(updatedMember?.role).toBe(OrganizationRole.ADMIN);
      
      // Kontrollera event
      const events = MockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event.constructor.name).toBe('OrganizationMemberRoleChangedEvent');
      
      // Hämta data från eventet, oavsett struktur
      const eventData = event.payload || event;
      const eventUserId = eventData.userId || event.userId;
      expect(eventUserId.toString()).toBe(userId.toString());
      
      // Verifiera gamla och nya rollen
      const oldRole = eventData.oldRole || event.oldRole;
      const newRole = eventData.newRole || event.newRole;
      expect(oldRole).toBe(OrganizationRole.MEMBER);
      expect(newRole).toBe(OrganizationRole.ADMIN);
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
      
      // Rensa events
      MockDomainEvents.clearEvents();
      
      // Act
      const updateResult = org.updateMemberRole(ownerId, OrganizationRole.ADMIN);
      
      // Assert
      expect(updateResult.isErr()).toBe(true);
      expect(updateResult.error).toContain('garen');
      
      // Kontrollera att inga events publicerades
      const events = MockDomainEvents.getEvents();
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
      
      // Rensa tidigare events innan teamet läggs till
      MockDomainEvents.clearEvents();
      
      // Act
      const addResult = org.addTeam(teamId);
      
      // Assert
      expect(addResult.isOk()).toBe(true);
      
      // Kontrollera att teamet lades till
      expect(org.teamIds).toContainEqual(teamId);
      
      // Kontrollera event
      const events = MockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event.constructor.name).toBe('TeamAddedToOrganizationEvent');
      
      // Hämta data från eventet, oavsett struktur
      const eventData = event.payload || event;
      const eventTeamId = eventData.teamId || event.teamId;
      expect(eventTeamId.toString()).toBe(teamId.toString());
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
      
      // Lägg först till teamet
      const addResult = org.addTeam(teamId);
      expect(addResult.isOk()).toBe(true);
      
      // Rensa tidigare events innan teamet tas bort
      MockDomainEvents.clearEvents();
      
      // Act
      const removeResult = org.removeTeam(teamId);
      
      // Assert
      expect(removeResult.isOk()).toBe(true);
      
      // Kontrollera att teamet togs bort
      const teams = org.getTeams();
      expect(teams.find(t => t.equals(teamId))).toBeUndefined();
      
      // Kontrollera event
      const events = MockDomainEvents.getEvents();
      expect(events.length).toBe(1);
      
      const event = events[0];
      expect(event.constructor.name).toBe('TeamRemovedFromOrganizationEvent');
      
      // Hämta data från eventet, oavsett struktur
      const eventData = event.payload || event;
      const eventTeamId = eventData.teamId || event.teamId;
      expect(eventTeamId.toString()).toBe(teamId.toString());
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
      
      // Lägg till teamet första gången
      const addResult = org.addTeam(teamId);
      expect(addResult.isOk()).toBe(true);
      
      // Rensa tidigare events innan vi testar att lägga till dubblett
      MockDomainEvents.clearEvents();
      
      // Act - lägg till samma team igen
      const secondAddResult = org.addTeam(teamId);
      
      // Assert
      expect(secondAddResult.isErr()).toBe(true);
      expect(secondAddResult.error).toContain('redan kopplat');
      
      // Kontrollera att inga events publicerades
      const events = MockDomainEvents.getEvents();
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
      
      const settings: OrgSettings = {
        name: 'New Organization Name',
        description: 'New description',
        logoUrl: 'https://example.com/logo.png',
      };
      
      // Rensa tidigare events innan uppdatering
      MockDomainEvents.clearEvents();
      
      // Act
      const updateResult = org.updateSettings(settings);
      
      // Assert
      expect(updateResult.isOk()).toBe(true);
      expect(org.name).toBe(settings.name);
      expect(org.description).toBe(settings.description);
      expect(org.logoUrl).toBe(settings.logoUrl);
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
      
      // Rensa tidigare events innan uppdatering
      MockDomainEvents.clearEvents();
      
      // Act - uppdatera med tomt namn
      const updateResult = org.updateSettings({
        name: '',
        description: 'New description',
      });
      
      // Assert
      expect(updateResult.isErr()).toBe(true);
      expect(updateResult.error).toContain('namn');
      
      // Kontrollera att organisationen inte ändrades
      expect(org.name).toBe('Test Organization');
    });
  });
  
  describe('Resursbegränsningar', () => {
    test('ska hantera resursbegränsningar vid medlemsläggning', () => {
      // Arrange - skapa en organisation med max 3 medlemmar
      const ownerId = new UniqueId();
      const orgResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      
      expect(orgResult.isOk()).toBe(true);
      const org = orgResult.value;
      
      // Skapa nya settings med maxMembers=3 och tilldela till org.settings
      const settingsProps = {
        ...org.settings.toJSON(),
        maxMembers: 3
      };
      const newSettingsResult = OrgSettings.create(settingsProps);
      expect(newSettingsResult.isOk()).toBe(true);
      org.settings = newSettingsResult.value;
      
      // Lägg till 2 medlemmar (max tillåtet)
      const memberResult1 = OrganizationMember.create({
        userId: new UniqueId().toString(),
        role: OrganizationRole.MEMBER,
      });
      expect(memberResult1.isOk()).toBe(true);
      
      const memberResult2 = OrganizationMember.create({
        userId: new UniqueId().toString(),
        role: OrganizationRole.MEMBER,
      });
      expect(memberResult2.isOk()).toBe(true);
      
      org.addMember(memberResult1.value);
      org.addMember(memberResult2.value);
      
      // Rensa händelser innan vi testar begränsningen
      MockDomainEvents.clearEvents();
      
      // Act - försök lägga till en fjärde medlem
      const memberResult3 = OrganizationMember.create({
        userId: new UniqueId().toString(),
        role: OrganizationRole.MEMBER,
      });
      expect(memberResult3.isOk()).toBe(true);
      
      const result = org.addMember(memberResult3.value);
      
      // Assert - bör misslyckas
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('maximal');
      expect(org.members.length).toBe(3); // Ägare + 2 medlemmar
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
    MockDomainEvents.clearEvents();
    
    // Skapa en organisation för testerna
    const orgResult = Organization.create(validOrgData);
    expect(orgResult.isOk()).toBe(true);
    organization = orgResult.value;
  });
  
  describe('inviteUser', () => {
    test('ska lägga till en giltig inbjudan', () => {
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
      MockDomainEvents.expectEventDispatched(OrganizationMemberInvitedEvent, {
        organizationId: organization.id,
        userId: userId,
        invitedBy: ownerId
      });
    });
    
    test('ska hindra dubbla inbjudningar till samma användare', () => {
      // Arrangera
      const email = 'test@exempel.se';
      const firstInvite = organization.inviteUser(userId, email, ownerId);
      expect(firstInvite.isOk()).toBe(true);
      
      // Återställ händelser
      MockDomainEvents.clearEvents();
      
      // Agera
      const result = organization.inviteUser(userId, email, ownerId);
      
      // Kontrollera
      expect(result.isErr()).toBe(true);
      
      // Kontrollera att ingen ny inbjudan lades till
      const invitations = organization.getPendingInvitations();
      expect(invitations.length).toBe(1);
      
      // Kontrollera att ingen händelse utlöstes
      MockDomainEvents.expectEventCount(OrganizationMemberInvitedEvent, 0);
    });
    
    test('ska hindra inbjudan av befintliga medlemmar', () => {
      // Arrangera - skapa en medlem och lägg till direkt i organisationen
      const memberResult = OrganizationMember.create({
        userId: userId.toString(),
        role: OrganizationRole.MEMBER
      });
      expect(memberResult.isOk()).toBe(true);
      
      const addMemberResult = organization.addMember(memberResult.value);
      expect(addMemberResult.isOk()).toBe(true);
      
      MockDomainEvents.clearEvents();
      
      // Agera
      const result = organization.inviteUser(userId, 'test@exempel.se', ownerId);
      
      // Kontrollera
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('redan medlem');
      
      // Kontrollera att ingen händelse utlöstes
      MockDomainEvents.expectEventNotDispatched(OrganizationMemberInvitedEvent);
    });
  });
  
  describe('acceptInvitation', () => {
    test('ska acceptera en giltig inbjudan och lägga till användaren som medlem', () => {
      // Arrangera
      const email = 'test@exempel.se';
      const inviteResult = organization.inviteUser(userId, email, ownerId);
      expect(inviteResult.isOk()).toBe(true);
      
      const invitations = organization.getPendingInvitations();
      expect(invitations.length).toBe(1);
      const invitationId = invitations[0].id;
      
      MockDomainEvents.clearEvents();
      
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
      MockDomainEvents.expectEventDispatched(OrganizationInvitationAcceptedEvent, {
        invitationId: invitationId
      });
    });
    
    test('ska förhindra accepterande av en utgången inbjudan', () => {
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
      
      MockDomainEvents.clearEvents();
      
      // Agera
      const result = organization.acceptInvitation(invitation.id, userId);
      
      // Kontrollera
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('löpt ut');
      
      // Kontrollera att användaren inte har lagts till
      const members = organization.members;
      expect(members.length).toBe(1); // Bara ägaren
      
      // Kontrollera att ingen händelse utlöstes
      MockDomainEvents.expectEventNotDispatched(OrganizationInvitationAcceptedEvent);
    });
  });
  
  describe('declineInvitation', () => {
    test('ska avböja en giltig inbjudan', () => {
      // Arrangera
      const email = 'test@exempel.se';
      const inviteResult = organization.inviteUser(userId, email, ownerId);
      expect(inviteResult.isOk()).toBe(true);
      
      const invitations = organization.getPendingInvitations();
      expect(invitations.length).toBe(1);
      const invitationId = invitations[0].id;
      
      MockDomainEvents.clearEvents();
      
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
      MockDomainEvents.expectEventDispatched(OrganizationInvitationDeclinedEvent, {
        invitationId: invitationId,
        userId: userId
      });
    });
    
    test('ska förhindra avböjande av en inbjudan för fel användare', () => {
      // Arrangera
      const email = 'test@exempel.se';
      const inviteResult = organization.inviteUser(userId, email, ownerId);
      expect(inviteResult.isOk()).toBe(true);
      
      const invitations = organization.getPendingInvitations();
      const invitationId = invitations[0].id;
      
      const wrongUserId = new UniqueId(); // Annan användare
      
      MockDomainEvents.clearEvents();
      
      // Agera
      const result = organization.declineInvitation(invitationId, wrongUserId);
      
      // Kontrollera
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('matchar inte');
      
      // Kontrollera att inbjudan är kvar
      const pendingInvitations = organization.getPendingInvitations();
      expect(pendingInvitations.length).toBe(1);
      
      // Kontrollera att ingen händelse utlöstes
      MockDomainEvents.expectEventNotDispatched(OrganizationInvitationDeclinedEvent);
    });
  });
}); 