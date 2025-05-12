import { UniqueId } from '../../core/UniqueId';
import { SubscriptionAdapter } from '../adapters/SubscriptionAdapter';
import { BaseResourceLimitStrategy, LimitCheckResult, ResourceType, ResourceTypeLabels } from './ResourceLimitStrategy';

/**
 * Strategi för att hantera begränsningar av antalet mål en organisation kan ha.
 */
export class GoalLimitStrategy extends BaseResourceLimitStrategy {
  constructor(subscriptionAdapter: SubscriptionAdapter, fallbackLimit: number = 5) {
    super(subscriptionAdapter, 'goals', fallbackLimit);
  }

  /**
   * Kontrollerar om fler mål kan skapas i en organisation.
   * 
   * @param organizationId - ID för den aktuella organisationen
   * @param currentCount - Nuvarande antal mål
   * @param addCount - Antal mål som försöker läggas till
   * @returns Promise med resultat om åtgärden är tillåten
   */
  async isActionAllowed(
    organizationId: UniqueId,
    currentCount: number,
    addCount: number = 1
  ): Promise<LimitCheckResult> {
    // Kontrollera först om organisationen har en aktiv prenumeration
    const hasSubscription = await this.subscriptionAdapter.hasActiveSubscription(organizationId);
    
    // Hämta svenskt namn för resurstypen för felmeddelanden
    const resourceLabel = ResourceTypeLabels[ResourceType.GOAL];
    
    // Om ingen aktiv prenumeration, använd standardbegränsningar
    if (!hasSubscription) {
      const limit = this.fallbackLimit;
      const willExceedLimit = currentCount + addCount > limit;
      
      return {
        allowed: !willExceedLimit,
        reason: willExceedLimit ? 
          `Du har nått gränsen för antal ${resourceLabel} (${limit}) i Basic-planen. Uppgradera för att skapa fler.` :
          undefined,
        limit,
        currentUsage: currentCount,
        usagePercentage: Math.min(Math.round((currentCount / limit) * 100), 100)
      };
    }
    
    // Annars använd generell metod i SubscriptionAdapter
    const canAdd = await this.subscriptionAdapter.canAddMoreResources(
      organizationId,
      ResourceType.GOAL,
      currentCount,
      addCount
    );
    
    const limit = await this.getLimit(organizationId);
    const usagePercentage = await this.getUsagePercentage(organizationId, currentCount);
    
    return {
      allowed: canAdd,
      reason: !canAdd ? 
        `Du har nått gränsen för antal ${resourceLabel} (${limit}) i din prenumerationsplan. Uppgradera för att skapa fler.` :
        undefined,
      limit,
      currentUsage: currentCount,
      usagePercentage
    };
  }
} 