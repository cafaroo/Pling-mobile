/**
 * Hjälpfunktioner för felhantering inom subscription-domänen
 */

/**
 * Skapar en standardiserad felkontext för prenumerations-operationer
 * 
 * @param operation Namn på operation eller process som utförs
 * @returns Strukturerad felkontext för loggning och felrapportering
 */
export const createSubscriptionErrorContext = (operation: string) => ({
  domain: 'subscription',
  operation,
  timestamp: new Date()
});

/**
 * Konverterar en felkod till användarvänligt felmeddelande
 * 
 * @param errorCode Kod för felet
 * @returns Användarvänligt felmeddelande på svenska
 */
export const getSubscriptionErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'SUBSCRIPTION_NOT_FOUND': 'Prenumerationen kunde inte hittas.',
    'SUBSCRIPTION_EXPIRED': 'Prenumerationen har upphört.',
    'SUBSCRIPTION_LIMIT_EXCEEDED': 'Gränsen för din prenumeration har överskridits.',
    'FEATURE_NOT_AVAILABLE': 'Denna funktion är inte tillgänglig i din prenumerationsplan.',
    'PAYMENT_REQUIRED': 'Betalning krävs för att fortsätta använda tjänsten.',
    'INVALID_USAGE_DATA': 'Felaktiga användningsdata angavs.',
    // Lägg till fler felmeddelanden vid behov
    'DEFAULT': 'Ett fel uppstod med prenumerationstjänsten.'
  };
  
  return errorMessages[errorCode] || errorMessages['DEFAULT'];
}; 