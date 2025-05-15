import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Resultat från kontroll av funktionsåtkomst
 */
export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  currentUsage?: number;
}

/**
 * Service för att hantera funktionsflaggor och begränsningar
 * baserat på prenumerationsplaner
 */
export interface FeatureFlagService {
  /**
   * Kontrollerar om en funktion är aktiverad för en organisation
   * @param organizationId Organisations-ID
   * @param featureName Namn på funktionen att kontrollera
   */
  isFeatureEnabled(organizationId: UniqueId, featureName: string): Promise<Result<boolean, string>>;

  /**
   * Hämtar värdet för en funktionsflagga
   * @param organizationId Organisations-ID
   * @param featureName Namn på funktionen att hämta värde för
   * @param defaultValue Standardvärde om funktionen inte finns
   */
  getFeatureValue<T>(
    organizationId: UniqueId, 
    featureName: string, 
    defaultValue: T
  ): Promise<Result<T, string>>;

  /**
   * Kontrollerar om en specifik funktion är tillgänglig för en organisation
   * @param organizationId Organisations-ID
   * @param featureId ID för funktionen att kontrollera
   */
  checkFeatureAccess(
    organizationId: string, 
    featureId: string
  ): Promise<FeatureAccessResult>;

  /**
   * Kontrollerar om en organisation har tillräcklig kvot kvar för en resurs
   * @param organizationId Organisations-ID
   * @param metricName Namn på resursmått
   * @param requestedAmount Begärd mängd
   */
  checkUsageLimit(
    organizationId: string, 
    metricName: string, 
    requestedAmount: number
  ): Promise<FeatureAccessResult>;

  /**
   * Uppdaterar användningsstatistik för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param metricName - Namnet på resursmåttet (t.ex. "teamMembers", "mediaStorage")
   * @param newValue - Nytt värde för resursmåttet
   * @returns Promise som löses när uppdateringen är klar
   */
  updateUsage(
    organizationId: string,
    metricName: string, 
    newValue: number
  ): Promise<void>;
  
  /**
   * Hämtar lista av alla funktioner tillgängliga för en organisation
   * baserat på deras prenumerationsplan.
   * 
   * @param organizationId - ID för organisationen
   * @returns Promise med lista av tillgängliga funktions-ID:n
   */
  getAvailableFeatures(
    organizationId: string
  ): Promise<string[]>;
  
  /**
   * Hämtar begränsningar för en organisation baserat på 
   * deras prenumerationsplan.
   * 
   * @param organizationId - ID för organisationen
   * @returns Promise med objekt innehållande begränsningar
   */
  getSubscriptionLimits(
    organizationId: string
  ): Promise<Record<string, number>>;
} 