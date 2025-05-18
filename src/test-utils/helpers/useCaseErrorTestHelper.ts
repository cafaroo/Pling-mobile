import { Result } from '@/shared/core/Result';

/**
 * UseCaseErrorCases - Definierar olika felscenarier för testning av use cases
 * 
 * @template T - Typ för repository eller annan beroende som ska mockas
 * @template E - Typ för fel som returneras av use case
 */
export interface UseCaseErrorCases<T, E = string> {
  /**
   * Konfiguration för att simulera databasfel
   */
  databaseError?: {
    /**
     * Metod som ska mockas för att returnera ett databasfel
     */
    method: keyof T;
    
    /**
     * Felmeddelande som ska returneras
     */
    errorMessage: E;
    
    /**
     * Förväntat felmeddelande från use case
     */
    expectedUseCaseError: string;
  };
  
  /**
   * Konfiguration för att simulera valideringsfel
   */
  validationError?: {
    /**
     * Namn på indata som ska vara ogiltig
     */
    invalidInput: string;
    
    /**
     * Ogiltigt värde för indata
     */
    invalidValue: any;
    
    /**
     * Förväntat felmeddelande från use case
     */
    expectedUseCaseError: string;
  };
  
  /**
   * Konfiguration för att simulera att en entitet inte hittas
   */
  notFoundError?: {
    /**
     * Metod som ska mockas för att returnera ett 'not found'-fel
     */
    method: keyof T;
    
    /**
     * ID eller annan identifierare som inte ska hittas
     */
    id: string;
    
    /**
     * Förväntat felmeddelande från use case
     */
    expectedUseCaseError: string;
  };
  
  /**
   * Konfiguration för att simulera tillståndsfel (t.ex. en operation som inte är tillåten i nuvarande tillstånd)
   */
  stateError?: {
    /**
     * Metod som ska mockas för att returnera data i fel tillstånd
     */
    method: keyof T;
    
    /**
     * Tillstånd som ska returneras
     */
    state: any;
    
    /**
     * Förväntat felmeddelande från use case
     */
    expectedUseCaseError: string;
  };
  
  /**
   * Konfiguration för att simulera behörighetsfel
   */
  permissionError?: {
    /**
     * Metod som ska mockas för att simulera behörighetsfel
     */
    method: keyof T;
    
    /**
     * Användar-ID som ska sakna behörighet
     */
    userId: string;
    
    /**
     * Förväntat felmeddelande från use case
     */
    expectedUseCaseError: string;
  };
  
  /**
   * Konfiguration för att simulera att ett undantag kastas
   */
  thrownError?: {
    /**
     * Metod som ska kasta ett undantag
     */
    method: keyof T;
    
    /**
     * Undantag som ska kastas
     */
    error: Error;
    
    /**
     * Förväntat felmeddelande från use case
     */
    expectedUseCaseError: string;
  };
}

/**
 * TestsUseCaseErrors - Funktion för att standardisera testning av felhantering i use cases
 * 
 * @param errorCases - Felscenarier att testa
 * @param repositoryMock - Mockad repository
 * @param executeUseCase - Funktion för att exekvera use case
 * @param baseInput - Bas-indata för use case (som modifieras vid validering)
 */
