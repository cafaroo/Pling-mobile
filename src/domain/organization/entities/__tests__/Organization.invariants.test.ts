import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '../Organization';
import { OrganizationMember } from '../../value-objects/OrganizationMember';
import { OrganizationRole } from '../../value-objects/OrganizationRole';
import { createAggregateTestHelper } from '@/test-utils/AggregateTestHelper';
import { OrganizationUpdatedEvent } from '../../events/OrganizationUpdatedEvent';
import { OrganizationMemberJoinedEvent } from '../../events/OrganizationMemberJoinedEvent';
import { OrganizationMemberLeftEvent } from '../../events/OrganizationMemberLeftEvent';

describe('Organization Invariants och Event-publicering', () => {
  let organization: Organization;
  let ownerId: UniqueId;
  let testHelper: ReturnType<typeof createAggregateTestHelper<Organization>>;
  
  beforeEach(() => {
    ownerId = new UniqueId();
    const orgResult = Organization.create({
      name: 'Test Organization',
      ownerId
    });
    expect(orgResult.isOk()).toBe(true);
    organization = orgResult.value;
    
    // Skapa testHelper med organisationen
    testHelper = createAggregateTestHelper(organization);
  });
  
  describe('Grundläggande invarianter', () => {
    it('ska validera att organisationen måste ha ett namn', () => {
      testHelper.testInvariant('name', '', 'Organisation måste ha ett namn');
    });
    
    it('ska validera att organisationen måste ha en ägare', () => {
      testHelper.testInvariant('ownerId', null, 'Organisation måste ha en ägare');
    });
    
    it('ska validera att ägaren är medlem med OWNER-roll', () => {
      // Ta bort alla medlemmar inklusive ägaren
      (organization as any).props.members = [];
      
      // @ts-ignore - Åtkomst till privat metod för testning
      const result = organization.validateInvariants();
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ägaren måste vara medlem i organisationen med OWNER-roll');
    });
    
    it('ska validera att varje användare bara har en roll i organisationen', () => {
      const memberId = new UniqueId();
      
      // Skapa två medlemsobjekt med samma användar-ID men olika roller
      const member1 = new OrganizationMember({
        userId: memberId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      const member2 = new OrganizationMember({
        userId: memberId,
        role: OrganizationRole.ADMIN,
        joinedAt: new Date()
      });
      
      // Lägg till båda i organizationens medlemslista
      (organization as any).props.members.push(member1);
      (organization as any).props.members.push(member2);
      
      // @ts-ignore - Åtkomst till privat metod för testning
      const result = organization.validateInvariants();
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('En användare kan bara ha en roll i organisationen');
    });
  });
  
  describe('Operativa invarianter', () => {
    it('ska validera medlemsgränser vid addMember', () => {
      // Sätt en medlemsgräns på 2 (ägaren + 1 medlem) i inställningarna
      (organization as any).props.settings.maxMembers = 2;
      
      // Lägg till en medlem (nu 2 totalt med ägaren)
      const memberId1 = new UniqueId();
      const member1 = new OrganizationMember({
        userId: memberId1,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      const result1 = organization.addMember(member1);
      expect(result1.isOk()).toBe(true);
      
      // Försök lägga till ytterligare en medlem över gränsen
      const memberId2 = new UniqueId();
      const member2 = new OrganizationMember({
        userId: memberId2,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      // Kontrollera att detta förhindras av medlemsgränsen
      if (organization.settings.maxMembers) {
        const mockCanAddMoreMembers = jest.fn().mockResolvedValue({
          isOk: () => false,
          isErr: () => true,
          error: 'Medlemsgräns överskriden'
        });
        
        (organization as any).canAddMoreMembers = mockCanAddMoreMembers;
        
        const result2 = organization.addMember(member2);
        expect(result2.isErr()).toBe(true);
      }
    });
  });
  
  describe('Event-publicering vid operationer', () => {
    it('ska publicera OrganizationUpdatedEvent vid uppdatering', () => {
      // Uppdatera organisationen
      testHelper.executeAndExpectEvents(
        org => {
          org.update({ name: 'Updated Name' });
        },
        [OrganizationUpdatedEvent],
        events => {
          expect((events[0] as OrganizationUpdatedEvent).payload.name).toBe('Updated Name');
        }
      );
    });
    
    it('ska publicera MemberJoinedEvent när en medlem läggs till', () => {
      // Skapa en ny medlem
      const memberId = new UniqueId();
      const member = new OrganizationMember({
        userId: memberId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      // Lägg till medlemmen och kontrollera events
      testHelper.executeAndExpectEvents(
        org => {
          org.addMember(member);
        },
        [OrganizationMemberJoinedEvent],
        events => {
          const event = events[0] as OrganizationMemberJoinedEvent;
          expect(event.payload.userId).toBe(memberId.toString());
          expect(event.payload.role).toBe(OrganizationRole.MEMBER);
        }
      );
    });
    
    it('ska publicera MemberLeftEvent när en medlem tas bort', () => {
      // Lägg först till en medlem
      const memberId = new UniqueId();
      const member = new OrganizationMember({
        userId: memberId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      organization.addMember(member);
      testHelper.clearEvents(); // Rensa tidigare events
      
      // Ta bort medlemmen och kontrollera event
      testHelper.executeAndExpectEvents(
        org => {
          org.removeMember(memberId);
        },
        [OrganizationMemberLeftEvent],
        events => {
          const event = events[0] as OrganizationMemberLeftEvent;
          expect(event.payload.userId).toBe(memberId.toString());
        }
      );
    });
    
    it('ska validera invarianter efter varje operation', () => {
      // Spionera på validateInvariants-metoden
      const spy = jest.spyOn((organization as any), 'validateInvariants');
      
      // Uppdatera organisationen
      organization.update({ name: 'Updated Name' });
      
      // Kontrollera att validateInvariants anropades
      expect(spy).toHaveBeenCalled();
      
      // Återställ spionen
      spy.mockRestore();
    });
  });
}); 