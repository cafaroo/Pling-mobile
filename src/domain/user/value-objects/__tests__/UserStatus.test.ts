/**
 * Test för UserStatus värde-objekt
 */

import { UserStatus, UserStatusEnum, parseUserStatus, isValidUserStatus, getAllUserStatuses } from '../UserStatus';
import { expectValueObjectToEqual, compareValueObject } from '@/test-utils/helpers/valueObjectTestHelper';

describe('UserStatus value object', () => {
  describe('creation', () => {
    it('ska skapa ett giltigt UserStatus-objekt', () => {
      // Act
      const result = UserStatus.create('active');
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const status = result.value;
        expect(status.value).toBe('active');
      }
    });
    
    it('ska normalisera värden vid skapande', () => {
      // Act
      const result = UserStatus.create('ACTIVE');
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const status = result.value;
        expect(status.value).toBe('active');
      }
    });
    
    it('ska returnera fel för ogiltiga statusar', () => {
      // Act
      const result = UserStatus.create('invalid-status');
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('inte en giltig användarstatus');
    });
  });
  
  describe('statiska konstanter', () => {
    it('ska tillhandahålla korrekt statiska statusvärden', () => {
      // Act & Assert
      expectValueObjectToEqual(UserStatus.PENDING, 'pending');
      expectValueObjectToEqual(UserStatus.ACTIVE, 'active');
      expectValueObjectToEqual(UserStatus.INACTIVE, 'inactive');
      expectValueObjectToEqual(UserStatus.BLOCKED, 'blocked');
    });
  });
  
  describe('testhjälpare', () => {
    it('ska kunna använda expectValueObjectToEqual för assertion', () => {
      // Arrange
      const result = UserStatus.create('active');
      expect(result.isOk()).toBe(true);
      const status = result.value;
      
      // Act & Assert
      expectValueObjectToEqual(status, 'active');
    });
    
    it('ska kunna jämföra med compareValueObject', () => {
      // Arrange
      const status = UserStatus.ACTIVE;
      
      // Act & Assert
      expect(compareValueObject(status, 'active')).toBe(true);
      expect(compareValueObject(status, 'inactive')).toBe(false);
    });
  });
  
  describe('equals och equalsValue', () => {
    it('ska jämföra korrekt med equals-metoden', () => {
      // Arrange
      const status1 = UserStatus.ACTIVE;
      const status2 = UserStatus.ACTIVE;
      const status3 = UserStatus.INACTIVE;
      
      // Act & Assert
      expect(status1.equals(status2)).toBe(true);
      expect(status1.equals(status3)).toBe(false);
    });
    
    it('ska jämföra strängar med equalsValue-metoden', () => {
      // Arrange
      const status = UserStatus.ACTIVE;
      
      // Act & Assert
      expect(status.equalsValue('active')).toBe(true);
      expect(status.equalsValue('ACTIVE')).toBe(true); // Normaliserar till lowercase
      expect(status.equalsValue('inactive')).toBe(false);
    });
    
    it('ska jämföra andra UserStatus med equalsValue-metoden', () => {
      // Arrange
      const status1 = UserStatus.ACTIVE;
      const status2 = UserStatus.ACTIVE;
      const status3 = UserStatus.INACTIVE;
      
      // Act & Assert
      expect(status1.equalsValue(status2)).toBe(true);
      expect(status1.equalsValue(status3)).toBe(false);
    });
  });
  
  describe('toString och getValue', () => {
    it('ska returnera korrekt strängrepresentation via toString', () => {
      // Arrange
      const status = UserStatus.ACTIVE;
      
      // Act & Assert
      expect(status.toString()).toBe('active');
    });
    
    it('ska returnera korrekt värde via value', () => {
      // Arrange
      const status = UserStatus.ACTIVE;
      
      // Act & Assert
      expect(status.value).toBe('active');
    });
  });
  
  describe('parseUserStatus', () => {
    it('ska korrekt parsa en sträng till UserStatus', () => {
      // Act
      const result = parseUserStatus('active');
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        expectValueObjectToEqual(result.value, 'active');
      }
    });
    
    it('ska hantera ogiltiga strängar', () => {
      // Act
      const result = parseUserStatus('invalid-status');
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ogiltig användarstatus');
    });
    
    it('ska returnera samma objekt om redan UserStatus', () => {
      // Arrange
      const originalStatus = UserStatus.ACTIVE;
      
      // Act
      const result = parseUserStatus(originalStatus);
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        expect(result.value).toBe(originalStatus); // Samma instans
      }
    });
  });
  
  describe('bakåtkompatibilitet', () => {
    it('ska kunna användas med gamla enum-värdena', () => {
      // Act & Assert - verifiera att de gamla enum-värdena fortfarande fungerar
      expect(UserStatusEnum.ACTIVE).toBe('active');
      expect(UserStatusEnum.PENDING).toBe('pending');
      expect(UserStatusEnum.INACTIVE).toBe('inactive');
      expect(UserStatusEnum.BLOCKED).toBe('blocked');
    });
    
    it('ska ha korrekta hjälpfunktioner för bakåtkompatibilitet', () => {
      // Testa isValidUserStatus
      expect(isValidUserStatus('active')).toBe(true);
      expect(isValidUserStatus('invalid')).toBe(false);
      
      // Testa getAllUserStatuses
      const statuses = getAllUserStatuses();
      expect(statuses).toContain('active');
      expect(statuses).toContain('pending');
      expect(statuses).toContain('inactive');
      expect(statuses).toContain('blocked');
    });
  });
}); 