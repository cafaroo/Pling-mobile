import { Result, ok, err } from '../Result';

describe('Result', () => {
  describe('ok', () => {
    it('ska skapa ett Result.ok-objekt med korrekt värde och API', () => {
      const result = ok(42);
      
      // Verifiera status
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      
      // Verifiera nya API-egenskaper
      expect(result.value).toBe(42);
      expect(result.error).toBeNull();
      
      // Verifiera bakåtkompatibilitet
      expect(result.getValue()).toBe(42);
      expect(() => result.getError()).toThrow();
    });

    it('ska stödja map metoden', () => {
      const result = ok(5);
      const mapped = result.map(x => x * 2);
      
      expect(mapped.isOk()).toBe(true);
      expect(mapped.value).toBe(10);
    });

    it('ska stödja mapErr metoden', () => {
      const result = ok(5);
      const mapped = result.mapErr(e => `Nytt ${e}`);
      
      expect(mapped.isOk()).toBe(true);
      expect(mapped.value).toBe(5);
    });

    it('ska stödja andThen metoden', () => {
      const result = ok(5);
      const chained = result.andThen(x => ok(x * 2));
      
      expect(chained.isOk()).toBe(true);
      expect(chained.value).toBe(10);
    });

    it('ska stödja orElse metoden', () => {
      const result = ok(5);
      const recovered = result.orElse(() => ok(10));
      
      expect(recovered.isOk()).toBe(true);
      expect(recovered.value).toBe(5); // Behåller originalet
    });
  });

  describe('err', () => {
    it('ska skapa ett Result.err-objekt med korrekt fel och API', () => {
      const result = err('fel');
      
      // Verifiera status
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      
      // Verifiera nya API-egenskaper
      expect(result.value).toBeNull();
      expect(result.error).toBe('fel');
      
      // Verifiera bakåtkompatibilitet
      expect(() => result.getValue()).toThrow();
      expect(result.getError()).toBe('fel');
    });

    it('ska stödja map metoden', () => {
      const result = err<number, string>('fel');
      const mapped = result.map(x => x * 2);
      
      expect(mapped.isErr()).toBe(true);
      expect(mapped.error).toBe('fel');
    });

    it('ska stödja mapErr metoden', () => {
      const result = err<number, string>('fel');
      const mapped = result.mapErr(e => `Nytt ${e}`);
      
      expect(mapped.isErr()).toBe(true);
      expect(mapped.error).toBe('Nytt fel');
    });

    it('ska stödja andThen metoden', () => {
      const result = err<number, string>('fel');
      const fn = jest.fn(() => ok(10));
      const chained = result.andThen(fn);
      
      expect(fn).not.toHaveBeenCalled();
      expect(chained.isErr()).toBe(true);
      expect(chained.error).toBe('fel');
    });

    it('ska stödja orElse metoden', () => {
      const result = err<number, string>('fel');
      const recovered = result.orElse(() => ok(10));
      
      expect(recovered.isOk()).toBe(true);
      expect(recovered.value).toBe(10);
    });
  });

  describe('resultat-verifiering', () => {
    it('skal hantera resultat på standardiserat sätt', () => {
      // Definiera funktioner som returnerar Result
      const getSuccess = () => ok(42);
      const getFailure = () => err<number, string>('fel');
      
      // Hantera resultat med explicit status-kontroll och direkta egenskaper
      const successResult = getSuccess();
      if (successResult.isOk()) {
        expect(successResult.value).toBe(42);
      } else {
        fail('Borde varit ett OK-resultat');
      }
      
      const failResult = getFailure();
      if (failResult.isErr()) {
        expect(failResult.error).toBe('fel');
      } else {
        fail('Borde varit ett Error-resultat');
      }
      
      // Hantera felfall med tydlig kontroll istället för unwrapOr
      const valueOrDefault = failResult.isOk() ? failResult.value : 0;
      expect(valueOrDefault).toBe(0);
    });
  });
}); 