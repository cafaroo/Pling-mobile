import { UniqueId } from '../../core/UniqueId';
import { SubscriptionAdapter } from '../adapters/SubscriptionAdapter';

/**
 * Interface för strategier som kontrollerar resursbegränsningar.
 * 
 * Strategier implementerar logik för att avgöra om åtgärder är tillåtna
 * baserat på prenumerationsbegränsningar.
 */
export interface ResourceLimitStrategy {
  /**
   * Kontrollerar om åtgärden är tillåten baserat på resursbegränsningar.
   * 
   * @param organizationId - ID för den aktuella organisationen
   * @param currentCount - Nuvarande antal av resursen
   * @param addCount - Antal resurser som försöker läggas till
   * @returns Promise med resultat om åtgärden är tillåten
   */
  isActionAllowed(
    organizationId: UniqueId,
    currentCount: number,
    addCount?: number
  ): Promise<LimitCheckResult>;

  /**
   * Hämtar begränsning för resursen baserat på prenumerationsplan.
   * 
   * @param organizationId - ID för den aktuella organisationen
   * @returns Promise med resursbegränsning
   */
  getLimit(organizationId: UniqueId): Promise<number>;

  /**
   * Hämtar användningsprocent för resursen.
   * 
   * @param organizationId - ID för den aktuella organisationen
   * @param currentCount - Nuvarande antal av resursen
   * @returns Promise med procentandel av begränsningen som används
   */
  getUsagePercentage(
    organizationId: UniqueId,
    currentCount: number
  ): Promise<number>;
}

/**
 * Resultat från kontroll av resursbegränsning.
 */
export interface LimitCheckResult {
  /** Om åtgärden är tillåten */
  allowed: boolean;
  
  /** Anledning till varför åtgärden inte är tillåten, om applicable */
  reason?: string;
  
  /** Ytterligare information om begränsningen */
  limit?: number;
  
  /** Nuvarande användning */
  currentUsage?: number;
  
  /** Användningsprocent */
  usagePercentage?: number;
}

/**
 * Abstrakta basimplementation av ResourceLimitStrategy för att dela kod
 * mellan specifika strategier.
 */
export abstract class BaseResourceLimitStrategy implements ResourceLimitStrategy {
  constructor(
    protected subscriptionAdapter: SubscriptionAdapter,
    protected limitKey: string,
    protected fallbackLimit: number
  ) {}

  /**
   * Implementeras av subklasser för att kontrollera specifika begränsningar.
   */
  abstract isActionAllowed(
    organizationId: UniqueId,
    currentCount: number,
    addCount?: number
  ): Promise<LimitCheckResult>;

  /**
   * Hämtar begränsning för resursen baserat på prenumerationsplan.
   */
  async getLimit(organizationId: UniqueId): Promise<number> {
    try {
      const limits = await this.subscriptionAdapter.getSubscriptionLimits(organizationId);
      return limits[this.limitKey] || this.fallbackLimit;
    } catch (error) {
      console.error(`Fel vid hämtning av begränsning (${this.limitKey}):`, error);
      return this.fallbackLimit;
    }
  }

  /**
   * Hämtar användningsprocent för resursen.
   */
  async getUsagePercentage(
    organizationId: UniqueId,
    currentCount: number
  ): Promise<number> {
    const limit = await this.getLimit(organizationId);
    if (limit <= 0) return 100; // Undviker division med noll
    
    const percentage = Math.min(Math.round((currentCount / limit) * 100), 100);
    return percentage;
  }
}

/**
 * Typer av organisationsresurser som kan begränsas.
 */
export enum ResourceType {
  GOAL = 'goal',
  COMPETITION = 'competition',
  DASHBOARD = 'dashboard',
  REPORT = 'report',
  MEDIA = 'media'
}

/**
 * Svenska etiketter för resurstyper.
 */
export const ResourceTypeLabels: Record<ResourceType, string> = {
  [ResourceType.GOAL]: 'mål',
  [ResourceType.COMPETITION]: 'tävling',
  [ResourceType.DASHBOARD]: 'dashboard',
  [ResourceType.REPORT]: 'rapport',
  [ResourceType.MEDIA]: 'mediefil'
};

/**
 * Strategi för att kontrollera begränsningar för organisationsresurser.
 */
export class OrganizationResourceLimitStrategy extends BaseResourceLimitStrategy {
  constructor(
    subscriptionAdapter: SubscriptionAdapter,
    private resourceType: ResourceType,
    fallbackLimit: number = 5
  ) {
    // Använd resurstypens namn som nyckel i prenumerationsbegränsningar
    super(subscriptionAdapter, `resources_${resourceType}`, fallbackLimit);
  }

  /**
   * Kontrollerar om fler resurser av specificerad typ kan skapas i en organisation.
   * 
   * @param organizationId - ID för den aktuella organisationen
   * @param currentCount - Nuvarande antal resurser av denna typ
   * @param addCount - Antal resurser som försöker läggas till
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
    const resourceLabel = ResourceTypeLabels[this.resourceType];
    
    // Om ingen aktiv prenumeration, använd standardbegränsningar
    if (!hasSubscription) {
      const limit = this.fallbackLimit;
      const willExceedLimit = currentCount + addCount > limit;
      
      return {
        allowed: !willExceedLimit,
        reason: willExceedLimit ? 
          `Du har nått gränsen för antal ${resourceLabel}er (${limit}) i Basic-planen. Uppgradera för att skapa fler.` :
          undefined,
        limit,
        currentUsage: currentCount,
        usagePercentage: Math.min(Math.round((currentCount / limit) * 100), 100)
      };
    }
    
    // Annars använd generell metod i SubscriptionAdapter
    const canAdd = await this.subscriptionAdapter.canAddMoreResources(
      organizationId,
      this.resourceType,
      currentCount,
      addCount
    );
    
    const limit = await this.getLimit(organizationId);
    const usagePercentage = await this.getUsagePercentage(organizationId, currentCount);
    
    return {
      allowed: canAdd,
      reason: !canAdd ? 
        `Du har nått gränsen för antal ${resourceLabel}er (${limit}) i din prenumerationsplan. Uppgradera för att skapa fler.` :
        undefined,
      limit,
      currentUsage: currentCount,
      usagePercentage
    };
  }
} 