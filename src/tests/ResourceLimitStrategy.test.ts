import { BaseResourceLimitStrategy } from '@/domain/organization/strategies/BaseResourceLimitStrategy';
import { ResourceType } from '@/domain/organization/strategies/ResourceLimitStrategy';
import { TeamLimitStrategy } from '@/domain/organization/strategies/TeamLimitStrategy';
import { TeamMemberLimitStrategy } from '@/domain/organization/strategies/TeamMemberLimitStrategy';
import { ResourceLimitStrategyFactory } from '@/domain/organization/strategies/ResourceLimitStrategyFactory';
import { SubscriptionPlanType } from '@/components/subscription/ResourceLimitProvider';

/**
 * Test för BaseResourceLimitStrategy
 */
describe('BaseResourceLimitStrategy', () => {
  // Skapa en konkret subklass för att testa abstrakta basklassen
  class TestStrategy extends BaseResourceLimitStrategy {
    calculateLimit(planType: SubscriptionPlanType): number {
      switch (planType) {
        case 'basic':
          return 10;
        case 'pro':
          return 50;
        case 'enterprise':
          return 100;
        default:
          return 0;
      }
    }
  }

  const strategy = new TestStrategy();

  it('should correctly determine if limit is reached', () => {
    expect(strategy.isLimitReached('basic', 5)).toBe(false);
    expect(strategy.isLimitReached('basic', 10)).toBe(true);
    expect(strategy.isLimitReached('basic', 15)).toBe(true);
  });

  it('should correctly determine if usage is near limit', () => {
    expect(strategy.isNearLimit('basic', 7)).toBe(false);
    expect(strategy.isNearLimit('basic', 8)).toBe(true); // 80%
    expect(strategy.isNearLimit('basic', 9)).toBe(true);
    expect(strategy.isNearLimit('basic', 10)).toBe(false); // At limit, not near
  });

  it('should correctly calculate usage percentage', () => {
    expect(strategy.getUsagePercentage('basic', 5)).toBe(50);
    expect(strategy.getUsagePercentage('basic', 7.5)).toBe(75);
    expect(strategy.getUsagePercentage('basic', 10)).toBe(100);
    expect(strategy.getUsagePercentage('basic', 15)).toBe(150);
  });

  it('should handle zero usage', () => {
    expect(strategy.getUsagePercentage('basic', 0)).toBe(0);
    expect(strategy.isLimitReached('basic', 0)).toBe(false);
    expect(strategy.isNearLimit('basic', 0)).toBe(false);
  });

  it('should handle zero limit', () => {
    // Skapa en strategi som returnerar 0 som gräns
    class ZeroLimitStrategy extends BaseResourceLimitStrategy {
      calculateLimit(): number {
        return 0;
      }
    }
    
    const zeroStrategy = new ZeroLimitStrategy();
    
    expect(zeroStrategy.getUsagePercentage('basic', 5)).toBe(Infinity);
    expect(zeroStrategy.isLimitReached('basic', 0)).toBe(true); // 0/0 är nådd
    expect(zeroStrategy.isNearLimit('basic', 0)).toBe(false);
  });

  it('should normalize negative usage to zero', () => {
    expect(strategy.getUsagePercentage('basic', -5)).toBe(0);
    expect(strategy.isLimitReached('basic', -5)).toBe(false);
    expect(strategy.isNearLimit('basic', -5)).toBe(false);
  });
});

/**
 * Test för TeamLimitStrategy
 */
describe('TeamLimitStrategy', () => {
  const strategy = new TeamLimitStrategy();

  it('should calculate correct limit for basic plan', () => {
    expect(strategy.calculateLimit('basic')).toBe(5);
  });
  
  it('should calculate correct limit for pro plan', () => {
    expect(strategy.calculateLimit('pro')).toBe(25);
  });
  
  it('should calculate correct limit for enterprise plan', () => {
    expect(strategy.calculateLimit('enterprise')).toBe(100);
  });

  it('should correctly determine if limit is reached for each plan', () => {
    // Basic plan
    expect(strategy.isLimitReached('basic', 4)).toBe(false);
    expect(strategy.isLimitReached('basic', 5)).toBe(true);
    
    // Pro plan
    expect(strategy.isLimitReached('pro', 24)).toBe(false);
    expect(strategy.isLimitReached('pro', 25)).toBe(true);
    
    // Enterprise plan
    expect(strategy.isLimitReached('enterprise', 99)).toBe(false);
    expect(strategy.isLimitReached('enterprise', 100)).toBe(true);
  });
  
  it('should correctly determine if usage is near limit for each plan', () => {
    // Basic plan (80% av 5 = 4)
    expect(strategy.isNearLimit('basic', 3)).toBe(false);
    expect(strategy.isNearLimit('basic', 4)).toBe(true);
    
    // Pro plan (80% av 25 = 20)
    expect(strategy.isNearLimit('pro', 19)).toBe(false);
    expect(strategy.isNearLimit('pro', 20)).toBe(true);
    
    // Enterprise plan (80% av 100 = 80)
    expect(strategy.isNearLimit('enterprise', 79)).toBe(false);
    expect(strategy.isNearLimit('enterprise', 80)).toBe(true);
  });
});

/**
 * Test för TeamMemberLimitStrategy
 */
describe('TeamMemberLimitStrategy', () => {
  const strategy = new TeamMemberLimitStrategy();
  
  it('should calculate correct limit for basic plan', () => {
    expect(strategy.calculateLimit('basic')).toBe(10);
  });
  
  it('should calculate correct limit for pro plan', () => {
    expect(strategy.calculateLimit('pro')).toBe(25);
  });
  
  it('should calculate correct limit for enterprise plan', () => {
    expect(strategy.calculateLimit('enterprise')).toBe(50);
  });
  
  it('should correctly determine if limit is reached for each plan', () => {
    // Basic plan
    expect(strategy.isLimitReached('basic', 9)).toBe(false);
    expect(strategy.isLimitReached('basic', 10)).toBe(true);
    
    // Pro plan
    expect(strategy.isLimitReached('pro', 24)).toBe(false);
    expect(strategy.isLimitReached('pro', 25)).toBe(true);
    
    // Enterprise plan
    expect(strategy.isLimitReached('enterprise', 49)).toBe(false);
    expect(strategy.isLimitReached('enterprise', 50)).toBe(true);
  });
});

/**
 * Test för ResourceLimitStrategyFactory
 */
describe('ResourceLimitStrategyFactory', () => {
  const factory = new ResourceLimitStrategyFactory();
  
  it('should return appropriate strategy for each resource type', () => {
    const teamStrategy = factory.getStrategy('team' as ResourceType);
    expect(teamStrategy).toBeInstanceOf(TeamLimitStrategy);
    
    const teamMemberStrategy = factory.getStrategy('teamMember' as ResourceType);
    expect(teamMemberStrategy).toBeInstanceOf(TeamMemberLimitStrategy);
  });
  
  it('should handle unknown resource types', () => {
    // Detta test förutsätter att fabriken hanterar okända typer på ett gracefullt sätt
    expect(() => {
      factory.getStrategy('unknown' as ResourceType);
    }).not.toThrow();
  });
  
  it('should return consistent instances for the same resource type', () => {
    const firstInstance = factory.getStrategy('team' as ResourceType);
    const secondInstance = factory.getStrategy('team' as ResourceType);
    
    // Om fabriken cachelar instanser bör dessa vara samma
    expect(firstInstance).toBe(secondInstance);
  });
}); 