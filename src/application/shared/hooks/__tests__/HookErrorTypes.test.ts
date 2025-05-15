import { 
  HookErrorCode, 
  categorizeError, 
  getErrorMessage, 
  isRetryableError, 
  isUserFriendlyError,
  DEFAULT_ERROR_CONFIG
} from '../HookErrorTypes';

describe('HookErrorTypes', () => {
  describe('categorizeError', () => {
    beforeEach(() => {
      // Mockup av navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });

    it('ska returnera OFFLINE_ERROR när användaren är offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      expect(categorizeError(new Error('något fel'))).toBe(HookErrorCode.OFFLINE_ERROR);
    });

    it('ska kategorisera HTTP-statuskodsfel korrekt', () => {
      expect(categorizeError(new Error(), 401)).toBe(HookErrorCode.UNAUTHORIZED);
      expect(categorizeError(new Error(), 403)).toBe(HookErrorCode.FORBIDDEN);
      expect(categorizeError(new Error(), 404)).toBe(HookErrorCode.DATA_NOT_FOUND);
      expect(categorizeError(new Error(), 409)).toBe(HookErrorCode.DATA_CONFLICT);
      expect(categorizeError(new Error(), 422)).toBe(HookErrorCode.VALIDATION_ERROR);
      expect(categorizeError(new Error(), 429)).toBe(HookErrorCode.RATE_LIMIT_ERROR);
      expect(categorizeError(new Error(), 500)).toBe(HookErrorCode.SERVER_ERROR);
    });

    it('ska identifiera nätverksfel baserat på felmeddelande', () => {
      expect(categorizeError(new Error('network error'))).toBe(HookErrorCode.NETWORK_ERROR);
      expect(categorizeError(new Error('Failed to fetch'))).toBe(HookErrorCode.NETWORK_ERROR);
    });

    it('ska identifiera timeout-fel baserat på felmeddelande', () => {
      expect(categorizeError(new Error('timeout exceeded'))).toBe(HookErrorCode.TIMEOUT_ERROR);
    });

    it('ska identifiera valideringsfel baserat på felmeddelande', () => {
      expect(categorizeError(new Error('invalid input'))).toBe(HookErrorCode.VALIDATION_ERROR);
    });

    it('ska returnera UNKNOWN_ERROR för oidentifierade fel', () => {
      expect(categorizeError(new Error('något ospecificerat fel'))).toBe(HookErrorCode.UNKNOWN_ERROR);
    });
  });

  describe('getErrorMessage', () => {
    it('ska returnera standardfelmeddelande för en felkod', () => {
      expect(getErrorMessage(HookErrorCode.NETWORK_ERROR)).toBe(
        DEFAULT_ERROR_CONFIG[HookErrorCode.NETWORK_ERROR].defaultMessage
      );
    });

    it('ska returnera anpassat felmeddelande när sådant tillhandahålls', () => {
      const customMessage = 'Ett anpassat felmeddelande';
      expect(getErrorMessage(HookErrorCode.NETWORK_ERROR, customMessage)).toBe(customMessage);
    });

    it('ska hantera okända felkoder', () => {
      expect(getErrorMessage('NONEXISTENT_CODE' as HookErrorCode)).toBe('Ett fel uppstod');
    });
  });

  describe('isRetryableError', () => {
    it('ska identifiera återförsökbara fel korrekt', () => {
      expect(isRetryableError(HookErrorCode.NETWORK_ERROR)).toBe(true);
      expect(isRetryableError(HookErrorCode.VALIDATION_ERROR)).toBe(false);
    });

    it('ska hantera okända felkoder', () => {
      expect(isRetryableError('NONEXISTENT_CODE' as HookErrorCode)).toBe(false);
    });
  });

  describe('isUserFriendlyError', () => {
    it('ska identifiera användaranpassade fel korrekt', () => {
      expect(isUserFriendlyError(HookErrorCode.NETWORK_ERROR)).toBe(true);
      expect(isUserFriendlyError(HookErrorCode.DOMAIN_ERROR)).toBe(false);
    });

    it('ska hantera okända felkoder', () => {
      expect(isUserFriendlyError('NONEXISTENT_CODE' as HookErrorCode)).toBe(true);
    });
  });
}); 