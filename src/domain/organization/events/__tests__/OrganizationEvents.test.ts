import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../../value-objects/OrganizationRole';
import { 
  MemberInvitedToOrganization,
  OrganizationInvitationAccepted,
  OrganizationInvitationDeclined
} from '../OrganizationEvents';

describe('Organization Invitation Events', () => {
  // Testdata
  const organizationId = new UniqueId();
  const userId = new UniqueId();
  const invitedBy = new UniqueId();
  const invitationId = new UniqueId();
  
  describe('MemberInvitedToOrganization', () => {
    it('ska skapa en giltig MemberInvitedToOrganization händelse', () => {
      // Arrangera och agera
      const event = new MemberInvitedToOrganization(
        organizationId,
        userId,
        invitedBy
      );
      
      // Kontrollera
      // Kontrollera publika egenskaper istället för name
      expect(event).toBeInstanceOf(MemberInvitedToOrganization);
      expect(event.organizationId).toEqual(organizationId);
      expect(event.userId).toEqual(userId);
      expect(event.invitedBy).toEqual(invitedBy);
    });
  });
  
  describe('OrganizationInvitationAccepted', () => {
    it('ska skapa en giltig OrganizationInvitationAccepted händelse', () => {
      // Arrangera och agera
      const event = new OrganizationInvitationAccepted(
        organizationId,
        invitationId,
        userId
      );
      
      // Kontrollera
      // Kontrollera publika egenskaper istället för name
      expect(event).toBeInstanceOf(OrganizationInvitationAccepted);
      expect(event.organizationId).toEqual(organizationId);
      expect(event.invitationId).toEqual(invitationId);
      expect(event.userId).toEqual(userId);
    });
  });
  
  describe('OrganizationInvitationDeclined', () => {
    it('ska skapa en giltig OrganizationInvitationDeclined händelse', () => {
      // Arrangera och agera
      const event = new OrganizationInvitationDeclined(
        organizationId,
        invitationId,
        userId
      );
      
      // Kontrollera
      // Kontrollera publika egenskaper istället för name
      expect(event).toBeInstanceOf(OrganizationInvitationDeclined);
      expect(event.organizationId).toEqual(organizationId);
      expect(event.invitationId).toEqual(invitationId);
      expect(event.userId).toEqual(userId);
    });
  });
}); 