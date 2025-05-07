import { PhoneNumber } from '../PhoneNumber';

describe('PhoneNumber', () => {
  describe('create', () => {
    it('ska skapa ett giltigt telefonnummerobjekt', () => {
      const validNumbers = [
        '+46701234567',
        '0701234567',
        '070-123 45 67',
        '+46 70 123 45 67'
      ];

      validNumbers.forEach(number => {
        const result = PhoneNumber.create(number);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().value).toBeDefined();
        }
      });
    });

    it('ska formatera nummer till standardformat', () => {
      const testCases = [
        { input: '0701234567', expected: '+46701234567' },
        { input: '070-123 45 67', expected: '+46701234567' },
        { input: '+46701234567', expected: '+46701234567' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = PhoneNumber.create(input);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().toString()).toBe(expected);
        }
      });
    });

    it('ska returnera fel för tomt nummer', () => {
      const result = PhoneNumber.create('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError()).toBe('Telefonnummer kan inte vara tomt');
      }
    });

    it('ska returnera fel för ogiltiga nummer', () => {
      const invalidNumbers = [
        'abc',
        '123',
        '+46',
        '+4670123456789',
        '070123456'
      ];

      invalidNumbers.forEach(number => {
        const result = PhoneNumber.create(number);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.getError()).toBe('Ogiltigt telefonnummer');
        }
      });
    });
  });

  describe('equals', () => {
    it('ska korrekt jämföra två telefonnummer', () => {
      const number1 = PhoneNumber.create('+46701234567');
      const number2 = PhoneNumber.create('0701234567');
      const number3 = PhoneNumber.create('+46702345678');

      expect(number1.isOk() && number2.isOk() && number3.isOk()).toBe(true);
      if (number1.isOk() && number2.isOk() && number3.isOk()) {
        expect(number1.getValue().equals(number2.getValue())).toBe(true);
        expect(number1.getValue().equals(number3.getValue())).toBe(false);
      }
    });

    it('ska hantera olika format vid jämförelse', () => {
      const number1 = PhoneNumber.create('+46701234567');
      const number2 = PhoneNumber.create('070-123 45 67');

      expect(number1.isOk() && number2.isOk()).toBe(true);
      if (number1.isOk() && number2.isOk()) {
        expect(number1.getValue().equals(number2.getValue())).toBe(true);
      }
    });
  });

  describe('toString', () => {
    it('ska returnera standardformaterat nummer', () => {
      const result = PhoneNumber.create('070-123 45 67');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getValue().toString()).toBe('+46701234567');
      }
    });
  });

  describe('format', () => {
    it('ska formatera nummer för visning', () => {
      const result = PhoneNumber.create('+46701234567');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getValue().format()).toBe('+46 70 123 45 67');
      }
    });
  });
}); 