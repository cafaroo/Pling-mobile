import { Organization } from '../Organization';
import { OrganizationMember } from '../../value-objects/OrganizationMember';
import { OrganizationRole } from '../../value-objects/OrganizationRole';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationCreatedEvent } from '../../events/OrganizationCreatedEvent';
import { OrganizationMemberJoinedEvent } from '../../events/OrganizationMemberJoinedEvent';
import { getEventData } from '@/test-utils/helpers/eventDataAdapter';

describe('Organization Aggregatroot Event Tests', () => {
  describe('Organization creation', () => {
    it('ska publicera OrganizationCreatedEvent vid skapande', () => {
      // Arrange
      const ownerId = new UniqueId();
      const name = 'Test Organization';

      // Act
      const organizationResult = Organization.create({
        name,
        ownerId
      });

      // Assert
      expect(organizationResult.isOk()).toBe(true);
      
      const organization = organizationResult.value;
      const domainEvents = organization.domainEvents;
      
      expect(domainEvents.length).toBe(1);
      expect(domainEvents[0]).toBeInstanceOf(OrganizationCreatedEvent);
      
      const event = domainEvents[0] as OrganizationCreatedEvent;
      expect(event.aggregateId).toBe(organization.id.toString());
      expect(getEventData(event, 'ownerId')).toBe(ownerId.toString());
      expect(getEventData(event, 'name')).toBe(name);
    });
    
    it('ska inte kunna skapa en organisation utan namn', () => {
      // Arrange
      const ownerId = new UniqueId();
      
      // Act
      const organizationResult = Organization.create({
        name: '',
        ownerId
      });
      
      // Assert
      expect(organizationResult.isErr()).toBe(true);
      expect(organizationResult.error).toContain('Organisationsnamn får inte vara tomt');
    });
  });
  
  describe('Member operations', () => {
    it('ska publicera OrganizationMemberJoinedEvent när en medlem läggs till', () => {
      // Arrange
      const ownerId = new UniqueId();
      const name = 'Test Organization';
      const organizationResult = Organization.create({
        name,
        ownerId
      });
      expect(organizationResult.isOk()).toBe(true);
      
      const organization = organizationResult.value;
      // Rensa events från skapandet
      organization.clearEvents();
      
      const newMemberId = new UniqueId();
      const newMember = new OrganizationMember({
        userId: newMemberId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      
      // Act
      const result = organization.addMember(newMember);
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      const domainEvents = organization.domainEvents;
      expect(domainEvents.length).toBe(1);
      expect(domainEvents[0]).toBeInstanceOf(OrganizationMemberJoinedEvent);
      
      const event = domainEvents[0] as OrganizationMemberJoinedEvent;
      expect(event.aggregateId).toBe(organization.id.toString());
      expect(getEventData(event, 'userId')).toBe(newMemberId.toString());
      
      // Hantera både strängvärde och OrganizationRole-objekt
      const roleValue = getEventData(event, 'role');
      if (typeof roleValue === 'string') {
        expect(roleValue.toLowerCase()).toBe(OrganizationRole.MEMBER.toString().toLowerCase());
      } else if (roleValue && typeof roleValue === 'object') {
        // Om det är ett OrganizationRole-objekt, jämför med equals eller toString
        if (typeof roleValue.equals === 'function') {
          expect(roleValue.equals(OrganizationRole.MEMBER)).toBe(true);
        } else {
          expect(roleValue.toString().toLowerCase()).toBe(OrganizationRole.MEMBER.toString().toLowerCase());
        }
      }
    });
    
    it('ska inte tillåta att lägga till en medlem som redan finns', () => {
      // Arrange
      const ownerId = new UniqueId();
      const name = 'Test Organization';
      const organizationResult = Organization.create({
        name,
        ownerId
      });
      expect(organizationResult.isOk()).toBe(true);
      
      const organization = organizationResult.value;
      
      // Försök lägga till samma medlem igen
      const ownerMember = new OrganizationMember({
        userId: ownerId,
        role: OrganizationRole.MEMBER, // Anmärkningsvärt annan roll än OWNER
        joinedAt: new Date()
      });
      
      // Act
      const result = organization.addMember(ownerMember);
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Användaren är redan medlem');
    });
  });
  
  describe('Invariant validation', () => {
    it('ska validera att ägaren är medlem med rätt roll', () => {
      // Detta testas indirekt genom create-metoden
      // eftersom validateInvariants körs inom create
      
      // Men vi kan använda reflection för att testa privat metod
      // Detta är en teknik som kan användas för testbarhet
      
      // Arrange: Skapa en organisation med valid state
      const ownerId = new UniqueId();
      const organizationResult = Organization.create({
        name: 'Test Organization',
        ownerId
      });
      expect(organizationResult.isOk()).toBe(true);
      const organization = organizationResult.value;
      
      // Förstör den interna invarianten: ta bort ägaren som medlem
      // @ts-ignore - Åtkomst till privat egenskap för testning
      organization.props.members = organization.props.members.filter(
        m => !m.userId.equals(ownerId)
      );
      
      // Act: Anropa validateInvariants via reflection
      // @ts-ignore - Åtkomst till privat metod för testning
      const result = organization.validateInvariants();
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ägaren måste vara medlem i organisationen med OWNER-roll');
    });
  });
}); 