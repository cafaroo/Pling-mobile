import { ServiceResponse } from '@/types/service';

/**
 * Standardiserad felhantering för service-funktioner
 * @param error Felobjektet som ska hanteras
 * @param message Ett standardmeddelande som beskriver funktionen där felet uppstod
 * @returns Ett ServiceResponse-objekt med feldetaljer
 */
export const handleError = <T>(error: unknown, message: string): ServiceResponse<T> => {
  console.error(`Error in ${message}:`, error);
  
  // Om det är ett Supabase PostgrestError
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return {
      success: false,
      error: {
        message: `Fel i ${message}`,
        code: (error as { code: string }).code,
        details: error
      }
    };
  }
  
  // Om det är ett Error-objekt, försök hämta meddelandet
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message || `Fel i ${message}`,
        details: error
      }
    };
  }
  
  // Generiskt fel
  return {
    success: false,
    error: {
      message: `Fel i ${message}`,
      details: error
    }
  };
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