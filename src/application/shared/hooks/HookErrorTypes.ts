/**
 * Standard felkoder för hooks
 * Används för att kategorisera fel och möjliggöra enhetlig hantering
 */
export enum HookErrorCode {
  // Nätverksfel
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  
  // API-relaterade fel
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Validering
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_STATE = 'INVALID_STATE',
  
  // Behörighetsfel
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Datafel
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_CONFLICT = 'DATA_CONFLICT',
  
  // Domänspecifika fel
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  DOMAIN_ERROR = 'DOMAIN_ERROR',
  
  // Cache-relaterade fel
  CACHE_ERROR = 'CACHE_ERROR',
  STALE_DATA = 'STALE_DATA',
  
  // Oväntade fel
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR'
}

/**
 * Konfiguration för felmeddelanden baserat på felkoder
 */
export interface ErrorMessageConfig {
  [key: string]: {
    defaultMessage: string;
    userFriendly: boolean;
    logLevel: 'info' | 'warn' | 'error';
    retryable: boolean;
  }
}

/**
 * Standardkonfiguration för alla felkoder
 */
export const DEFAULT_ERROR_CONFIG: ErrorMessageConfig = {
  [HookErrorCode.NETWORK_ERROR]: {
    defaultMessage: 'Kunde inte ansluta till servern. Kontrollera din internetanslutning.',
    userFriendly: true,
    logLevel: 'warn',
    retryable: true
  },
  [HookErrorCode.TIMEOUT_ERROR]: {
    defaultMessage: 'Förfrågan tog för lång tid. Försök igen senare.',
    userFriendly: true,
    logLevel: 'warn',
    retryable: true
  },
  [HookErrorCode.OFFLINE_ERROR]: {
    defaultMessage: 'Ingen internetanslutning. Data har sparats lokalt och kommer att synkroniseras när du är online igen.',
    userFriendly: true,
    logLevel: 'info',
    retryable: false
  },
  [HookErrorCode.API_ERROR]: {
    defaultMessage: 'Ett fel uppstod när vi kommunicerade med servern.',
    userFriendly: true,
    logLevel: 'error',
    retryable: true
  },
  [HookErrorCode.RATE_LIMIT_ERROR]: {
    defaultMessage: 'För många förfrågningar. Vänta en stund och försök igen.',
    userFriendly: true,
    logLevel: 'warn',
    retryable: false
  },
  [HookErrorCode.SERVER_ERROR]: {
    defaultMessage: 'Ett serverfel har inträffat. Vi arbetar på att lösa problemet.',
    userFriendly: true,
    logLevel: 'error',
    retryable: true
  },
  [HookErrorCode.VALIDATION_ERROR]: {
    defaultMessage: 'Det finns fel i inmatningen. Kontrollera och försök igen.',
    userFriendly: true,
    logLevel: 'info',
    retryable: false
  },
  [HookErrorCode.INVALID_INPUT]: {
    defaultMessage: 'Ogiltig inmatning. Kontrollera värdena och försök igen.',
    userFriendly: true,
    logLevel: 'info',
    retryable: false
  },
  [HookErrorCode.INVALID_STATE]: {
    defaultMessage: 'Operationen kunde inte utföras i nuvarande tillstånd.',
    userFriendly: true,
    logLevel: 'warn',
    retryable: false
  },
  [HookErrorCode.UNAUTHORIZED]: {
    defaultMessage: 'Du är inte inloggad eller din session har upphört.',
    userFriendly: true,
    logLevel: 'warn',
    retryable: false
  },
  [HookErrorCode.FORBIDDEN]: {
    defaultMessage: 'Du saknar behörighet för denna åtgärd.',
    userFriendly: true,
    logLevel: 'warn',
    retryable: false
  },
  [HookErrorCode.DATA_NOT_FOUND]: {
    defaultMessage: 'Den begärda informationen kunde inte hittas.',
    userFriendly: true,
    logLevel: 'info',
    retryable: false
  },
  [HookErrorCode.DATA_CONFLICT]: {
    defaultMessage: 'Ett datakonflikt uppstod. Någon annan kan ha ändrat samma information.',
    userFriendly: true,
    logLevel: 'warn',
    retryable: false
  },
  [HookErrorCode.BUSINESS_RULE_VIOLATION]: {
    defaultMessage: 'Åtgärden kunde inte utföras då den bryter mot affärsregler.',
    userFriendly: true,
    logLevel: 'info',
    retryable: false
  },
  [HookErrorCode.DOMAIN_ERROR]: {
    defaultMessage: 'Ett fel uppstod i domänlogiken.',
    userFriendly: false,
    logLevel: 'error',
    retryable: false
  },
  [HookErrorCode.CACHE_ERROR]: {
    defaultMessage: 'Problem med datalagring.',
    userFriendly: false,
    logLevel: 'warn',
    retryable: true
  },
  [HookErrorCode.STALE_DATA]: {
    defaultMessage: 'Data kan vara inaktuell. Uppdaterar...',
    userFriendly: true,
    logLevel: 'info',
    retryable: true
  },
  [HookErrorCode.UNKNOWN_ERROR]: {
    defaultMessage: 'Ett okänt fel uppstod.',
    userFriendly: true,
    logLevel: 'error',
    retryable: true
  },
  [HookErrorCode.UNEXPECTED_ERROR]: {
    defaultMessage: 'Ett oväntat fel uppstod. Vi arbetar på att lösa problemet.',
    userFriendly: true,
    logLevel: 'error',
    retryable: true
  }
};

