import { UniqueId } from '../../core/UniqueId';
import { SubscriptionAdapter } from '../adapters/SubscriptionAdapter';
import { BaseResourceLimitStrategy, LimitCheckResult } from './ResourceLimitStrategy';

/**
 * Strategi för att kontrollera begränsningar för antal team.
 */
export class TeamLimitStrategy extends BaseResourceLimitStrategy {
  constructor(subscriptionAdapter: SubscriptionAdapter) {
    // Använd "teams" som nyckel i prenumerationsbegränsningar
    // Fallback till 1 team för Basic-planen om inget annat anges
    super(subscriptionAdapter, 'teams', 1);
  }

  /**
   * Kontrollerar om fler team kan skapas i en organisation.
   * 
   * @param organizationId - ID för den aktuella organisationen
   * @param currentCount - Nuvarande antal team
   * @param addCount - Antal team som försöker läggas till
   * @returns Promise med resultat om åtgärden är tillåten
   */
  async isActionAllowed(
    organizationId: UniqueId,
    currentCount: number,
    addCount: number = 1
  ): Promise<LimitCheckResult> {
    // Kontrollera först om organisationen har en aktiv prenumeration
    const hasSubscription = await this.subscriptionAdapter.hasActiveSubscription(organizationId);
    
    // Om ingen aktiv prenumeration, använd standardbegränsningar
    if (!hasSubscription) {
      const limit = this.fallbackLimit;
      const willExceedLimit = currentCount + addCount > limit;
      
      return {
        allowed: !willExceedLimit,
        reason: willExceedLimit ? 
          `Du har nått gränsen för antal team (${limit}) i Basic-planen. Uppgradera för att skapa fler.` :
          undefined,
        limit,
        currentUsage: currentCount,
        usagePercentage: Math.min(Math.round((currentCount / limit) * 100), 100)
      };
    }
    
    // Annars använd specifik metod i SubscriptionAdapter
    const canAdd = await this.subscriptionAdapter.canAddMoreTeams(
      organizationId,
      currentCount,
      addCount
    );
    
    const limit = await this.getLimit(organizationId);
    const usagePercentage = await this.getUsagePercentage(organizationId, currentCount);
    
    return {
      allowed: canAdd,
      reason: !canAdd ? 
        `Du har nått gränsen för antal team (${limit}) i din prenumerationsplan. Uppgradera för att skapa fler.` :
        undefined,
      limit,
      currentUsage: currentCount,
      usagePercentage
    };
  }
} 