export const testUseCaseErrors = async <T, E = string>(
  errorCases: UseCaseErrorCases<T, E>,
  repositoryMock: T,
  executeUseCase: (input: any) => Promise<Result<any, string>>,
  baseInput: any = {}
): Promise<void> => {
  // Spara ursprungliga implementationer för att kunna återställa senare
  const originalImplementations: Partial<Record<keyof T, any>> = {};
  
  try {
    // Testa databasfel
    if (errorCases.databaseError) {
      const { method, errorMessage, expectedUseCaseError } = errorCases.databaseError;
      
      // Spara ursprunglig implementation
      originalImplementations[method] = (repositoryMock[method] as any);
      
      // Mocka metoden för att returnera fel
      (repositoryMock[method] as any) = jest.fn().mockResolvedValue(Result.err(errorMessage));
      
      // Kör use case och testa att rätt fel returneras
      const result = await executeUseCase(baseInput);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const errorMessage = result.error instanceof Error ? result.error.message : result.error;
        expect(errorMessage).toContain(expectedUseCaseError);
      }
      
      // Återställ mock
      (repositoryMock[method] as any) = originalImplementations[method];
    }
    
    // Testa valideringsfel
    if (errorCases.validationError) {
      const { invalidInput, invalidValue, expectedUseCaseError } = errorCases.validationError;
      
      // Skapa indata med ogiltigt värde
      const input = { ...baseInput, [invalidInput]: invalidValue };
      
      // Kör use case och testa att rätt fel returneras
      const result = await executeUseCase(input);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const errorMessage = result.error instanceof Error ? result.error.message : result.error;
        expect(errorMessage).toContain(expectedUseCaseError);
      }
    }
    
    // Testa not found-fel
    if (errorCases.notFoundError) {
      const { method, id, expectedUseCaseError } = errorCases.notFoundError;
      
      // Spara ursprunglig implementation
      originalImplementations[method] = (repositoryMock[method] as any);
      
      // Mocka metoden för att returnera not found-fel
      (repositoryMock[method] as any) = jest.fn().mockResolvedValue(Result.err('NOT_FOUND'));
      
      // Kör use case och testa att rätt fel returneras
      const result = await executeUseCase({
        ...baseInput,
        ...(id && { id }) // Lägg till ID om det finns
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const errorMessage = result.error instanceof Error ? result.error.message : result.error;
        expect(errorMessage).toContain(expectedUseCaseError);
      }
      
      // Återställ mock
      (repositoryMock[method] as any) = originalImplementations[method];
    }
    
    // Testa tillståndsfel
    if (errorCases.stateError) {
      const { method, state, expectedUseCaseError } = errorCases.stateError;
      
      // Spara ursprunglig implementation
      originalImplementations[method] = (repositoryMock[method] as any);
      
      // Mocka metoden för att returnera entitet i fel tillstånd
      (repositoryMock[method] as any) = jest.fn().mockResolvedValue(Result.ok(state));
      
      // Kör use case och testa att rätt fel returneras
      const result = await executeUseCase(baseInput);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const errorMessage = result.error instanceof Error ? result.error.message : result.error;
        expect(errorMessage).toContain(expectedUseCaseError);
      }
      
      // Återställ mock
      (repositoryMock[method] as any) = originalImplementations[method];
    }
    
    // Testa behörighetsfel
    if (errorCases.permissionError) {
      const { method, userId, expectedUseCaseError } = errorCases.permissionError;
      
      // Spara ursprunglig implementation
      originalImplementations[method] = (repositoryMock[method] as any);
      
      // Mocka metoden för att returnera behörighetsfel
      (repositoryMock[method] as any) = jest.fn().mockResolvedValue(Result.err('PERMISSION_DENIED'));
      
      // Kör use case och testa att rätt fel returneras
      const result = await executeUseCase({
        ...baseInput,
        ...(userId && { userId }) // Lägg till användar-ID om det finns
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const errorMessage = result.error instanceof Error ? result.error.message : result.error;
        expect(errorMessage).toContain(expectedUseCaseError);
      }
      
      // Återställ mock
      (repositoryMock[method] as any) = originalImplementations[method];
    }
    
    // Testa att ett undantag kastas
    if (errorCases.thrownError) {
      const { method, error, expectedUseCaseError } = errorCases.thrownError;
      
      // Spara ursprunglig implementation
      originalImplementations[method] = (repositoryMock[method] as any);
      
      // Mocka metoden för att kasta ett undantag
      (repositoryMock[method] as any) = jest.fn().mockImplementation(() => {
        throw error;
      });
      
      // Kör use case och testa att rätt fel returneras
      const result = await executeUseCase(baseInput);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const errorMessage = result.error instanceof Error ? result.error.message : result.error;
        expect(errorMessage).toContain(expectedUseCaseError);
      }
      
      // Återställ mock
      (repositoryMock[method] as any) = originalImplementations[method];
    }
  } finally {
    // Återställ alla mockar
    Object.entries(originalImplementations).forEach(([key, value]) => {
      (repositoryMock[key as keyof T] as any) = value;
    });
  }
};

/**
 * VerifyUseCaseErrorEvents - Verifierar att rätt events publiceras (eller inte) vid olika felscenarier
 * 
 * @param eventBus - Mockad eventBus
 * @param shouldPublishEvents - Om events ska publiceras vid olika felscenarier
 */
export const verifyUseCaseErrorEvents = (
  eventBus: { publish: jest.Mock },
  shouldPublishEvents: {
    onDatabaseError?: boolean;
    onValidationError?: boolean;
    onNotFoundError?: boolean;
    onStateError?: boolean;
    onPermissionError?: boolean;
    onThrownError?: boolean;
  } = {}
): void => {
  // Sätt standardvärden
  const defaults = {
    onDatabaseError: false,
    onValidationError: false,
    onNotFoundError: false,
    onStateError: false,
    onPermissionError: false,
    onThrownError: false
  };
  
  const config = { ...defaults, ...shouldPublishEvents };
  
  // Verifiera att events publicerades eller inte vid olika felscenarier
  if (config.onDatabaseError) {
    expect(eventBus.publish).toHaveBeenCalled();
  } else {
    expect(eventBus.publish).not.toHaveBeenCalled();
  }
  
  // Återställ mock för nästa test
  eventBus.publish.mockClear();
}; 