/**
 * Kategoriserar ett fel baserat på felmeddelande och HTTP-statuskod
 * @param error Det fångade felet
 * @param statusCode HTTP-statuskod om tillgänglig
 * @returns Lämplig felkod
 */
export function categorizeError(error: unknown, statusCode?: number): HookErrorCode {
  if (!navigator.onLine) {
    return HookErrorCode.OFFLINE_ERROR;
  }
  
  // Kolla HTTP-statuskoder
  if (statusCode) {
    if (statusCode === 401) return HookErrorCode.UNAUTHORIZED;
    if (statusCode === 403) return HookErrorCode.FORBIDDEN;
    if (statusCode === 404) return HookErrorCode.DATA_NOT_FOUND;
    if (statusCode === 409) return HookErrorCode.DATA_CONFLICT;
    if (statusCode === 422) return HookErrorCode.VALIDATION_ERROR;
    if (statusCode === 429) return HookErrorCode.RATE_LIMIT_ERROR;
    if (statusCode >= 500) return HookErrorCode.SERVER_ERROR;
  }
  
  // Analysera felmeddelandet
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerCaseMessage = errorMessage.toLowerCase();
  
  if (lowerCaseMessage.includes('timeout')) return HookErrorCode.TIMEOUT_ERROR;
  if (lowerCaseMessage.includes('network') || lowerCaseMessage.includes('fetch')) return HookErrorCode.NETWORK_ERROR;
  if (lowerCaseMessage.includes('valid')) return HookErrorCode.VALIDATION_ERROR;
  if (lowerCaseMessage.includes('permission') || lowerCaseMessage.includes('access denied')) return HookErrorCode.FORBIDDEN;
  if (lowerCaseMessage.includes('not found')) return HookErrorCode.DATA_NOT_FOUND;
  if (lowerCaseMessage.includes('conflict')) return HookErrorCode.DATA_CONFLICT;
  if (lowerCaseMessage.includes('unauthorized') || lowerCaseMessage.includes('unauthenticated')) return HookErrorCode.UNAUTHORIZED;
  
  return HookErrorCode.UNKNOWN_ERROR;
}

/**
 * Hämtar användarmeddelande baserat på felkod
 * @param code Felkoden
 * @param customMessage Eventuellt anpassat felmeddelande
 * @returns Användarmeddelande
 */
export function getErrorMessage(code: HookErrorCode, customMessage?: string): string {
  const config = DEFAULT_ERROR_CONFIG[code];
  if (!config) return customMessage || 'Ett fel uppstod';
  
  return customMessage || config.defaultMessage;
}

/**
 * Kontrollerar om ett fel kan återförsökas
 * @param code Felkoden
 * @returns true om felet kan återförsökas
 */
export function isRetryableError(code: HookErrorCode): boolean {
  const config = DEFAULT_ERROR_CONFIG[code];
  return config ? config.retryable : false;
}

/**
 * Kontrollerar om ett fel bör visas för användaren
 * @param code Felkoden
 * @returns true om felet bör visas för användaren
 */
export function isUserFriendlyError(code: HookErrorCode): boolean {
  const config = DEFAULT_ERROR_CONFIG[code];
  return config ? config.userFriendly : true;
} 