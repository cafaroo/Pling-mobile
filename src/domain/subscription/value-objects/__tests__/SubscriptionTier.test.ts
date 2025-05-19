/**
 * Test för SubscriptionTier värde-objekt
 */

import { SubscriptionTier, SubscriptionTierEnum, parseSubscriptionTier, isFeatureAvailableForTier } from '../SubscriptionTier';
import { expectValueObjectToEqual, compareValueObject, assertValueObjectType } from '@/test-utils/helpers/valueObjectTestHelper';

describe('SubscriptionTier value object', () => {
  describe('creation', () => {
    it('ska skapa ett giltigt SubscriptionTier-objekt', () => {
      // Act
      const result = SubscriptionTier.create('pro');
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const tier = result.value;
        expect(tier.value).toBe('pro');
      }
    });
    
    it('ska normalisera värden vid skapande', () => {
      // Act
      const result = SubscriptionTier.create('PRO');
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const tier = result.value;
        expect(tier.value).toBe('pro');
      }
    });
    
    it('ska returnera fel för ogiltiga nivåer', () => {
      // Act
      const result = SubscriptionTier.create('invalid-tier');
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('inte en giltig prenumerationsnivå');
    });
  });
  
  describe('statiska konstanter', () => {
    it('ska tillhandahålla korrekt statiska nivåvärden', () => {
      // Act & Assert
      expectValueObjectToEqual(SubscriptionTier.BASIC, 'basic');
      expectValueObjectToEqual(SubscriptionTier.PRO, 'pro');
      expectValueObjectToEqual(SubscriptionTier.ENTERPRISE, 'enterprise');
    });
  });
  
  describe('testhjälpare', () => {
    it('ska kunna använda expectValueObjectToEqual för assertion', () => {
      // Arrange
      const result = SubscriptionTier.create('pro');
      expect(result.isOk()).toBe(true);
      const tier = result.value;
      
      // Act & Assert
      expectValueObjectToEqual(tier, 'pro');
    });
    
    it('ska kunna jämföra med compareValueObject', () => {
      // Arrange
      const tier = SubscriptionTier.PRO;
      
      // Act & Assert
      expect(compareValueObject(tier, 'pro')).toBe(true);
      expect(compareValueObject(tier, 'basic')).toBe(false);
    });
    
    it('ska kunna validera typ med assertValueObjectType', () => {
      // Arrange
      const tier = SubscriptionTier.PRO;
      
      // Act & Assert
      expect(() => assertValueObjectType(tier, SubscriptionTier)).not.toThrow();
      expect(() => assertValueObjectType('not-a-tier', SubscriptionTier)).toThrow();
    });
  });
  
  describe('equals och equalsValue', () => {
    it('ska jämföra korrekt med equals-metoden', () => {
      // Arrange
      const tier1 = SubscriptionTier.PRO;
      const tier2 = SubscriptionTier.PRO;
      const tier3 = SubscriptionTier.BASIC;
      
      // Act & Assert
      expect(tier1.equals(tier2)).toBe(true);
      expect(tier1.equals(tier3)).toBe(false);
    });
    
    it('ska jämföra strängar med equalsValue-metoden', () => {
      // Arrange
      const tier = SubscriptionTier.PRO;
      
      // Act & Assert
      expect(tier.equalsValue('pro')).toBe(true);
      expect(tier.equalsValue('PRO')).toBe(true); // Normaliserar till lowercase
      expect(tier.equalsValue('basic')).toBe(false);
    });
    
    it('ska jämföra andra SubscriptionTier med equalsValue-metoden', () => {
      // Arrange
      const tier1 = SubscriptionTier.PRO;
      const tier2 = SubscriptionTier.PRO;
      const tier3 = SubscriptionTier.BASIC;
      
      // Act & Assert
      expect(tier1.equalsValue(tier2)).toBe(true);
      expect(tier1.equalsValue(tier3)).toBe(false);
    });
  });
  
  describe('isEqualOrHigherThan', () => {
    it('ska korrekt jämföra nivåhierarkier', () => {
      // Arrange
      const basic = SubscriptionTier.BASIC;
      const pro = SubscriptionTier.PRO;
      const enterprise = SubscriptionTier.ENTERPRISE;
      
      // Act & Assert
      // Same tier
      expect(basic.isEqualOrHigherThan(basic)).toBe(true);
      expect(pro.isEqualOrHigherThan(pro)).toBe(true);
      expect(enterprise.isEqualOrHigherThan(enterprise)).toBe(true);
      
      // Higher tier
      expect(pro.isEqualOrHigherThan(basic)).toBe(true);
      expect(enterprise.isEqualOrHigherThan(basic)).toBe(true);
      expect(enterprise.isEqualOrHigherThan(pro)).toBe(true);
      
      // Lower tier
      expect(basic.isEqualOrHigherThan(pro)).toBe(false);
      expect(basic.isEqualOrHigherThan(enterprise)).toBe(false);
      expect(pro.isEqualOrHigherThan(enterprise)).toBe(false);
    });
  });
  
  describe('getDisplayName', () => {
    it('ska returnera korrekt displayName för nivån', () => {
      // Act & Assert
      expect(SubscriptionTier.BASIC.getDisplayName()).toBe('Basic');
      expect(SubscriptionTier.PRO.getDisplayName()).toBe('Pro');
      expect(SubscriptionTier.ENTERPRISE.getDisplayName()).toBe('Enterprise');
    });
  });
  
  describe('toString och getValue', () => {
    it('ska returnera korrekt strängrepresentation via toString', () => {
      // Arrange
      const tier = SubscriptionTier.PRO;
      
      // Act & Assert
      expect(tier.toString()).toBe('pro');
    });
    
    it('ska returnera korrekt värde via value', () => {
      // Arrange
      const tier = SubscriptionTier.PRO;
      
      // Act & Assert
      expect(tier.value).toBe('pro');
    });
  });
  
  describe('toPlanTier', () => {
    it('ska konvertera till PlanTier-typ korrekt', () => {
      // Arrange
      const tier = SubscriptionTier.PRO;
      
      // Act
      const planTier = tier.toPlanTier();
      
      // Assert
      expect(planTier).toBe('pro');
    });
  });
  
  describe('parseSubscriptionTier', () => {
    it('ska korrekt parsa en sträng till SubscriptionTier', () => {
      // Act
      const result = parseSubscriptionTier('pro');
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        expectValueObjectToEqual(result.value, 'pro');
      }
    });
    
    it('ska hantera ogiltiga strängar', () => {
      // Act
      const result = parseSubscriptionTier('invalid-tier');
      
      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ogiltig prenumerationsnivå');
    });
    
    it('ska returnera samma objekt om redan SubscriptionTier', () => {
      // Arrange
      const originalTier = SubscriptionTier.PRO;
      
      // Act
      const result = parseSubscriptionTier(originalTier);
      
      // Assert
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        expect(result.value).toBe(originalTier); // Samma instans
      }
    });
  });
  
  describe('isFeatureAvailableForTier', () => {
    it('ska returnera true för feature med samma tier', () => {
      // Act & Assert
      expect(isFeatureAvailableForTier('basic', 'basic')).toBe(true);
      expect(isFeatureAvailableForTier('pro', 'pro')).toBe(true);
      expect(isFeatureAvailableForTier('enterprise', 'enterprise')).toBe(true);
    });
    
    it('ska returnera true för feature med lägre tier', () => {
      // Act & Assert
      expect(isFeatureAvailableForTier('basic', 'pro')).toBe(true);
      expect(isFeatureAvailableForTier('basic', 'enterprise')).toBe(true);
      expect(isFeatureAvailableForTier('pro', 'enterprise')).toBe(true);
    });
    
    it('ska returnera false för feature med högre tier', () => {
      // Act & Assert
      expect(isFeatureAvailableForTier('pro', 'basic')).toBe(false);
      expect(isFeatureAvailableForTier('enterprise', 'basic')).toBe(false);
      expect(isFeatureAvailableForTier('enterprise', 'pro')).toBe(false);
    });
    
    it('ska fungera med strängvärden och objekt blandat', () => {
      // Arrange
      const proPlan = SubscriptionTier.PRO;
      
      // Act & Assert
      expect(isFeatureAvailableForTier('basic', proPlan)).toBe(true);
      expect(isFeatureAvailableForTier(SubscriptionTier.BASIC, 'pro')).toBe(true);
      expect(isFeatureAvailableForTier(SubscriptionTier.ENTERPRISE, proPlan)).toBe(false);
    });
    
    it('ska returnera false för ogiltiga värden', () => {
      // Act & Assert
      expect(isFeatureAvailableForTier('invalid', 'pro')).toBe(false);
      expect(isFeatureAvailableForTier('basic', 'invalid')).toBe(false);
    });
  });
  
  describe('bakåtkompatibilitet', () => {
    it('ska tillhandahålla PlanTier exportering för bakåtkompatibilitet', () => {
      // Act & Assert
      expect(SubscriptionTierEnum.BASIC).toBe('basic');
      expect(SubscriptionTierEnum.PRO).toBe('pro');
      expect(SubscriptionTierEnum.ENTERPRISE).toBe('enterprise');
    });
  });
}); 