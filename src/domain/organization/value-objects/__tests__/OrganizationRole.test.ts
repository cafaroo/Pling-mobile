/**
 * Test för OrganizationRole värde-objekt
 * Använder standardiserade ValueObjectTestHelper för att testa värde-objekt
 */

import { OrganizationRole, OrganizationRoleEnum } from '../OrganizationRole';
import { expectValueObjectToEqual, compareValueObject, areEquivalentValueObjects } from '@/test-utils/helpers/valueObjectTestHelper';

describe('OrganizationRole value object', () => {
  describe('creation', () => {
    it('ska skapa ett giltigt OrganizationRole-objekt', () => {
      // Act
      const result = OrganizationRole.create('admin');
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const role = result.value;
        expect(role.value).toBe('admin');
      }
    });
    
    it('ska normalisera värden vid skapande', () => {
      // Act
      const result = OrganizationRole.create('ADMIN');
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const role = result.value;
        expect(role.value).toBe('admin');
      }
    });
    
    it('ska returnera fel för ogiltiga roller', () => {
      // Act
      const result = OrganizationRole.create('invalid-role');
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('inte en giltig organisationsroll');
    });
  });
  
  describe('standardiserade hjälpfunktioner', () => {
    it('ska kunna jämföras med expectValueObjectToEqual', () => {
      // Arrange
      const role = OrganizationRole.ADMIN;
      
      // Act & Assert
      expectValueObjectToEqual(role, 'admin');
    });
    
    it('ska kunna jämföras med compareValueObject', () => {
      // Arrange
      const role = OrganizationRole.MEMBER;
      
      // Act & Assert
      expect(compareValueObject(role, 'member')).toBe(true);
      expect(compareValueObject(role, 'admin')).toBe(false);
    });
    
    it('ska kunna jämföra två värde-objekt med areEquivalentValueObjects', () => {
      // Arrange
      const role1 = OrganizationRole.OWNER;
      const role2 = OrganizationRole.OWNER;
      const role3 = OrganizationRole.ADMIN;
      
      // Act & Assert
      expect(areEquivalentValueObjects(role1, role2)).toBe(true);
      expect(areEquivalentValueObjects(role1, role3)).toBe(false);
    });
  });
  
  describe('toString och getValue', () => {
    it('ska returnera korrekt strängrepresentation via toString', () => {
      // Arrange
      const role = OrganizationRole.ADMIN;
      
      // Act & Assert
      expect(role.toString()).toBe('admin');
    });
    
    it('ska returnera korrekt värde via value', () => {
      // Arrange
      const role = OrganizationRole.ADMIN;
      
      // Act & Assert
      expect(role.value).toBe('admin');
    });
  });
  
  describe('equals och equalsValue', () => {
    it('ska korrekt jämföra med equals-metoden', () => {
      // Arrange
      const role1 = OrganizationRole.ADMIN;
      const role2 = OrganizationRole.ADMIN;
      const role3 = OrganizationRole.MEMBER;
      
      // Act & Assert
      expect(role1.equals(role2)).toBe(true);
      expect(role1.equals(role3)).toBe(false);
    });
    
    it('ska korrekt jämföra strängar med equalsValue-metoden', () => {
      // Arrange
      const role = OrganizationRole.ADMIN;
      
      // Act & Assert
      expect(role.equalsValue('admin')).toBe(true);
      expect(role.equalsValue('ADMIN')).toBe(true); // Normaliserar till lowercase
      expect(role.equalsValue('member')).toBe(false);
    });
    
    it('ska korrekt jämföra värde-objekt med equalsValue-metoden', () => {
      // Arrange
      const role1 = OrganizationRole.ADMIN;
      const role2 = OrganizationRole.ADMIN;
      const role3 = OrganizationRole.MEMBER;
      
      // Act & Assert
      expect(role1.equalsValue(role2)).toBe(true);
      expect(role1.equalsValue(role3)).toBe(false);
    });
  });
  
  describe('behörighetshantering', () => {
    it('ska korrekt hantera behörighetsjämförelser', () => {
      // Arrange
      const owner = OrganizationRole.OWNER;
      const admin = OrganizationRole.ADMIN;
      const member = OrganizationRole.MEMBER;
      
      // Act & Assert
      expect(owner.hasAtLeastSamePermissionAs(admin)).toBe(true);
      expect(owner.hasAtLeastSamePermissionAs(member)).toBe(true);
      
      expect(admin.hasAtLeastSamePermissionAs(member)).toBe(true);
      expect(admin.hasAtLeastSamePermissionAs(owner)).toBe(false);
      
      expect(member.hasAtLeastSamePermissionAs(admin)).toBe(false);
      expect(member.hasAtLeastSamePermissionAs(owner)).toBe(false);
    });
  });
  
  describe('statiska instanser', () => {
    it('ska tillhandahålla korrekt statiska roller', () => {
      // Act & Assert
      expectValueObjectToEqual(OrganizationRole.OWNER, 'owner');
      expectValueObjectToEqual(OrganizationRole.ADMIN, 'admin');
      expectValueObjectToEqual(OrganizationRole.MEMBER, 'member');
      expectValueObjectToEqual(OrganizationRole.INVITED, 'invited');
    });
  });
}); 