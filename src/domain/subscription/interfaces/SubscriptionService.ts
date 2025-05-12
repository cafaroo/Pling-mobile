import { UniqueId } from '../../core/UniqueId';

/**
 * Gränssnitt som exponeras mot Organization-domänen
 * Detta är det huvudsakliga kontraktet mellan subscription och organization
 */
export interface SubscriptionService {
  /**
   * Kontrollerar om en organisation har en aktiv prenumeration
   */
  hasActiveSubscription(organizationId: UniqueId): Promise<boolean>;
  
  /**
   * Hämtar den aktuella prenumerationsplanens namn för en organisation
   * Returnerar 'basic' om ingen prenumeration finns
   */
  getCurrentPlanName(organizationId: UniqueId): Promise<string>;
  
  /**
   * Kontrollerar om en organisation har tillgång till en specifik feature
   */
  hasFeatureAccess(organizationId: UniqueId, featureId: string): Promise<boolean>;
  
  /**
   * Kontrollerar om en organisation kan lägga till fler användare baserat på prenumerationsgränser
   */
  canAddMoreUsers(organizationId: UniqueId, currentCount: number, addCount: number): Promise<boolean>;
  
  /**
   * Kontrollerar om en organisation kan använda mer lagringsutrymme baserat på prenumerationsgränser
   */
  canUseMoreStorage(organizationId: UniqueId, currentSizeMB: number, addSizeMB: number): Promise<boolean>;
  
  /**
   * Kontrollerar om en organisation kan skapa fler dashboards baserat på prenumerationsgränser
   */
  canCreateMoreDashboards(organizationId: UniqueId, currentCount: number, addCount: number): Promise<boolean>;
  
  /**
   * Kontrollerar om en organisation kan använda API-resurser baserat på prenumerationsgränser
   */
  canUseApiResources(organizationId: UniqueId): Promise<boolean>;
  
  /**
   * Uppdaterar användningsstatistik för en organisation
   */
  updateUsageMetrics(organizationId: UniqueId, metrics: {
    teamMembers?: number;
    mediaStorage?: number;
    apiRequests?: number;
  }): Promise<void>;
  
  /**
   * Hämtar användningsprocent för olika resurser relativt till prenumerationsgränser
   */
  getUsagePercentages(organizationId: UniqueId): Promise<{
    teamMembers: number;
    mediaStorage: number;
    customDashboards?: number;
    apiRequests?: number;
  }>;
  
  /**
   * Hämtar prenumerationsstatusinformation för en organisation
   */
  getSubscriptionStatusInfo(organizationId: UniqueId): Promise<{
    status: string;
    displayName: string;
    isActive: boolean;
    daysUntilRenewal?: number;
    isInTrial?: boolean;
    daysLeftInTrial?: number;
    isCanceled?: boolean;
    cancelAtPeriodEnd?: boolean;
  } | null>;
} 