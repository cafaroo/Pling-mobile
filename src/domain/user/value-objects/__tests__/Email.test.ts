import { Email } from '../Email';
import '@testing-library/jest-dom';

describe('Email', () => {
  describe('create', () => {
    it('ska skapa ett giltigt Email-objekt', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user+tag@domain.co.uk',
        'very.common@example.com',
        'a.little.lengthy.but.fine@a.iana-servers.net'
      ];

      validEmails.forEach(email => {
        const result = Email.create(email);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.value).toBe(email.toLowerCase());
        }
      });
    });

    it('ska normalisera e-postadresser till gemener', () => {
      const result = Email.create('Test@EXAMPLE.com');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe('test@example.com');
      }
    });

    it('ska returnera fel för tom e-post', () => {
      const result = Email.create('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Email kan inte vara tom');
      }
    });

    it('ska returnera fel för för lång e-post', () => {
      // Skapa en väldigt lång lokal del
      const longLocalPart = 'a'.repeat(255);
      const result = Email.create(`${longLocalPart}@example.com`);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('E-postadressen är för lång');
      }
    });

    it('ska returnera fel för ogiltiga e-postadresser', () => {
      const invalidEmails = [
        'plainaddress',
        '#@%^%#$@#$@#.com',
        '@example.com',
        'email.example.com',
        'email@example@example.com',
        '.email@example.com',
        'email.@example.com',
        'email@-example.com',
        'email@111.222.333.44444'
      ];

      invalidEmails.forEach(email => {
        const result = Email.create(email);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBe('Ogiltig e-postadress');
        }
      });
    });
  });

  describe('equals', () => {
    it('ska korrekt jämföra två e-postadresser', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      const email3 = Email.create('other@example.com');

      expect(email1.isOk() && email2.isOk() && email3.isOk()).toBe(true);
      if (email1.isOk() && email2.isOk() && email3.isOk()) {
        expect(email1.value.equals(email2.value)).toBe(true);
        expect(email1.value.equals(email3.value)).toBe(false);
      }
    });

    it('ska hantera skiftlägesokänsliga jämförelser', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('TEST@EXAMPLE.COM');

      expect(email1.isOk() && email2.isOk()).toBe(true);
      if (email1.isOk() && email2.isOk()) {
        expect(email1.value.equals(email2.value)).toBe(true);
      }
    });
  });

  describe('toString', () => {
    it('ska returnera e-postadressen som sträng', () => {
      const result = Email.create('test@example.com');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.toString()).toBe('test@example.com');
      }
    });
  });
}); 