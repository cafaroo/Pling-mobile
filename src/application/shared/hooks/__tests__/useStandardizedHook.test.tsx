import { renderHook, act } from '@testing-library/react-hooks';
import { Result } from '@/shared/core/Result';
import { 
  useStandardizedOperation, 
  useStandardizedRetryableOperation,
  createHookError
} from '../useStandardizedHook';
import { HookErrorCode } from '../HookErrorTypes';

// Hjälpfunktion för att simulera asynkron fördröjning
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('useStandardizedHook', () => {
  describe('useStandardizedOperation', () => {
    it('ska hantera lyckade operationer korrekt', async () => {
      // Arrangera
      const mockData = { id: '123', name: 'Test' };
      const mockOperation = jest.fn().mockResolvedValue(Result.ok(mockData));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => 
        useStandardizedOperation(mockOperation)
      );
      
      // Initial tillstånd
      expect(result.current.status).toBe('idle');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      
      // Anropa operationen
      let operationResult;
      act(() => {
        operationResult = result.current.execute({ testParam: 'value' });
      });
      
      // Kontrollera laddningstillstånd
      expect(result.current.status).toBe('loading');
      expect(result.current.isLoading).toBe(true);
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Kontrollera resultat
      expect(result.current.status).toBe('success');
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      
      // Kontrollera att mockOperation anropades med rätt parametrar
      expect(mockOperation).toHaveBeenCalledWith({ testParam: 'value' });
      
      // Kontrollera returvärdet
      const resolvedResult = await operationResult;
      expect(resolvedResult.isSuccess()).toBe(true);
      expect(resolvedResult.getValue()).toEqual(mockData);
    });
    
    it('ska hantera misslyckade operationer korrekt (Result.fail)', async () => {
      // Arrangera
      const mockError = { message: 'Operation misslyckades', statusCode: 404 };
      const mockOperation = jest.fn().mockResolvedValue(Result.fail(mockError));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => 
        useStandardizedOperation(mockOperation)
      );
      
      let operationResult;
      act(() => {
        operationResult = result.current.execute({ testParam: 'value' });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Kontrollera resultat
      expect(result.current.status).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.code).toBe(HookErrorCode.DATA_NOT_FOUND);
      
      // Kontrollera returvärdet
      const resolvedResult = await operationResult;
      expect(resolvedResult.isFailure()).toBe(true);
    });
    
    it('ska hantera kastade fel korrekt', async () => {
      // Arrangera
      const thrownError = new Error('Nätverksfel');
      const mockOperation = jest.fn().mockImplementation(() => {
        throw thrownError;
      });
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => 
        useStandardizedOperation(mockOperation)
      );
      
      let operationResult;
      act(() => {
        operationResult = result.current.execute({ testParam: 'value' });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Kontrollera resultat
      expect(result.current.status).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.originalError).toBe(thrownError);
      
      // Kontrollera returvärdet
      const resolvedResult = await operationResult;
      expect(resolvedResult.isFailure()).toBe(true);
    });
    
    it('ska kunna återställa hook-tillståndet', async () => {
      // Arrangera
      const mockData = { id: '123', name: 'Test' };
      const mockOperation = jest.fn().mockResolvedValue(Result.ok(mockData));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => 
        useStandardizedOperation(mockOperation)
      );
      
      // Anropa operationen och vänta på att den slutförs
      act(() => {
        result.current.execute({ testParam: 'value' });
      });
      
      await waitForNextUpdate();
      
      // Verifiera att operationen slutfördes
      expect(result.current.status).toBe('success');
      expect(result.current.data).toEqual(mockData);
      
      // Återställ hook-tillståndet
      act(() => {
        result.current.reset();
      });
      
      // Verifiera att tillståndet återställdes
      expect(result.current.status).toBe('idle');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
  
  describe('useStandardizedRetryableOperation', () => {
    it('ska kunna utföra återförsök efter ett fel', async () => {
      jest.useFakeTimers();
      
      // Arrangera
      const mockData = { id: '123', name: 'Test' };
      const mockOperation = jest.fn()
        // Första anropet misslyckas
        .mockResolvedValueOnce(Result.fail({ 
          message: 'Nätverksfel', 
          statusCode: 500,
          originalError: new Error('Nätverksfel')
        }))
        // Andra anropet lyckas
        .mockResolvedValueOnce(Result.ok(mockData));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => 
        useStandardizedRetryableOperation(mockOperation, { 
          delayMs: 100 
        })
      );
      
      // Anropa operationen
      act(() => {
        result.current.execute({ testParam: 'value' });
      });
      
      // Vänta på att första anropet slutförs
      await waitForNextUpdate();
      
      // Verifiera att operationen misslyckades
      expect(result.current.status).toBe('error');
      expect(result.current.error?.retryable).toBe(true);
      
      // Utför återförsök
      act(() => {
        result.current.retry();
      });
      
      // Flytta fram tidtagningen för att simulera väntetiden
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Vänta på att återförsöket slutförs
      await waitForNextUpdate();
      
      // Verifiera att återförsöket lyckades
      expect(result.current.status).toBe('success');
      expect(result.current.data).toEqual(mockData);
      expect(mockOperation).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
    
    it('ska inte utföra återförsök för icke-återförsöksbara fel', async () => {
      // Arrangera - validationsfel är inte återförsöksbara
      const mockOperation = jest.fn().mockResolvedValue(Result.fail({ 
        message: 'Valideringsfel', 
        statusCode: 422 
      }));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => 
        useStandardizedRetryableOperation(mockOperation)
      );
      
      // Anropa operationen
      act(() => {
        result.current.execute({ testParam: 'invalid' });
      });
      
      // Vänta på att anropet slutförs
      await waitForNextUpdate();
      
      // Verifiera att operationen misslyckades
      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe(HookErrorCode.VALIDATION_ERROR);
      expect(result.current.error?.retryable).toBe(false);
      
      // Försök utföra återförsök
      let retryResult;
      act(() => {
        retryResult = result.current.retry();
      });
      
      // Verifiera att återförsök inte utfördes
      expect(await retryResult).toBeNull();
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
    
    it('ska respektera maxRetries-konfiguration', async () => {
      jest.useFakeTimers();
      
      // Arrangera - en operation som alltid misslyckas
      const mockOperation = jest.fn().mockResolvedValue(Result.fail({ 
        message: 'Nätverksfel', 
        statusCode: 500 
      }));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => 
        useStandardizedRetryableOperation(mockOperation, { 
          maxRetries: 2,
          delayMs: 100 
        })
      );
      
      // Anropa operationen
      act(() => {
        result.current.execute({ testParam: 'value' });
      });
      
      // Vänta på att anropet slutförs
      await waitForNextUpdate();
      
      // Första återförsök
      act(() => {
        result.current.retry();
      });
      
      // Flytta fram tidtagningen
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Vänta på återförsöket
      await waitForNextUpdate();
      
      // Andra återförsök
      act(() => {
        result.current.retry();
      });
      
      // Flytta fram tidtagningen
      act(() => {
        jest.advanceTimersByTime(200); // 100 * 2^1
      });
      
      // Vänta på återförsöket
      await waitForNextUpdate();
      
      // Försök med ett tredje återförsök (bör inte fungera)
      let thirdRetryResult;
      act(() => {
        thirdRetryResult = result.current.retry();
      });
      
      // Verifiera att tredje återförsöket inte utfördes
      expect(await thirdRetryResult).toBeNull();
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initialt + 2 återförsök
      
      jest.useRealTimers();
    });
  });
  
  describe('createHookError', () => {
    it('ska skapa standardiserade HookError-objekt', () => {
      // Nätverksfel
      const networkError = new Error('Failed to fetch');
      const hookError = createHookError(networkError);
      
      expect(hookError.code).toBe(HookErrorCode.NETWORK_ERROR);
      expect(hookError.originalError).toBe(networkError);
      expect(hookError.retryable).toBe(true);
      
      // Fel med HTTP-statuskod
      const authError = new Error('Unauthorized');
      const hookErrorWithStatus = createHookError(authError, 401);
      
      expect(hookErrorWithStatus.code).toBe(HookErrorCode.UNAUTHORIZED);
      expect(hookErrorWithStatus.originalError).toBe(authError);
      
      // Fel med anpassat meddelande
      const customMessage = 'Du saknar behörighet att utföra denna åtgärd';
      const hookErrorWithCustomMessage = createHookError(authError, 403, customMessage);
      
      expect(hookErrorWithCustomMessage.code).toBe(HookErrorCode.FORBIDDEN);
      expect(hookErrorWithCustomMessage.message).toBe(customMessage);
    });
  });
}); 