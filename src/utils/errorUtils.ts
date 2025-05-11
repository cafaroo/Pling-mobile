import { ServiceResponse } from '@types/service';

/**
 * Standardiserad felhantering för service-funktioner
 * @param error Felobjektet som ska hanteras
 * @param message Ett standardmeddelande som beskriver funktionen där felet uppstod
 * @returns Ett ServiceResponse-objekt med feldetaljer
 */
export const handleError = <T>(error: unknown, message: string): ServiceResponse<T> => {
  console.error(`Error in ${message}:`, error);
  
  // För bakåtkompatibilitet med tester, returnera det gamla formatet med status
  return {
    data: null,
    error: error instanceof Error ? error : {
      message: `Fel i ${message}`,
      details: error
    },
    status: 'error',
    // Behåll success-flaggan för nya kod som förväntar sig det nya formatet
    success: false
  } as any; // Använd any för att temporärt tillåta båda formaten
};

/**
 * Standardiserad typgard för att kontrollera om ett ServiceResponse innehåller ett fel
 */
export function isErrorResponse<T>(response: ServiceResponse<T>): response is ServiceResponse<never> {
  return !response.success;
}

/**
 * Kastar ett Error-objekt med information från ett ServiceResponse
 */
export function throwServiceError<T>(response: ServiceResponse<T>): never {
  throw new Error(response.error?.message || 'Ett okänt fel uppstod');
} 