import { Result, ok, err } from '../Result';

describe('Result', () => {
  describe('ok', () => {
    it('ska skapa ett Result.ok-objekt', () => {
      const result = Result.ok('värde');
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result.getValue()).toBe('värde');
    });

    it('ska kasta fel vid försök att hämta error från ett ok-resultat', () => {
      const result = Result.ok('värde');
      expect(() => result.getError()).toThrow();
    });

    it('ska mappa ett värde korrekt', () => {
      const result = Result.ok(5);
      const mapped = result.map(x => x * 2);
      expect(mapped.isOk()).toBe(true);
      expect(mapped.getValue()).toBe(10);
    });

    it('ska använda unwrap korrekt för ett ok-resultat', () => {
      const result = Result.ok('värde');
      expect(result.unwrap()).toBe('värde');
    });

    it('ska använda unwrapOr korrekt för ett ok-resultat', () => {
      const result = Result.ok('värde');
      expect(result.unwrapOr('default')).toBe('värde');
    });
  });

  describe('err', () => {
    it('ska skapa ett Result.err-objekt', () => {
      const result = Result.err('fel');
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      expect(result.getError()).toBe('fel');
    });

    it('ska kasta fel vid försök att hämta värde från ett err-resultat', () => {
      const result = Result.err('fel');
      expect(() => result.getValue()).toThrow();
    });

    it('ska mappa ett fel korrekt med mapErr', () => {
      const result = Result.err('fel');
      const mapped = result.mapErr(e => `Nytt ${e}`);
      expect(mapped.isErr()).toBe(true);
      expect(mapped.getError()).toBe('Nytt fel');
    });

    it('ska kasta fel vid unwrap på ett err-resultat', () => {
      const result = Result.err('fel');
      expect(() => result.unwrap()).toThrow();
    });

    it('ska använda unwrapOr korrekt för ett err-resultat', () => {
      const result = Result.err('fel');
      expect(result.unwrapOr('default')).toBe('default');
    });
  });

  describe('andThen', () => {
    it('ska kedja ok-resultat korrekt', () => {
      const result = Result.ok(5);
      const chained = result.andThen(x => Result.ok(x * 2));
      expect(chained.isOk()).toBe(true);
      expect(chained.getValue()).toBe(10);
    });

    it('ska avbryta kedjan vid err-resultat', () => {
      const result = Result.ok(5);
      const chained = result.andThen(() => Result.err('fel'));
      expect(chained.isErr()).toBe(true);
      expect(chained.getError()).toBe('fel');
    });

    it('ska inte anropa funktionen om ursprungsobjektet är ett err', () => {
      const result = Result.err('första felet');
      const fn = jest.fn(() => Result.ok('aldrig anropad'));
      const chained = result.andThen(fn);
      expect(fn).not.toHaveBeenCalled();
      expect(chained.isErr()).toBe(true);
      expect(chained.getError()).toBe('första felet');
    });
  });

  describe('orElse', () => {
    it('ska behålla ok-resultat', () => {
      const result = Result.ok('värde');
      const recovered = result.orElse(() => Result.ok('ny värde'));
      expect(recovered.isOk()).toBe(true);
      expect(recovered.getValue()).toBe('värde');
    });

    it('ska tillåta återhämtning från err-resultat', () => {
      const result = Result.err('fel');
      const recovered = result.orElse(() => Result.ok('återhämtad'));
      expect(recovered.isOk()).toBe(true);
      expect(recovered.getValue()).toBe('återhämtad');
    });

    it('ska tillåta förändra err-resultat', () => {
      const result = Result.err('fel');
      const recovered = result.orElse(e => Result.err(`Hanterat: ${e}`));
      expect(recovered.isErr()).toBe(true);
      expect(recovered.getError()).toBe('Hanterat: fel');
    });
  });

  describe('hjälpfunktioner', () => {
    it('ok-funktionen skapar Result.ok', () => {
      const result = ok('värde');
      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toBe('värde');
    });

    it('err-funktionen skapar Result.err', () => {
      const result = err('fel');
      expect(result.isErr()).toBe(true);
      expect(result.getError()).toBe('fel');
    });
  });
}); 