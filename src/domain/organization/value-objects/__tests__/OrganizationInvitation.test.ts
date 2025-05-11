import { OrganizationInvitation } from '../OrganizationInvitation';
import { UniqueId } from '@/shared/core/UniqueId';

describe('OrganizationInvitation', () => {
  // Testdata
  const validProps = {
    organizationId: new UniqueId(),
    userId: new UniqueId(),
    invitedBy: new UniqueId(),
    email: 'test@exempel.se',
    createdAt: new Date()
  };

  describe('create', () => {
    it('ska skapa en giltig inbjudan', () => {
      const result = OrganizationInvitation.create(validProps);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const invitation = result.value;
        expect(invitation.organizationId).toEqual(validProps.organizationId);
        expect(invitation.userId).toEqual(validProps.userId);
        expect(invitation.invitedBy).toEqual(validProps.invitedBy);
        expect(invitation.email).toBe(validProps.email);
        expect(invitation.status).toBe('pending');
        expect(invitation.expiresAt).toBeDefined();
        expect(invitation.isPending()).toBe(true);
      }
    });

    it('ska returnera fel vid ogiltig e-postadress', () => {
      const invalidProps = {
        ...validProps,
        email: 'invalid-email'
      };
      
      const result = OrganizationInvitation.create(invalidProps);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Ogiltig e-postadress');
      }
    });
  });

  describe('status metoder', () => {
    it('ska korrekt identifiera status', () => {
      const pendingResult = OrganizationInvitation.create(validProps);
      expect(pendingResult.isOk()).toBe(true);
      
      if (pendingResult.isOk()) {
        const pending = pendingResult.value;
        expect(pending.isPending()).toBe(true);
        expect(pending.isAccepted()).toBe(false);
        expect(pending.isDeclined()).toBe(false);
        expect(pending.isExpired()).toBe(false);
      }
    });

    it('ska identifiera utgångna inbjudningar', () => {
      const expiredProps = {
        ...validProps,
        expiresAt: new Date(Date.now() - 1000) // 1 sekund i det förflutna
      };
      
      const expiredResult = OrganizationInvitation.create(expiredProps);
      expect(expiredResult.isOk()).toBe(true);
      
      if (expiredResult.isOk()) {
        const expired = expiredResult.value;
        expect(expired.isExpired()).toBe(true);
      }
    });
  });

  describe('acceptera inbjudan', () => {
    it('ska ändra status till accepterad', () => {
      const invitationResult = OrganizationInvitation.create(validProps);
      expect(invitationResult.isOk()).toBe(true);
      
      if (invitationResult.isOk()) {
        const invitation = invitationResult.value;
        const acceptResult = invitation.accept();
        
        expect(acceptResult.isOk()).toBe(true);
        
        if (acceptResult.isOk()) {
          const accepted = acceptResult.value;
          expect(accepted.status).toBe('accepted');
          expect(accepted.isAccepted()).toBe(true);
          expect(accepted.respondedAt).toBeDefined();
        }
      }
    });

    it('ska inte kunna acceptera en utgången inbjudan', () => {
      const expiredProps = {
        ...validProps,
        expiresAt: new Date(Date.now() - 1000) // 1 sekund i det förflutna
      };
      
      const expiredResult = OrganizationInvitation.create(expiredProps);
      expect(expiredResult.isOk()).toBe(true);
      
      if (expiredResult.isOk()) {
        const expired = expiredResult.value;
        const acceptResult = expired.accept();
        
        expect(acceptResult.isErr()).toBe(true);
        if (acceptResult.isErr()) {
          expect(acceptResult.error).toContain('löpt ut');
        }
      }
    });
  });

  describe('avböja inbjudan', () => {
    it('ska ändra status till avböjd', () => {
      const invitationResult = OrganizationInvitation.create(validProps);
      expect(invitationResult.isOk()).toBe(true);
      
      if (invitationResult.isOk()) {
        const invitation = invitationResult.value;
        const declineResult = invitation.decline();
        
        expect(declineResult.isOk()).toBe(true);
        
        if (declineResult.isOk()) {
          const declined = declineResult.value;
          expect(declined.status).toBe('declined');
          expect(declined.isDeclined()).toBe(true);
          expect(declined.respondedAt).toBeDefined();
        }
      }
    });

    it('ska inte kunna avböja en utgången inbjudan', () => {
      const expiredProps = {
        ...validProps,
        expiresAt: new Date(Date.now() - 1000) // 1 sekund i det förflutna
      };
      
      const expiredResult = OrganizationInvitation.create(expiredProps);
      expect(expiredResult.isOk()).toBe(true);
      
      if (expiredResult.isOk()) {
        const expired = expiredResult.value;
        const declineResult = expired.decline();
        
        expect(declineResult.isErr()).toBe(true);
        if (declineResult.isErr()) {
          expect(declineResult.error).toContain('löpt ut');
        }
      }
    });
  });

  describe('utgå inbjudan', () => {
    it('ska markera en väntande inbjudan som utgången', () => {
      const invitationResult = OrganizationInvitation.create(validProps);
      expect(invitationResult.isOk()).toBe(true);
      
      if (invitationResult.isOk()) {
        const invitation = invitationResult.value;
        const expireResult = invitation.expire();
        
        expect(expireResult.isOk()).toBe(true);
        
        if (expireResult.isOk()) {
          const expired = expireResult.value;
          expect(expired.status).toBe('expired');
          expect(expired.isExpired()).toBe(true);
        }
      }
    });

    it('ska inte kunna markera en accepterad inbjudan som utgången', () => {
      const invitationResult = OrganizationInvitation.create(validProps);
      expect(invitationResult.isOk()).toBe(true);
      
      if (invitationResult.isOk()) {
        const invitation = invitationResult.value;
        const acceptResult = invitation.accept();
        
        expect(acceptResult.isOk()).toBe(true);
        
        if (acceptResult.isOk()) {
          const accepted = acceptResult.value;
          const expireResult = accepted.expire();
          
          expect(expireResult.isErr()).toBe(true);
          if (expireResult.isErr()) {
            expect(expireResult.error).toContain('väntande');
          }
        }
      }
    });
  });
}); 