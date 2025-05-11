import { Organization } from '../Organization';
import { OrganizationInvitation } from '../../value-objects/OrganizationInvitation';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../../value-objects/OrganizationRole';
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';
import { 
  MemberInvitedToOrganization, 
  OrganizationInvitationAccepted,
  OrganizationInvitationDeclined 
} from '../../events/OrganizationEvents';
import { OrganizationMember } from '../OrganizationMember';

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
      DomainEventTestHelper.expectEventDispatched(MemberInvitedToOrganization, {
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
      DomainEventTestHelper.expectEventCount(MemberInvitedToOrganization, 0);
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
      DomainEventTestHelper.expectEventNotDispatched(MemberInvitedToOrganization);
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
      DomainEventTestHelper.expectEventDispatched(OrganizationInvitationAccepted, {
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
      DomainEventTestHelper.expectEventNotDispatched(OrganizationInvitationAccepted);
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
      DomainEventTestHelper.expectEventDispatched(OrganizationInvitationDeclined, {
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
      DomainEventTestHelper.expectEventNotDispatched(OrganizationInvitationDeclined);
    });
  });
}); 