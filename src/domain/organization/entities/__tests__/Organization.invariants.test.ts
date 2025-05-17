import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '../Organization';
import { OrganizationMember } from '../../value-objects/OrganizationMember';
import { OrganizationRole } from '../../value-objects/OrganizationRole';
import { createAggregateTestHelper } from '@/test-utils/AggregateTestHelper';
import { OrganizationUpdatedEvent } from '../../events/OrganizationUpdatedEvent';
import { OrganizationMemberJoinedEvent } from '../../events/OrganizationMemberJoinedEvent';
import { OrganizationMemberLeftEvent } from '../../events/OrganizationMemberLeftEvent';
import { getEventData } from '@/test-utils/helpers/eventDataAdapter';

describe('Organization Invariants och Event-publicering', () => {
  let organization: Organization;
  let ownerId: UniqueId;
  let testHelper: ReturnType<typeof createAggregateTestHelper<Organization>>;
  
  beforeEach(async () => {
    // Skapa en unik ID för ägaren
    ownerId = new UniqueId('test-owner-id');
    
    // Skapa en organisation
    const organizationResult = await Organization.create({
      name: 'Test Organization',
      ownerId: ownerId,
      settings: {
        maxMembers: 10 // Sätt maxMembers här i konstruktorn
      }
    });
    
    if (organizationResult.isErr()) {
      throw new Error(`Kunde inte skapa organisation: ${organizationResult.error}`);
    }
    
    organization = organizationResult.value;
    
    // Kontrollera att ägaren faktiskt har lagts till som medlem
    const ownerMember = organization.members.find(m => m.userId.equals(ownerId));
    expect(ownerMember).toBeDefined();
    expect(ownerMember?.role).toBe(OrganizationRole.OWNER);
    
    // Skapa testHelper med organisationen
    testHelper = createAggregateTestHelper(organization);
  });
  
  describe('Operativa invarianter', () => {
    it('ska validera att organisationen måste ha ett namn', async () => {
      // Skapa en organisation utan namn ska misslyckas
      const organizationResult = await Organization.create({
        name: '',
        ownerId
      });
      
      expect(organizationResult.isErr()).toBe(true);
      expect(organizationResult.error).toContain('namn');
    });
    
    it('ska validera att organisationen måste ha en ägare', async () => {
      // Skapa en organisation utan ägare ska misslyckas
      const organizationResult = await Organization.create({
        name: 'Test Organization',
        ownerId: null as any
      });
      
      expect(organizationResult.isErr()).toBe(true);
      expect(organizationResult.error).toContain('gare');
    });
    
    it('ska validera att ägaren är medlem med OWNER-roll', () => {
      // Ta bort alla medlemmar och testa att invarianten upptäcks
      (organization as any).props.members = [];
      
      // Kör metod som validerar invarianter
      const validateResult = (organization as any).validateInvariants();
      
      expect(validateResult.isErr()).toBe(true);
      expect(validateResult.error).toContain('gare');
    });
    
    it('ska validera medlemsgränser vid addMember', async () => {
      // Uppdatera settings med updateSettings istället för att direkt ändra fields
      const updateResult = await organization.updateSettings({
        maxMembers: 2 // Ägaren och en extra medlem
      });
      expect(updateResult.isOk()).toBe(true);
      
      // Lägg till en medlem (nu 2 totalt med ägaren)
      const memberId1 = new UniqueId();
      const member1 = new OrganizationMember({
        userId: memberId1,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      const addResult1 = organization.addMember(member1);
      expect(addResult1.isOk()).toBe(true);
      
      // Försök lägga till ytterligare en medlem (överskrider gränsen)
      const memberId2 = new UniqueId();
      const member2 = new OrganizationMember({
        userId: memberId2,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      const addResult2 = organization.addMember(member2);
      expect(addResult2.isErr()).toBe(true);
      expect(addResult2.error).toContain('medlemsgr');
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
      
      // Lägg till första medlemmen (ska lyckas)
      const addResult1 = organization.addMember(member1);
      expect(addResult1.isOk()).toBe(true);
      
      // Försök lägga till andra medlemmen med samma ID (ska misslyckas)
      const addResult2 = organization.addMember(member2);
      expect(addResult2.isErr()).toBe(true);
      expect(addResult2.error).toContain('redan medlem');
    });
  });
  
  describe('Event-publicering vid operationer', () => {
    it('ska publicera OrganizationUpdatedEvent vid uppdatering', () => {
      testHelper.executeAndExpectEvents(
        o => {
          o.update({
            name: 'Updated Name',
            description: 'Updated description'
          });
        },
        [OrganizationUpdatedEvent],
        events => {
          const event = events[0] as OrganizationUpdatedEvent;
          // Använd getEventData istället för direct payload access
          expect(getEventData(event, 'name')).toBe('Updated Name');
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
        o => {
          o.addMember(member);
        },
        [OrganizationMemberJoinedEvent],
        events => {
          const event = events[0] as OrganizationMemberJoinedEvent;
          // Använd getEventData istället för direct payload access
          expect(getEventData(event, 'userId')).toBe(memberId.toString());
          expect(getEventData(event, 'role')).toBe(OrganizationRole.MEMBER);
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
        o => {
          o.removeMember(memberId);
        },
        [OrganizationMemberLeftEvent],
        events => {
          const event = events[0] as OrganizationMemberLeftEvent;
          // Använd getEventData istället för direct payload access
          expect(getEventData(event, 'userId')).toBe(memberId.toString());
        }
      );
    });
    
    it('ska validera invarianter efter varje operation', () => {
      // Skapa en spy-funktion på validateInvariants-metoden
      const validateSpy = jest.spyOn(
        organization as any, 
        'validateInvariants'
      );
      
      // Uppdatera organisationen
      organization.update({
        name: 'Updated Organization Name'
      });
      
      // Kontrollera att validateInvariants anropades
      expect(validateSpy).toHaveBeenCalled();
      
      // Återställ spionen
      validateSpy.mockRestore();
    });
    
    it('ska förhindra operationer som skulle bryta invarianter', () => {
      // Försök att ta bort ägaren från organisationen
      const result = organization.removeMember(ownerId);
      
      // Detta bör misslyckas med ett felmeddelande
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('gare');
    });
  });
}); 