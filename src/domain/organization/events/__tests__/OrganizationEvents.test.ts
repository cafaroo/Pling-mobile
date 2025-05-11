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
      expect(event.name).toBe('MemberInvitedToOrganization');
      expect(event.payload).toHaveProperty('organizationId', organizationId.toString());
      expect(event.payload).toHaveProperty('userId', userId.toString());
      expect(event.payload).toHaveProperty('invitedBy', invitedBy.toString());
      expect(event.payload).toHaveProperty('timestamp');
      
      // Kontrollera publika egenskaper
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
      expect(event.name).toBe('OrganizationInvitationAccepted');
      expect(event.payload).toHaveProperty('organizationId', organizationId.toString());
      expect(event.payload).toHaveProperty('invitationId', invitationId.toString());
      expect(event.payload).toHaveProperty('userId', userId.toString());
      expect(event.payload).toHaveProperty('timestamp');
      
      // Kontrollera publika egenskaper
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
      expect(event.name).toBe('OrganizationInvitationDeclined');
      expect(event.payload).toHaveProperty('organizationId', organizationId.toString());
      expect(event.payload).toHaveProperty('invitationId', invitationId.toString());
      expect(event.payload).toHaveProperty('userId', userId.toString());
      expect(event.payload).toHaveProperty('timestamp');
      
      // Kontrollera publika egenskaper
      expect(event.organizationId).toEqual(organizationId);
      expect(event.invitationId).toEqual(invitationId);
      expect(event.userId).toEqual(userId);
    });
  });
}); 