import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { Subscription } from '../entities/Subscription';

/**
 * Resultat från en funktions- eller begränsningskontroll
 */
export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  currentUsage?: number;
}

/**
 * Gränssnitt för service som hanterar åtkomst till funktioner baserat 
 * på prenumerationsplan.
 */
export interface FeatureFlagService {
  /**
   * Kontrollerar om en specifik funktion är tillgänglig för en
   * organisation baserat på deras prenumerationsplan.
   * 
   * @param organizationId - ID för organisationen
   * @param featureId - ID för funktionen att kontrollera
   * @returns Promise med resultat av kontrollen
   */
  checkFeatureAccess(
    organizationId: string,
    featureId: string
  ): Promise<FeatureAccessResult>;
  
  /**
   * Kontrollerar om en organisation har tillräcklig kvot kvar
   * för att använda en viss mängd av en resurs.
   * 
   * @param organizationId - ID för organisationen
   * @param metricName - Namnet på resursmåttet (t.ex. "teamMembers", "mediaStorage")
   * @param requestedAmount - Begärd mängd att kontrollera
   * @returns Promise med resultat av kontrollen
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